/**
 * Smart Bible Planner - Dynamic Weighted Partitioning Algorithm
 * 
 * 핵심 알고리즘:
 * 1. 가중치 계산 (Weighted Cost) - 난이도, 텍스트 길이 기반
 * 2. 자동 병합/분할 (Auto Merge/Split) - 목표 시간에 맞춤
 * 3. 버퍼 데이 생성 (Buffer Days) - 7일마다 휴식일
 */

import { BibleTranslation } from './constants';

// ==========================================
// 1. 데이터 타입 정의
// ==========================================

export interface BibleVerse {
    book: string;
    chapter: number;
    verse: number;
    textLength: number;        // 공백 제외 글자 수
    difficultyScore: number;   // 1.0: 보통, 1.5: 어려움 (레위기 등)
    isNarrative: boolean;      // 서사 구조 여부 (끊지 않는게 좋음)
}

export interface DailyPlan {
    dayNumber: number;
    readings: BibleVerse[];
    book: string;
    startChapter: number;
    endChapter: number;
    startVerse?: number;
    endVerse?: number;
    estimatedTimeSeconds: number;
    estimatedTimeMinutes: number;
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
}

export type PlannerMode = 'NKRV' | 'EASY';

// 책별 난이도 점수 (1.0 = 보통, 1.5 = 어려움)
const BOOK_DIFFICULTY: Record<string, number> = {
    // 어려운 책들 (율법서, 예언서)
    '레위기': 1.5,
    '민수기': 1.4,
    '신명기': 1.3,
    '에스겔': 1.5,
    '다니엘': 1.4,
    '스가랴': 1.4,
    '요한계시록': 1.5,
    '욥기': 1.4,
    '전도서': 1.3,
    '이사야': 1.3,
    '예레미야': 1.3,
    '히브리서': 1.3,
    '로마서': 1.3,
    // 보통 난이도
    '창세기': 1.0,
    '출애굽기': 1.1,
    '여호수아': 1.0,
    '사사기': 1.0,
    '룻기': 1.0,
    '사무엘상': 1.0,
    '사무엘하': 1.0,
    '열왕기상': 1.0,
    '열왕기하': 1.0,
    '역대상': 1.1,
    '역대하': 1.1,
    '에스라': 1.1,
    '느헤미야': 1.1,
    '에스더': 1.0,
    '시편': 1.1,
    '잠언': 1.2,
    '아가': 1.2,
    '예레미야애가': 1.2,
    '호세아': 1.2,
    '요엘': 1.1,
    '아모스': 1.1,
    '오바댜': 1.0,
    '요나': 1.0,
    '미가': 1.1,
    '나훔': 1.1,
    '하박국': 1.1,
    '스바냐': 1.1,
    '학개': 1.0,
    '말라기': 1.0,
    // 신약 (복음서는 읽기 쉬움)
    '마태복음': 1.0,
    '마가복음': 1.0,
    '누가복음': 1.0,
    '요한복음': 1.0,
    '사도행전': 1.0,
    '고린도전서': 1.2,
    '고린도후서': 1.2,
    '갈라디아서': 1.2,
    '에베소서': 1.2,
    '빌립보서': 1.1,
    '골로새서': 1.2,
    '데살로니가전서': 1.1,
    '데살로니가후서': 1.1,
    '디모데전서': 1.1,
    '디모데후서': 1.1,
    '디도서': 1.1,
    '빌레몬서': 1.0,
    '야고보서': 1.1,
    '베드로전서': 1.2,
    '베드로후서': 1.2,
    '요한일서': 1.0,
    '요한이서': 1.0,
    '요한삼서': 1.0,
    '유다서': 1.2,
};

// 책별 서사 구조 여부 (끊지 않는 게 좋은 책들)
const NARRATIVE_BOOKS = new Set([
    '창세기', '출애굽기', '여호수아', '사사기', '룻기',
    '사무엘상', '사무엘하', '열왕기상', '열왕기하',
    '역대상', '역대하', '에스라', '느헤미야', '에스더',
    '요나', '다니엘',
    '마태복음', '마가복음', '누가복음', '요한복음', '사도행전',
]);

// ==========================================
// 2. 핵심 알고리즘 클래스
// ==========================================

export class SmartBiblePlanner {
    private mode: PlannerMode;
    private readingSpeedCPM: number;    // 분당 읽는 글자 수
    private targetSeconds: number;       // 하루 목표 시간 (초)
    private hardWordPenalty: number;     // 어려운 단어 패널티
    private overflowTolerance: number;   // 초과 허용치
    private bufferDayInterval: number;   // 버퍼 데이 간격

    constructor(mode: PlannerMode = 'NKRV', targetMinutes: number = 10) {
        this.mode = mode;
        this.readingSpeedCPM = 450;  // 성인 평균 읽기 속도
        this.targetSeconds = targetMinutes * 60;
        this.bufferDayInterval = 7;

        if (mode === 'NKRV') {
            // 개역개정: 인지 부하 고려, 엄격한 시간 제한
            this.hardWordPenalty = 1.3;
            this.overflowTolerance = 1.1;
        } else {
            // 쉬운성경: 흐름 중심, 유연한 시간 허용
            this.hardWordPenalty = 1.0;
            this.overflowTolerance = 1.3;
        }
    }

    /**
     * 한 절을 읽는 데 걸리는 '인지적 시간(초)' 계산
     */
    private calculateVerseCost(verse: BibleVerse): number {
        const baseTime = verse.textLength / (this.readingSpeedCPM / 60);

        // 개역개정이고 난이도가 높으면 가중치 적용
        if (this.mode === 'NKRV' && verse.difficultyScore > 1.0) {
            return baseTime * this.hardWordPenalty;
        }

        return baseTime;
    }

    /**
     * 성경 데이터를 기반으로 일일 읽기 계획 생성
     */
    public generatePlan(
        bibleData: Record<string, Record<string, Record<string, string>>>,
        books: string[]
    ): DailyPlan[] {
        const plans: DailyPlan[] = [];
        const allVerses = this.extractAllVerses(bibleData, books);

        let currentDayReadings: BibleVerse[] = [];
        let currentTimeAcc = 0;
        let dayCount = 1;

        for (let i = 0; i < allVerses.length; i++) {
            const verse = allVerses[i];

            // 1. 현재 절의 비용 계산
            const verseCost = this.calculateVerseCost(verse);

            // 2. 버퍼 데이 로직: 7일마다 쉼
            if (dayCount % this.bufferDayInterval === 0 && currentDayReadings.length === 0) {
                plans.push({
                    dayNumber: dayCount,
                    readings: [],
                    book: '',
                    startChapter: 0,
                    endChapter: 0,
                    estimatedTimeSeconds: 0,
                    estimatedTimeMinutes: 0,
                    isBufferDay: true,
                    isCompleted: false,
                    note: '🛌 버퍼 데이 (복습 및 휴식)',
                });
                dayCount++;
            }

            // 3. 누적 시간 확인 및 끊기 결정
            if (currentTimeAcc + verseCost > this.targetSeconds * this.overflowTolerance) {
                // 현재까지 묶음을 저장
                if (currentDayReadings.length > 0) {
                    plans.push(this.createDailyPlan(dayCount, currentDayReadings, currentTimeAcc));
                    dayCount++;
                }

                // 초기화
                currentDayReadings = [];
                currentTimeAcc = 0;
            }

            // 4. 현재 버킷에 담기
            currentDayReadings.push(verse);
            currentTimeAcc += verseCost;
        }

        // 마지막 남은 자투리 처리
        if (currentDayReadings.length > 0) {
            plans.push(this.createDailyPlan(dayCount, currentDayReadings, currentTimeAcc));
        }

        return plans;
    }

    /**
     * 성경 JSON 데이터에서 모든 절 추출
     */
    private extractAllVerses(
        bibleData: Record<string, Record<string, Record<string, string>>>,
        books: string[]
    ): BibleVerse[] {
        const verses: BibleVerse[] = [];

        for (const book of books) {
            // JSON 키 매핑
            let key = book;
            if (book === '요한일서') key = '요한1서';
            if (book === '요한이서') key = '요한2서';
            if (book === '요한삼서') key = '요한3서';

            const bookData = bibleData[key];
            if (!bookData) continue;

            const chapters = Object.keys(bookData).map(Number).sort((a, b) => a - b);

            for (const chapter of chapters) {
                const chapterData = bookData[chapter.toString()];
                if (!chapterData) continue;

                const verseNumbers = Object.keys(chapterData).map(Number).sort((a, b) => a - b);

                for (const verseNum of verseNumbers) {
                    const text = chapterData[verseNum.toString()] || '';
                    const cleanText = text.replace(/\s/g, '');

                    verses.push({
                        book,
                        chapter,
                        verse: verseNum,
                        textLength: cleanText.length,
                        difficultyScore: BOOK_DIFFICULTY[book] || 1.0,
                        isNarrative: NARRATIVE_BOOKS.has(book),
                    });
                }
            }
        }

        return verses;
    }

    /**
     * DailyPlan 객체 생성 헬퍼
     */
    private createDailyPlan(
        dayNumber: number,
        readings: BibleVerse[],
        totalSeconds: number
    ): DailyPlan {
        const firstVerse = readings[0];
        const lastVerse = readings[readings.length - 1];

        return {
            dayNumber,
            readings,
            book: firstVerse.book,
            startChapter: firstVerse.chapter,
            endChapter: lastVerse.chapter,
            startVerse: firstVerse.verse,
            endVerse: lastVerse.verse,
            estimatedTimeSeconds: Math.round(totalSeconds),
            estimatedTimeMinutes: Math.round(totalSeconds / 60),
            isBufferDay: false,
            isCompleted: false,
            note: '',
        };
    }

    /**
     * 오늘의 과제 가져오기
     */
    public static getTodayAssignment(
        plans: DailyPlan[],
        completedDays: number[]
    ): DailyPlan | null {
        // 완료되지 않은 첫 번째 날 찾기
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

        // 날짜 정렬 (최신순)
        const sorted = [...completedDates].sort((a, b) => b.getTime() - a.getTime());

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let streak = 0;
        let currentDate = new Date(today);

        for (const date of sorted) {
            const compareDate = new Date(date);
            compareDate.setHours(0, 0, 0, 0);

            // 오늘 또는 어제인지 확인
            const diffDays = Math.floor((currentDate.getTime() - compareDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 0 || diffDays === 1) {
                streak++;
                currentDate = compareDate;
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (diffDays > 1) {
                break; // 연속 끊김
            }
        }

        return streak;
    }
}

// ==========================================
// 3. 읽기 계획 관리 훅용 유틸리티
// ==========================================

export interface UserReadingProgress {
    planId: string;
    userId: string;
    completedDays: number[];
    completedDates: string[];  // ISO date strings
    currentDay: number;
    startDate: string;
    lastReadDate: string;
}

/**
 * localStorage 키 생성
 */
export const getReadingPlanKey = (userId: string) => `readingPlan_${userId}`;
export const getProgressKey = (userId: string) => `readingProgress_${userId}`;

/**
 * 읽기 계획 저장
 */
export const saveReadingPlan = (userId: string, plans: DailyPlan[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(getReadingPlanKey(userId), JSON.stringify(plans));
};

/**
 * 읽기 계획 불러오기
 */
export const loadReadingPlan = (userId: string): DailyPlan[] | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(getReadingPlanKey(userId));
    return data ? JSON.parse(data) : null;
};

/**
 * 진행 상황 저장
 */
export const saveProgress = (userId: string, progress: UserReadingProgress): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(getProgressKey(userId), JSON.stringify(progress));
};

/**
 * 진행 상황 불러오기
 */
export const loadProgress = (userId: string): UserReadingProgress | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(getProgressKey(userId));
    return data ? JSON.parse(data) : null;
};

/**
 * 오늘 읽기 완료 마킹
 */
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

/**
 * 읽기 통계 계산
 */
export const calculateStats = (
    plans: DailyPlan[],
    progress: UserReadingProgress
): ReadingPlanStats => {
    const completedDays = progress.completedDays.length;
    const totalDays = plans.filter(p => !p.isBufferDay).length;

    const completedReadings = plans.filter(p =>
        progress.completedDays.includes(p.dayNumber) && !p.isBufferDay
    );

    let totalWords = 0;
    let totalChapters = 0;

    for (const reading of completedReadings) {
        for (const verse of reading.readings) {
            totalWords += verse.textLength;
        }
        totalChapters += (reading.endChapter - reading.startChapter + 1);
    }

    const completedDates = progress.completedDates.map(d => new Date(d));
    const streak = SmartBiblePlanner.calculateStreak(completedDates);

    return {
        currentDay: progress.currentDay,
        totalDays,
        progressPercent: Math.round((completedDays / totalDays) * 100),
        currentStreak: streak,
        longestStreak: streak, // TODO: Track longest separately
        totalWordsRead: totalWords,
        totalChaptersRead: totalChapters,
    };
};

export default SmartBiblePlanner;
