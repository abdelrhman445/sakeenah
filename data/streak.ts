import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = 'sakeenah_streak';
const LAST_DATE_KEY = 'sakeenah_last_completed_date';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export async function markCategoryDoneToday(): Promise<number> {
  const lastDate = await AsyncStorage.getItem(LAST_DATE_KEY);
  const today = todayStr();

  if (lastDate === today) {
    const current = await AsyncStorage.getItem(STREAK_KEY);
    return current ? parseInt(current, 10) : 1;
  }

  let streak = 1;
  if (lastDate === yesterdayStr()) {
    const current = await AsyncStorage.getItem(STREAK_KEY);
    streak = (current ? parseInt(current, 10) : 0) + 1;
  }

  await AsyncStorage.setItem(STREAK_KEY, streak.toString());
  await AsyncStorage.setItem(LAST_DATE_KEY, today);
  return streak;
}

export async function getCurrentStreak(): Promise<number> {
  const lastDate = await AsyncStorage.getItem(LAST_DATE_KEY);
  const streak = await AsyncStorage.getItem(STREAK_KEY);

  if (!lastDate || !streak) return 0;

  const today = todayStr();
  const yesterday = yesterdayStr();

  // لو آخر يوم اتعمل فيه ذكر مش النهاردة ولا إمبارح، الـ streak اتكسر
  if (lastDate !== today && lastDate !== yesterday) {
    return 0;
  }

  return parseInt(streak, 10);
}