// تحويل التاريخ الميلادي للهجري بخوارزمية التقويم الهجري الجدولي (tabular
// Islamic calendar) القياسية. التقويم ده حسابي وتقريبي بطبيعته — التقويم
// الرسمي بيعتمد على رؤية الهلال فعليًا، فممكن يختلف يوم أو يومين حسب
// الدولة والمرجع، وده طبيعي وبيحصل مع أي تطبيق بيحسب التاريخ الهجري تلقائيًا.

const HIJRI_MONTHS = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
];

export type HijriDate = {
  year: number;
  month: number; // 1-12
  day: number;
};

function gregorianToJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

export function gregorianToHijri(date: Date = new Date()): HijriDate {
  const jdn = gregorianToJDN(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const islamicEpoch = 1948440;

  let l = jdn - islamicEpoch + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;

  return { year, month, day };
}

export function formatHijriDate(date: Date = new Date()): string {
  const { year, month, day } = gregorianToHijri(date);
  const monthName = HIJRI_MONTHS[month - 1] ?? '';
  return `${day} ${monthName} ${year} هـ`;
}
