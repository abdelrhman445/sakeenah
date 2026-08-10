import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_READ_KEY = 'sakeenah_quran_last_read';

export type LastRead = {
  chapterId: number;
  verseId: number;
};

export async function getLastRead(): Promise<LastRead | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_READ_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.chapterId === 'number' && typeof parsed.verseId === 'number') {
      return parsed;
    }
    return null;
  } catch (err) {
    console.error('getLastRead failed', err);
    return null;
  }
}

export async function setLastRead(chapterId: number, verseId: number): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_READ_KEY, JSON.stringify({ chapterId, verseId }));
  } catch (err) {
    console.error('setLastRead failed', err);
  }
}
