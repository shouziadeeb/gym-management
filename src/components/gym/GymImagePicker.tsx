import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Plus, X } from 'lucide-react-native';

import { useTheme } from '@/hooks/useTheme';
import { imageMediaConfig, imagePickerOptions } from '@/lib/media';
import type { ThemeColors } from '@/theme/colors';
import { text as textClasses } from '@/theme/classes';
import { cardSurface } from '@/theme/styles';
import type { GymImage } from '@/api/gym-images.api';

const MAX_IMAGES = imageMediaConfig.maxImagesPerGym;
const IMAGE_SIZE = 140;
const TILE_OUTER = IMAGE_SIZE + 12;

type Props = {
  images: GymImage[];
  logoUrl?: string | null;
  onAdd: (uri: string) => Promise<void>;
  onRemove: (path: string) => Promise<void>;
  onRemoveLogo?: () => Promise<void>;
  disabled?: boolean;
};

export function GymImagePicker({ images, logoUrl, onAdd, onRemove, onRemoveLogo, disabled }: Props) {
  const { colors } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [removingPath, setRemovingPath] = useState<string | null>(null);
  const [removingLogo, setRemovingLogo] = useState(false);

  const hasLogo = Boolean(logoUrl?.trim());
  const totalCount = (hasLogo ? 1 : 0) + images.length;
  const canAdd = totalCount < MAX_IMAGES && !uploading && !disabled;

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload gym images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync(imagePickerOptions);

    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      await onAdd(result.assets[0].uri);
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Could not upload image.');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(path: string) {
    async function executeRemove() {
      setRemovingPath(path);
      try {
        await onRemove(path);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Could not remove image.';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Error', msg);
        }
      } finally {
        setRemovingPath(null);
      }
    }

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to remove this image?')) {
        await executeRemove();
      }
    } else {
      Alert.alert('Remove image', 'Are you sure you want to remove this image?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: executeRemove },
      ]);
    }
  }

  async function handleRemoveLogo() {
    if (!onRemoveLogo) return;

    async function executeLogo() {
      setRemovingLogo(true);
      try {
        await onRemoveLogo!();
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Could not remove logo.';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Error', msg);
        }
      } finally {
        setRemovingLogo(false);
      }
    }

    if (Platform.OS === 'web') {
      if (window.confirm('Remove the gym logo?')) {
        await executeLogo();
      }
    } else {
      Alert.alert('Remove logo', 'Are you sure you want to remove the gym logo?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: executeLogo },
      ]);
    }
  }

  return (
    <View>
      <View className="flex-row items-center justify-between mb-3">
        <Text className={textClasses.cardTitle} style={{ color: colors.foreground }}>
          Gym Photos
        </Text>
        <Text className={textClasses.caption} style={{ color: colors.muted }}>
          {totalCount}/{MAX_IMAGES}
        </Text>
      </View>

      <View className="flex-row flex-wrap">
        {hasLogo && (
          <LogoTile
            url={logoUrl!.trim()}
            colors={colors}
            removing={removingLogo}
            onRemove={onRemoveLogo ? handleRemoveLogo : undefined}
          />
        )}

        {images.map((image) => (
          <ImageTile
            key={image.path}
            image={image}
            removing={removingPath === image.path}
            onRemove={() => handleRemove(image.path)}
            colors={colors}
          />
        ))}

        {canAdd && <AddTile onPress={pickImage} colors={colors} />}

        {uploading && (
          <View
            className="items-center justify-center rounded-2xl border border-dashed"
            style={[
              { width: IMAGE_SIZE, height: IMAGE_SIZE, margin: 6, borderColor: colors.border },
              cardSurface(colors),
            ]}
          >
            <ActivityIndicator color={colors.primary} />
            <Text className={`mt-2 ${textClasses.caption}`} style={{ color: colors.muted }}>
              Uploading…
            </Text>
          </View>
        )}
      </View>

      {totalCount === 0 && !uploading && (
        <View className="items-center py-6">
          <Camera size={32} color={colors.muted} />
          <Text className={`mt-2 ${textClasses.caption}`} style={{ color: colors.muted }}>
            Add up to {MAX_IMAGES} photos of your gym
          </Text>
        </View>
      )}
    </View>
  );
}

const CLOSE_BTN = 26;

type LogoTileProps = {
  url: string;
  colors: ThemeColors;
  removing: boolean;
  onRemove?: () => void;
};

function LogoTile({ url, colors, removing, onRemove }: LogoTileProps) {
  return (
    <View style={{ width: TILE_OUTER, height: TILE_OUTER, padding: 6 }}>
      <Image
        source={{ uri: url }}
        style={{
          width: IMAGE_SIZE,
          height: IMAGE_SIZE,
          borderRadius: 14,
          backgroundColor: colors.surface,
        }}
        resizeMode="cover"
      />
      <View
        style={{
          position: 'absolute',
          bottom: 6,
          left: 6,
          right: 6,
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.55)',
          borderBottomLeftRadius: 14,
          borderBottomRightRadius: 14,
          paddingVertical: 3,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>Logo</Text>
      </View>

      {removing ? (
        <View
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            width: IMAGE_SIZE,
            height: IMAGE_SIZE,
            borderRadius: 14,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator color="#fff" />
        </View>
      ) : onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: CLOSE_BTN,
            height: CLOSE_BTN,
            borderRadius: CLOSE_BTN / 2,
            backgroundColor: colors.danger,
            borderWidth: 2,
            borderColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <X size={12} color={colors.dangerForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

type ImageTileProps = {
  image: GymImage;
  removing: boolean;
  onRemove: () => void;
  colors: ThemeColors;
};

function ImageTile({ image, removing, onRemove, colors }: ImageTileProps) {
  return (
    <View style={{ width: TILE_OUTER, height: TILE_OUTER, padding: 6 }}>
      <Image
        source={{ uri: image.url }}
        style={{
          width: IMAGE_SIZE,
          height: IMAGE_SIZE,
          borderRadius: 14,
          backgroundColor: colors.surface,
        }}
        resizeMode="cover"
      />

      {removing ? (
        <View
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            width: IMAGE_SIZE,
            height: IMAGE_SIZE,
            borderRadius: 14,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator color="#fff" />
        </View>
      ) : (
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: CLOSE_BTN,
            height: CLOSE_BTN,
            borderRadius: CLOSE_BTN / 2,
            backgroundColor: colors.danger,
            borderWidth: 2,
            borderColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <X size={12} color={colors.dangerForeground} />
        </Pressable>
      )}
    </View>
  );
}

function AddTile({ onPress, colors }: { onPress: () => void; colors: ThemeColors }) {
  return (
    <View style={{ width: TILE_OUTER, height: TILE_OUTER, padding: 6 }}>
      <Pressable
        onPress={onPress}
        style={{
          width: IMAGE_SIZE,
          height: IMAGE_SIZE,
          borderRadius: 16,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Plus size={28} color={colors.primary} />
        <Text style={{ marginTop: 4, fontSize: 12, fontWeight: '500', color: colors.primary }}>
          Add Photo
        </Text>
      </Pressable>
    </View>
  );
}
