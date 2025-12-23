/**
 * Smart Bible Planner - Sequential Reading Algorithm v2
 * 
 * 핵심 원칙:
 * 1. 순차 읽기 (Sequential) - 창세기 1장부터 요한계시록까지 순서대로
 * 2. 전체 66권 완독 - 1년 안에 성경 전체 읽기
 * 3. 동적 분량 조절 - 목표 시간에 맞춰 장/절 단위로 분할
 */

import { BibleTranslation, BIBLE_BOOKS } from './constants';

// ==========================================
// 1. 데이터 타입 정의
// ==========================================

export interface ReadingRange {
    book: string;
    startChapter: number;
    endChapter: number;
    startVerse: number;
    endVerse: number;
}

export interface DailyPlan {
    dayNumber: number;
    ranges: ReadingRange[];  // 여러 책에 걸칠 수 있음
    displayText: string;     // "창세기 1:1 ~ 2:25"
    shortText: string;       // "창 1-2"
    book: string;            // 메인 책 (첫 번째)
    startChapter: number;
    endChapter: number;
    startVerse: number;
    endVerse: number;
    estimatedTimeSeconds: number;
    estimatedTimeMinutes: number;
    wordCount: number;
    isBufferDay: boolean;
    isCompleted: boolean;
    completedAt?: Date;
    note: string;
}

export interface ReadingPlanStats {
    currentDay: number;
    totalDays: number;
    progressPercent: number;
    currentStreak: number;
    longestStreak: number;
    totalWordsRead: number;
    totalChaptersRead: number;
    booksCompleted: number;
}

export type PlannerMode = 'NKRV' | 'EASY';

// 책 약어 맵
const BOOK_ABBREV: Record<string, string> = {
    '창세기': '창', '출애굽기': '출', '레위기': '레', '민수기': '민', '신명기': '신',
    '여호수아': '수', '사사기': '삿', '룻기': '룻', '사무엘상': '삼상', '사무엘하': '삼하',
    '열왕기상': '왕상', '열왕기하': '왕하', '역대상': '대상', '역대하': '대하',
    '에스라': '스', '느헤미야': '느', '에스더': '에', '욥기': '욥', '시편': '시',
    '잠언': '잠', '전도서': '전', '아가': '아', '이사야': '사', '예레미야': '렘',
    '예레미야애가': '애', '에스겔': '겔', '다니엘': '단', '호세아': '호', '요엘': '욜',
    '아모스': '암', '오바댜': '옵', '요나': '욘', '미가': '미', '나훔': '나',
    '하박국': '합', '스바냐': '습', '학개': '학', '스가랴': '슥', '말라기': '말',
    '마태복음': '마', '마가복음': '막', '누가복음': '눅', '요한복음': '요',
    '사도행전': '행', '로마서': '롬', '고린도전서': '고전', '고린도후서': '고후',
    '갈라디아서': '갈', '에베소서': '엡', '빌립보서': '빌', '골로새서': '골',
    '데살로니가전서': '살전', '데살로니가후서': '살후', '디모데전서': '딤전',
    '디모데후서': '딤후', '디도서': '딛', '빌레몬서': '몬', '히브리서': '히',
    '야고보서': '약', '베드로전서': '벧전', '베드로후서': '벧후',
    '요한일서': '요일', '요한이서': '요이', '요한삼서': '요삼',
    '유다서': '유', '요한계시록': '계',
};

// 책별 난이도 점수 (1.0 = 보통, 1.5 = 어려움)
const BOOK_DIFFICULTY: Record<string, number> = {
    '레위기': 1.4, '민수기': 1.3, '신명기': 1.2, '에스겔': 1.4, '다니엘': 1.3,
    '스가랴': 1.3, '요한계시록': 1.4, '욥기': 1.3, '전도서': 1.2, '이사야': 1.2,
    '예레미야': 1.2, '히브리서': 1.2, '로마서': 1.2,
};

// ==========================================
// 2. 핵심 알고리즘 클래스 v2
// ==========================================

export class SmartBiblePlanner {
    private mode: PlannerMode;
    private readingSpeedCPM: number;
    private targetSeconds: number;
    private overflowTolerance: number;
    private totalDaysTarget: number;

    constructor(mode: PlannerMode = 'NKRV', targetMinutes: number = 10) {
        this.mode = mode;
        this.readingSpeedCPM = mode === 'NKRV' ? 400 : 500;  // 개역개정은 더 천천히
        this.targetSeconds = targetMinutes * 60;
        this.overflowTolerance = mode === 'NKRV' ? 1.15 : 1.25;
        this.totalDaysTarget = 365;  // 1년
    }

    /**
     * 순차적 1년 성경읽기 계획 생성
     * 핵심: 창세기 1장부터 요한계시록까지 순서대로, 365일에 맞춤
     */
    public generatePlan(
        bibleData: Record<string, Record<string, Record<string, string>>>,
        books: string[] = BIBLE_BOOKS
    ): DailyPlan[] {
        // 1. 전체 성경 단어 수 계산
        const allChapters = this.extractAllChapters(bibleData, books);
        const totalWords = allChapters.reduce((sum, ch) => sum + ch.wordCount, 0);

        // 2. 일일 목표 단어 수 계산 (버퍼 데이 고려)
        const readingDays = Math.floor(this.totalDaysTarget * 6 / 7);  // 일요일 제외
        const wordsPerDay = Math.ceil(totalWords / readingDays);

        // 3. 순차적으로 일일 계획 생성
        const plans: DailyPlan[] = [];
        let dayNumber = 1;
        let currentDayWords = 0;
        let currentDayChapters: typeof allChapters = [];

        for (let i = 0; i < allChapters.length; i++) {
            const chapter = allChapters[i];

            // 버퍼 데이 (일요일) 체크
            if (dayNumber % 7 === 0 && currentDayChapters.length === 0) {
                plans.push(this.createBufferDay(dayNumber));
                dayNumber++;
            }

            // 현재 장 추가
            currentDayChapters.push(chapter);
            currentDayWords += chapter.wordCount;

            // 목표 단어 수 도달하면 하루 마감
            const isLastChapter = i === allChapters.length - 1;
            const shouldClose = currentDayWords >= wordsPerDay * this.overflowTolerance || isLastChapter;

            if (shouldClose && currentDayChapters.length > 0) {
                plans.push(this.createDailyPlan(dayNumber, currentDayChapters, currentDayWords));
                dayNumber++;
                currentDayChapters = [];
                currentDayWords = 0;
            }
        }

        return plans;
    }

    /**
     * 성경 데이터에서 모든 장 추출 (순서 유지!)
     */
    private extractAllChapters(
        bibleData: Record<string, Record<string, Record<string, string>>>,
        books: string[]
    ): Array<{ book: string; chapter: number; wordCount: number; verseCount: number; firstVerse: number; lastVerse: number }> {
        const chapters: Array<{ book: string; chapter: number; wordCount: number; verseCount: number; firstVerse: number; lastVerse: number }> = [];

        // BIBLE_BOOKS 순서대로 처리 (창세기 → 요한계시록)
        for (const book of books) {
            // JSON 키 매핑
            let key = book;
            if (book === '요한일서') key = '요한1서';
            if (book === '요한이서') key = '요한2서';
            if (book === '요한삼서') key = '요한3서';

            const bookData = bibleData[key];
            if (!bookData) {
                console.warn(`Book not found in Bible data: ${book} (key: ${key})`);
                continue;
            }

            // 장을 숫자 순서대로 정렬
            const chapterNums = Object.keys(bookData).map(Number).sort((a, b) => a - b);

            for (const chapterNum of chapterNums) {
                const chapterData = bookData[chapterNum.toString()];
                if (!chapterData) continue;

                const verseNums = Object.keys(chapterData).map(Number).sort((a, b) => a - b);
                let wordCount = 0;

                for (const verseNum of verseNums) {
                    const text = chapterData[verseNum.toString()] || '';
                    // Clean text (remove footnotes like [a], [1], etc.)
                    const cleanText = text.replace(/\[[a-zA-Z0-9]+\]/g, '').replace(/\s/g, '');
                    wordCount += cleanText.length;
                }

                // 난이도 보정
                const difficulty = BOOK_DIFFICULTY[book] || 1.0;
                wordCount = Math.round(wordCount * difficulty);

                chapters.push({
                    book,
                    chapter: chapterNum,
                    wordCount,
                    verseCount: verseNums.length,
                    firstVerse: verseNums[0] || 1,
                    lastVerse: verseNums[verseNums.length - 1] || 1,
                });
            }
        }

        return chapters;
    }

    /**
     * 일일 계획 생성
     */
    private createDailyPlan(
        dayNumber: number,
        chapters: Array<{ book: string; chapter: number; wordCount: number; verseCount: number; firstVerse: number; lastVerse: number }>,
        totalWords: number
    ): DailyPlan {
        if (chapters.length === 0) {
            return this.createBufferDay(dayNumber);
        }

        const first = chapters[0];
        const last = chapters[chapters.length - 1];

        // 읽기 범위 생성
        const ranges: ReadingRange[] = [];
        let currentRange: ReadingRange | null = null;

        for (const ch of chapters) {
            if (!currentRange || currentRange.book !== ch.book) {
                if (currentRange) ranges.push(currentRange);
                currentRange = {
                    book: ch.book,
                    startChapter: ch.chapter,
                    endChapter: ch.chapter,
                    startVerse: ch.firstVerse,
                    endVerse: ch.lastVerse,
                };
            } else {
                currentRange.endChapter = ch.chapter;
                currentRange.endVerse = ch.lastVerse;
            }
        }
        if (currentRange) ranges.push(currentRange);

        // 표시 텍스트 생성
        const displayText = this.createDisplayText(ranges);
        const shortText = this.createShortText(ranges);

        // 예상 읽기 시간
        const estimatedSeconds = Math.round((totalWords / this.readingSpeedCPM) * 60);

        return {
            dayNumber,
            ranges,
            displayText,
            shortText,
            book: first.book,
            startChapter: first.chapter,
            endChapter: last.chapter,
            startVerse: first.firstVerse,
            endVerse: last.lastVerse,
            estimatedTimeSeconds: estimatedSeconds,
            estimatedTimeMinutes: Math.round(estimatedSeconds / 60),
            wordCount: totalWords,
            isBufferDay: false,
            isCompleted: false,
            note: '',
        };
    }

    /**
     * 버퍼 데이 생성
     */
    private createBufferDay(dayNumber: number): DailyPlan {
        return {
            dayNumber,
            ranges: [],
            displayText: '휴식일',
            shortText: '☕',
            book: '',
            startChapter: 0,
            endChapter: 0,
            startVerse: 0,
            endVerse: 0,
            estimatedTimeSeconds: 0,
            estimatedTimeMinutes: 0,
            wordCount: 0,
            isBufferDay: true,
            isCompleted: false,
            note: '🛌 복습 및 휴식',
        };
    }

    /**
     * 표시 텍스트 생성 (예: "창세기 1:1 ~ 2:25")
     */
    private createDisplayText(ranges: ReadingRange[]): string {
        if (ranges.length === 0) return '';

        const parts: string[] = [];
        for (const r of ranges) {
            if (r.startChapter === r.endChapter) {
                parts.push(`${r.book} ${r.startChapter}:${r.startVerse}-${r.endVerse}`);
            } else {
                parts.push(`${r.book} ${r.startChapter}:${r.startVerse} ~ ${r.endChapter}:${r.endVerse}`);
            }
        }
        return parts.join(', ');
    }

    /**
     * 짧은 텍스트 생성 (예: "창 1-2")
     */
    private createShortText(ranges: ReadingRange[]): string {
        if (ranges.length === 0) return '';

        const parts: string[] = [];
        for (const r of ranges) {
            const abbrev = BOOK_ABBREV[r.book] || r.book.substring(0, 2);
            if (r.startChapter === r.endChapter) {
                parts.push(`${abbrev} ${r.startChapter}`);
            } else {
                parts.push(`${abbrev} ${r.startChapter}-${r.endChapter}`);
            }
        }
        return parts.join(', ');
    }

    /**
     * 오늘의 과제 가져오기
     */
    public static getTodayAssignment(plans: DailyPlan[], completedDays: number[]): DailyPlan | null {
        for (const plan of plans) {
            if (!completedDays.includes(plan.dayNumber) && !plan.isBufferDay) {
                return plan;
            }
        }
        return null;
    }

    /**
     * 연속 읽기 스트릭 계산
     */
    public static calculateStreak(completedDates: Date[]): number {
        if (completedDates.length === 0) return 0;

        const sorted = [...completedDates].sort((a, b) => b.getTime() - a.getTime());
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let streak = 0;
        let currentDate = new Date(today);

        for (const date of sorted) {
            const compareDate = new Date(date);
            compareDate.setHours(0, 0, 0, 0);

            const diffDays = Math.floor((currentDate.getTime() - compareDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 0 || diffDays === 1) {
                streak++;
                currentDate = compareDate;
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (diffDays > 1) {
                break;
            }
        }

        return streak;
    }
}

// ==========================================
// 3. 읽기 계획 관리 유틸리티
// ==========================================

export interface UserReadingProgress {
    planId: string;
    userId: string;
    completedDays: number[];
    completedDates: string[];
    currentDay: number;
    startDate: string;
    lastReadDate: string;
}

export const getReadingPlanKey = (userId: string) => `readingPlan_v2_${userId}`;
export const getProgressKey = (userId: string) => `readingProgress_v2_${userId}`;

export const saveReadingPlan = (userId: string, plans: DailyPlan[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(getReadingPlanKey(userId), JSON.stringify(plans));
};

export const loadReadingPlan = (userId: string): DailyPlan[] | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(getReadingPlanKey(userId));
    return data ? JSON.parse(data) : null;
};

export const saveProgress = (userId: string, progress: UserReadingProgress): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(getProgressKey(userId), JSON.stringify(progress));
};

export const loadProgress = (userId: string): UserReadingProgress | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(getProgressKey(userId));
    return data ? JSON.parse(data) : null;
};

export const markDayComplete = (userId: string, dayNumber: number): void => {
    const progress = loadProgress(userId);
    if (!progress) return;

    if (!progress.completedDays.includes(dayNumber)) {
        progress.completedDays.push(dayNumber);
        progress.completedDates.push(new Date().toISOString());
        progress.lastReadDate = new Date().toISOString();
        progress.currentDay = dayNumber + 1;
        saveProgress(userId, progress);
    }
};

export const calculateStats = (plans: DailyPlan[], progress: UserReadingProgress): ReadingPlanStats => {
    const completedDays = progress.completedDays.length;
    const totalDays = plans.filter(p => !p.isBufferDay).length;

    const completedReadings = plans.filter(p =>
        progress.completedDays.includes(p.dayNumber) && !p.isBufferDay
    );

    let totalWords = 0;
    let totalChapters = 0;
    const booksRead = new Set<string>();

    for (const reading of completedReadings) {
        totalWords += reading.wordCount;
        totalChapters += (reading.endChapter - reading.startChapter + 1);
        if (reading.book) booksRead.add(reading.book);
    }

    const completedDates = progress.completedDates.map(d => new Date(d));
    const streak = SmartBiblePlanner.calculateStreak(completedDates);

    return {
        currentDay: progress.currentDay,
        totalDays,
        progressPercent: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
        currentStreak: streak,
        longestStreak: streak,
        totalWordsRead: totalWords,
        totalChaptersRead: totalChapters,
        booksCompleted: booksRead.size,
    };
};

export default SmartBiblePlanner;
