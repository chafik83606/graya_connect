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

import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '../../lib/errors';
import { colors, radius, spacing } from '../../lib/theme';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { resetPassword, isSupabaseReady } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'Indiquez votre adresse email.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      Alert.alert(
        'Email envoyé',
        'Ouvrez le lien reçu sur le même iPhone où Graya Connect est installé. Vous pourrez alors choisir un nouveau mot de passe dans l\'app.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
      );
    } catch (error) {
      Alert.alert('Erreur', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#1A1400', colors.background]} style={styles.flex}>
        <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
          <Text style={styles.title}>Mot de passe oublié</Text>
          <Text style={styles.subtitle}>
            Entrez votre email. Nous vous enverrons un lien pour choisir un nouveau mot de passe.
          </Text>

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

          <Pressable
            style={[styles.button, (loading || !isSupabaseReady) && styles.buttonDisabled]}
            onPress={handleReset}
            disabled={loading || !isSupabaseReady}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.buttonText}>Envoyer le lien</Text>
            )}
          </Pressable>

          <Link href="/(auth)/login" asChild>
            <Pressable style={styles.backLink}>
              <Text style={styles.link}>Retour à la connexion</Text>
            </Pressable>
          </Link>
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
  },
  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
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
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 16,
  },
  backLink: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
});
