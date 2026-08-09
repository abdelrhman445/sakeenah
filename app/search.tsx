import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { searchZekr } from '@/data/azkar';
import { useAppTheme } from '@/contexts/theme-context';

export default function SearchScreen() {
  const { colors } = useAppTheme();
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchZekr(query), [query]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text },
        ]}
        placeholder="ابحث في كل الأذكار..."
        placeholderTextColor={colors.textSecondary}
        value={query}
        onChangeText={setQuery}
        autoFocus
        textAlign="right"
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {query.trim().length > 0 && results.length === 0 && (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>مفيش نتايج مطابقة</Text>
        )}
        {results.map((item) => (
          <View
            key={item.id}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          >
            <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>
              {item.categoryTitle}
            </Text>
            <Text style={[styles.zekrText, { color: colors.text }]}>{item.text}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  scroll: {
    paddingBottom: 24,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'right',
  },
  zekrText: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'right',
  },
});
