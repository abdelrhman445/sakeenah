import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type ReminderType = 'morning' | 'evening';

const REMINDER_ID_KEY = (type: ReminderType) => `sakeenah_reminder_${type}`;
const REMINDER_ENABLED_KEY = (type: ReminderType) => `sakeenah_reminder_enabled_${type}`;
const REMINDER_TIME_KEY = (type: ReminderType) => `sakeenah_reminder_time_${type}`;

const DEFAULT_TIME: Record<ReminderType, { hour: number; minute: number }> = {
  morning: { hour: 6, minute: 0 },
  evening: { hour: 18, minute: 0 },
};

const REMINDER_CONTENT: Record<ReminderType, { title: string; body: string }> = {
  morning: {
    title: 'وقت أذكار الصباح 🌅',
    body: 'ابدأ يومك بالسكينة — دقيقتين وخلاص',
  },
  evening: {
    title: 'وقت أذكار المساء 🌙',
    body: 'اختم يومك بذكر الله',
  },
};

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function isReminderEnabled(type: ReminderType): Promise<boolean> {
  const val = await AsyncStorage.getItem(REMINDER_ENABLED_KEY(type));
  return val === 'true';
}

export async function getReminderTime(
  type: ReminderType
): Promise<{ hour: number; minute: number }> {
  const raw = await AsyncStorage.getItem(REMINDER_TIME_KEY(type));
  if (!raw) return DEFAULT_TIME[type];
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.hour === 'number' && typeof parsed.minute === 'number') return parsed;
  } catch {
    // تجاهل وارجع للقيمة الافتراضية
  }
  return DEFAULT_TIME[type];
}

async function scheduleAt(type: ReminderType, hour: number, minute: number): Promise<string> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('azkar-reminders', {
      name: 'تذكير الأذكار',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existingId = await AsyncStorage.getItem(REMINDER_ID_KEY(type));
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId);
  }

  const content = REMINDER_CONTENT[type];
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  await AsyncStorage.setItem(REMINDER_ID_KEY(type), id);
  await AsyncStorage.setItem(REMINDER_TIME_KEY(type), JSON.stringify({ hour, minute }));
  return id;
}

/** يفعّل التذكير بوقت مخصص (لو مش متبعت وقت، بيستخدم آخر وقت محفوظ أو الافتراضي). */
export async function enableReminder(
  type: ReminderType,
  time?: { hour: number; minute: number }
): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  const { hour, minute } = time ?? (await getReminderTime(type));
  await scheduleAt(type, hour, minute);
  await AsyncStorage.setItem(REMINDER_ENABLED_KEY(type), 'true');
  return true;
}

/** يغيّر وقت تذكير مفعّل بالفعل من غير ما يلغي التفعيل. */
export async function updateReminderTime(
  type: ReminderType,
  hour: number,
  minute: number
): Promise<void> {
  const enabled = await isReminderEnabled(type);
  if (!enabled) {
    await AsyncStorage.setItem(REMINDER_TIME_KEY(type), JSON.stringify({ hour, minute }));
    return;
  }
  await scheduleAt(type, hour, minute);
}

export async function disableReminder(type: ReminderType): Promise<void> {
  const existingId = await AsyncStorage.getItem(REMINDER_ID_KEY(type));
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId);
    await AsyncStorage.removeItem(REMINDER_ID_KEY(type));
  }
  await AsyncStorage.setItem(REMINDER_ENABLED_KEY(type), 'false');
}

export function formatTimeLabel(hour: number, minute: number): string {
  const period = hour >= 12 ? 'م' : 'ص';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

export async function getReminderTimeLabel(type: ReminderType): Promise<string> {
  const { hour, minute } = await getReminderTime(type);
  return formatTimeLabel(hour, minute);
}
