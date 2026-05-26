import { logger } from '@/lib/logger';
import { readUriAsUint8Array, resolveImageContentType } from '@/lib/read-uri-bytes';
import { supabase } from '@/lib/supabase';

const GYM_IMAGES_BUCKET = 'gym-images';

export type UploadResult = {
  publicUrl: string;
  path: string;
};

export async function uploadGymImage(gymId: string, uri: string): Promise<UploadResult> {
  const { bytes, contentType: headerType } = await readUriAsUint8Array(uri);
  const { contentType, ext } = resolveImageContentType(uri, headerType);
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `${gymId}/${fileName}`;

  const { error } = await supabase.storage.from(GYM_IMAGES_BUCKET).upload(storagePath, bytes, {
    contentType,
    upsert: false,
  });

  if (error) {
    logger.error('uploadGymImage failed', { storagePath, error: error.message });
    throw error;
  }

  const { data: urlData } = supabase.storage.from(GYM_IMAGES_BUCKET).getPublicUrl(storagePath);

  return { publicUrl: urlData.publicUrl, path: storagePath };
}

export async function deleteGymImage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(GYM_IMAGES_BUCKET).remove([storagePath]);

  if (error) {
    logger.warn('deleteGymImage failed', { storagePath, error: error.message });
  }
}

/**
 * Deletes a file from any storage bucket given its full public URL.
 * Extracts the bucket name and path from the URL pattern:
 *   .../storage/v1/object/public/{bucket}/{path}
 */
export async function deleteImageByUrl(publicUrl: string): Promise<void> {
  const match = publicUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!match) {
    logger.warn('deleteImageByUrl: could not parse storage path from URL', { publicUrl });
    return;
  }

  const [, bucket, path] = match;
  const { error } = await supabase.storage.from(bucket).remove([decodeURIComponent(path)]);

  if (error) {
    logger.warn('deleteImageByUrl failed', { bucket, path, error: error.message });
  }
}
