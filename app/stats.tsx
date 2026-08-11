import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DayRecord, getHistorySummary, getLastNDays, HistorySummary } from '@/data/history';
import { getBothStreaks } from '@/data/streak';
import { getKhatmaPlan, KhatmaPlan } from '@/data/khatma';
import { getTasbeehTotal } from '@/data/tasbeeh';
import { useAppTheme } from '@/contexts/theme-context';

const WEEKDAY_LABELS = ['أحد', 'اتنين', 'تلات', 'أربع', 'خميس', 'جمعة', 'سبت'];

export default function StatsScreen() {
  const { colors } = useAppTheme();
  const [days, setDays] = useState<DayRecord[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [streaks, setStreaks] = useState({ morning: 0, evening: 0 });
  const [khatma, setKhatma] = useState<KhatmaPlan | null>(null);
  const [tasbeehTotal, setTasbeehTotal] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getLastNDays(7).then(setDays);
      getHistorySummary().then(setSummary);
      getBothStreaks().then(setStreaks);
      getKhatmaPlan().then(setKhatma);
      getTasbeehTotal().then(setTasbeehTotal);
    }, [])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>آخر 7 أيام</Text>
        <View
          style={[
            styles.weekCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.weekRow}>
            {days.map((d) => {
              const weekday = WEEKDAY_LABELS[new Date(d.date).getDay()];
              const didAny = d.morning || d.evening;
              return (
                <View key={d.date} style={styles.dayCol}>
                  <View
                    style={[
                      styles.dayDot,
                      { borderColor: colors.cardBorder },
                      didAny && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    {didAny && <Text style={styles.dayCheck}>✓</Text>}
                  </View>
                  <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{weekday}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>الاستمرارية</Text>
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={styles.statEmoji}>🌅</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{streaks.morning}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>يوم صباح</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={styles.statEmoji}>🌙</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{streaks.evening}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>يوم مساء</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>مجاميع كلية</Text>
        <View
          style={[
            styles.listCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <StatRow
            label="أيام أذكار الصباح"
            value={summary?.totalMorningDays ?? 0}
            color={colors.text}
          />
          <StatRow
            label="أيام أذكار المساء"
            value={summary?.totalEveningDays ?? 0}
            color={colors.text}
          />
          <StatRow
            label="أيام وِرد الختمة"
            value={summary?.totalKhatmaDays ?? 0}
            color={colors.text}
          />
          <StatRow label="إجمالي التسبيح" value={tasbeehTotal} color={colors.text} last />
        </View>

        {khatma && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>الختمة</Text>
            <View
              style={[
                styles.listCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.khatmaText, { color: colors.text }]}>
                {khatma.completed
                  ? 'خلصت الختمة كاملة 🎉'
                  : `${khatma.progressVerses}/${khatma.totalVerses} آية (٪${khatma.progressPercent})`}
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: colors.background }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.primary, width: `${khatma.progressPercent}%` },
                  ]}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatRow({
  label,
  value,
  color,
  last,
}: {
  label: string;
  value: number;
  color: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.statRow, !last && styles.statRowBorder]}>
      <Text style={[styles.statRowValue, { color }]}>{value}</Text>
      <Text style={[styles.statRowLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8,
    marginTop: 4,
  },
  weekCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  weekRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    gap: 6,
  },
  dayDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCheck: {
    color: '#0F1720',
    fontSize: 13,
    fontWeight: 'bold',
  },
  dayLabel: {
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.25)',
  },
  statRowLabel: {
    fontSize: 14,
  },
  statRowValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  khatmaText: {
    fontSize: 14,
    textAlign: 'right',
    padding: 12,
    paddingBottom: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 12,
    marginBottom: 12,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
});
