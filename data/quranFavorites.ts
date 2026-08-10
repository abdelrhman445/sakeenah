import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'sakeenah_quran_favorite_verses';

function verseKey(chapterId: number, verseId: number): string {
  return `${chapterId}:${verseId}`;
}

export async function getFavoriteVerseIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch (err) {
    console.error('getFavoriteVerseIds failed', err);
    return [];
  }
}

export async function isFavoriteVerse(chapterId: number, verseId: number): Promise<boolean> {
  const ids = await getFavoriteVerseIds();
  return ids.includes(verseKey(chapterId, verseId));
}

export async function toggleFavoriteVerse(chapterId: number, verseId: number): Promise<boolean> {
  const key = verseKey(chapterId, verseId);
  const ids = await getFavoriteVerseIds();
  const exists = ids.includes(key);
  const updated = exists ? ids.filter((id) => id !== key) : [...ids, key];
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  return !exists;
}

export function parseVerseKey(key: string): { chapterId: number; verseId: number } {
  const [chapterId, verseId] = key.split(':').map(Number);
  return { chapterId, verseId };
}
