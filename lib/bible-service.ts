// Bible Data Service
// Uses local JSON file for Korean Bible (개역개정)

export interface BibleVerse {
    book: string;
    chapter: number;
    verse: number;
    text: string;
}

export interface BibleChapter {
    book: string;
    chapter: number;
    verses: BibleVerse[];
}

// Korean book names mapping
export const BIBLE_BOOKS_KO: Record<string, string> = {
    'Genesis': '창세기',
    'Exodus': '출애굽기',
    'Leviticus': '레위기',
    'Numbers': '민수기',
    'Deuteronomy': '신명기',
    'Joshua': '여호수아',
    'Judges': '사사기',
    'Ruth': '룻기',
    '1 Samuel': '사무엘상',
    '2 Samuel': '사무엘하',
    '1 Kings': '열왕기상',
    '2 Kings': '열왕기하',
    '1 Chronicles': '역대상',
    '2 Chronicles': '역대하',
    'Ezra': '에스라',
    'Nehemiah': '느헤미야',
    'Esther': '에스더',
    'Job': '욥기',
    'Psalms': '시편',
    'Proverbs': '잠언',
    'Ecclesiastes': '전도서',
    'Song of Solomon': '아가',
    'Isaiah': '이사야',
    'Jeremiah': '예레미야',
    'Lamentations': '예레미야애가',
    'Ezekiel': '에스겔',
    'Daniel': '다니엘',
    'Hosea': '호세아',
    'Joel': '요엘',
    'Amos': '아모스',
    'Obadiah': '오바댜',
    'Jonah': '요나',
    'Micah': '미가',
    'Nahum': '나훔',
    'Habakkuk': '하박국',
    'Zephaniah': '스바냐',
    'Haggai': '학개',
    'Zechariah': '스가랴',
    'Malachi': '말라기',
    'Matthew': '마태복음',
    'Mark': '마가복음',
    'Luke': '누가복음',
    'John': '요한복음',
    'Acts': '사도행전',
    'Romans': '로마서',
    '1 Corinthians': '고린도전서',
    '2 Corinthians': '고린도후서',
    'Galatians': '갈라디아서',
    'Ephesians': '에베소서',
    'Philippians': '빌립보서',
    'Colossians': '골로새서',
    '1 Thessalonians': '데살로니가전서',
    '2 Thessalonians': '데살로니가후서',
    '1 Timothy': '디모데전서',
    '2 Timothy': '디모데후서',
    'Titus': '디도서',
    'Philemon': '빌레몬서',
    'Hebrews': '히브리서',
    'James': '야고보서',
    '1 Peter': '베드로전서',
    '2 Peter': '베드로후서',
    '1 John': '요한1서',
    '2 John': '요한2서',
    '3 John': '요한3서',
    'Jude': '유다서',
    'Revelation': '요한계시록',
};

// Reverse mapping for Korean to English
export const BIBLE_BOOKS_EN: Record<string, string> = Object.fromEntries(
    Object.entries(BIBLE_BOOKS_KO).map(([en, ko]) => [ko, en])
);

// Bible data cache
let bibleData: any = null;

// Load Bible data from public folder
async function loadBibleData() {
    if (bibleData) return bibleData;

    try {
        // Try to load from local JSON file
        const response = await fetch('/bible/ko_krv.json');
        if (response.ok) {
            bibleData = await response.json();
            return bibleData;
        }
    } catch (error) {
        console.error('Error loading local Bible data:', error);
    }

    // Fallback: Load from API
    try {
        const response = await fetch('https://bible-api.com/john%203:16?translation=korean');
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error loading Bible from API:', error);
    }

    return null;
}

// Get a single verse
export async function getVerse(book: string, chapter: number, verse: number): Promise<BibleVerse | null> {
    const data = await loadBibleData();
    if (!data) return null;

    try {
        const bookData = data[book] || data[BIBLE_BOOKS_KO[book]] || data[BIBLE_BOOKS_EN[book]];
        if (!bookData) return null;

        const chapterData = bookData[chapter.toString()];
        if (!chapterData) return null;

        const text = chapterData[verse.toString()];
        if (!text) return null;

        return { book, chapter, verse, text };
    } catch (error) {
        console.error('Error getting verse:', error);
        return null;
    }
}

// Get entire chapter
export async function getChapter(book: string, chapter: number): Promise<BibleChapter | null> {
    const data = await loadBibleData();
    if (!data) return null;

    try {
        const bookData = data[book] || data[BIBLE_BOOKS_KO[book]] || data[BIBLE_BOOKS_EN[book]];
        if (!bookData) return null;

        const chapterData = bookData[chapter.toString()];
        if (!chapterData) return null;

        const verses: BibleVerse[] = Object.entries(chapterData).map(([verseNum, text]) => ({
            book,
            chapter,
            verse: parseInt(verseNum),
            text: text as string,
        })).sort((a, b) => a.verse - b.verse);

        return { book, chapter, verses };
    } catch (error) {
        console.error('Error getting chapter:', error);
        return null;
    }
}

// Search Bible text
export async function searchBible(query: string, limit: number = 20): Promise<BibleVerse[]> {
    const data = await loadBibleData();
    if (!data) return [];

    const results: BibleVerse[] = [];
    const queryLower = query.toLowerCase();

    try {
        for (const [book, chapters] of Object.entries(data)) {
            for (const [chapterNum, verses] of Object.entries(chapters as object)) {
                for (const [verseNum, text] of Object.entries(verses as object)) {
                    if ((text as string).toLowerCase().includes(queryLower)) {
                        results.push({
                            book,
                            chapter: parseInt(chapterNum),
                            verse: parseInt(verseNum),
                            text: text as string,
                        });

                        if (results.length >= limit) return results;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error searching Bible:', error);
    }

    return results;
}

// Get book info
export function getBookInfo(book: string) {
    const koName = BIBLE_BOOKS_KO[book] || book;
    const enName = BIBLE_BOOKS_EN[book] || book;

    return {
        korean: koName,
        english: enName,
        isOldTestament: Object.keys(BIBLE_BOOKS_KO).indexOf(enName) < 39,
    };
}
