import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { getChapter, QuranVerse } from '@/data/quran';
import { setLastRead } from '@/data/quranProgress';
import { getFavoriteVerseIds, toggleFavoriteVerse } from '@/data/quranFavorites';
import { getSurahAudioUrl } from '@/lib/quranAudio';
import { reportError } from '@/lib/errorReporting';
import { useAppTheme } from '@/contexts/theme-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ShareCard, ShareCardHandle } from '@/components/share-card';

// كل السور بتتصدّر بالبسملة ما عدا الفاتحة (البسملة عندها أصلاً أول آية)
// وسورة التوبة (معروف إنها بتتلى من غير بسملة).
const NO_BASMALA_HEADER = new Set([1, 9]);
const BASMALA = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

const FONT_SIZE_KEY = 'sakeenah_quran_font_size';
const MIN_FONT = 16;
const MAX_FONT = 30;
const DEFAULT_FONT = 20;

export default function SurahScreen() {
  const { id, verse } = useLocalSearchParams<{ id: string; verse?: string }>();
  const { colors } = useAppTheme();
  const chapter = getChapter(Number(id));
  const targetVerse = verse ? Number(verse) : undefined;

  const [fontSize, setFontSize] = useState(DEFAULT_FONT);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [shareVerse, setShareVerse] = useState<QuranVerse | null>(null);
  const shareCardRef = useRef<ShareCardHandle>(null);
  const listRef = useRef<FlatList<QuranVerse>>(null);
  const topVerseRef = useRef<number>(targetVerse ?? 1);
  const hasScrolledToTarget = useRef(false);

  const audioPlayer = useAudioPlayer({ uri: getSurahAudioUrl(chapter?.id ?? 1) });
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  useEffect(() => {
    AsyncStorage.getItem(FONT_SIZE_KEY).then((raw) => {
      if (raw) setFontSize(parseInt(raw, 10));
    });
    getFavoriteVerseIds().then(setFavoriteIds);
  }, []);

  useEffect(() => {
    return () => {
      if (chapter) {
        setLastRead(chapter.id, topVerseRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter?.id]);

  const changeFontSize = (delta: number) => {
    setFontSize((prev) => {
      const next = Math.min(MAX_FONT, Math.max(MIN_FONT, prev + delta));
      AsyncStorage.setItem(FONT_SIZE_KEY, String(next));
      return next;
    });
  };

  const handleShare = (v: QuranVerse) => {
    if (!chapter) return;
    Share.share({
      message: `${v.text}\n\n﴿سورة ${chapter.name} — آية ${v.id}﴾\nمن تطبيق سكينة`,
    });
  };

  const handleToggleFavorite = async (v: QuranVerse) => {
    if (!chapter) return;
    const nowFavorite = await toggleFavoriteVerse(chapter.id, v.id);
    Haptics.selectionAsync();
    setFavoriteIds((prev) => {
      const key = `${chapter.id}:${v.id}`;
      return nowFavorite ? [...prev, key] : prev.filter((f) => f !== key);
    });
  };

  const handleLongPress = (v: QuranVerse) => {
    if (!chapter) return;
    const key = `${chapter.id}:${v.id}`;
    const isFav = favoriteIds.includes(key);
    Haptics.selectionAsync();
    Alert.alert(`آية ${v.id}`, undefined, [
      {
        text: isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة',
        onPress: () => handleToggleFavorite(v),
      },
      { text: 'مشاركة نص', onPress: () => handleShare(v) },
      { text: 'مشاركة كصورة', onPress: () => setShareVerse(v) },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  // بعد ما `shareVerse` يتحدد بنستنى تِك واحد عشان الكارت المخفي يترسم،
  // ونلتقطه ونفتح شيت المشاركة بالصورة الناتجة.
  useEffect(() => {
    if (!shareVerse) return;
    let cancelled = false;
    (async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const uri = await shareCardRef.current?.capture();
        if (cancelled || !uri) return;
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'image/png' });
        }
      } catch (err) {
        reportError(err, 'quran:shareImage');
        if (!cancelled) Alert.alert('حصل خطأ', 'مقدرناش نجهز صورة المشاركة');
      } finally {
        if (!cancelled) setShareVerse(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shareVerse]);

  const toggleAudio = () => {
    if (audioStatus.playing) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.item) {
      topVerseRef.current = (first.item as QuranVerse).id;
    }
  }).current;

  const persistProgressNow = useCallback(() => {
    if (chapter) setLastRead(chapter.id, topVerseRef.current);
  }, [chapter]);

  const onScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      listRef.current?.scrollToOffset({
        offset: info.averageItemLength * info.index,
        animated: false,
      });
      setTimeout(() => {
        if (!hasScrolledToTarget.current && chapter) {
          const index = chapter.verses.findIndex((v) => v.id === targetVerse);
          if (index >= 0) {
            listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.2 });
            hasScrolledToTarget.current = true;
          }
        }
      }, 250);
    },
    [chapter, targetVerse]
  );

  if (!chapter) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.text }]}>السورة غير موجودة</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <Stack.Screen
        options={{
          title: chapter.name,
          headerBackTitle: 'رجوع',
          headerRight: () => (
            <View style={styles.headerControls}>
              <TouchableOpacity onPress={toggleAudio} style={styles.audioBtn}>
                <IconSymbol
                  name={audioStatus.playing ? 'pause.fill' : 'play.fill'}
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <View style={styles.fontControls}>
                <TouchableOpacity onPress={() => changeFontSize(-2)} style={styles.fontBtn}>
                  <Text style={[styles.fontBtnText, { color: colors.primary }]}>أ-</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => changeFontSize(2)} style={styles.fontBtn}>
                  <Text style={[styles.fontBtnText, { color: colors.primary }]}>أ+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ),
        }}
      />

      <FlatList
        ref={listRef}
        data={chapter.verses}
        keyExtractor={(v) => String(v.id)}
        contentContainerStyle={styles.content}
        initialScrollIndex={
          targetVerse
            ? Math.max(
                0,
                chapter.verses.findIndex((v) => v.id === targetVerse)
              )
            : undefined
        }
        onScrollToIndexFailed={onScrollToIndexFailed}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        onMomentumScrollEnd={persistProgressNow}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.name, { color: colors.primary }]}>{chapter.name}</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {chapter.type === 'meccan' ? 'مكية' : 'مدنية'} · {chapter.total_verses} آية
            </Text>
            {!NO_BASMALA_HEADER.has(chapter.id) && (
              <Text style={[styles.basmala, { color: colors.primary }]}>{BASMALA}</Text>
            )}
            {(audioStatus.playing || audioStatus.isBuffering) && (
              <Text style={[styles.audioStatus, { color: colors.textSecondary }]}>
                {audioStatus.isBuffering ? '🔊 بيتحمّل التلاوة...' : '🔊 الشيخ مشاري العفاسي'}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const isTarget = item.id === targetVerse;
          const isFavorite = favoriteIds.includes(`${chapter.id}:${item.id}`);
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onLongPress={() => handleLongPress(item)}
              style={[
                styles.verseRow,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                isTarget && { borderColor: colors.primary, borderWidth: 1.5 },
              ]}
            >
              <Text style={[styles.verseText, { color: colors.text, fontSize }]}>
                {item.text}
                <Text style={[styles.verseNumber, { color: colors.primary }]}> ﴿{item.id}﴾</Text>
                {isFavorite && ' ⭐️'}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {shareVerse && chapter && (
        <ShareCard
          ref={shareCardRef}
          eyebrow={`سورة ${chapter.name} — آية ${shareVerse.id}`}
          body={shareVerse.text}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notFound: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  audioBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  fontControls: {
    flexDirection: 'row',
    gap: 4,
  },
  fontBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fontBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  audioStatus: {
    fontSize: 12,
    marginTop: 12,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
  },
  basmala: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  verseRow: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  verseText: {
    lineHeight: 40,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  verseNumber: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
