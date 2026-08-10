import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_SEEN_KEY = 'sakeenah_onboarding_seen';

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_SEEN_KEY)) === 'true';
  } catch {
    // لو التخزين فشل، الأفضل نفترض إنه شافها قبل كده بدل ما نضايقه بيها
    // تاني كل مرة يفتح التطبيق.
    return true;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
  } catch {
    // تجاهل — أسوأ سيناريو إنها تتعرض تاني المرة الجاية.
  }
}
