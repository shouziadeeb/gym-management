import { optionalEnv } from '@/lib/env';

export const STORAGE_BUCKET = optionalEnv.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET || 'gym-images';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const STORAGE_FOLDERS = ['gyms', 'reviews', 'trainers', 'profiles'] as const;

export type StorageFolder = (typeof STORAGE_FOLDERS)[number];

export type UploadableImage = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  size?: number | null;
};

export type UploadedImageResult = {
  path: string;
  publicUrl: string;
};
