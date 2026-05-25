import { useCallback, useState } from 'react';

import { uploadImage } from '@/services/storage/service';
import type { StorageFolder, UploadableImage, UploadedImageResult } from '@/services/storage/types';

type UseImageUploadReturn = {
  isUploading: boolean;
  error: string | null;
  upload: (file: UploadableImage, folder: StorageFolder) => Promise<UploadedImageResult | null>;
  resetError: () => void;
};

export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: UploadableImage, folder: StorageFolder) => {
    setIsUploading(true);
    setError(null);
    try {
      return await uploadImage(file, folder);
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Could not upload image.';
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const resetError = useCallback(() => setError(null), []);

  return { isUploading, error, upload, resetError };
}
