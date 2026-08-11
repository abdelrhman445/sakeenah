import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ViewShot from 'react-native-view-shot';

import { useAppTheme } from '@/contexts/theme-context';

export type ShareCardHandle = {
  capture: () => Promise<string>;
};

type Props = {
  /** سطر صغير فوق النص، زي اسم فئة الذكر أو "سورة كذا — آية كذا". */
  eyebrow?: string;
  body: string;
};

/**
 * كارت مخفي (خارج حدود الشاشة) بنستخدمه بس للالتقاط عن طريق
 * react-native-view-shot، وبعدين مشاركته كصورة عبر expo-sharing. مش بيتعرض
 * فعليًا للمستخدم — استدعِ `capture()` بعد ما الذكر/الآية يتحدد.
 */
export const ShareCard = forwardRef<ShareCardHandle, Props>(function ShareCard(
  { eyebrow, body },
  ref
) {
  const { colors } = useAppTheme();
  const shotRef = useRef<ViewShot>(null);

  useImperativeHandle(ref, () => ({
    capture: async () => {
      const capture = shotRef.current?.capture;
      if (!capture) throw new Error('مقدرناش نجهز صورة المشاركة');
      const uri = await capture();
      if (!uri) throw new Error('مقدرناش نجهز صورة المشاركة');
      return uri;
    },
  }));

  return (
    <ViewShot ref={shotRef} options={{ format: 'png', quality: 0.95 }} style={styles.wrapper}>
      <View
        style={[styles.card, { backgroundColor: colors.background, borderColor: colors.primary }]}
      >
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text>
        ) : null}
        <Text style={[styles.body, { color: colors.text }]}>{body}</Text>
        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
        <Text style={[styles.brand, { color: colors.primary }]}>سكينة 🤍</Text>
      </View>
    </ViewShot>
  );
});

const CARD_WIDTH = 320;

const styles = StyleSheet.create({
  // بعيد عن حدود الشاشة عشان يفضل مخفي عن المستخدم لكن لسه في شجرة العرض
  // (view-shot محتاج العنصر يكون متركّب فعليًا عشان يقدر يلتقطه).
  wrapper: {
    position: 'absolute',
    top: -9999,
    left: 0,
    width: CARD_WIDTH,
  },
  card: {
    width: CARD_WIDTH,
    padding: 28,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  body: {
    fontSize: 20,
    lineHeight: 34,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 20,
  },
  divider: {
    width: 40,
    height: 2,
    borderRadius: 1,
    marginBottom: 12,
  },
  brand: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
