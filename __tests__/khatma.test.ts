import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getKhatmaPlan,
  markKhatmaDoneToday,
  resetKhatmaPlan,
  startKhatmaPlan,
} from '@/data/khatma';
import { totalVerseCount } from '@/data/quran';

function setSystemDate(iso: string) {
  jest.useFakeTimers().setSystemTime(new Date(iso));
}

describe('khatma plan', () => {
  afterEach(async () => {
    jest.useRealTimers();
    await AsyncStorage.clear();
  });

  it('بترجع null لو مفيش خطة اتبدأت', async () => {
    const plan = await getKhatmaPlan();
    expect(plan).toBeNull();
  });

  it('بتبدأ خطة جديدة بالهدف اليومي الصح', async () => {
    setSystemDate('2026-01-01T09:00:00');
    await startKhatmaPlan(30);

    const plan = await getKhatmaPlan();
    expect(plan).not.toBeNull();
    expect(plan?.durationDays).toBe(30);
    expect(plan?.progressVerses).toBe(0);
    expect(plan?.dailyTarget).toBe(Math.ceil(totalVerseCount / 30));
    expect(plan?.streak).toBe(0);
    expect(plan?.completed).toBe(false);
  });

  it('تسجيل وِرد النهاردة بيزوّد التقدم والاستمرارية', async () => {
    setSystemDate('2026-01-01T09:00:00');
    await startKhatmaPlan(60);

    const afterFirstDay = await markKhatmaDoneToday();
    expect(afterFirstDay?.doneToday).toBe(true);
    expect(afterFirstDay?.streak).toBe(1);
    expect(afterFirstDay?.progressVerses).toBe(afterFirstDay?.dailyTarget);
  });

  it('تسجيل الورد مرتين في نفس اليوم مبيضاعفش التقدم', async () => {
    setSystemDate('2026-01-01T09:00:00');
    await startKhatmaPlan(60);
    await markKhatmaDoneToday();
    const second = await markKhatmaDoneToday();

    expect(second?.progressVerses).toBe(second?.dailyTarget);
  });

  it('الاستمرارية بتكمل لو الورد اتسجل يومين ورا بعض', async () => {
    setSystemDate('2026-01-01T09:00:00');
    await startKhatmaPlan(60);
    await markKhatmaDoneToday();

    setSystemDate('2026-01-02T09:00:00');
    const secondDay = await markKhatmaDoneToday();
    expect(secondDay?.streak).toBe(2);
  });

  it('الاستمرارية بتتكسر لو فاتت يوم من غير تسجيل', async () => {
    setSystemDate('2026-01-01T09:00:00');
    await startKhatmaPlan(60);
    await markKhatmaDoneToday();

    setSystemDate('2026-01-05T09:00:00');
    const plan = await getKhatmaPlan();
    expect(plan?.streak).toBe(0);
  });

  it('resetKhatmaPlan بيمسح الخطة بالكامل', async () => {
    setSystemDate('2026-01-01T09:00:00');
    await startKhatmaPlan(30);
    await resetKhatmaPlan();

    const plan = await getKhatmaPlan();
    expect(plan).toBeNull();
  });
});
