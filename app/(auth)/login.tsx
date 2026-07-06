import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PasswordInput } from '../../components/PasswordInput';
import { useAuth } from '../../contexts/AuthContext';
import { getAuthErrorMessage } from '../../lib/errors';
import { colors, radius, spacing } from '../../lib/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, enterDemoMode, isSupabaseReady } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Connexion échouée', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    enterDemoMode();
    // Laisse React appliquer isDemoMode avant la navigation (évite écran noir / conflit de routes).
    requestAnimationFrame(() => {
      router.replace('/(tabs)');
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#1A1400', colors.background, colors.background]} style={styles.flex}>
        <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>GRAYA</Text>
            <Text style={styles.tagline}>Connect · Le réseau des fans</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="vous@email.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Mot de passe</Text>
            <PasswordInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
            />

            <Link href="/(auth)/forgot-password" asChild>
              <Pressable style={styles.forgotLink}>
                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
              </Pressable>
            </Link>

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading || !isSupabaseReady}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.buttonText}>
                  {isSupabaseReady ? 'Se connecter' : 'Configurer Supabase d\'abord'}
                </Text>
              )}
            </Pressable>

            {!isSupabaseReady ? (
              <Text style={styles.setupHint}>
                Créez un fichier .env avec EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY
              </Text>
            ) : null}

            <Pressable style={styles.demoButton} onPress={handleDemo}>
              <Ionicons name="play-circle-outline" size={20} color={colors.textMuted} />
              <Text style={styles.demoText}>Aperçu démo (données fictives)</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte ?</Text>
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <Text style={styles.link}>Créer un compte</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
  },
  brandBlock: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  brand: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 6,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 16,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  demoText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: colors.textSecondary,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
  setupHint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 18,
  },
});
