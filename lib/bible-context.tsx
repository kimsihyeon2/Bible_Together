'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

import { TRANSLATIONS, BibleTranslation } from './constants';
export type { BibleTranslation };
export { TRANSLATIONS };


// In-memory caches per translation
const bibleCaches: Record<string, any> = {};

interface BibleContextType {
    isLoaded: boolean;
    currentTranslation: BibleTranslation;
    setTranslation: (translation: BibleTranslation) => void;
    getVerses: (book: string, chapter: number) => [string, string][];
    getChapterCount: (book: string) => number;
    searchBible: (query: string) => Array<{ book: string, chapter: number, verse: string, text: string }>;
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
        // Sort by verse number and Clean text
        return Object.entries(chData as Record<string, string>)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .map(([verse, text]) => [verse, text.replace(/\[[a-zA-Z0-9]+\]/g, '')]);
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

    // SOTA Bible Search - Full-text search across current translation
    const searchBible = useCallback((query: string): Array<{ book: string, chapter: number, verse: string, text: string }> => {
        const cache = bibleCaches[currentTranslation];
        if (!cache || !query || query.length < 2) return [];

        const results: Array<{ book: string, chapter: number, verse: string, text: string }> = [];
        const lowerQuery = query.toLowerCase();
        const MAX_RESULTS = 100;

        // Search through all books
        for (const [book, chapters] of Object.entries(cache)) {
            if (results.length >= MAX_RESULTS) break;

            for (const [chapterNum, verses] of Object.entries(chapters as Record<string, Record<string, string>>)) {
                if (results.length >= MAX_RESULTS) break;

                for (const [verseNum, text] of Object.entries(verses)) {
                    if (results.length >= MAX_RESULTS) break;

                    if (text.toLowerCase().includes(lowerQuery)) {
                        results.push({
                            book,
                            chapter: parseInt(chapterNum),
                            verse: verseNum,
                            text: text.replace(/\[[a-zA-Z0-9]+\]/g, '')
                        });
                    }
                }
            }
        }

        return results;
    }, [currentTranslation]);

    return (
        <BibleContext.Provider value={{
            isLoaded,
            currentTranslation,
            setTranslation,
            getVerses,
            getChapterCount,
            searchBible,
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
