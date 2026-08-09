import { useCallback, useState } from 'react';
import { StyleSheet, View, Text, Switch, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ReminderType,
  isReminderEnabled,
  enableReminder,
  disableReminder,
  getReminderTimeLabel,
} from '@/lib/notifications';

const REMINDERS: { type: ReminderType; label: string; icon: string }[] = [
  { type: 'morning', label: 'تذكير أذكار الصباح', icon: '🌅' },
  { type: 'evening', label: 'تذكير أذكار المساء', icon: '🌙' },
];

export default function SettingsScreen() {
  const [enabled, setEnabled] = useState<Record<ReminderType, boolean>>({
    morning: false,
    evening: false,
  });
  const [loading, setLoading] = useState<Record<ReminderType, boolean>>({
    morning: false,
    evening: false,
  });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const morning = await isReminderEnabled('morning');
        const evening = await isReminderEnabled('evening');
        setEnabled({ morning, evening });
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
            'من غير إذن الإشعارات مش هنقدر نفكرك بالأذكار — فعّلها من إعدادات الجهاز'
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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>الإعدادات</Text>
      <Text style={styles.subtitle}>التذكيرات اليومية</Text>

      {REMINDERS.map((r) => (
        <View key={r.type} style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.icon}>{r.icon}</Text>
            <View>
              <Text style={styles.rowLabel}>{r.label}</Text>
              {enabled[r.type] && (
                <Text style={styles.rowTime}>الساعة {getReminderTimeLabel(r.type)}</Text>
              )}
            </View>
          </View>
          <Switch
            value={enabled[r.type]}
            onValueChange={(v) => handleToggle(r.type, v)}
            disabled={loading[r.type]}
            trackColor={{ false: '#22303B', true: '#7FE3C0' }}
            thumbColor="#fff"
          />
        </View>
      ))}

      <Text style={styles.note}>💡 قريبًا: هتقدر تختار الوقت اللي يناسبك بنفسك</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1720',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7FE3C0',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B98A5',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161F28',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#22303B',
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
    color: '#E6EDF3',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  rowTime: {
    color: '#7FE3C0',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
  note: {
    color: '#8B98A5',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
  },
});
