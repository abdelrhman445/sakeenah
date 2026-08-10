import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * طبقة تسجيل أخطاء محلية بسيطة. مفيش حساب Sentry أو أي خدمة خارجية
 * مربوطة دلوقتي (محتاج قرار وDSN key من صاحب المشروع)، فلحد ما ده يتحدد
 * إحنا بنحتفظ بآخر الأخطاء على الجهاز نفسه في AsyncStorage — ده أفضل
 * من `console.error` لوحده لأن اللوج بيختفي بمجرد قفل التطبيق.
 *
 * لو حبيت تربط Sentry (أو أي خدمة تانية) بعدين، المكان الوحيد المحتاج
 * تعديل هو دالة `reportError` تحت — ضيف الاستدعاء بتاع الخدمة جنب
 * التخزين المحلي، من غير ما تغيّر أي حاجة في باقي الكود اللي بينادي عليها.
 */

const LOG_KEY = 'sakeenah_error_log';
const MAX_ENTRIES = 20;

export type ErrorLogEntry = {
  message: string;
  stack?: string;
  context?: string;
  platform: string;
  timestamp: string;
};

async function appendEntry(entry: ErrorLogEntry): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    const existing: ErrorLogEntry[] = raw ? JSON.parse(raw) : [];
    const next = [entry, ...existing].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(next));
  } catch {
    // لو التخزين نفسه فشل، مفيش حاجة تانية نعملها غير إننا نتجاهل —
    // مينفعش تسجيل الخطأ يسبب خطأ تاني.
  }
}

/**
 * نقطة الدخول الموحّدة لأي خطأ في التطبيق — استخدمها بدل console.error
 * المباشر في أي مكان بيمسك exception مهم (error boundary، فشل شبكة
 * متكرر، فشل جدولة إشعار...).
 */
export function reportError(error: unknown, context?: string): void {
  const err = error instanceof Error ? error : new Error(String(error));

  if (__DEV__) {
    console.error(context ? `[${context}]` : '[error]', err);
  }

  void appendEntry({
    message: err.message,
    stack: err.stack,
    context,
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
  });
}

export async function getRecentErrors(): Promise<ErrorLogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearErrorLog(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOG_KEY);
  } catch {
    // تجاهل
  }
}

/**
 * بيلقط أي JS exception ميتمسكش بـ try/catch ولا بالـ error boundary
 * (زي خطأ جوه callback غير متزامن) وأي unhandled promise rejection.
 * ينادى مرة واحدة بس عند تشغيل التطبيق (شوف app/_layout.tsx).
 */
export function installGlobalErrorHandlers(): void {
  const globalAny = global as unknown as {
    ErrorUtils?: {
      getGlobalHandler: () => (error: unknown, isFatal?: boolean) => void;
      setGlobalHandler: (handler: (error: unknown, isFatal?: boolean) => void) => void;
    };
    HermesInternal?: unknown;
    process?: { on?: (event: string, handler: (reason: unknown) => void) => void };
  };

  if (globalAny.ErrorUtils?.setGlobalHandler) {
    const previousHandler = globalAny.ErrorUtils.getGlobalHandler();
    globalAny.ErrorUtils.setGlobalHandler((error, isFatal) => {
      reportError(error, isFatal ? 'fatal' : 'unhandled');
      previousHandler?.(error, isFatal);
    });
  }

  // على الويب (react-native-web) بنقدر نستخدم unhandledrejection العادي.
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      reportError(event.reason, 'unhandledrejection');
    });
  }
}
