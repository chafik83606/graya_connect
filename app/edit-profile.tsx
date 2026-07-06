import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../lib/errors';
import { uploadAvatar } from '../lib/api/storage';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing } from '../lib/theme';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setBio(profile.bio ?? '');
      setAvatarUri(profile.avatar_url);
    }
  }, [profile]);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission refusée', 'Autorisez l\'accès à la galerie pour changer la photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user || !displayName.trim()) {
      Alert.alert('Erreur', 'Le nom affiché est obligatoire.');
      return;
    }

    setLoading(true);
    try {
      let avatarUrl = profile?.avatar_url ?? null;
      if (avatarUri && avatarUri !== profile?.avatar_url && !avatarUri.startsWith('http')) {
        avatarUrl = await uploadAvatar(user.id, avatarUri);
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      router.back();
    } catch (error) {
      Alert.alert('Erreur', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const initial = displayName.charAt(0).toUpperCase() || 'G';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <Pressable onPress={handleSave} disabled={loading} style={styles.saveButton}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.saveText}>Enregistrer</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.form}>
        <Pressable style={styles.avatarBlock} onPress={pickAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
          <View style={styles.avatarEdit}>
            <Ionicons name="camera" size={16} color={colors.background} />
          </View>
        </Pressable>
        <Text style={styles.avatarHint}>
          {profile?.is_artist
            ? 'Cette photo apparaît sur la bannière du fil d\'actualité.'
            : 'Appuyez pour changer votre photo'}
        </Text>

        <Text style={styles.label}>Nom affiché</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Votre pseudo"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Parlez de vous..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={160}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: { padding: spacing.xs },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: '600' },
  saveButton: { minWidth: 80, alignItems: 'flex-end' },
  saveText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  form: { padding: spacing.md, gap: spacing.sm, alignItems: 'center' },
  avatarBlock: { position: 'relative', marginBottom: spacing.xs },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primaryDark,
  },
  avatarInitial: { color: colors.background, fontSize: 36, fontWeight: '800' },
  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarHint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    alignSelf: 'stretch',
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
