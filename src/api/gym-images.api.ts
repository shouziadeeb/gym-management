import { supabase } from '@/lib/supabase';
import { uploadGymImage, deleteGymImage } from '@/lib/storage';
import { logger } from '@/lib/logger';
import type { Gym } from '@/types/models';

const MAX_GYM_IMAGES = 4;

export type GymImage = {
  url: string;
  path: string;
};

export function getGymImages(gym: Gym): GymImage[] {
  const settings = gym.settings as Record<string, unknown> | null;
  const images = settings?.gymImages;
  if (!Array.isArray(images)) return [];
  return images as GymImage[];
}

/** Returns all displayable image URLs: logo first, then uploaded gym images. */
export function getAllGymImageUrls(gym: Gym): string[] {
  const urls: string[] = [];
  if (gym.logo_url?.trim()) urls.push(gym.logo_url.trim());
  for (const img of getGymImages(gym)) {
    urls.push(img.url);
  }
  return urls;
}

export async function addGymImage(gymId: string, localUri: string): Promise<GymImage[]> {
  const gym = await fetchGymForImages(gymId);
  const existing = getGymImages(gym);

  if (existing.length >= MAX_GYM_IMAGES) {
    throw new Error(`Maximum ${MAX_GYM_IMAGES} images allowed.`);
  }

  const { publicUrl, path } = await uploadGymImage(gymId, localUri);
  const updated = [...existing, { url: publicUrl, path }];

  await persistGymImages(gymId, gym, updated);
  logger.info('addGymImage success', { gymId, path });
  return updated;
}

export async function removeGymImage(gymId: string, imagePath: string): Promise<GymImage[]> {
  const gym = await fetchGymForImages(gymId);
  const existing = getGymImages(gym);

  const target = existing.find((img) => img.path === imagePath);
  if (target) {
    await deleteGymImage(target.path);
  }

  const updated = existing.filter((img) => img.path !== imagePath);
  await persistGymImages(gymId, gym, updated);
  logger.info('removeGymImage success', { gymId, imagePath });
  return updated;
}

async function fetchGymForImages(gymId: string): Promise<Gym> {
  const { data, error } = await supabase.from('gyms').select('*').eq('id', gymId).single();
  if (error) throw error;
  return data as Gym;
}

async function persistGymImages(gymId: string, gym: Gym, images: GymImage[]): Promise<void> {
  const currentSettings = (gym.settings ?? {}) as Record<string, unknown>;
  const nextSettings = { ...currentSettings, gymImages: images };

  const { error } = await supabase.from('gyms').update({ settings: nextSettings }).eq('id', gymId);
  if (error) throw error;
}
