import { Component, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColors } from '@/constants/theme';
import { reportError } from '@/lib/errorReporting';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * حاجز أخطاء عام — من غيره أي exception في أي شاشة كان بيوقع التطبيق كله
 * بشاشة بيضا. دلوقتي بيلقط الخطأ ويعرض رسالة لطيفة مع زرار "حاول تاني"
 * بدل الكراش الكامل.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string } | unknown) {
    const stack =
      typeof info === 'object' && info !== null && 'componentStack' in info
        ? String((info as { componentStack?: string }).componentStack ?? '')
        : undefined;
    reportError(error, stack ? `render-crash: ${stack.slice(0, 200)}` : 'render-crash');
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      const colors = AppColors.dark;
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={[styles.emoji]}>😔</Text>
          <Text style={[styles.title, { color: colors.text }]}>حصل خطأ غير متوقع</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            حاول تاني، ولو المشكلة استمرت جرب تقفل التطبيق وتفتحه من جديد
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={this.handleRetry}
          >
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>حاول تاني</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
});
