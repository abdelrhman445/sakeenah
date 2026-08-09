import { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { categories, Zekr } from '@/data/azkar';
import { markCategoryDoneToday } from '@/data/streak';
import { getFavoriteIds, toggleFavorite } from '@/data/favorites';
import { useAppTheme } from '@/contexts/theme-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AzkarListScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const { colors } = useAppTheme();

  const categoryData = categories.find((c) => c.id === category);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [virtueModal, setVirtueModal] = useState<Zekr | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    if (categoryData) {
      const initial: Record<string, number> = {};
      categoryData.items.forEach((item) => {
        initial[item.id] = 0;
      });
      setCounts(initial);
    }
  }, [category, categoryData]);

  useFocusEffect(
    useCallback(() => {
      getFavoriteIds().then(setFavoriteIds);
    }, [])
  );

  if (!categoryData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.text }]}>الفئة غير موجودة</Text>
      </SafeAreaView>
    );
  }

  const handleTap = (item: Zekr) => {
    setCounts((prev) => {
      const current = prev[item.id] || 0;
      if (current >= item.repeat) return prev;
      const updated = { ...prev, [item.id]: current + 1 };

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const allDone = categoryData.items.every((z) => (updated[z.id] || 0) >= z.repeat);
      if (allDone) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        markCategoryDoneToday(categoryData.id).then((streak) => {
          const streakMsg = streak > 0 ? ` — استمرار ${streak} يوم` : '';
          Alert.alert('بارك الله فيك 🤍', `أكملت ${categoryData.title}${streakMsg}`);
        });
      }
      return updated;
    });
  };

  const handleToggleFavorite = async (id: string) => {
    const nowFavorite = await toggleFavorite(id);
    Haptics.selectionAsync();
    setFavoriteIds((prev) => (nowFavorite ? [...prev, id] : prev.filter((f) => f !== id)));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: categoryData.title, headerBackTitle: 'رجوع' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {categoryData.items.map((item) => {
          const current = counts[item.id] || 0;
          const done = current >= item.repeat;
          const isFavorite = favoriteIds.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.zekrCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                done && { backgroundColor: colors.cardDone, borderColor: colors.cardDoneBorder },
              ]}
              activeOpacity={0.7}
              onPress={() => handleTap(item)}
              disabled={done}
            >
              <Text style={[styles.zekrText, { color: colors.text }]}>{item.text}</Text>
              <View style={styles.counterRow}>
                <Text
                  style={[
                    styles.counterText,
                    { color: colors.textSecondary },
                    done && { color: colors.primary },
                  ]}
                >
                  {current} / {item.repeat}
                </Text>
                <View style={styles.rightActions}>
                  {done && <Text style={[styles.checkMark, { color: colors.primary }]}>✓</Text>}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(item.id);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                  >
                    <IconSymbol
                      name="star.fill"
                      size={17}
                      color={isFavorite ? colors.warning : colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      setVirtueModal(item);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="فضل الذكر"
                  >
                    <IconSymbol name="info.circle.fill" size={17} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal
        visible={!!virtueModal}
        transparent
        animationType="fade"
        onRequestClose={() => setVirtueModal(null)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setVirtueModal(null)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: colors.primary }]}>فضل الذكر</Text>
            <Text style={[styles.modalText, { color: colors.text }]}>{virtueModal?.virtue}</Text>
            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: colors.primary }]}
              onPress={() => setVirtueModal(null)}
            >
              <Text style={[styles.modalCloseText, { color: colors.onPrimary }]}>تمام</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notFound: {
    textAlign: 'center',
    marginTop: 40,
  },
  scroll: {
    padding: 16,
  },
  zekrCard: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
  },
  zekrText: {
    fontSize: 18,
    lineHeight: 30,
    textAlign: 'right',
    marginBottom: 12,
  },
  counterRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkMark: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rightActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 16,
    padding: 22,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'right',
    marginBottom: 18,
  },
  modalClose: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
});
