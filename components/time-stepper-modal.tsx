import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '@/contexts/theme-context';
import { formatTimeLabel } from '@/lib/notifications';

type Props = {
  visible: boolean;
  initialHour: number;
  initialMinute: number;
  onClose: () => void;
  onConfirm: (hour: number, minute: number) => void;
};

/**
 * منتقي وقت بسيط بأزرار +/- بدل ما نضيف باكدج native جديد
 * (@react-native-community/datetimepicker) اللي بيحتاج rebuild للتطبيق.
 */
export function TimeStepperModal({
  visible,
  initialHour,
  initialMinute,
  onClose,
  onConfirm,
}: Props) {
  const { colors } = useAppTheme();
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);

  const bumpHour = (delta: number) => setHour((h) => (h + delta + 24) % 24);
  const bumpMinute = (delta: number) => setMinute((m) => (m + delta + 60) % 60);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: colors.text }]}>اختار الوقت</Text>

          <View style={styles.stepperRow}>
            <View style={styles.column}>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.background }]}
                onPress={() => bumpMinute(5)}
              >
                <Text style={[styles.stepBtnText, { color: colors.primary }]}>+</Text>
              </TouchableOpacity>
              <Text style={[styles.value, { color: colors.text }]}>
                {minute.toString().padStart(2, '0')}
              </Text>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.background }]}
                onPress={() => bumpMinute(-5)}
              >
                <Text style={[styles.stepBtnText, { color: colors.primary }]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.unitLabel, { color: colors.textSecondary }]}>دقيقة</Text>
            </View>

            <Text style={[styles.colon, { color: colors.text }]}>:</Text>

            <View style={styles.column}>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.background }]}
                onPress={() => bumpHour(1)}
              >
                <Text style={[styles.stepBtnText, { color: colors.primary }]}>+</Text>
              </TouchableOpacity>
              <Text style={[styles.value, { color: colors.text }]}>
                {hour.toString().padStart(2, '0')}
              </Text>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.background }]}
                onPress={() => bumpHour(-1)}
              >
                <Text style={[styles.stepBtnText, { color: colors.primary }]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.unitLabel, { color: colors.textSecondary }]}>ساعة</Text>
            </View>
          </View>

          <Text style={[styles.preview, { color: colors.textSecondary }]}>
            {formatTimeLabel(hour, minute)}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={onClose}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={() => onConfirm(hour, minute)}
            >
              <Text style={[styles.confirmText, { color: colors.onPrimary }]}>تأكيد</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  column: {
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: 11,
  },
  colon: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: -20,
  },
  preview: {
    marginTop: 20,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBtn: {},
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
