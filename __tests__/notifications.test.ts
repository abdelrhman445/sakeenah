import AsyncStorage from '@react-native-async-storage/async-storage';

import { formatTimeLabel, getReminderTime } from '@/lib/notifications';

describe('formatTimeLabel', () => {
  it('بيحوّل الساعة لصيغة 12 ساعة صباحًا', () => {
    expect(formatTimeLabel(6, 0)).toBe('6:00 ص');
  });

  it('بيحوّل الساعة لصيغة 12 ساعة مساءً', () => {
    expect(formatTimeLabel(18, 5)).toBe('6:05 م');
  });

  it('نص الليل (0) بيتحول لـ 12 ص', () => {
    expect(formatTimeLabel(0, 30)).toBe('12:30 ص');
  });

  it('الظهر (12) بيتحول لـ 12 م', () => {
    expect(formatTimeLabel(12, 0)).toBe('12:00 م');
  });

  it('الدقايق أقل من 10 بتتحط لها صفر قبلها', () => {
    expect(formatTimeLabel(7, 5)).toBe('7:05 ص');
  });
});

describe('getReminderTime', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('بيرجع الوقت الافتراضي لو مفيش وقت محفوظ لتذكير الصباح', async () => {
    const time = await getReminderTime('morning');
    expect(time).toEqual({ hour: 6, minute: 0 });
  });

  it('بيرجع الوقت الافتراضي لو مفيش وقت محفوظ لتذكير المساء', async () => {
    const time = await getReminderTime('evening');
    expect(time).toEqual({ hour: 18, minute: 0 });
  });
});
