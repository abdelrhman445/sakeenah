import { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Switch,
  Alert,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ReminderType,
  isReminderEnabled,
  enableReminder,
  disableReminder,
  getReminderTime,
  getReminderTimeLabel,
  updateReminderTime,
} from '@/lib/notifications';
import { useAppTheme, ThemeMode } from '@/contexts/theme-context';
import { TimeStepperModal } from '@/components/time-stepper-modal';

const REMINDERS: { type: ReminderType; label: string; icon: string }[] = [
  { type: 'morning', label: 'تذكير أذكار الصباح', icon: '🌅' },
  { type: 'evening', label: 'تذكير أذكار المساء', icon: '🌙' },
];

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'تلقائي' },
  { mode: 'light', label: 'فاتح' },
  { mode: 'dark', label: 'غامق' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, mode, setMode } = useAppTheme();

  const [enabled, setEnabled] = useState<Record<ReminderType, boolean>>({
    morning: false,
    evening: false,
  });
  const [loading, setLoading] = useState<Record<ReminderType, boolean>>({
    morning: false,
    evening: false,
  });
  const [timeLabels, setTimeLabels] = useState<Record<ReminderType, string>>({
    morning: '',
    evening: '',
  });
  const [pickerFor, setPickerFor] = useState<ReminderType | null>(null);
  const [pickerInitial, setPickerInitial] = useState({ hour: 6, minute: 0 });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const morning = await isReminderEnabled('morning');
        const evening = await isReminderEnabled('evening');
        setEnabled({ morning, evening });

        const morningLabel = await getReminderTimeLabel('morning');
        const eveningLabel = await getReminderTimeLabel('evening');
        setTimeLabels({ morning: morningLabel, evening: eveningLabel });
      })();
    }, [])
  );

  const handleToggle = async (type: ReminderType, value: boolean) => {
    setLoading((prev) => ({ ...prev, [type]: true }));
    try {
      if (value) {
        const granted = await enableReminder(type);
        if (!granted) {
          Alert.alert(
            'محتاجين إذن الإشعارات',
            'من غير إذن الإشعارات مش هنقدر نفكرك بالأذكار — فعّلها من إعدادات الجهاز',
            [
              { text: 'إلغاء', style: 'cancel' },
              { text: 'فتح الإعدادات', onPress: () => Linking.openSettings() },
            ]
          );
          setLoading((prev) => ({ ...prev, [type]: false }));
          return;
        }
      } else {
        await disableReminder(type);
      }
      setEnabled((prev) => ({ ...prev, [type]: value }));
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const openTimePicker = async (type: ReminderType) => {
    const current = await getReminderTime(type);
    setPickerInitial(current);
    setPickerFor(type);
  };

  const confirmTime = async (hour: number, minute: number) => {
    if (!pickerFor) return;
    await updateReminderTime(pickerFor, hour, minute);
    const label = await getReminderTimeLabel(pickerFor);
    setTimeLabels((prev) => ({ ...prev, [pickerFor]: label }));
    setPickerFor(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.primary }]}>الإعدادات</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>التذكيرات اليومية</Text>

        {REMINDERS.map((r) => (
          <View
            key={r.type}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.icon}>{r.icon}</Text>
              <View>
                <Text style={[styles.rowLabel, { color: colors.text }]}>{r.label}</Text>
                {enabled[r.type] && (
                  <TouchableOpacity onPress={() => openTimePicker(r.type)}>
                    <Text style={[styles.rowTime, { color: colors.primary }]}>
                      الساعة {timeLabels[r.type]} · غيّر الوقت
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Switch
              value={enabled[r.type]}
              onValueChange={(v) => handleToggle(r.type, v)}
              disabled={loading[r.type]}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        ))}

        <Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: 24 }]}>
          المظهر
        </Text>
        <View
          style={[
            styles.themeRow,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          {THEME_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.mode}
              style={[styles.themeOption, mode === opt.mode && { backgroundColor: colors.primary }]}
              onPress={() => setMode(opt.mode)}
            >
              <Text
                style={[
                  styles.themeOptionText,
                  { color: mode === opt.mode ? colors.onPrimary : colors.text },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.linkRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => router.push('/about')}
        >
          <Text style={[styles.linkText, { color: colors.text }]}>عن التطبيق</Text>
        </TouchableOpacity>
      </ScrollView>

      <TimeStepperModal
        visible={pickerFor !== null}
        initialHour={pickerInitial.hour}
        initialMinute={pickerInitial.minute}
        onClose={() => setPickerFor(null)}
        onConfirm={confirmTime}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 24,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  rowTime: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
  themeRow: {
    flexDirection: 'row-reverse',
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
    gap: 6,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  linkRow: {
    marginTop: 24,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
});
