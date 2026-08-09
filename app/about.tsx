import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { useAppTheme } from '@/contexts/theme-context';

export default function AboutScreen() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.emoji}>🤍</Text>
      <Text style={[styles.title, { color: colors.primary }]}>سكينة</Text>
      <Text style={[styles.version, { color: colors.textSecondary }]}>الإصدار 1.0.0</Text>

      <Text style={[styles.description, { color: colors.text }]}>
        تطبيق بسيط لمساعدتك تحافظ على أذكار الصباح والمساء ومواعيد الصلاة، بعيدًا عن التشتيت.
      </Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => WebBrowser.openBrowserAsync('https://portfolio.nullspecteracademy.ninja/')}
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>سياسة الخصوصية</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => Linking.openURL('mailto:boodapro540@gmail.com')}
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>تواصل معنا</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  version: {
    fontSize: 13,
    marginBottom: 20,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  button: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
