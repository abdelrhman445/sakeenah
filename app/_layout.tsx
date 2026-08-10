import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/error-boundary';
import { AppThemeProvider, useAppTheme } from '@/contexts/theme-context';
import { installGlobalErrorHandlers } from '@/lib/errorReporting';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { scheme } = useAppTheme();

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
        />
        <Stack.Screen name="about" options={{ presentation: 'modal', title: 'عن التطبيق' }} />
        <Stack.Screen
          name="search"
          options={{ presentation: 'modal', title: 'البحث في الأذكار' }}
        />
        <Stack.Screen name="azkar/favorites" options={{ title: 'المفضلة' }} />
        <Stack.Screen name="azkar/[category]" options={{ title: '' }} />
        <Stack.Screen name="qibla" options={{ title: 'اتجاه القبلة' }} />
        <Stack.Screen name="quran/[id]" options={{ title: '' }} />
        <Stack.Screen name="quran/favorites" options={{ title: 'آيات مفضلة' }} />
      </Stack>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    installGlobalErrorHandlers();
  }, []);

  return (
    <ErrorBoundary>
      <AppThemeProvider>
        <RootNavigator />
      </AppThemeProvider>
    </ErrorBoundary>
  );
}
