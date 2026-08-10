import quranData from './quran.json';

export type QuranVerse = {
  id: number;
  text: string;
};

export type QuranChapter = {
  id: number;
  name: string;
  transliteration: string;
  type: 'meccan' | 'medinan';
  total_verses: number;
  verses: QuranVerse[];
};

// القرآن الكريم كامل — ١١٤ سورة، ٦٢٣٦ آية (نص عثماني)، مبيّت جوه التطبيق
// عشان يشتغل من غير إنترنت.
export const quranChapters: QuranChapter[] = quranData as QuranChapter[];

export function getChapter(id: number): QuranChapter | undefined {
  return quranChapters.find((c) => c.id === id);
}

// فهرس مسطّح لكل آيات القرآن بالترتيب (١ الفاتحة:١ ... ١١٤ الناس:٦) —
// بيتبني مرة واحدة وقت التحميل، بنستخدمه في خطة الختمة عشان نحسب
// نطاق كل يوم بسرعة من غير ما نلف على السور في كل مرة.
export type FlatVerseRef = { chapterId: number; verseId: number };
export const flatVerses: FlatVerseRef[] = quranChapters.flatMap((c) =>
  c.verses.map((v) => ({ chapterId: c.id, verseId: v.id }))
);
export const totalVerseCount = flatVerses.length;

// بيشيل التشكيل والعلامات القرآنية (سكتات، تنوين، إلخ) وبيوحّد أشكال
// الألف والهمزة (ٱ أ إ آ -> ا) عشان لو المستخدم كتب "الله" بألف عادية
// يلاقي "ٱللَّه" في النص العثماني برضو.
function stripDiacritics(text: string): string {
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED\u06DF\u08D3-\u08E1\u08E3-\u08FF\u0670]/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627');
}

type VerseSearchEntry = { chapter: QuranChapter; verse: QuranVerse; stripped: string };

let verseSearchIndex: VerseSearchEntry[] | null = null;

function getVerseSearchIndex(): VerseSearchEntry[] {
  if (!verseSearchIndex) {
    verseSearchIndex = quranChapters.flatMap((chapter) =>
      chapter.verses.map((verse) => ({
        chapter,
        verse,
        stripped: stripDiacritics(verse.text),
      }))
    );
  }
  return verseSearchIndex;
}

export type VerseSearchResult = { chapter: QuranChapter; verse: QuranVerse };

export function searchVerses(query: string, limit = 30): VerseSearchResult[] {
  const q = stripDiacritics(query.trim());
  if (q.length < 2) return [];

  const results: VerseSearchResult[] = [];
  for (const entry of getVerseSearchIndex()) {
    if (entry.stripped.includes(q)) {
      results.push({ chapter: entry.chapter, verse: entry.verse });
      if (results.length >= limit) break;
    }
  }
  return results;
}
