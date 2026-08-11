import AsyncStorage from '@react-native-async-storage/async-storage';

import { flatVerses, getChapter, totalVerseCount } from './quran';
import { logCompletion } from './history';

const DURATION_KEY = 'sakeenah_khatma_duration_days';
const PROGRESS_KEY = 'sakeenah_khatma_progress_verses';
const LAST_DONE_DATE_KEY = 'sakeenah_khatma_last_done_date';
const STREAK_KEY = 'sakeenah_khatma_streak';

export type KhatmaPlan = {
  durationDays: number;
  progressVerses: number;
  totalVerses: number;
  dailyTarget: number;
  streak: number;
  doneToday: boolean;
  completed: boolean;
  progressPercent: number;
  todayRangeLabel: string;
};

function todayStr(reference: Date = new Date()): string {
  return reference.toISOString().split('T')[0];
}

function yesterdayStr(reference: Date = new Date()): string {
  const d = new Date(reference);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/** بيبدأ خطة ختمة جديدة على مدار عدد الأيام المطلوب، وبيمسح أي تقدّم قديم. */
export async function startKhatmaPlan(durationDays: number): Promise<void> {
  await AsyncStorage.setItem(DURATION_KEY, String(durationDays));
  await AsyncStorage.setItem(PROGRESS_KEY, '0');
  await AsyncStorage.removeItem(LAST_DONE_DATE_KEY);
  await AsyncStorage.removeItem(STREAK_KEY);
}

export async function resetKhatmaPlan(): Promise<void> {
  await AsyncStorage.multiRemove([DURATION_KEY, PROGRESS_KEY, LAST_DONE_DATE_KEY, STREAK_KEY]);
}

export async function getKhatmaPlan(): Promise<KhatmaPlan | null> {
  const durationRaw = await AsyncStorage.getItem(DURATION_KEY);
  if (!durationRaw) return null;

  const durationDays = parseInt(durationRaw, 10);
  const progressRaw = await AsyncStorage.getItem(PROGRESS_KEY);
  const progressVerses = Math.min(progressRaw ? parseInt(progressRaw, 10) : 0, totalVerseCount);
  const lastDone = await AsyncStorage.getItem(LAST_DONE_DATE_KEY);
  const streakRaw = await AsyncStorage.getItem(STREAK_KEY);

  const today = todayStr();
  const yesterday = yesterdayStr();
  // لو فاتت يوم من غير ما يحدد وردته، الاستمرارية بتتكسر (زي أذكار الصباح/المساء بالظبط).
  const streak =
    lastDone === today || lastDone === yesterday ? (streakRaw ? parseInt(streakRaw, 10) : 0) : 0;

  const dailyTarget = Math.ceil(totalVerseCount / durationDays);
  const completed = progressVerses >= totalVerseCount;
  const doneToday = lastDone === today;

  let todayRangeLabel = 'خلصت الختمة كاملة 🎉';
  if (!completed) {
    const startIdx = Math.min(progressVerses, totalVerseCount - 1);
    const endIdx = Math.min(progressVerses + dailyTarget - 1, totalVerseCount - 1);
    const startRef = flatVerses[startIdx];
    const endRef = flatVerses[endIdx];
    const startChapter = getChapter(startRef.chapterId);
    const endChapter = getChapter(endRef.chapterId);
    todayRangeLabel =
      startRef.chapterId === endRef.chapterId
        ? `سورة ${startChapter?.name} — من آية ${startRef.verseId} إلى آية ${endRef.verseId}`
        : `من سورة ${startChapter?.name} آية ${startRef.verseId} إلى سورة ${endChapter?.name} آية ${endRef.verseId}`;
  }

  return {
    durationDays,
    progressVerses,
    totalVerses: totalVerseCount,
    dailyTarget,
    streak,
    doneToday,
    completed,
    progressPercent: Math.round((progressVerses / totalVerseCount) * 100),
    todayRangeLabel,
  };
}

/** بيسجّل إن المستخدم خلّص وِرد النهاردة، وبيقدّم التقدّم والاستمرارية. */
export async function markKhatmaDoneToday(): Promise<KhatmaPlan | null> {
  const plan = await getKhatmaPlan();
  if (!plan || plan.completed || plan.doneToday) return plan;

  const today = todayStr();
  const yesterday = yesterdayStr();
  const lastDone = await AsyncStorage.getItem(LAST_DONE_DATE_KEY);
  const newStreak = lastDone === yesterday ? plan.streak + 1 : 1;

  const newProgress = Math.min(plan.progressVerses + plan.dailyTarget, plan.totalVerses);
  await AsyncStorage.setItem(PROGRESS_KEY, String(newProgress));
  await AsyncStorage.setItem(LAST_DONE_DATE_KEY, today);
  await AsyncStorage.setItem(STREAK_KEY, String(newStreak));
  await logCompletion('khatma');

  return getKhatmaPlan();
}
