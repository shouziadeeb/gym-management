import AsyncStorage from '@react-native-async-storage/async-storage';

import { logger } from '@/lib/logger';

const RECENTS_KEY = 'gym_discovery_recent_v1';
const SEARCH_HISTORY_KEY = 'gym_discovery_search_history_v1';
const FAVORITES_KEY = 'gym_discovery_favorite_categories_v1';

const RECENT_LIMIT = 24;
const SEARCH_LIMIT = 20;
const CATEGORY_LIMIT = 12;

export async function readRecentGymIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENTS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch (error) {
    logger.warn('discovery.storage.recent_read_failed', { error });
    return [];
  }
}

export async function recordGymView(gymId: string): Promise<void> {
  if (!gymId) return;

  try {
    const existing = await readRecentGymIds();
    const next = [gymId, ...existing.filter((id) => id !== gymId)].slice(0, RECENT_LIMIT);

    await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch (error) {
    logger.warn('discovery.storage.recent_write_failed', { error, gymId });
  }
}

export async function appendSearchHistoryTerm(term: string): Promise<void> {
  const normalized = term.trim();
  if (normalized.length < 2 || normalized.length > 120) return;

  try {
    const raw = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    let existing: string[] = [];

    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        existing = parsed.filter((value): value is string => typeof value === 'string');
      }
    }

    const next = [normalized, ...existing.filter((value) => value.toLowerCase() !== normalized.toLowerCase())].slice(
      0,
      SEARCH_LIMIT,
    );

    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
  } catch (error) {
    logger.warn('discovery.storage.search_history_write_failed', { error, normalized });
  }
}

export async function readSearchHistory(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((value): value is string => typeof value === 'string').slice(0, SEARCH_LIMIT);
  } catch (error) {
    logger.warn('discovery.storage.search_history_read_failed', { error });
    return [];
  }
}

export async function readFavoriteCategories(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((slug): slug is string => typeof slug === 'string' && slug.length > 0).slice(0, CATEGORY_LIMIT);
  } catch (error) {
    logger.warn('discovery.storage.favorite_categories_read_failed', { error });
    return [];
  }
}

export async function toggleFavoriteCategory(slug: string): Promise<void> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return;

  try {
    const existing = await readFavoriteCategories();

    const has = existing.some((entry) => entry.toLowerCase() === normalized);

    const next = has ? existing.filter((entry) => entry.toLowerCase() !== normalized) : [normalized, ...existing];

    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next.slice(0, CATEGORY_LIMIT)));
  } catch (error) {
    logger.warn('discovery.storage.favorite_categories_write_failed', { error, normalized });
  }
}
