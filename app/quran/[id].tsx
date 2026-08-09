import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getChapter } from '@/data/quran';
import { useAppTheme } from '@/contexts/theme-context';

// كل السور بتتصدّر بالبسملة ما عدا الفاتحة (البسملة عندها أصلاً أول آية)
// وسورة التوبة (معروف إنها بتتلى من غير بسملة).
const NO_BASMALA_HEADER = new Set([1, 9]);
const BASMALA = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

export default function SurahScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const chapter = getChapter(Number(id));

  if (!chapter) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.text }]}>السورة غير موجودة</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: chapter.name, headerBackTitle: 'رجوع' }} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.primary }]}>{chapter.name}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {chapter.type === 'meccan' ? 'مكية' : 'مدنية'} · {chapter.total_verses} آية
          </Text>
        </View>

        {!NO_BASMALA_HEADER.has(chapter.id) && (
          <Text style={[styles.basmala, { color: colors.primary }]}>{BASMALA}</Text>
        )}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.verses, { color: colors.text }]}>
            {chapter.verses.map((v) => (
              <Text key={v.id}>
                {v.text}
                <Text style={[styles.verseNumber, { color: colors.primary }]}> ﴿{v.id}﴾ </Text>
              </Text>
            ))}
          </Text>
        </View>
      </ScrollView>
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
    fontSize: 16,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
  },
  basmala: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  verses: {
    fontSize: 20,
    lineHeight: 40,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  verseNumber: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
