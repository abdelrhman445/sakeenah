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

const REMINDER_CONTENT: Record<ReminderType, { title: string; body: string; hour: number; minute: number }> = {
  morning: {
    title: 'وقت أذكار الصباح 🌅',
    body: 'ابدأ يومك بالسكينة — دقيقتين وخلاص',
    hour: 6,
    minute: 0,
  },
  evening: {
    title: 'وقت أذكار المساء 🌙',
    body: 'اختم يومك بذكر الله',
    hour: 18,
    minute: 0,
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

export async function enableReminder(type: ReminderType): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

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
      hour: content.hour,
      minute: content.minute,
    },
  });

  await AsyncStorage.setItem(REMINDER_ID_KEY(type), id);
  await AsyncStorage.setItem(REMINDER_ENABLED_KEY(type), 'true');
  return true;
}

export async function disableReminder(type: ReminderType): Promise<void> {
  const existingId = await AsyncStorage.getItem(REMINDER_ID_KEY(type));
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId);
    await AsyncStorage.removeItem(REMINDER_ID_KEY(type));
  }
  await AsyncStorage.setItem(REMINDER_ENABLED_KEY(type), 'false');
}

export function getReminderTimeLabel(type: ReminderType): string {
  const { hour, minute } = REMINDER_CONTENT[type];
  const period = hour >= 12 ? 'م' : 'ص';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}