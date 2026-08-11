/**
 * تلاوة صوتية للسور كاملة (مش آية بآية) بصوت الشيخ مشاري راشد العفاسي،
 * عن طريق سيرفرات mp3quran.net العامة المجانية. المرحلة دي قارئ واحد بس
 * ومفيش تزامن مع الآيات وقت التشغيل — ده أبسط حل يشتغل من غير أي backend
 * أو حساب جديد، وقابل للتوسعة لاحقًا (قارئ تاني، تحميل offline، تزامن
 * آية بآية) لو حبينا.
 */
export function getSurahAudioUrl(surahId: number): string {
  const padded = String(surahId).padStart(3, '0');
  return `https://server8.mp3quran.net/afs/${padded}.mp3`;
}
