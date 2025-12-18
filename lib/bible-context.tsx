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

            try {
                // 1. Try to fetch from network (browser cache will handle subsequent loads)
                const res = await fetch('/bible/ko_krv.json', { cache: 'force-cache' });
                if (!res.ok) throw new Error('Failed to fetch Bible data');
                const data = await res.json();

                // 2. Set to memory cache
                bibleCache = data;
                setIsLoaded(true);
            } catch (error) {
                console.error('Bible load error:', error);
                // Retry logic could be added here
            }
        };

        loadBible();
    }, []);

    const getVerses = (book: string, chapter: number): [string, string][] => {
        if (!bibleCache || !bibleCache[book]) return [];
        const chData = bibleCache[book][chapter.toString()];
        if (!chData) return [];
        // Sort by verse number
        return Object.entries(chData as Record<string, string>).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    };

    const getChapterCount = (book: string): number => {
        if (!bibleCache || !bibleCache[book]) return 0;
        return Object.keys(bibleCache[book]).length;
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
