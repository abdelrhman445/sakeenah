import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/error-boundary';
import { AppThemeProvider, useAppTheme } from '@/contexts/theme-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { scheme } = useAppTheme();

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="about" options={{ presentation: 'modal', title: 'عن التطبيق' }} />
        <Stack.Screen
          name="search"
          options={{ presentation: 'modal', title: 'البحث في الأذكار' }}
        />
        <Stack.Screen name="azkar/favorites" options={{ title: 'المفضلة' }} />
        <Stack.Screen name="azkar/[category]" options={{ title: '' }} />
        <Stack.Screen name="qibla" options={{ title: 'اتجاه القبلة' }} />
      </Stack>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AppThemeProvider>
        <RootNavigator />
      </AppThemeProvider>
    </ErrorBoundary>
  );
}
