import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * سجل بسيط بالأيام اللي المستخدم خلّص فيها أذكار الصباح/المساء أو وِرد
 * الختمة، بالإضافة لعدد التسبيح اليومي. مختلف عن `streak.ts` اللي بيهتم
 * بالاستمرارية الحالية بس — ده أرشيف تاريخي بنستخدمه في شاشة الإحصائيات
 * لعرض آخر أسبوع/شهر ومجاميع كلية.
 *
 * بيتخزن كـ map مفتاحه التاريخ (YYYY-MM-DD) عشان القراءة والتحديث يكونوا
 * O(1)، ومحدود بآخر MAX_DAYS يوم عشان الحجم في AsyncStorage يفضل معقول.
 */

const HISTORY_KEY = 'sakeenah_completion_history';
const MAX_DAYS = 120;

export type DayRecord = {
  date: string;
  morning?: boolean;
  evening?: boolean;
  khatma?: boolean;
  tasbeeh?: number;
};

function todayStr(reference: Date = new Date()): string {
  return reference.toISOString().split('T')[0];
}

async function readHistory(): Promise<Record<string, DayRecord>> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function writeHistory(map: Record<string, DayRecord>): Promise<void> {
  const dates = Object.keys(map).sort();
  if (dates.length > MAX_DAYS) {
    for (const d of dates.slice(0, dates.length - MAX_DAYS)) {
      delete map[d];
    }
  }
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(map));
  } catch {
    // تجاهل فشل الكتابة — السجل التاريخي مش حرج زي التخزين الأساسي.
  }
}

export async function logCompletion(field: 'morning' | 'evening' | 'khatma'): Promise<void> {
  const map = await readHistory();
  const today = todayStr();
  map[today] = { ...(map[today] ?? { date: today }), [field]: true };
  await writeHistory(map);
}

export async function logTasbeehCount(count: number): Promise<void> {
  if (count <= 0) return;
  const map = await readHistory();
  const today = todayStr();
  const existing = map[today]?.tasbeeh ?? 0;
  map[today] = { ...(map[today] ?? { date: today }), tasbeeh: existing + count };
  await writeHistory(map);
}

/** بيرجع آخر n يوم بالترتيب الزمني (الأقدم أولاً)، بما فيهم الأيام الفاضية. */
export async function getLastNDays(n: number): Promise<DayRecord[]> {
  const map = await readHistory();
  const result: DayRecord[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayStr(d);
    result.push(map[key] ?? { date: key });
  }
  return result;
}

export type HistorySummary = {
  totalMorningDays: number;
  totalEveningDays: number;
  totalKhatmaDays: number;
  totalTasbeeh: number;
};

export async function getHistorySummary(): Promise<HistorySummary> {
  const map = await readHistory();
  const summary: HistorySummary = {
    totalMorningDays: 0,
    totalEveningDays: 0,
    totalKhatmaDays: 0,
    totalTasbeeh: 0,
  };
  for (const record of Object.values(map)) {
    if (record.morning) summary.totalMorningDays += 1;
    if (record.evening) summary.totalEveningDays += 1;
    if (record.khatma) summary.totalKhatmaDays += 1;
    summary.totalTasbeeh += record.tasbeeh ?? 0;
  }
  return summary;
}
