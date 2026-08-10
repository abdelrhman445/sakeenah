import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { reportError } from '@/lib/errorReporting';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

// نفس فكرة القناة في lib/notifications.ts: قنوات أندرويد ثابتة مش
// بتتحدّث لأي حد عنده نسخة قديمة مثبتة قناة قديمة من غير صوت. القناة دي
// مخصصة لتنبيهات مواعيد الصلاة وبتتنشئ بإعدادات الصوت الصح من أول مرة.
const PRAYER_ANDROID_CHANNEL_ID = 'prayer-times-v2';

type Coords = { latitude: number; longitude: number };
type Timing = { name: PrayerName; label: string; time: string };

const STORAGE_KEYS = {
  LOCATION: 'prayerTimes:location',
  NOTIFICATIONS_ENABLED: 'prayerTimes:notificationsEnabled',
  LAST_SCHEDULED_DATE: 'prayerTimes:lastScheduledDate',
  CACHED_TIMINGS: 'prayerTimes:cachedTimings',
  CACHED_TIMINGS_DATE: 'prayerTimes:cachedTimingsDate',
};

const FETCH_TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

// Egyptian General Authority of Survey — most accurate method for Egypt.
const CALCULATION_METHOD = 5;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ---------- Location ----------

export async function requestLocationPermission(): Promise<Coords | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const coords: Coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(coords));
    return coords;
  } catch (err) {
    reportError(err, 'prayerTimes:requestLocationPermission');
    return null;
  }
}

export async function getSavedLocation(): Promise<Coords | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION);
    return raw ? (JSON.parse(raw) as Coords) : null;
  } catch (err) {
    reportError(err, 'prayerTimes:getSavedLocation');
    return null;
  }
}

// ---------- Timings (Aladhan API) ----------

function todayDMY(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// بتحاول تجيب مواعيد الصلاة من Aladhan API، وبتعيد المحاولة مرتين كمان
// (بفاصل زمني متزايد) لو النت متقطع أو الـ API رجّع خطأ مؤقت، قبل ما
// نستسلم ونرجّع للكاش المحلي.
async function fetchTimingsRaw(coords: Coords, dateDMY: string): Promise<Record<string, string>> {
  const url = `https://api.aladhan.com/v1/timings/${dateDMY}?latitude=${coords.latitude}&longitude=${coords.longitude}&method=${CALCULATION_METHOD}`;

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
      if (!res.ok) throw new Error(`Aladhan API error: ${res.status}`);
      const json = await res.json();
      return json.data.timings as Record<string, string>;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) await delay(500 * (attempt + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('fetchTimingsRaw failed');
}

function mapRawTimings(raw: Record<string, string>): Timing[] {
  const order: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const keyMap: Record<PrayerName, string> = {
    fajr: 'Fajr',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
  };

  return order.map((name) => ({
    name,
    label: PRAYER_LABELS[name],
    // Aladhan returns "HH:mm (TZ)" sometimes — strip anything after a space.
    time: (raw[keyMap[name]] || '').split(' ')[0],
  }));
}

export type PrayerTimingsResult = {
  timings: Timing[];
  /** true لو دي مواعيد من كاش قديم (يوم مختلف) بسبب فشل الاتصال بالإنترنت. */
  stale: boolean;
};

export async function getTodayTimings(): Promise<PrayerTimingsResult | null> {
  const today = todayDMY();

  try {
    const coords = await getSavedLocation();
    if (!coords) return null;

    try {
      const raw = await fetchTimingsRaw(coords, today);
      const timings = mapRawTimings(raw);

      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_TIMINGS, JSON.stringify(timings));
      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_TIMINGS_DATE, today);

      return { timings, stale: false };
    } catch (fetchErr) {
      reportError(fetchErr, 'prayerTimes:fetch');

      // فشل الاتصال بالـ API — نرجّع آخر مواعيد محفوظة بدل ما نسيب
      // المستخدم من غير مواعيد خالص. لو الكاش من يوم غير النهاردة،
      // بنعلّمها stale عشان الواجهة توضح إنها مش محدّثة.
      const cachedRaw = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_TIMINGS);
      if (!cachedRaw) return null;

      const cachedTimings = JSON.parse(cachedRaw) as Timing[];
      const cachedDate = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_TIMINGS_DATE);
      return { timings: cachedTimings, stale: cachedDate !== today };
    }
  } catch (err) {
    reportError(err, 'prayerTimes:getTodayTimings');
    return null;
  }
}

// ---------- Notifications ----------

export async function isPrayerNotificationsEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
    return raw === 'true';
  } catch (err) {
    reportError(err, 'prayerTimes:isPrayerNotificationsEnabled');
    return false;
  }
}

export async function shouldRefreshSchedule(): Promise<boolean> {
  try {
    const lastDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SCHEDULED_DATE);
    return lastDate !== todayDMY();
  } catch (err) {
    reportError(err, 'prayerTimes:shouldRefreshSchedule');
    return true;
  }
}

function parseTimeToDate(time: string): Date | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date;
}

export async function schedulePrayerNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return false;

    const result = await getTodayTimings();
    // لو مفيش مواعيد أصلًا، أو اللي عندنا كاش قديم من يوم مختلف، نتجنب
    // جدولة تذكيرات بمواعيد غلط — أفضل نأجل الجدولة لحد ما النت يرجع.
    if (!result || result.stale) return false;
    const { timings } = result;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(PRAYER_ANDROID_CHANNEL_ID, {
        name: 'مواعيد الصلاة',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
      });
    }

    // Clear any previously scheduled prayer notifications before re-scheduling.
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    let scheduledAny = false;

    for (const t of timings) {
      const fireDate = parseTimeToDate(t.time);
      if (!fireDate || fireDate.getTime() <= now.getTime()) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `حان الآن وقت صلاة ${t.label}`,
          body: `الساعة ${t.time}`,
          sound: 'default',
          ...(Platform.OS === 'android' ? { channelId: PRAYER_ANDROID_CHANNEL_ID } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireDate,
        },
      });
      scheduledAny = true;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'true');
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SCHEDULED_DATE, todayDMY());

    return scheduledAny || timings.length === 0;
  } catch (err) {
    reportError(err, 'prayerTimes:schedulePrayerNotifications');
    return false;
  }
}

// ---------- Next prayer helper ----------

export type NextPrayerInfo = {
  current: Timing | null;
  next: Timing;
  minutesRemaining: number;
};

/**
 * بيرجع الصلاة الجاية من قائمة مواعيد اليوم، مع دقايق العد التنازلي.
 * لو كل صلوات اليوم فاتت (يعني إحنا بعد العشاء)، بيرجع فجر بكرة كتقدير تقريبي.
 */
export function getNextPrayer(timings: Timing[], now: Date = new Date()): NextPrayerInfo | null {
  if (timings.length === 0) return null;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const toMinutes = (time: string): number | null => {
    const match = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  };

  let previous: Timing | null = null;
  for (let i = 0; i < timings.length; i++) {
    const minutes = toMinutes(timings[i].time);
    if (minutes === null) continue;

    if (minutes > nowMinutes) {
      return {
        current: previous,
        next: timings[i],
        minutesRemaining: minutes - nowMinutes,
      };
    }
    previous = timings[i];
  }

  // كل صلوات اليوم فاتت — الصلاة الجاية هي فجر بكرة (24 ساعة من نفس التوقيت).
  const fajr = timings[0];
  const fajrMinutes = toMinutes(fajr.time);
  const minutesRemaining = fajrMinutes === null ? 0 : 24 * 60 - nowMinutes + fajrMinutes;

  return {
    current: timings[timings.length - 1],
    next: fajr,
    minutesRemaining,
  };
}

export async function disablePrayerNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'false');
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SCHEDULED_DATE);
  } catch (err) {
    reportError(err, 'prayerTimes:disablePrayerNotifications');
  }
}
