'use client';

import { supabase } from './supabase';

/**
 * SOTA Reading Progress Tracking Utilities
 * Handles saving reading activities, getting continue reading position, etc.
 */

interface LastReadPosition {
    book: string;
    chapter: number;
    created_at: string;
}

/**
 * Save reading progress to database
 * - reading_activities: individual chapter completions
 * - daily_readings: aggregate daily stats
 * - cell_activities: community feed
 */
export async function saveReadingProgress(
    userId: string,
    userName: string,
    book: string,
    chapter: number,
    source: 'TEXT' | 'AUDIO' = 'TEXT',
    cellId?: string
): Promise<boolean> {
    try {
        // 1. Insert into reading_activities
        const { error: activityError } = await supabase
            .from('reading_activities')
            .insert({
                user_id: userId,
                user_name: userName,
                book,
                chapter,
                translation: 'KRV',
                cell_id: cellId || null,
            });

        if (activityError) {
            console.error('Error saving reading activity:', activityError);
            return false;
        }

        // 2. Upsert daily_readings (aggregate)
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('daily_readings').upsert({
            user_id: userId,
            reading_date: today,
            chapters_read: 1,
        }, {
            onConflict: 'user_id,reading_date',
            ignoreDuplicates: false,
        });

        // 3. Add to cell_activities for community feed (if user has a cell)
        if (cellId) {
            const sourceText = source === 'AUDIO' ? '(음성) 듣기 완료' : '읽었습니다';
            await supabase.from('cell_activities').insert({
                cell_id: cellId,
                user_id: userId,
                type: 'READING',
                title: `${book} ${chapter}장을 ${sourceText}`,
            });
        }

        // 4. Save last read position to localStorage for instant access
        // 4. Save last read position to localStorage for instant access (User Specific)
        if (typeof window !== 'undefined') {
            localStorage.setItem(`lastReadBook_${userId}`, book);
            localStorage.setItem(`lastReadChapter_${userId}`, String(chapter));
            localStorage.setItem(`lastReadTime_${userId}`, new Date().toISOString());
        }

        console.log(`✅ Reading progress saved: ${book} ${chapter}장 (${source})`);
        return true;

    } catch (error) {
        console.error('Error in saveReadingProgress:', error);
        return false;
    }
}

/**
 * Get the last read position from database
 * Returns the most recent reading activity
 */
export async function getLastReadPosition(userId: string): Promise<LastReadPosition | null> {
    try {
        const { data, error } = await supabase
            .from('reading_activities')
            .select('book, chapter, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !data) {
            return null;
        }

        return data as LastReadPosition;

    } catch (error) {
        console.error('Error getting last read position:', error);
        return null;
    }
}

/**
 * Get continue reading suggestion - the NEXT chapter to read
 * If user last read 창세기 3장, suggests 창세기 4장
 */
export async function getContinueReading(userId: string, getChapterCount: (book: string) => number): Promise<{ book: string; chapter: number } | null> {
    // First check localStorage for instant response (User Specific)
    if (typeof window !== 'undefined') {
        const localBook = localStorage.getItem(`lastReadBook_${userId}`);
        const localChapter = localStorage.getItem(`lastReadChapter_${userId}`);
        if (localBook && localChapter) {
            const ch = parseInt(localChapter);
            const maxChapters = getChapterCount(localBook);
            if (ch < maxChapters) {
                return { book: localBook, chapter: ch + 1 };
            } else {
                // Last chapter - would need to go to next book (complex, skip for now)
                return { book: localBook, chapter: 1 };
            }
        }
    }

    // Fallback to database
    const lastRead = await getLastReadPosition(userId);
    if (!lastRead) {
        return null; // No reading history, use default
    }

    const maxChapters = getChapterCount(lastRead.book);
    if (lastRead.chapter < maxChapters) {
        return { book: lastRead.book, chapter: lastRead.chapter + 1 };
    }

    // At the last chapter of the book - return chapter 1 of same book for now
    return { book: lastRead.book, chapter: 1 };
}

/**
 * Get user's cell_id for activity logging
 */
export async function getUserCellId(userId: string): Promise<string | null> {
    try {
        const { data } = await supabase
            .from('cell_members')
            .select('cell_id')
            .eq('user_id', userId)
            .maybeSingle();

        return data?.cell_id || null;
    } catch {
        return null;
    }
}
