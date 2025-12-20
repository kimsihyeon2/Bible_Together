'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// In-memory cache to prevent re-fetching on tab switching
let bibleCache: any = null;

interface BibleContextType {
    isLoaded: boolean;
    getVerses: (book: string, chapter: number) => [string, string][];
    getChapterCount: (book: string) => number;
}

const BibleContext = createContext<BibleContextType | null>(null);

export const BibleProvider = ({ children }: { children: ReactNode }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadBible = async () => {
            if (bibleCache) {
                setIsLoaded(true);
                return;
            }

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
                    const res = await fetchWithTimeout('/bible/ko_krv.json', 15000); // 15s timeout
                    if (!res.ok) throw new Error('Failed to fetch Bible data');
                    const data = await res.json();
                    bibleCache = data;
                    setIsLoaded(true);
                    return;
                } catch (error) {
                    console.error(`Bible load attempt ${attempt + 1} failed:`, error);
                    if (attempt === 1) {
                        // Final failure - still mark as loaded to prevent blocking
                        console.error('Bible load failed after retries, continuing with empty state');
                        setIsLoaded(true);
                    }
                }
            }
        };

        loadBible();
    }, []);

    const getVerses = (book: string, chapter: number): [string, string][] => {
        if (!bibleCache) return [];

        // Map standard names to JSON keys if needed
        let key = book;
        if (book === '요한일서') key = '요한1서';
        if (book === '요한이서') key = '요한2서';
        if (book === '요한삼서') key = '요한3서';

        if (!bibleCache[key]) return [];
        const chData = bibleCache[key][chapter.toString()];
        if (!chData) return [];
        // Sort by verse number
        return Object.entries(chData as Record<string, string>).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    };

    const getChapterCount = (book: string): number => {
        if (!bibleCache) return 0;

        let key = book;
        if (book === '요한일서') key = '요한1서';
        if (book === '요한이서') key = '요한2서';
        if (book === '요한삼서') key = '요한3서';

        if (!bibleCache[key]) return 0;
        return Object.keys(bibleCache[key]).length;
    };

    return (
        <BibleContext.Provider value={{ isLoaded, getVerses, getChapterCount }}>
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
