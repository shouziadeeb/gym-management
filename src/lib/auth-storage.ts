import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/** Supabase auth storage — synchronous localStorage on web (PKCE flow state survives redirect). */
export function createAuthStorage() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return AsyncStorage;
}

export const AUTH_STORAGE_KEY = 'gym-auth';
