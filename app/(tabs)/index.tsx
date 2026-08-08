import { useCallback, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { categories } from '@/data/azkar';
import { getCurrentStreak } from '@/data/streak';

export default function HomeScreen() {
  const router = useRouter();
  const [streak, setStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getCurrentStreak().then(setStreak);
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>سكينة</Text>
        <Text style={styles.subtitle}>أذكارك اليومية بقلب حاضر</Text>

        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streak} يوم متواصل</Text>
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
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push(`/azkar/${item.id}`)}
          >
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardCount}>{item.items.length} أذكار</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1720',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7FE3C0',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B98A5',
    marginBottom: 12,
  },
  streakBadge: {
    backgroundColor: '#1E2A33',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    color: '#FFB020',
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
    backgroundColor: '#161F28',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22303B',
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  cardTitle: {
    color: '#E6EDF3',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardCount: {
    color: '#8B98A5',
    fontSize: 12,
  },
});