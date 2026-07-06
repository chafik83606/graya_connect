import { Redirect } from 'expo-router';

import { LoadingScreen } from '../components/LoadingScreen';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { session, isLoading, isDemoMode, pendingPasswordReset } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (pendingPasswordReset) {
    return <Redirect href="/reset-password" />;
  }

  if (session || isDemoMode) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
