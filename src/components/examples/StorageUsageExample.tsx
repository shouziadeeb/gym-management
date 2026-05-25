import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useImageDeletion, useImageUpload } from '@/hooks';
import type { StorageFolder } from '@/services/storage';
import { text } from '@/theme/classes';

type Props = {
  pickedUri: string | null;
  folder?: StorageFolder;
};

export function StorageUsageExample({ pickedUri, folder = 'reviews' }: Props) {
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const { isUploading, error: uploadError, upload } = useImageUpload();
  const { isDeleting, error: deleteError, remove } = useImageDeletion();

  async function handleUpload() {
    if (!pickedUri) return;

    const result = await upload(
      {
        uri: pickedUri,
        fileName: `${folder}-example.jpg`,
      },
      folder,
    );

    if (!result) return;
    setUploadedPath(result.path);
    setPublicUrl(result.publicUrl);
  }

  async function handleDelete() {
    if (!uploadedPath) return;
    const success = await remove(uploadedPath);
    if (!success) return;

    setUploadedPath(null);
    setPublicUrl(null);
  }

  return (
    <View>
      <Button title="Upload sample image" onPress={handleUpload} loading={isUploading} disabled={!pickedUri || isDeleting} />
      <View className="mt-2">
        <Button title="Delete uploaded image" onPress={handleDelete} loading={isDeleting} disabled={!uploadedPath || isUploading} variant="danger" />
      </View>

      {uploadedPath ? <Text className={`mt-2 ${text.caption}`}>Path: {uploadedPath}</Text> : null}
      {publicUrl ? <Text className={`mt-1 ${text.caption}`}>Public URL: {publicUrl}</Text> : null}
      {uploadError ? <Text className={`mt-1 ${text.error}`}>{uploadError}</Text> : null}
      {deleteError ? <Text className={`mt-1 ${text.error}`}>{deleteError}</Text> : null}
    </View>
  );
}
