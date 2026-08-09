import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'sakeenah_favorite_azkar';

export async function getFavoriteIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch (err) {
    console.error('getFavoriteIds failed', err);
    return [];
  }
}

export async function isFavorite(zekrId: string): Promise<boolean> {
  const ids = await getFavoriteIds();
  return ids.includes(zekrId);
}

export async function toggleFavorite(zekrId: string): Promise<boolean> {
  const ids = await getFavoriteIds();
  const exists = ids.includes(zekrId);
  const updated = exists ? ids.filter((id) => id !== zekrId) : [...ids, zekrId];
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  return !exists;
}
