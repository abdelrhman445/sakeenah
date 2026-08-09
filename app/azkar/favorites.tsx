import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { getZekrByIds, ZekrWithCategory } from '@/data/azkar';
import { getFavoriteIds, toggleFavorite } from '@/data/favorites';
import { useAppTheme } from '@/contexts/theme-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function FavoritesScreen() {
  const { colors } = useAppTheme();
  const [items, setItems] = useState<ZekrWithCategory[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const ids = await getFavoriteIds();
    setItems(getZekrByIds(ids));
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleRemove = async (id: string) => {
    await toggleFavorite(id);
    Haptics.selectionAsync();
    setItems((prev) => prev.filter((z) => z.id !== id));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {loaded && items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>⭐️</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>مفيش أذكار مفضلة لسه</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            اضغط على أيقونة النجمة جنب أي ذكر عشان تضيفه هنا
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {items.map((item) => (
            <View
              key={item.id}
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>
                  {item.categoryTitle}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemove(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <IconSymbol name="star.fill" size={18} color={colors.warning} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.zekrText, { color: colors.text }]}>{item.text}</Text>
            </View>
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
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  zekrText: {
    fontSize: 17,
    lineHeight: 28,
    textAlign: 'right',
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
