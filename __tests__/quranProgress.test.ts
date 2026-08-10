import AsyncStorage from '@react-native-async-storage/async-storage';

import { getLastRead, setLastRead } from '@/data/quranProgress';

describe('quran progress', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('بترجع null لو لسه ما اتسجّلش أي قراءة', async () => {
    const result = await getLastRead();
    expect(result).toBeNull();
  });

  it('بتحفظ وترجّع آخر مكان اتقرا بالظبط', async () => {
    await setLastRead(2, 15);
    const result = await getLastRead();
    expect(result).toEqual({ chapterId: 2, verseId: 15 });
  });

  it('آخر setLastRead هو اللي بيفضل محفوظ', async () => {
    await setLastRead(2, 15);
    await setLastRead(18, 10);
    const result = await getLastRead();
    expect(result).toEqual({ chapterId: 18, verseId: 10 });
  });

  it('بترجع null لو البيانات المخزنة تالفة', async () => {
    await AsyncStorage.setItem('sakeenah_quran_last_read', 'not-valid-json');
    const result = await getLastRead();
    expect(result).toBeNull();
  });
});
