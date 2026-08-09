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
