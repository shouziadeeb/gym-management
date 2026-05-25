import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES, type StorageFolder, type UploadableImage } from '@/services/storage/types';

const FILE_EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function sanitizeFileSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildStoragePath(folder: StorageFolder, userId: string, sourceName?: string | null): string {
  const cleanedName = sanitizeFileSegment(sourceName ?? '') || 'image';
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const extension = sourceName?.split('.').pop()?.toLowerCase();
  const fileExtension = extension && extension.length <= 5 ? extension : 'jpg';

  return `${folder}/${userId}/${timestamp}-${random}-${cleanedName}.${fileExtension}`;
}

export function normalizeMimeType(file: UploadableImage): string {
  const fromFile = file.mimeType?.trim().toLowerCase();
  if (fromFile) return fromFile;

  const extension = file.fileName?.split('.').pop()?.toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';

  return 'image/jpeg';
}

export function validateImageFile(file: UploadableImage): void {
  if (!file?.uri || typeof file.uri !== 'string') {
    throw new Error('Please select a valid image file.');
  }

  const mimeType = normalizeMimeType(file);
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    throw new Error('Unsupported image format. Use JPG, PNG, or WEBP.');
  }

  if (typeof file.size === 'number' && file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Image size must be less than 5MB.');
  }
}

export async function toArrayBufferFromUri(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Failed to read image file before upload.');
  }

  return response.arrayBuffer();
}

export function extensionFromMimeType(mimeType: string): string {
  return FILE_EXTENSION_BY_MIME[mimeType] ?? 'jpg';
}

