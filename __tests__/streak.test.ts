import { __testables } from '@/data/streak';

const { todayStr, yesterdayStr } = __testables;

describe('streak date helpers', () => {
  it('todayStr يرجع تاريخ اليوم بصيغة YYYY-MM-DD', () => {
    const date = new Date('2026-08-08T10:00:00.000Z');
    expect(todayStr(date)).toBe('2026-08-08');
  });

  it('yesterdayStr يرجع يوم قبل التاريخ المرسل', () => {
    const date = new Date('2026-08-08T10:00:00.000Z');
    expect(yesterdayStr(date)).toBe('2026-08-07');
  });

  it('yesterdayStr بيتعامل صح مع بداية الشهر', () => {
    const date = new Date('2026-03-01T10:00:00.000Z');
    expect(yesterdayStr(date)).toBe('2026-02-28');
  });

  it('yesterdayStr بيتعامل صح مع بداية السنة', () => {
    const date = new Date('2026-01-01T10:00:00.000Z');
    expect(yesterdayStr(date)).toBe('2025-12-31');
  });
});
