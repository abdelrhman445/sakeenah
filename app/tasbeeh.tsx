import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { addTasbeehCount, getTasbeehTotal, resetTasbeehTotal } from '@/data/tasbeeh';
import { useAppTheme } from '@/contexts/theme-context';

const TARGET_PRESETS = [33, 99, 100];

export default function TasbeehScreen() {
  const { colors } = useAppTheme();

  const [target, setTarget] = useState(33);
  const [round, setRound] = useState(0);
  const [lifetimeTotal, setLifetimeTotal] = useState(0);
  const pendingRef = useRef(0);

  useEffect(() => {
    getTasbeehTotal().then(setLifetimeTotal);
  }, []);

  // بنسجّل أي عدّ متراكم لسه ما اتحفظش (pendingRef) لما الشاشة تخرج من
  // الفوكس، بدل ما نكتب في AsyncStorage مع كل ضغطة — أسرع وأوفر بطارية.
  const flushPending = useCallback(() => {
    if (pendingRef.current > 0) {
      const toSave = pendingRef.current;
      pendingRef.current = 0;
      addTasbeehCount(toSave).then(setLifetimeTotal);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        flushPending();
      };
    }, [flushPending])
  );

  useEffect(() => {
    return () => {
      flushPending();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pendingRef.current += 1;
    setLifetimeTotal((prev) => prev + 1);

    setRound((prev) => {
      const next = prev + 1;
      if (next >= target) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return 0;
      }
      return next;
    });
  };

  const handleResetRound = () => {
    Haptics.selectionAsync();
    setRound(0);
  };

  const handleResetTotal = () => {
    Alert.alert('تصفير العداد الكلي', 'هيتصفّر إجمالي التسبيح المسجّل من الأول، تحب تكمل؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تصفير',
        style: 'destructive',
        onPress: async () => {
          pendingRef.current = 0;
          await resetTasbeehTotal();
          setLifetimeTotal(0);
          setRound(0);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.total, { color: colors.textSecondary }]}>
        الإجمالي الكلي: {lifetimeTotal}
      </Text>

      <View style={styles.presetsRow}>
        {TARGET_PRESETS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.presetChip,
              { borderColor: colors.primary },
              target === t && { backgroundColor: colors.primary },
            ]}
            onPress={() => {
              setTarget(t);
              setRound(0);
            }}
          >
            <Text
              style={[
                styles.presetText,
                { color: target === t ? colors.onPrimary : colors.primary },
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.center}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleTap}
          style={[styles.circle, { backgroundColor: colors.card, borderColor: colors.primary }]}
        >
          <Text style={[styles.count, { color: colors.primary }]}>{round}</Text>
          <Text style={[styles.countTarget, { color: colors.textSecondary }]}>/ {target}</Text>
        </TouchableOpacity>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          اضغط في أي مكان في الدايرة
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleResetRound} style={styles.footerBtn}>
          <Text style={[styles.footerBtnText, { color: colors.text }]}>تصفير الجولة</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleResetTotal} style={styles.footerBtn}>
          <Text style={[styles.footerBtnText, { color: colors.danger }]}>تصفير الإجمالي</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const CIRCLE_SIZE = 220;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  total: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 16,
  },
  presetsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  presetChip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  presetText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  countTarget: {
    fontSize: 18,
    marginTop: 4,
  },
  hint: {
    fontSize: 13,
    marginTop: 18,
  },
  footer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  footerBtn: {
    padding: 10,
  },
  footerBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
