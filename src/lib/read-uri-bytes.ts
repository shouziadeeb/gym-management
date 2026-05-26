const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function extractExtFromUri(uri: string): string | null {
  if (uri.startsWith('blob:') || uri.startsWith('data:')) return null;
  const match = uri.match(/\.([a-zA-Z]{3,4})(?:\?.*)?$/);
  return match ? match[1].toLowerCase() : null;
}

export function resolveImageContentType(
  uri: string,
  headerContentType?: string | null,
): { contentType: string; ext: string } {
  const header = headerContentType?.split(';')[0]?.trim().toLowerCase();
  if (header && MIME_TO_EXT[header]) {
    return { contentType: header, ext: MIME_TO_EXT[header] };
  }

  const uriExt = extractExtFromUri(uri);
  if (uriExt) {
    const normalized = uriExt === 'jpg' ? 'jpeg' : uriExt;
    return { contentType: `image/${normalized}`, ext: uriExt };
  }

  return { contentType: 'image/jpeg', ext: 'jpg' };
}

/**
 * Reads a local or remote URI into bytes.
 * Uses `Response.arrayBuffer()` — React Native Blob lacks `.arrayBuffer()`.
 */
export async function readUriAsUint8Array(uri: string): Promise<{
  bytes: Uint8Array;
  contentType: string | null;
}> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Failed to read image file before upload.');
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    bytes: new Uint8Array(arrayBuffer),
    contentType: response.headers.get('content-type'),
  };
}

export async function readUriAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const { bytes } = await readUriAsUint8Array(uri);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
