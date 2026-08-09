/**
 * لوحة ألوان "سكينة" الموحّدة — نسخة غامقة (الافتراضية) ونسخة فاتحة.
 * أي شاشة في التطبيق المفروض تسحب ألوانها من هنا (عن طريق useAppTheme)
 * بدل ما تكتب أكواد هيكس بشكل مباشر جوه StyleSheet.create.
 */

import { Platform } from 'react-native';

export type AppColorScheme = {
  background: string;
  card: string;
  cardBorder: string;
  cardDone: string;
  cardDoneBorder: string;
  text: string;
  textSecondary: string;
  primary: string;
  onPrimary: string;
  warning: string;
  danger: string;
  overlay: string;
  tabBar: string;
  tabIconDefault: string;
  tabIconSelected: string;
};

export const AppColors: Record<'light' | 'dark', AppColorScheme> = {
  dark: {
    background: '#0F1720',
    card: '#161F28',
    cardBorder: '#22303B',
    cardDone: '#132821',
    cardDoneBorder: '#7FE3C0',
    text: '#E6EDF3',
    textSecondary: '#8B98A5',
    primary: '#7FE3C0',
    onPrimary: '#0F1720',
    warning: '#FFB020',
    danger: '#E5484D',
    overlay: 'rgba(0,0,0,0.6)',
    tabBar: '#0F1720',
    tabIconDefault: '#8B98A5',
    tabIconSelected: '#7FE3C0',
  },
  light: {
    background: '#F6F3EC',
    card: '#FFFFFF',
    cardBorder: '#E4DECF',
    cardDone: '#E9F7F0',
    cardDoneBorder: '#1E9E76',
    text: '#1C2530',
    textSecondary: '#6B7684',
    primary: '#1E9E76',
    onPrimary: '#FFFFFF',
    warning: '#B5760A',
    danger: '#C4302B',
    overlay: 'rgba(0,0,0,0.45)',
    tabBar: '#FFFFFF',
    tabIconDefault: '#8B98A5',
    tabIconSelected: '#1E9E76',
  },
};

// إبقاء الاسم القديم Colors شغال لأي كومبوننت لسه بيستخدم التمبلت الافتراضي
// (ThemedText / ThemedView المتبقّية من قالب Expo).
export const Colors = {
  light: {
    text: AppColors.light.text,
    background: AppColors.light.background,
    tint: AppColors.light.primary,
    icon: AppColors.light.textSecondary,
    tabIconDefault: AppColors.light.tabIconDefault,
    tabIconSelected: AppColors.light.tabIconSelected,
  },
  dark: {
    text: AppColors.dark.text,
    background: AppColors.dark.background,
    tint: AppColors.dark.primary,
    icon: AppColors.dark.textSecondary,
    tabIconDefault: AppColors.dark.tabIconDefault,
    tabIconSelected: AppColors.dark.tabIconSelected,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
