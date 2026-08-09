import { getQiblaDirection } from '@/lib/qibla';

describe('getQiblaDirection', () => {
  it('بيرجع رقم صحيح بين 0 و 360', () => {
    // القاهرة تقريبًا
    const bearing = getQiblaDirection(30.0444, 31.2357);
    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThan(360);
  });

  it('اتجاه القبلة من القاهرة لازم يكون جنوب شرقي تقريبًا', () => {
    const bearing = getQiblaDirection(30.0444, 31.2357);
    // القاهرة جنوب شرق مكة تقريبًا، فالمتوقع الاتجاه بين 90 و 180 درجة
    expect(bearing).toBeGreaterThan(90);
    expect(bearing).toBeLessThan(180);
  });
});
