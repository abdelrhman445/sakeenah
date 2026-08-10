import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/contexts/theme-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { markOnboardingComplete } from '@/lib/onboarding';

type Point = {
  icon: Parameters<typeof IconSymbol>[0]['name'];
  title: string;
  body: string;
};

const POINTS: Point[] = [
  {
    icon: 'book.fill',
    title: 'أذكار الصباح والمساء',
    body: 'مجموعة كاملة من الأذكار مع عداد تكرار، ستريك يومي، ومفضلة تحفظ فيها اللي بيريحك',
  },
  {
    icon: 'location.north.line.fill',
    title: 'مواعيد الصلاة والقبلة',
    body: 'بنحسبهم بدقة لمكانك — وده بيحتاج إذن الموقع من الجهاز، مرة واحدة بس ولما تحتاجه فعليًا',
  },
  {
    icon: 'text.book.closed.fill',
    title: 'القرآن الكريم',
    body: 'قراءة كاملة، حفظ آخر مكان وصلت له، وخطة ختمة تقدر تتابعها يوم بيوم',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  const handleContinue = async () => {
    await markOnboardingComplete();
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🤍</Text>
        <Text style={[styles.title, { color: colors.primary }]}>سكينة</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          رفيقك اليومي للطمأنينة — من غير تشتيت ولا إعلانات
        </Text>
      </View>

      <View style={styles.points}>
        {POINTS.map((p) => (
          <View
            key={p.title}
            style={[
              styles.pointCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <IconSymbol name={p.icon} size={22} color={colors.primary} />
            <View style={styles.pointText}>
              <Text style={[styles.pointTitle, { color: colors.text }]}>{p.title}</Text>
              <Text style={[styles.pointBody, { color: colors.textSecondary }]}>{p.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={[styles.note, { color: colors.textSecondary }]}>
        موقعك بيُستخدم بس لحساب مواعيد الصلاة والقبلة على جهازك، مش بيتبعت لأي حد ولا بيتخزن على
        سيرفر خارجي.
      </Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleContinue}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>يلا نبدأ</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  points: {
    gap: 12,
  },
  pointCard: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  pointText: {
    flex: 1,
  },
  pointTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'right',
  },
  pointBody: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
