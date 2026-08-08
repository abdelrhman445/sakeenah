import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Modal, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { categories, Zekr } from '@/data/azkar';
import { markCategoryDoneToday } from '@/data/streak';

export default function AzkarListScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();

  const categoryData = categories.find((c) => c.id === category);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [virtueModal, setVirtueModal] = useState<Zekr | null>(null);

  useEffect(() => {
    if (categoryData) {
      const initial: Record<string, number> = {};
      categoryData.items.forEach((item) => {
        initial[item.id] = 0;
      });
      setCounts(initial);
    }
  }, [category]);

  if (!categoryData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>الفئة غير موجودة</Text>
      </SafeAreaView>
    );
  }

  const handleTap = (item: Zekr) => {
    setCounts((prev) => {
      const current = prev[item.id] || 0;
      if (current >= item.repeat) return prev;
      const updated = { ...prev, [item.id]: current + 1 };

      const allDone = categoryData.items.every(
        (z) => (updated[z.id] || 0) >= z.repeat
      );
      if (allDone) {
        markCategoryDoneToday().then((streak) => {
          Alert.alert('بارك الله فيك 🤍', `أكملت ${categoryData.title} — استمرار ${streak} يوم`);
        });
      }
      return updated;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: categoryData.title, headerBackTitle: 'رجوع' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {categoryData.items.map((item) => {
          const current = counts[item.id] || 0;
          const done = current >= item.repeat;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.zekrCard, done && styles.zekrCardDone]}
              activeOpacity={0.7}
              onPress={() => handleTap(item)}
              disabled={done}
            >
              <Text style={styles.zekrText}>{item.text}</Text>
              <View style={styles.counterRow}>
                <Text style={[styles.counterText, done && styles.counterDoneText]}>
                  {current} / {item.repeat}
                </Text>
                <View style={styles.rightActions}>
                  {done && <Text style={styles.checkMark}>✓</Text>}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      setVirtueModal(item);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.infoIcon}>ℹ️</Text>
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
        <Pressable style={styles.modalOverlay} onPress={() => setVirtueModal(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>فضل الذكر</Text>
            <Text style={styles.modalText}>{virtueModal?.virtue}</Text>
            <TouchableOpacity style={styles.modalClose} onPress={() => setVirtueModal(null)}>
              <Text style={styles.modalCloseText}>تمام</Text>
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
    backgroundColor: '#0F1720',
  },
  notFound: {
    color: '#E6EDF3',
    textAlign: 'center',
    marginTop: 40,
  },
  scroll: {
    padding: 16,
  },
  zekrCard: {
    backgroundColor: '#161F28',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#22303B',
  },
  zekrCardDone: {
    borderColor: '#7FE3C0',
    backgroundColor: '#132821',
  },
  zekrText: {
    color: '#E6EDF3',
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
    color: '#8B98A5',
    fontSize: 14,
    fontWeight: '600',
  },
  counterDoneText: {
    color: '#7FE3C0',
  },
  checkMark: {
    color: '#7FE3C0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rightActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  infoIcon: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#161F28',
    borderRadius: 16,
    padding: 22,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#22303B',
  },
  modalTitle: {
    color: '#7FE3C0',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 10,
  },
  modalText: {
    color: '#E6EDF3',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'right',
    marginBottom: 18,
  },
  modalClose: {
    backgroundColor: '#7FE3C0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#0F1720',
    fontWeight: 'bold',
    fontSize: 15,
  },
});