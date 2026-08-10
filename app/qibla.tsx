import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getQiblaDirection } from '@/lib/qibla';
import { useAppTheme } from '@/contexts/theme-context';

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// حساب اتجاه القبلة نفسه (getQiblaDirection) صح ١٠٠٪ ومتأكد منه
// بالاختبارات. لكن بوصلة بعض الأجهزة (خصوصًا أندرويد) بترجّع قراءة
// معكوسة عن الاتجاه القياسي، وده مشكلة في حساس الجهاز مش في الحساب.
// فبنسيب زرار بسيط "قلب المؤشر" بيتحفظ على الجهاز، بدل ما نخمّن نفس
// الاتجاه لكل الأجهزة.
const INVERT_STORAGE_KEY = 'sakeenah:qiblaNeedleInverted';

export default function QiblaScreen() {
  const { colors } = useAppTheme();
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
  const [heading, setHeading] = useState(0);
  const [inverted, setInverted] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(INVERT_STORAGE_KEY).then((val) => {
      if (val === 'true') setInverted(true);
    });
  }, []);

  const toggleInverted = () => {
    setInverted((prev) => {
      const next = !prev;
      AsyncStorage.setItem(INVERT_STORAGE_KEY, String(next));
      return next;
    });
  };

  const openInMaps = () => {
    if (!coords) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${coords.latitude},${coords.longitude}&destination=${KAABA_LAT},${KAABA_LNG}`;
    Linking.openURL(url);
  };

  useEffect(() => {
    let headingSubscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      let finalStatus = status;
      if (finalStatus !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        finalStatus = req.status;
      }
      if (finalStatus !== 'granted') {
        setPermissionDenied(true);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (cancelled) return;
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      const bearing = getQiblaDirection(position.coords.latitude, position.coords.longitude);
      setQiblaBearing(bearing);

      // بنستخدم بوصلة نظام التشغيل المعايرة (Location.watchHeadingAsync) بدل
      // ما نحسب الاتجاه يدويًا من الماجنتوميتر الخام — الحساب اليدوي كان
      // بيدّي اتجاه معكوس على بعض الأجهزة. trueHeading بيرجع -1 لو مش
      // متاح، فبنقع على magHeading كبديل.
      headingSubscription = await Location.watchHeadingAsync((data) => {
        const value = data.trueHeading >= 0 ? data.trueHeading : data.magHeading;
        setHeading(value);
      });
    })();

    return () => {
      cancelled = true;
      headingSubscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (qiblaBearing === null) return;
    const relative = (qiblaBearing - heading + 360) % 360;
    const target = inverted ? (360 - relative) % 360 : relative;
    Animated.timing(rotation, {
      toValue: target,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [heading, qiblaBearing, rotation, inverted]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {permissionDenied ? (
        <View style={styles.centerFill}>
          <Text style={styles.emoji}>🧭</Text>
          <Text style={[styles.title, { color: colors.text }]}>محتاجين إذن الموقع</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            من غير الموقع مش هنقدر نحسبلك اتجاه القبلة بدقة
          </Text>
        </View>
      ) : qiblaBearing === null ? (
        <View style={styles.centerFill}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>بنحدد موقعك...</Text>
        </View>
      ) : (
        <View style={styles.centerFill}>
          <Text style={[styles.title, { color: colors.text }]}>وجّه تليفونك ناحية السهم</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: 40 }]}>
            السهم بيشاور على اتجاه الكعبة المشرفة
          </Text>

          <View
            style={[
              styles.compassCircle,
              { borderColor: colors.cardBorder, backgroundColor: colors.card },
            ]}
          >
            <Animated.View style={[styles.needle, { transform: [{ rotate: rotateInterpolate }] }]}>
              <Text style={[styles.needleArrow, { color: colors.primary }]}>⬆️</Text>
            </Animated.View>
            <Text style={[styles.kaabaEmoji]}>🕋</Text>
          </View>

          <Text style={[styles.helpText, { color: colors.textSecondary, marginTop: 32 }]}>
            دقة البوصلة بتعتمد على حساسات جهازك — لو مش دقيقة، حرّك الموبايل على شكل ٨
          </Text>

          <TouchableOpacity
            style={[styles.helpButton, { borderColor: colors.cardBorder, marginTop: 12 }]}
            onPress={toggleInverted}
          >
            <Text style={[styles.helpText, { color: colors.primary, fontWeight: 'bold' }]}>
              {inverted ? '✓ تم قلب اتجاه المؤشر' : 'السهم بيشاور عكس الكعبة؟ اضغط هنا لقلبه'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.helpButton, { borderColor: colors.cardBorder, marginTop: 12 }]}
            onPress={openInMaps}
          >
            <Text style={[styles.helpText, { color: colors.text, fontWeight: 'bold' }]}>
              🗺️ افتح الاتجاه في خرائط جوجل
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerFill: {
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  compassCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needle: {
    position: 'absolute',
  },
  needleArrow: {
    fontSize: 64,
  },
  kaabaEmoji: {
    position: 'absolute',
    top: 14,
    fontSize: 22,
  },
  helpButton: {
    marginTop: 32,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    maxWidth: 300,
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
