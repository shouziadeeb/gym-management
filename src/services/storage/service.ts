import { getCurrentSession } from '@/services/auth/auth.service';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import {
  STORAGE_BUCKET,
  STORAGE_FOLDERS,
  type StorageFolder,
  type UploadableImage,
  type UploadedImageResult,
} from '@/services/storage/types';
import {
  buildStoragePath,
  extensionFromMimeType,
  normalizeMimeType,
  toArrayBufferFromUri,
  validateImageFile,
} from '@/services/storage/helpers';

function assertAllowedFolder(folder: string): asserts folder is StorageFolder {
  if (!STORAGE_FOLDERS.includes(folder as StorageFolder)) {
    throw new Error(`Unsupported storage folder "${folder}".`);
  }
}

async function assertAuthenticatedUserId(): Promise<string> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error('You must be signed in to upload images.');
  }

  return userId;
}

export async function uploadImage(file: UploadableImage, folder: StorageFolder): Promise<UploadedImageResult> {
  assertAllowedFolder(folder);
  validateImageFile(file);

  const userId = await assertAuthenticatedUserId();
  const mimeType = normalizeMimeType(file);
  const fileExtension = extensionFromMimeType(mimeType);
  const path = buildStoragePath(folder, userId, file.fileName ?? `image.${fileExtension}`);
  const body = await toArrayBufferFromUri(file.uri);

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, body, {
    contentType: mimeType,
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    logger.error('storage.upload.failed', { bucket: STORAGE_BUCKET, path, folder, code: error.name, message: error.message });
    throw new Error('Failed to upload image. Please try again.');
  }

  return {
    path,
    publicUrl: getPublicImageUrl(path),
  };
}

export function getPublicImageUrl(path: string): string {
  const normalizedPath = path.trim().replace(/^\/+/, '');
  if (!normalizedPath) {
    throw new Error('Image path is required to get a public URL.');
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(normalizedPath);
  return data.publicUrl;
}

export async function deleteImage(path: string): Promise<void> {
  const normalizedPath = path.trim().replace(/^\/+/, '');
  if (!normalizedPath) {
    throw new Error('Image path is required for deletion.');
  }

  await assertAuthenticatedUserId();

  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([normalizedPath]);
  if (error) {
    logger.error('storage.delete.failed', { bucket: STORAGE_BUCKET, path: normalizedPath, code: error.name, message: error.message });
    throw new Error('Failed to delete image. Please try again.');
  }
}
