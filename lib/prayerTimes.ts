import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

type Coords = { latitude: number; longitude: number };
type Timing = { name: PrayerName; label: string; time: string };

const STORAGE_KEYS = {
  LOCATION: 'prayerTimes:location',
  NOTIFICATIONS_ENABLED: 'prayerTimes:notificationsEnabled',
  LAST_SCHEDULED_DATE: 'prayerTimes:lastScheduledDate',
};

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
    console.error('requestLocationPermission failed', err);
    return null;
  }
}

export async function getSavedLocation(): Promise<Coords | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION);
    return raw ? (JSON.parse(raw) as Coords) : null;
  } catch (err) {
    console.error('getSavedLocation failed', err);
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

async function fetchTimingsRaw(coords: Coords, dateDMY: string) {
  const url = `https://api.aladhan.com/v1/timings/${dateDMY}?latitude=${coords.latitude}&longitude=${coords.longitude}&method=${CALCULATION_METHOD}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Aladhan API error: ${res.status}`);
  const json = await res.json();
  return json.data.timings as Record<string, string>;
}

export async function getTodayTimings(): Promise<Timing[] | null> {
  try {
    const coords = await getSavedLocation();
    if (!coords) return null;

    const raw = await fetchTimingsRaw(coords, todayDMY());

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
  } catch (err) {
    console.error('getTodayTimings failed', err);
    return null;
  }
}

// ---------- Notifications ----------

export async function isPrayerNotificationsEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
    return raw === 'true';
  } catch (err) {
    console.error('isPrayerNotificationsEnabled failed', err);
    return false;
  }
}

export async function shouldRefreshSchedule(): Promise<boolean> {
  try {
    const lastDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SCHEDULED_DATE);
    return lastDate !== todayDMY();
  } catch (err) {
    console.error('shouldRefreshSchedule failed', err);
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

    const timings = await getTodayTimings();
    if (!timings) return false;

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
          sound: true,
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
    console.error('schedulePrayerNotifications failed', err);
    return false;
  }
}

export async function disablePrayerNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'false');
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SCHEDULED_DATE);
  } catch (err) {
    console.error('disablePrayerNotifications failed', err);
  }
}