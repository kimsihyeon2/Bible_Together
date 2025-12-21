'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// 📖 Translation types
export type BibleTranslation = 'KRV' | 'KLB' | 'EASY';

export const TRANSLATIONS: Record<BibleTranslation, { name: string; file: string; description: string }> = {
    KRV: { name: '개역개정', file: '/bible/ko_krv.json', description: '개역개정 (한글성경)' },
    KLB: { name: '현대인의 성경', file: '/bible/ko_klb.json', description: '현대인의 성경 (KLB)' },
    EASY: { name: '쉬운성경', file: '/bible/ko_easy.json', description: '쉬운성경 (Easy Bible)' }
};

// In-memory caches per translation
const bibleCaches: Record<string, any> = {};

interface BibleContextType {
    isLoaded: boolean;
    currentTranslation: BibleTranslation;
    setTranslation: (translation: BibleTranslation) => void;
    getVerses: (book: string, chapter: number) => [string, string][];
    getChapterCount: (book: string) => number;
    availableTranslations: typeof TRANSLATIONS;
}

const BibleContext = createContext<BibleContextType | null>(null);

export const BibleProvider = ({ children }: { children: ReactNode }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentTranslation, setCurrentTranslation] = useState<BibleTranslation>('KRV');

    // Load saved translation preference
    useEffect(() => {
        const saved = localStorage.getItem('bibleTranslation') as BibleTranslation;
        if (saved && TRANSLATIONS[saved]) {
            setCurrentTranslation(saved);
        }
    }, []);

    // Load Bible data
    useEffect(() => {
        const loadBible = async () => {
            const translationConfig = TRANSLATIONS[currentTranslation];

            // Check cache first
            if (bibleCaches[currentTranslation]) {
                setIsLoaded(true);
                return;
            }

            setIsLoaded(false);

            const fetchWithTimeout = async (url: string, timeout: number) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                try {
                    const res = await fetch(url, {
                        cache: 'force-cache',
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                    return res;
                } catch (e) {
                    clearTimeout(timeoutId);
                    throw e;
                }
            };

            // Retry up to 2 times
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    const res = await fetchWithTimeout(translationConfig.file, 15000);
                    if (!res.ok) throw new Error('Failed to fetch Bible data');
                    const data = await res.json();
                    bibleCaches[currentTranslation] = data;
                    setIsLoaded(true);
                    return;
                } catch (error) {
                    console.error(`Bible load attempt ${attempt + 1} failed:`, error);
                    if (attempt === 1) {
                        // Final failure - fallback to KRV if available
                        if (currentTranslation !== 'KRV' && bibleCaches['KRV']) {
                            console.log('Falling back to KRV');
                            setCurrentTranslation('KRV');
                        }
                        setIsLoaded(true);
                    }
                }
            }
        };

        loadBible();
    }, [currentTranslation]);

    const setTranslation = useCallback((translation: BibleTranslation) => {
        setCurrentTranslation(translation);
        localStorage.setItem('bibleTranslation', translation);
    }, []);

    const getVerses = useCallback((book: string, chapter: number): [string, string][] => {
        const cache = bibleCaches[currentTranslation];
        if (!cache) return [];

        // Map standard names to JSON keys if needed
        let key = book;
        if (book === '요한일서') key = '요한1서';
        if (book === '요한이서') key = '요한2서';
        if (book === '요한삼서') key = '요한3서';

        if (!cache[key]) return [];
        const chData = cache[key][chapter.toString()];
        if (!chData) return [];
        // Sort by verse number
        return Object.entries(chData as Record<string, string>).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    }, [currentTranslation]);

    const getChapterCount = useCallback((book: string): number => {
        const cache = bibleCaches[currentTranslation];
        if (!cache) return 0;

        let key = book;
        if (book === '요한일서') key = '요한1서';
        if (book === '요한이서') key = '요한2서';
        if (book === '요한삼서') key = '요한3서';

        if (!cache[key]) return 0;
        return Object.keys(cache[key]).length;
    }, [currentTranslation]);

    return (
        <BibleContext.Provider value={{
            isLoaded,
            currentTranslation,
            setTranslation,
            getVerses,
            getChapterCount,
            availableTranslations: TRANSLATIONS
        }}>
            {children}
        </BibleContext.Provider>
    );
};

export const useBible = () => {
    const context = useContext(BibleContext);
    if (!context) {
        throw new Error('useBible must be used within a BibleProvider');
    }
    return context;
};
