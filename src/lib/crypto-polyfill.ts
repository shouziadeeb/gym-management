/**
 * WebCrypto polyfill for Supabase PKCE (S256) on React Native + Expo web/Hermes.
 * Must load before `@/lib/supabase` initializes the client.
 */
import * as ExpoCrypto from 'expo-crypto';
import 'react-native-get-random-values';

type GlobalWithCrypto = typeof globalThis & {
  crypto?: Crypto;
};

function patchSubtleCrypto(cryptoObj: Crypto): void {
  if (cryptoObj.subtle?.digest) {
    return;
  }

  const subtle = {
    digest: async (
      algorithm: AlgorithmIdentifier,
      data: BufferSource,
    ): Promise<ArrayBuffer> => {
      const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
      if (name !== 'SHA-256') {
        throw new Error(`Unsupported digest algorithm: ${name}`);
      }

      const bytes =
        data instanceof ArrayBuffer
          ? new Uint8Array(data)
          : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

      return ExpoCrypto.digest(ExpoCrypto.CryptoDigestAlgorithm.SHA256, bytes);
    },
  } as SubtleCrypto;

  Object.defineProperty(cryptoObj, 'subtle', {
    configurable: true,
    value: subtle,
  });
}

function patchCrypto(): void {
  const global = globalThis as GlobalWithCrypto;
  const existing = global.crypto;

  if (existing?.subtle?.digest && existing.getRandomValues) {
    return;
  }

  const cryptoObj = existing ?? ({} as Crypto);

  if (!cryptoObj.getRandomValues) {
    cryptoObj.getRandomValues = (typedArray) =>
      ExpoCrypto.getRandomValues(typedArray);
  }

  if (!cryptoObj.randomUUID) {
    cryptoObj.randomUUID = () => ExpoCrypto.randomUUID();
  }

  patchSubtleCrypto(cryptoObj);
  global.crypto = cryptoObj;
}

patchCrypto();
