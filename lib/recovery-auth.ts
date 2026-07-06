import type { SupabaseClient } from '@supabase/supabase-js';

type ParsedRecovery =
  | { kind: 'session'; accessToken: string; refreshToken: string }
  | { kind: 'code'; code: string }
  | { kind: 'otp'; tokenHash: string };

/** Unwrap Outlook Safe Links, Google redirect wrappers, etc. */
export function unwrapEmailLink(input: string): string {
  let url = input.trim();

  for (let depth = 0; depth < 6; depth += 1) {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      let nested: string | null = null;

      if (
        host.includes('safelinks.protection.outlook.com') ||
        host.includes('safelinks.protection.microsoft.com')
      ) {
        nested = parsed.searchParams.get('url');
      } else if (host === 'www.google.com' && parsed.pathname === '/url') {
        nested = parsed.searchParams.get('url') ?? parsed.searchParams.get('q');
      } else if (host.includes('urldefense.proofpoint.com')) {
        nested = parsed.searchParams.get('u');
        if (nested) {
          nested = nested.replace(/-([0-9A-Fa-f]{2})/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16)),
          );
        }
      }

      if (!nested) break;
      url = decodeURIComponent(nested);
    } catch {
      break;
    }
  }

  return url.trim();
}

function getParamString(url: string) {
  if (url.includes('#')) {
    return url.split('#').slice(1).join('#');
  }
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return '';
  return url.slice(queryIndex + 1);
}

function looksLikeRecoveryUrl(url: string) {
  const lower = url.toLowerCase();
  return (
    lower.includes('/auth/v1/verify') ||
    lower.includes('access_token=') ||
    lower.includes('token_hash=') ||
    (lower.includes('code=') && lower.includes('type=recovery')) ||
    (lower.includes('type=recovery') && lower.includes('token='))
  );
}

/** True if URL contains recovery credentials (not just the app path). */
export function isRecoveryAuthUrl(url: string) {
  return looksLikeRecoveryUrl(url) || looksLikeRecoveryUrl(unwrapEmailLink(url));
}

export function parseSupabaseAuthUrl(url: string): ParsedRecovery | null {
  const paramString = getParamString(url);
  if (!paramString) return null;

  const params = new URLSearchParams(paramString);
  const error = params.get('error_description') ?? params.get('error');
  if (error) {
    throw new Error(decodeURIComponent(error.replace(/\+/g, ' ')));
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const code = params.get('code');
  const tokenHash = params.get('token_hash');
  const type = params.get('type');

  if (accessToken && refreshToken) {
    return { kind: 'session', accessToken, refreshToken };
  }
  if (code) {
    return { kind: 'code', code };
  }
  if (tokenHash && type === 'recovery') {
    return { kind: 'otp', tokenHash };
  }

  return null;
}

function parseSupabaseVerifyUrl(url: string) {
  try {
    const parsed = new URL(url.trim());
    if (!parsed.pathname.includes('/auth/v1/verify')) return null;
    const token = parsed.searchParams.get('token');
    const type = parsed.searchParams.get('type');
    if (token && type === 'recovery') {
      return token;
    }
  } catch {
    return null;
  }
  return null;
}

async function verifyRecoveryToken(client: SupabaseClient, token: string) {
  const { error } = await client.auth.verifyOtp({
    token_hash: token,
    type: 'recovery',
  });
  if (error) throw error;
}

async function applyParsedRecovery(parsed: ParsedRecovery, client: SupabaseClient) {
  if (parsed.kind === 'session') {
    const { error } = await client.auth.setSession({
      access_token: parsed.accessToken,
      refresh_token: parsed.refreshToken,
    });
    if (error) throw error;
    return;
  }
  if (parsed.kind === 'code') {
    const { error } = await client.auth.exchangeCodeForSession(parsed.code);
    if (error) throw error;
    return;
  }
  await verifyRecoveryToken(client, parsed.tokenHash);
}

async function fetchVerifyRedirect(verifyUrl: string) {
  const response = await fetch(verifyUrl.trim(), { method: 'GET', redirect: 'manual' });
  if (response.status >= 300 && response.status < 400) {
    return response.headers.get('Location');
  }
  return null;
}

async function completeRecoveryFromResolvedUrl(url: string, client: SupabaseClient) {
  const direct = parseSupabaseAuthUrl(url);
  if (direct) {
    await applyParsedRecovery(direct, client);
    return;
  }

  if (url.includes('/auth/v1/verify')) {
    const redirect = await fetchVerifyRedirect(url);
    if (redirect) {
      await completeRecoveryFromResolvedUrl(redirect, client);
      return;
    }

    const verifyToken = parseSupabaseVerifyUrl(url);
    if (verifyToken) {
      await verifyRecoveryToken(client, verifyToken);
      return;
    }
  }

  throw new Error('Lien invalide ou expiré. Redemandez un email de réinitialisation.');
}

/** Validate and complete password recovery from email link or app redirect URL. */
export async function completeRecoveryFromUrl(url: string, client: SupabaseClient) {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error('Collez le lien reçu par email.');
  }

  const resolved = unwrapEmailLink(trimmed);

  try {
    await completeRecoveryFromResolvedUrl(resolved, client);
  } catch (firstError) {
    if (resolved !== trimmed) {
      try {
        await completeRecoveryFromResolvedUrl(trimmed, client);
        return;
      } catch {
        throw firstError;
      }
    }
    throw firstError;
  }
}
