// إحداثيات الكعبة المشرفة (مكة المكرمة).
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * بيحسب زاوية اتجاه القبلة (bearing) بالدرجات من الشمال، بطريقة
 * great-circle bearing القياسية.
 */
export function getQiblaDirection(latitude: number, longitude: number): number {
  const lat1 = toRadians(latitude);
  const lat2 = toRadians(KAABA_LAT);
  const deltaLng = toRadians(KAABA_LNG - longitude);

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}
