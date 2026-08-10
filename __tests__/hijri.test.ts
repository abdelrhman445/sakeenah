import { formatHijriDate, gregorianToHijri } from '@/lib/hijri';

describe('gregorianToHijri', () => {
  it('بيحوّل تاريخ ميلادي لهجري صح حسابيًا (تقويم جدولي)', () => {
    expect(gregorianToHijri(new Date('2026-08-08T12:00:00'))).toEqual({
      year: 1448,
      month: 2,
      day: 23,
    });
  });

  it('بيتعامل صح مع بداية السنة الميلادية', () => {
    expect(gregorianToHijri(new Date('2026-01-01T12:00:00'))).toEqual({
      year: 1447,
      month: 7,
      day: 12,
    });
  });

  it('الشهر دايمًا بين 1 و 12', () => {
    const { month } = gregorianToHijri(new Date('2026-03-20T12:00:00'));
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });
});

describe('formatHijriDate', () => {
  it('بيرجع نص فيه رقم اليوم واسم الشهر والسنة و"هـ"', () => {
    const label = formatHijriDate(new Date('2026-08-08T12:00:00'));
    expect(label).toBe('23 صفر 1448 هـ');
  });

  it('اسم الشهر مش فاضي لأي تاريخ صحيح', () => {
    const label = formatHijriDate(new Date('2026-01-01T12:00:00'));
    expect(label).not.toContain('undefined');
    expect(label.length).toBeGreaterThan(5);
  });
});
