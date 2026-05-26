import type { ImagePickerOptions } from 'expo-image-picker';

/** Shared image picker and upload compression settings. */
export const imageMediaConfig = {
  /** JPEG/WebP quality for library picks (0–1). */
  pickerQuality: 0.75,
  /** Max edge length when resizing before upload (future: expo-image-manipulator). */
  maxUploadDimension: 1920,
  maxImagesPerGym: 4,
} as const;

export const imagePickerOptions: ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: imageMediaConfig.pickerQuality,
  allowsMultipleSelection: false,
};
