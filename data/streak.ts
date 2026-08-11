import AsyncStorage from '@react-native-async-storage/async-storage';

import { logCompletion } from './history';

/**
 * الستريك بقى مقسوم بين الصباح والمساء بدل عداد واحد مشترك — كده كل
 * فئة (صباح/مساء) بتحسب استمراريتها لوحدها، وده أصح لتطبيق اسمه "سكينة"
 * مبني أساسًا على عادتي الصباح والمساء.
 */
export type StreakType = 'morning' | 'evening';

const STREAK_KEY = (type: StreakType) => `sakeenah_streak_${type}`;
const LAST_DATE_KEY = (type: StreakType) => `sakeenah_last_completed_date_${type}`;

// مفاتيح الستريك القديمة (قبل الفصل) — نستخدمها مرة واحدة فقط للترحيل
// عشان المستخدمين اللي كانوا عندهم ستريك قبل التحديث ميخسروهوش.
const LEGACY_STREAK_KEY = 'sakeenah_streak';
const LEGACY_LAST_DATE_KEY = 'sakeenah_last_completed_date';
const LEGACY_MIGRATED_KEY = 'sakeenah_streak_migrated';

function todayStr(reference: Date = new Date()): string {
  return reference.toISOString().split('T')[0];
}

function yesterdayStr(reference: Date = new Date()): string {
  const d = new Date(reference);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

async function migrateLegacyStreakIfNeeded(): Promise<void> {
  const migrated = await AsyncStorage.getItem(LEGACY_MIGRATED_KEY);
  if (migrated === 'true') return;

  const legacyStreak = await AsyncStorage.getItem(LEGACY_STREAK_KEY);
  const legacyDate = await AsyncStorage.getItem(LEGACY_LAST_DATE_KEY);

  if (legacyStreak && legacyDate) {
    // نحط قيمة الستريك القديمة على الصباح والمساء الاتنين، أفضل من ما نصفرها.
    await AsyncStorage.setItem(STREAK_KEY('morning'), legacyStreak);
    await AsyncStorage.setItem(LAST_DATE_KEY('morning'), legacyDate);
    await AsyncStorage.setItem(STREAK_KEY('evening'), legacyStreak);
    await AsyncStorage.setItem(LAST_DATE_KEY('evening'), legacyDate);
  }

  await AsyncStorage.setItem(LEGACY_MIGRATED_KEY, 'true');
}

/**
 * تسجيل إن فئة معينة اتعملت النهاردة. لو الفئة صباح أو مساء بيتحسب لها
 * ستريك مستقل؛ أي فئة تانية (النوم، التسبيح...) بترجع 0 لأنها مش جزء
 * من حساب الاستمرارية الأساسي.
 */
export async function markCategoryDoneToday(categoryId: string): Promise<number> {
  if (categoryId !== 'morning' && categoryId !== 'evening') {
    return 0;
  }

  await migrateLegacyStreakIfNeeded();

  const type = categoryId as StreakType;
  const lastDate = await AsyncStorage.getItem(LAST_DATE_KEY(type));
  const today = todayStr();

  if (lastDate === today) {
    const current = await AsyncStorage.getItem(STREAK_KEY(type));
    return current ? parseInt(current, 10) : 1;
  }

  let streak = 1;
  if (lastDate === yesterdayStr()) {
    const current = await AsyncStorage.getItem(STREAK_KEY(type));
    streak = (current ? parseInt(current, 10) : 0) + 1;
  }

  await AsyncStorage.setItem(STREAK_KEY(type), streak.toString());
  await AsyncStorage.setItem(LAST_DATE_KEY(type), today);
  await logCompletion(type);
  return streak;
}

export async function getStreak(type: StreakType): Promise<number> {
  await migrateLegacyStreakIfNeeded();

  const lastDate = await AsyncStorage.getItem(LAST_DATE_KEY(type));
  const streak = await AsyncStorage.getItem(STREAK_KEY(type));

  if (!lastDate || !streak) return 0;

  const today = todayStr();
  const yesterday = yesterdayStr();

  // لو آخر يوم اتعمل فيه ذكر مش النهاردة ولا إمبارح، الـ streak اتكسر
  if (lastDate !== today && lastDate !== yesterday) {
    return 0;
  }

  return parseInt(streak, 10);
}

export async function getBothStreaks(): Promise<{ morning: number; evening: number }> {
  const [morning, evening] = await Promise.all([getStreak('morning'), getStreak('evening')]);
  return { morning, evening };
}

// مصدّرة لأغراض الاختبار فقط.
export const __testables = { todayStr, yesterdayStr };
