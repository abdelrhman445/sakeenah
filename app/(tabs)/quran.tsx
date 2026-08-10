import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  quranChapters,
  getChapter,
  searchVerses,
  QuranChapter,
  VerseSearchResult,
} from '@/data/quran';
import { getLastRead, LastRead } from '@/data/quranProgress';
import {
  KhatmaPlan,
  getKhatmaPlan,
  startKhatmaPlan,
  markKhatmaDoneToday,
  resetKhatmaPlan,
} from '@/data/khatma';
import { formatHijriDate } from '@/lib/hijri';
import { useAppTheme } from '@/contexts/theme-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

const KHATMA_PRESETS = [30, 60, 90];

export default function QuranScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [lastRead, setLastReadState] = useState<LastRead | null>(null);
  const [khatma, setKhatma] = useState<KhatmaPlan | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timeout);
  }, [query]);

  const refresh = useCallback(() => {
    getLastRead().then(setLastReadState);
    getKhatmaPlan().then(setKhatma);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const matchedChapters = useMemo(() => {
    const q = query.trim();
    if (!q) return quranChapters;
    return quranChapters.filter(
      (c) => c.name.includes(q) || c.transliteration.toLowerCase().includes(q.toLowerCase())
    );
  }, [query]);

  const matchedVerses: VerseSearchResult[] = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    return searchVerses(debouncedQuery, 20);
  }, [debouncedQuery]);

  const lastReadChapter = lastRead ? getChapter(lastRead.chapterId) : undefined;

  const handleStartKhatma = (days: number) => {
    Alert.alert(
      'بدء خطة ختمة',
      `هتقرأ حوالي ${Math.ceil(6236 / days)} آية في اليوم على مدار ${days} يوم`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'ابدأ',
          onPress: async () => {
            await startKhatmaPlan(days);
            refresh();
          },
        },
      ]
    );
  };

  const handleMarkDone = async () => {
    await markKhatmaDoneToday();
    refresh();
  };

  const handleResetKhatma = () => {
    Alert.alert('إعادة ضبط الختمة', 'هيتصفّر تقدّمك الحالي في الختمة، تحب تكمل؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'إعادة ضبط',
        style: 'destructive',
        onPress: async () => {
          await resetKhatmaPlan();
          refresh();
        },
      },
    ]);
  };

  const renderChapter = ({ item }: { item: QuranChapter }) => (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      activeOpacity={0.8}
      onPress={() => router.push(`/quran/${item.id}`)}
    >
      <View style={[styles.badge, { borderColor: colors.primary }]}>
        <Text style={[styles.badgeText, { color: colors.primary }]}>{item.id}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
          {item.type === 'meccan' ? 'مكية' : 'مدنية'} · {item.total_verses} آية
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/quran/favorites')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol name="star.fill" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>القرآن الكريم</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>١١٤ سورة كاملة</Text>
        <Text style={[styles.hijri, { color: colors.textSecondary }]}>
          {formatHijriDate()} (تقريبي)
        </Text>
      </View>

      <View
        style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      >
        <IconSymbol name="magnifyingglass" size={18} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ابحث باسم السورة أو نص آية"
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.text }]}
          textAlign="right"
        />
      </View>

      <FlatList
        data={matchedChapters}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={renderChapter}
        ListHeaderComponent={
          query.trim().length === 0 ? (
            <>
              {lastReadChapter && (
                <TouchableOpacity
                  style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push(`/quran/${lastReadChapter.id}?verse=${lastRead?.verseId}`)
                  }
                >
                  <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                    أكمل من حيث توقفت
                  </Text>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    سورة {lastReadChapter.name} — آية {lastRead?.verseId}
                  </Text>
                </TouchableOpacity>
              )}

              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>خطة الختمة</Text>
                {khatma ? (
                  <>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {khatma.completed ? 'خلصت الختمة 🎉' : khatma.todayRangeLabel}
                    </Text>
                    <View style={[styles.progressTrack, { backgroundColor: colors.background }]}>
                      <View
                        style={[
                          styles.progressFill,
                          { backgroundColor: colors.primary, width: `${khatma.progressPercent}%` },
                        ]}
                      />
                    </View>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                      {khatma.progressVerses}/{khatma.totalVerses} آية (٪{khatma.progressPercent})
                      {khatma.streak > 0 ? ` · 🔥 ${khatma.streak} يوم` : ''}
                    </Text>
                    {!khatma.completed && (
                      <TouchableOpacity
                        style={[
                          styles.smallBtn,
                          {
                            backgroundColor: khatma.doneToday ? colors.background : colors.primary,
                            borderColor: colors.cardBorder,
                          },
                        ]}
                        disabled={khatma.doneToday}
                        onPress={handleMarkDone}
                      >
                        <Text
                          style={[
                            styles.smallBtnText,
                            { color: khatma.doneToday ? colors.textSecondary : colors.onPrimary },
                          ]}
                        >
                          {khatma.doneToday ? 'خلّصت وِرد النهاردة ✓' : 'اتممت وردي النهارده'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleResetKhatma} style={styles.resetLink}>
                      <Text style={[styles.resetText, { color: colors.danger }]}>
                        إعادة ضبط الختمة
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                      اختار مدة الختمة وهنقسملك القرآن على أيامها
                    </Text>
                    <View style={styles.presetsRow}>
                      {KHATMA_PRESETS.map((days) => (
                        <TouchableOpacity
                          key={days}
                          style={[styles.presetChip, { borderColor: colors.primary }]}
                          onPress={() => handleStartKhatma(days)}
                        >
                          <Text style={[styles.presetText, { color: colors.primary }]}>
                            {days} يوم
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>

              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>كل السور</Text>
            </>
          ) : matchedVerses.length > 0 ? (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                آيات مطابقة
              </Text>
              {matchedVerses.map(({ chapter, verse }) => (
                <TouchableOpacity
                  key={`${chapter.id}:${verse.id}`}
                  style={[
                    styles.verseHit,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/quran/${chapter.id}?verse=${verse.id}`)}
                >
                  <Text style={[styles.verseHitLabel, { color: colors.textSecondary }]}>
                    سورة {chapter.name} — آية {verse.id}
                  </Text>
                  <Text numberOfLines={2} style={[styles.verseHitText, { color: colors.text }]}>
                    {verse.text}
                  </Text>
                </TouchableOpacity>
              ))}
              {matchedChapters.length > 0 && (
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  سور مطابقة
                </Text>
              )}
            </>
          ) : null
        }
        ListEmptyComponent={
          query.trim().length > 0 && matchedVerses.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>مفيش نتائج</Text>
          ) : null
        }
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
  },
  hijri: {
    fontSize: 12,
    marginTop: 4,
  },
  searchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  list: {
    padding: 16,
    paddingTop: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  smallBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  smallBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  resetLink: {
    marginTop: 10,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 12,
  },
  presetsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  presetChip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  presetText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8,
    marginTop: 4,
  },
  verseHit: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  verseHitLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 4,
  },
  verseHitText: {
    fontSize: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 24,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 12,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'right',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});
