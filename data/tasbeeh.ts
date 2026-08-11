import AsyncStorage from '@react-native-async-storage/async-storage';

import { logTasbeehCount } from './history';

/**
 * عداد تسبيح عام مستقل عن عداد الأذكار الموجود جوه كل فئة — ده لأي تسبيح
 * حر (سبحة إلكترونية) من غير ما يكون مربوط بذكر معيّن. بنحتفظ برقم إجمالي
 * تراكمي مدى الحياة، وبنسجّل كل زيادة في `history.ts` عشان تظهر في
 * الإحصائيات.
 */

const TOTAL_KEY = 'sakeenah_tasbeeh_total';

export async function getTasbeehTotal(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(TOTAL_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

/** بيضيف عدد تسبيحات جديدة للإجمالي ويرجّع الإجمالي الجديد. */
export async function addTasbeehCount(count: number): Promise<number> {
  if (count <= 0) return getTasbeehTotal();
  const current = await getTasbeehTotal();
  const next = current + count;
  try {
    await AsyncStorage.setItem(TOTAL_KEY, String(next));
  } catch {
    // تجاهل — هنحاول تاني في المرة الجاية.
  }
  await logTasbeehCount(count);
  return next;
}

export async function resetTasbeehTotal(): Promise<void> {
  try {
    await AsyncStorage.setItem(TOTAL_KEY, '0');
  } catch {
    // تجاهل
  }
}
