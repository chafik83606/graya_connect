import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PasswordInput } from '../components/PasswordInput';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../lib/errors';
import { colors, radius, spacing } from '../lib/theme';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { pendingPasswordReset, session, completeRecoveryFromLink, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pastedLink, setPastedLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [validatingLink, setValidatingLink] = useState(false);
  const [showPasteHelp, setShowPasteHelp] = useState(false);

  const ready = pendingPasswordReset && Boolean(session);

  useEffect(() => {
    if (session) return;
    const timer = setTimeout(() => setShowPasteHelp(true), 1500);
    return () => clearTimeout(timer);
  }, [session]);

  const handlePasteLink = async () => {
    if (!pastedLink.trim()) {
      Alert.alert('Erreur', 'Collez le lien complet reçu par email.');
      return;
    }

    setValidatingLink(true);
    try {
      await completeRecoveryFromLink(pastedLink.trim());
    } catch (error) {
      Alert.alert('Lien invalide', getErrorMessage(error));
    } finally {
      setValidatingLink(false);
    }
  };

  const handleSave = async () => {
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    setSaving(true);
    try {
      await updatePassword(password);
      Alert.alert('Mot de passe mis à jour', 'Connectez-vous avec votre nouveau mot de passe.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error) {
      Alert.alert('Erreur', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (!ready) {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <LinearGradient colors={['#1A1400', colors.background]} style={styles.flex}>
          <ScrollView
            contentContainerStyle={[
              styles.waitContainer,
              { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {!showPasteHelp ? (
              <>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.title}>Ouverture du lien…</Text>
              </>
            ) : (
              <>
                <Text style={styles.title}>Lien non reçu</Text>
                <Text style={styles.subtitle}>
                  Sur iPhone / Outlook, le lien est parfois modifié. Appui long sur le lien dans le
                  mail → Copier le lien, puis collez-le ici :
                </Text>

                <TextInput
                  style={styles.linkInput}
                  value={pastedLink}
                  onChangeText={setPastedLink}
                  placeholder="https://...supabase.co/auth/v1/verify?..."
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                />

                <Pressable
                  style={[styles.button, validatingLink && styles.buttonDisabled]}
                  onPress={handlePasteLink}
                  disabled={validatingLink}
                >
                  {validatingLink ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <Text style={styles.buttonText}>Valider le lien</Text>
                  )}
                </Pressable>

                <Pressable style={styles.secondaryBtn} onPress={() => router.replace('/(auth)/forgot-password')}>
                  <Text style={styles.secondaryText}>Renvoyer un email</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#1A1400', colors.background]} style={styles.flex}>
        <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
          <Text style={styles.title}>Nouveau mot de passe</Text>
          <Text style={styles.subtitle}>Choisissez un nouveau mot de passe pour votre compte.</Text>

          <Text style={styles.label}>Nouveau mot de passe</Text>
          <PasswordInput
            value={password}
            onChangeText={setPassword}
            placeholder="6 caractères minimum"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Confirmer</Text>
          <PasswordInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Retapez le mot de passe"
            placeholderTextColor={colors.textMuted}
          />

          <Pressable
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.buttonText}>Enregistrer</Text>
            )}
          </Pressable>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  waitContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  linkInput: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 14,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  secondaryText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
});
