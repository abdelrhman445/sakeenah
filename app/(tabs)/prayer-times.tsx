import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  PrayerName,
  disablePrayerNotifications,
  getNextPrayer,
  getSavedLocation,
  getTodayTimings,
  isPrayerNotificationsEnabled,
  requestLocationPermission,
  schedulePrayerNotifications,
} from '@/lib/prayerTimes';
import { useAppTheme } from '@/contexts/theme-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

type Timing = { name: PrayerName; label: string; time: string };

export default function PrayerTimesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [timings, setTimings] = useState<Timing[] | null>(null);
  const [stale, setStale] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [now, setNow] = useState(new Date());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (askPermission: boolean) => {
    const savedLocation = await getSavedLocation();

    if (!savedLocation && askPermission) {
      const granted = await requestLocationPermission();
      if (!granted) {
        setHasLocation(false);
        setLoading(false);
        return;
      }
    } else if (!savedLocation) {
      setHasLocation(false);
      setLoading(false);
      return;
    }

    setHasLocation(true);
    const result = await getTodayTimings();
    setTimings(result?.timings ?? null);
    setStale(result?.stale ?? false);
    const enabled = await isPrayerNotificationsEnabled();
    setNotificationsOn(enabled);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load(false);
    }, [load])
  );

  useEffect(() => {
    tickRef.current = setInterval(() => setNow(new Date()), 30_000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const handleEnableLocation = async () => {
    setLoading(true);
    await load(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(false);
    setRefreshing(false);
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const ok = await schedulePrayerNotifications();
      if (!ok) {
        Alert.alert(
          'محتاجين إذن الإشعارات',
          'من غير إذن الإشعارات مش هنقدر نفكرك بمواعيد الصلاة — فعّله من إعدادات الجهاز'
        );
        return;
      }
      setNotificationsOn(true);
    } else {
      await disablePrayerNotifications();
      setNotificationsOn(false);
    }
  };

  const nextPrayer = timings ? getNextPrayer(timings, now) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.primary }]}>مواعيد الصلاة</Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/qibla')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol name="location.north.line.fill" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : !hasLocation ? (
        <View style={styles.centerFill}>
          <Text style={[styles.emptyEmoji]}>📍</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>محتاجين موقعك</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            عشان نحسبلك مواعيد الصلاة الدقيقة لمكانك
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleEnableLocation}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>فعّل الموقع</Text>
          </TouchableOpacity>
        </View>
      ) : !timings ? (
        <View style={styles.centerFill}>
          <Text style={[styles.emptyEmoji]}>📡</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>مفيش اتصال بالإنترنت</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            اتأكد من الإنترنت وجرب تاني
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>حاول تاني</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {stale && (
            <View
              style={[
                styles.staleBanner,
                { backgroundColor: colors.card, borderColor: colors.warning },
              ]}
            >
              <Text style={[styles.staleText, { color: colors.warning }]}>
                ⚠️ مفيش اتصال بالإنترنت — المواعيد دي من آخر تحديث محفوظ ومش لليوم بالظبط
              </Text>
            </View>
          )}

          {nextPrayer && (
            <View
              style={[
                styles.nextCard,
                { backgroundColor: colors.cardDone, borderColor: colors.cardDoneBorder },
              ]}
            >
              <Text style={[styles.nextLabel, { color: colors.textSecondary }]}>الصلاة الجاية</Text>
              <Text style={[styles.nextName, { color: colors.text }]}>{nextPrayer.next.label}</Text>
              <Text style={[styles.nextCountdown, { color: colors.primary }]}>
                {formatCountdown(nextPrayer.minutesRemaining)}
              </Text>
            </View>
          )}

          <View style={styles.list}>
            {timings.map((t) => {
              const isNext = nextPrayer?.next.name === t.name;
              return (
                <View
                  key={t.name}
                  style={[
                    styles.row,
                    {
                      backgroundColor: colors.card,
                      borderColor: isNext ? colors.primary : colors.cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.rowTime, { color: isNext ? colors.primary : colors.text }]}>
                    {t.time}
                  </Text>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>{t.label}</Text>
                </View>
              );
            })}
          </View>

          <View
            style={[
              styles.notifRow,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View>
              <Text style={[styles.notifLabel, { color: colors.text }]}>تذكير بكل صلاة</Text>
              <Text style={[styles.notifSubtitle, { color: colors.textSecondary }]}>
                هنبعتلك إشعار عند دخول وقت كل صلاة
              </Text>
            </View>
            <Switch
              value={notificationsOn}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function formatCountdown(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `متبقي ${minutes} دقيقة`;
  return `متبقي ${hours} ساعة و${minutes} دقيقة`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  iconButton: {
    padding: 4,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  scroll: {
    padding: 16,
  },
  staleBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  staleText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  nextCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    marginBottom: 18,
  },
  nextLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  nextName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nextCountdown: {
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    gap: 10,
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowTime: {
    fontSize: 16,
    fontWeight: '700',
  },
  notifRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  notifLabel: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
  notifSubtitle: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
    maxWidth: 220,
  },
});
