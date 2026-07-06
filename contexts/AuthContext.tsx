import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { ensureUserProfile } from '../lib/api/profile';
import { completeRecoveryFromUrl } from '../lib/recovery-auth';
import { isRecoveryAuthUrl } from '../lib/auth-linking';
import { GRAYA_PROFILE } from '../lib/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isDemoMode: boolean;
  isSupabaseReady: boolean;
  pendingPasswordReset: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<Session | null>;
  resetPassword: (email: string) => Promise<void>;
  completeRecoveryFromLink: (url: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const incomingUrl = Linking.useURL();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [pendingPasswordReset, setPendingPasswordReset] = useState(false);
  const isDemoModeRef = useRef(false);

  useEffect(() => {
    isDemoModeRef.current = isDemoMode;
  }, [isDemoMode]);

  const loadProfile = useCallback(async (userId: string, userMetadata?: Record<string, unknown>) => {
    if (!isSupabaseConfigured) return;

    try {
      const data = await ensureUserProfile(userId, userMetadata);
      setProfile(data);
    } catch {
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await loadProfile(session.user.id, session.user.user_metadata);
    }
  }, [session?.user, loadProfile]);

  const completeRecoveryFromLink = useCallback(async (url: string) => {
    await completeRecoveryFromUrl(url, supabase);
    setPendingPasswordReset(true);
    setIsDemoMode(false);
    router.replace('/reset-password');
  }, []);

  const openRecoveryFromLink = useCallback(
    async (url: string | null) => {
      if (!url || isDemoModeRef.current) return;

      if (isRecoveryAuthUrl(url)) {
        try {
          await completeRecoveryFromLink(url);
        } catch {
          setPendingPasswordReset(true);
          router.replace('/reset-password');
        }
        return;
      }

      // iOS often opens grayaconnect://reset-password without tokens after email redirect.
      if (url.includes('reset-password')) {
        setPendingPasswordReset(true);
        router.replace('/reset-password');
      }
    },
    [completeRecoveryFromLink],
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        loadProfile(currentSession.user.id, currentSession.user.user_metadata);
      }
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') {
        setPendingPasswordReset(true);
        router.replace('/reset-password');
      }
      if (nextSession?.user) {
        loadProfile(nextSession.user.id, nextSession.user.user_metadata);
        if (isDemoModeRef.current) {
          setIsDemoMode(false);
        }
      } else if (!isDemoModeRef.current) {
        setProfile(null);
      }
    });

    Linking.getInitialURL().then(openRecoveryFromLink);

    return () => listener.subscription.unsubscribe();
  }, [loadProfile, openRecoveryFromLink]);

  useEffect(() => {
    openRecoveryFromLink(incomingUrl);
  }, [incomingUrl, openRecoveryFromLink]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setIsDemoMode(false);
    setPendingPasswordReset(false);
  }, []);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: username,
        },
      },
    });
    if (error) throw error;
    setIsDemoMode(false);
    if (data.session?.user) {
      await loadProfile(data.session.user.id, data.session.user.user_metadata);
    }
    return data.session;
  }, [loadProfile]);

  const resetPassword = useCallback(async (email: string) => {
    const redirectTo = Linking.createURL('reset-password');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setPendingPasswordReset(false);
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      setProfile(null);
      return;
    }
    setPendingPasswordReset(false);
    await supabase.auth.signOut();
    setProfile(null);
  }, [isDemoMode]);

  const enterDemoMode = useCallback(() => {
    setPendingPasswordReset(false);
    setIsDemoMode(true);
    setProfile(GRAYA_PROFILE);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile: isDemoMode ? GRAYA_PROFILE : profile,
      isLoading,
      isDemoMode,
      isSupabaseReady: isSupabaseConfigured,
      pendingPasswordReset,
      signIn,
      signUp,
      resetPassword,
      completeRecoveryFromLink,
      updatePassword,
      signOut,
      enterDemoMode,
      refreshProfile,
    }),
    [
      session,
      profile,
      isLoading,
      isDemoMode,
      pendingPasswordReset,
      signIn,
      signUp,
      resetPassword,
      completeRecoveryFromLink,
      updatePassword,
      signOut,
      enterDemoMode,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
