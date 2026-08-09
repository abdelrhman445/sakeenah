import { getNextPrayer } from '@/lib/prayerTimes';

const timings = [
  { name: 'fajr' as const, label: 'الفجر', time: '04:30' },
  { name: 'dhuhr' as const, label: 'الظهر', time: '12:15' },
  { name: 'asr' as const, label: 'العصر', time: '15:45' },
  { name: 'maghrib' as const, label: 'المغرب', time: '18:50' },
  { name: 'isha' as const, label: 'العشاء', time: '20:15' },
];

describe('getNextPrayer', () => {
  it('بيلاقي الصلاة الجاية في نص اليوم', () => {
    const now = new Date('2026-08-08T10:00:00');
    const result = getNextPrayer(timings, now);
    expect(result?.next.name).toBe('dhuhr');
  });

  it('بيرجع فجر بكرة لو كل صلوات اليوم فاتت', () => {
    const now = new Date('2026-08-08T22:00:00');
    const result = getNextPrayer(timings, now);
    expect(result?.next.name).toBe('fajr');
    expect(result?.minutesRemaining).toBeGreaterThan(0);
  });

  it('بيرجع null لو مفيش مواعيد', () => {
    const result = getNextPrayer([], new Date());
    expect(result).toBeNull();
  });
});
