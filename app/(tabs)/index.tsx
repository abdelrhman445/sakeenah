import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { categories } from '@/data/azkar';
import { getBothStreaks } from '@/data/streak';
import { formatHijriDate } from '@/lib/hijri';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { useAppTheme } from '@/contexts/theme-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [streaks, setStreaks] = useState({ morning: 0, evening: 0 });

  useFocusEffect(
    useCallback(() => {
      getBothStreaks().then(setStreaks);
    }, [])
  );

  // بيتنفذ مرة واحدة بس عند أول تحميل للتطبيق — لو المستخدم لسه ما شافش
  // شاشة التعريف، بنعرضها فوق التابز قبل أي حاجة تانية.
  useEffect(() => {
    let active = true;
    hasCompletedOnboarding().then((seen) => {
      if (active && !seen) router.push('/onboarding');
    });
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/azkar/favorites')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol name="star.fill" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/search')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol name="magnifyingglass" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/tasbeeh')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol name="circle.grid.cross.fill" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/stats')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol name="chart.bar.fill" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>سكينة</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          أذكارك اليومية بقلب حاضر
        </Text>
        <Text style={[styles.hijri, { color: colors.textSecondary }]}>
          {formatHijriDate()} (تقريبي)
        </Text>

        {(streaks.morning > 0 || streaks.evening > 0) && (
          <View style={styles.streakRow}>
            {streaks.morning > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: colors.card }]}>
                <Text style={[styles.streakText, { color: colors.warning }]}>
                  🌅 {streaks.morning} يوم
                </Text>
              </View>
            )}
            {streaks.evening > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: colors.card }]}>
                <Text style={[styles.streakText, { color: colors.warning }]}>
                  🌙 {streaks.evening} يوم
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            activeOpacity={0.8}
            onPress={() => router.push(`/azkar/${item.id}`)}
          >
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.cardCount, { color: colors.textSecondary }]}>
              {item.items.length} أذكار
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  hijri: {
    fontSize: 11,
    marginTop: -8,
    marginBottom: 12,
  },
  streakRow: {
    flexDirection: 'row',
    gap: 8,
  },
  streakBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
  },
  grid: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardCount: {
    fontSize: 12,
  },
});
