import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
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

import { createPost } from '../lib/api/posts';
import { ensureUserProfile } from '../lib/api/profile';
import { uploadPostImage } from '../lib/api/storage';
import { getErrorMessage } from '../lib/errors';
import { useAuth } from '../contexts/AuthContext';
import { colors, radius, spacing } from '../lib/theme';

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const { user, isDemoMode } = useAuth();
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission refusée', 'Autorisez l\'accès à la galerie pour ajouter une photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePublish = async () => {
    if (isDemoMode) {
      Alert.alert('Mode démo', 'Connectez-vous avec un vrai compte pour publier.');
      return;
    }

    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour publier un post.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Erreur', 'Écrivez quelque chose avant de publier.');
      return;
    }

    setLoading(true);
    try {
      await ensureUserProfile(user.id, user.user_metadata);

      let imageUrl: string | null = null;
      if (imageUri) {
        imageUrl = await uploadPostImage(user.id, imageUri);
      }
      await createPost(user.id, content, imageUrl);
      router.back();
    } catch (error) {
      Alert.alert('Publication échouée', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Nouveau post</Text>
        <Pressable
          onPress={handlePublish}
          disabled={loading || !content.trim()}
          style={[styles.publishButton, (!content.trim() || loading) && styles.publishDisabled]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.publishText}>Publier</Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          placeholder="Quoi de neuf ?"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
          autoFocus
        />

        {imageUri ? (
          <View style={styles.imagePreview}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
            <Pressable style={styles.removeImage} onPress={() => setImageUri(null)}>
              <Ionicons name="close-circle" size={28} color={colors.error} />
            </Pressable>
          </View>
        ) : null}

        <Pressable style={styles.addPhotoButton} onPress={pickImage}>
          <Ionicons name="image-outline" size={22} color={colors.primary} />
          <Text style={styles.addPhotoText}>Ajouter une photo</Text>
        </Pressable>
      </ScrollView>
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
  headerButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  publishButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    minWidth: 80,
    alignItems: 'center',
  },
  publishDisabled: {
    opacity: 0.5,
  },
  publishText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 14,
  },
  body: {
    padding: spacing.md,
    gap: spacing.md,
  },
  input: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 26,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imagePreview: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  removeImage: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addPhotoText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
});
