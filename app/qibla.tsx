import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getQiblaDirection } from '@/lib/qibla';
import { useAppTheme } from '@/contexts/theme-context';

export default function QiblaScreen() {
  const { colors } = useAppTheme();
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
  const [heading, setHeading] = useState(0);
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

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
      const bearing = getQiblaDirection(position.coords.latitude, position.coords.longitude);
      setQiblaBearing(bearing);

      Magnetometer.setUpdateInterval(200);
      subscription = Magnetometer.addListener((data) => {
        const angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
        const normalized = (angle + 90 + 360) % 360;
        setHeading(normalized);
      });
    })();

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (qiblaBearing === null) return;
    const target = (qiblaBearing - heading + 360) % 360;
    Animated.timing(rotation, {
      toValue: target,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [heading, qiblaBearing, rotation]);

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

          <TouchableOpacity
            style={[styles.helpButton, { borderColor: colors.cardBorder }]}
            onPress={() => {}}
            disabled
          >
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              دقة البوصلة بتعتمد على حساسات جهازك — لو مش دقيقة، حرّك الموبايل على شكل ٨
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
