import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Share } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { getChapter } from '@/data/quran';
import { getFavoriteVerseIds, toggleFavoriteVerse, parseVerseKey } from '@/data/quranFavorites';
import { useAppTheme } from '@/contexts/theme-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

type FavoriteVerseItem = {
  key: string;
  chapterId: number;
  chapterName: string;
  verseId: number;
  text: string;
};

export default function QuranFavoritesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [items, setItems] = useState<FavoriteVerseItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const ids = await getFavoriteVerseIds();
    const resolved: FavoriteVerseItem[] = ids
      .map((key) => {
        const { chapterId, verseId } = parseVerseKey(key);
        const chapter = getChapter(chapterId);
        const verse = chapter?.verses.find((v) => v.id === verseId);
        if (!chapter || !verse) return null;
        return {
          key,
          chapterId,
          chapterName: chapter.name,
          verseId,
          text: verse.text,
        };
      })
      .filter((v): v is FavoriteVerseItem => v !== null);
    setItems(resolved);
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleRemove = async (item: FavoriteVerseItem) => {
    await toggleFavoriteVerse(item.chapterId, item.verseId);
    Haptics.selectionAsync();
    setItems((prev) => prev.filter((v) => v.key !== item.key));
  };

  const handleShare = (item: FavoriteVerseItem) => {
    Share.share({
      message: `${item.text}\n\n﴿سورة ${item.chapterName} — آية ${item.verseId}﴾\nمن تطبيق سكينة`,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {loaded && items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>⭐️</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>مفيش آيات مفضلة لسه</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            اضغط مطولًا على أي آية في القرآن عشان تضيفها هنا
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.8}
              onPress={() => router.push(`/quran/${item.chapterId}?verse=${item.verseId}`)}
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>
                  سورة {item.chapterName} — آية {item.verseId}
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => handleShare(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.shareIcon}>🔗</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemove(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <IconSymbol name="star.fill" size={18} color={colors.warning} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.verseText, { color: colors.text }]}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
  },
  card: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
  },
  shareIcon: {
    fontSize: 16,
  },
  verseText: {
    fontSize: 18,
    lineHeight: 32,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  empty: {
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
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});
