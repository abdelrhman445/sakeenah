import { useMemo, useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { quranChapters, QuranChapter } from '@/data/quran';
import { useAppTheme } from '@/contexts/theme-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function QuranScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return quranChapters;
    return quranChapters.filter(
      (c) => c.name.includes(q) || c.transliteration.toLowerCase().includes(q.toLowerCase())
    );
  }, [query]);

  const renderItem = ({ item }: { item: QuranChapter }) => (
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>القرآن الكريم</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>١١٤ سورة كاملة</Text>
      </View>

      <View
        style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      >
        <IconSymbol name="magnifyingglass" size={18} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ابحث باسم السورة"
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.text }]}
          textAlign="right"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>مفيش نتائج</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
