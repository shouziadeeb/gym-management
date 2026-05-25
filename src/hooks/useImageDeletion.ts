import { useCallback, useState } from 'react';

import { deleteImage } from '@/services/storage/service';

type UseImageDeletionReturn = {
  isDeleting: boolean;
  error: string | null;
  remove: (path: string) => Promise<boolean>;
  resetError: () => void;
};

export function useImageDeletion(): UseImageDeletionReturn {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (path: string) => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteImage(path);
      return true;
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Could not delete image.';
      setError(message);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const resetError = useCallback(() => setError(null), []);

  return { isDeleting, error, remove, resetError };
}
