type ErrorLike = {
  message?: string;
  code?: string;
  details?: string;
};

function getMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as ErrorLike).message ?? 'Erreur inconnue');
  }
  return 'Erreur inconnue';
}

function getCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as ErrorLike).code);
  }
  return undefined;
}

export function getErrorMessage(error: unknown): string {
  const message = getMessage(error);
  const code = getCode(error);

  if (message.includes('Invalid login credentials')) {
    return 'Email ou mot de passe incorrect.';
  }
  if (message.includes('User already registered')) {
    return 'Un compte existe déjà avec cet email.';
  }
  if (message.includes('Password should be at least')) {
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  }
  if (message.includes('Unable to validate email')) {
    return 'Adresse email invalide.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Confirmez votre email avant de vous connecter.';
  }
  if (code === '23503' || message.includes('foreign key')) {
    return 'Votre profil n\'existe pas encore. Reconnectez-vous puis réessayez.';
  }
  if (code === '42P01' || (message.includes('relation') && message.includes('does not exist'))) {
    return 'Tables manquantes. Exécutez supabase/setup-complete.sql dans le SQL Editor Supabase.';
  }
  if (code === '42501' || message.includes('row-level security')) {
    return 'Permission refusée. Vérifiez que votre compte a le statut artiste (is_artist) dans Supabase.';
  }
  if (message.includes('duplicate key') || code === '23505') {
    if (message.includes('post_reports')) {
      return 'Vous avez déjà signalé ce post.';
    }
    return 'Ce pseudo est déjà utilisé. Choisissez-en un autre.';
  }

  return message;
}

/** @deprecated Use getErrorMessage */
export function getAuthErrorMessage(error: unknown): string {
  return getErrorMessage(error);
}
