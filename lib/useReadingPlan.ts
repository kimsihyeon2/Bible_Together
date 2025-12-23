'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import { useBible } from './bible-context';
import { BIBLE_BOOKS } from './constants';
import {
    SmartBiblePlanner,
    DailyPlan,
    ReadingPlanStats,
    UserReadingProgress,
    PlannerMode,
    saveReadingPlan,
    loadReadingPlan,
    saveProgress,
    loadProgress,
    markDayComplete,
    calculateStats,
} from './smart-bible-planner';
import { supabase } from './supabase';

interface UseReadingPlanReturn {
    // State
    isLoading: boolean;
    isGenerating: boolean;
    plans: DailyPlan[];
    progress: UserReadingProgress | null;
    stats: ReadingPlanStats | null;
    todayAssignment: DailyPlan | null;

    // Actions
    generatePlan: (mode: PlannerMode, targetMinutes?: number) => Promise<void>;
    completeTodayReading: () => void;
    getMonthPlans: (year: number, month: number) => Map<number, DailyPlan>;
    resetPlan: () => void;
    syncWithServer: () => Promise<void>;
}

/**
 * React Hook for managing Bible reading plans
 */
export const useReadingPlan = (): UseReadingPlanReturn => {
    const { user } = useAuth();
    const { isLoaded: bibleLoaded } = useBible();

    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [plans, setPlans] = useState<DailyPlan[]>([]);
    const [progress, setProgress] = useState<UserReadingProgress | null>(null);
    const [stats, setStats] = useState<ReadingPlanStats | null>(null);
    const [todayAssignment, setTodayAssignment] = useState<DailyPlan | null>(null);

    // Load existing plan and progress
    useEffect(() => {
        if (!user?.id) {
            setIsLoading(false);
            return;
        }

        const loadedPlans = loadReadingPlan(user.id);
        const loadedProgress = loadProgress(user.id);

        if (loadedPlans && loadedProgress) {
            setPlans(loadedPlans);
            setProgress(loadedProgress);

            // Calculate today's assignment
            const today = SmartBiblePlanner.getTodayAssignment(
                loadedPlans,
                loadedProgress.completedDays
            );
            setTodayAssignment(today);

            // Calculate stats
            const calculatedStats = calculateStats(loadedPlans, loadedProgress);
            setStats(calculatedStats);

            // Trigger background sync
            syncWithServerProgress(user.id, loadedPlans, loadedProgress).then(syncedProgress => {
                if (syncedProgress) {
                    setProgress(syncedProgress);
                    const newStats = calculateStats(loadedPlans, syncedProgress);
                    setStats(newStats);

                    // Update today assignment based on synced progress
                    const newToday = SmartBiblePlanner.getTodayAssignment(loadedPlans, syncedProgress.completedDays);
                    setTodayAssignment(newToday);
                }
            });
        }

        setIsLoading(false);
    }, [user?.id]);

    /**
     * Generate a new reading plan
     */
    const generatePlan = useCallback(async (
        mode: PlannerMode = 'NKRV',
        targetMinutes: number = 10
    ) => {
        if (!user?.id || !bibleLoaded) return;

        setIsGenerating(true);

        try {
            // Fetch Bible data for all books
            const bibleData: Record<string, Record<string, Record<string, string>>> = {};

            // We need to fetch the entire Bible JSON
            const translationFile = mode === 'EASY' ? '/bible/ko_easy.json' : '/bible/ko_krv.json';
            const response = await fetch(translationFile);
            const fullBibleData = await response.json();

            // Use the fetched data
            Object.assign(bibleData, fullBibleData);

            // Create planner and generate
            const planner = new SmartBiblePlanner(mode, targetMinutes);
            const generatedPlans = planner.generatePlan(bibleData, BIBLE_BOOKS);

            // Initialize progress
            const newProgress: UserReadingProgress = {
                planId: `plan_${Date.now()}`,
                userId: user.id,
                completedDays: [],
                completedDates: [],
                currentDay: 1,
                startDate: new Date().toISOString(),
                lastReadDate: '',
            };

            // Save to localStorage
            saveReadingPlan(user.id, generatedPlans);
            saveProgress(user.id, newProgress);

            // Update state
            setPlans(generatedPlans);
            setProgress(newProgress);

            // Calculate today's assignment
            const today = SmartBiblePlanner.getTodayAssignment(generatedPlans, []);
            setTodayAssignment(today);

            // Calculate stats
            const calculatedStats = calculateStats(generatedPlans, newProgress);
            setStats(calculatedStats);

        } catch (error) {
            console.error('Failed to generate reading plan:', error);
        } finally {
            setIsGenerating(false);
        }
    }, [user?.id, bibleLoaded]);

    /**
     * Mark today's reading as complete
     */
    const completeTodayReading = useCallback(() => {
        if (!user?.id || !todayAssignment) return;

        markDayComplete(user.id, todayAssignment.dayNumber);

        // Reload progress
        const updatedProgress = loadProgress(user.id);
        if (updatedProgress) {
            setProgress(updatedProgress);

            // Update today's assignment
            const nextAssignment = SmartBiblePlanner.getTodayAssignment(
                plans,
                updatedProgress.completedDays
            );
            setTodayAssignment(nextAssignment);

            // Recalculate stats
            const updatedStats = calculateStats(plans, updatedProgress);
            setStats(updatedStats);
        }
    }, [user?.id, todayAssignment, plans]);

    /**
     * Get plans for a specific month (for calendar view)
     */
    const getMonthPlans = useCallback((year: number, month: number): Map<number, DailyPlan> => {
        const monthPlans = new Map<number, DailyPlan>();

        if (!progress) return monthPlans;

        // Calculate which day number corresponds to which calendar date
        const startDate = new Date(progress.startDate);
        const firstOfMonth = new Date(year, month, 1);
        const lastOfMonth = new Date(year, month + 1, 0);

        for (let date = new Date(firstOfMonth); date <= lastOfMonth; date.setDate(date.getDate() + 1)) {
            const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const dayNumber = daysDiff + 1;

            if (dayNumber > 0 && dayNumber <= plans.length) {
                const plan = plans[dayNumber - 1];
                if (plan) {
                    // Mark as completed if in completedDays
                    const planWithStatus = {
                        ...plan,
                        isCompleted: progress.completedDays.includes(plan.dayNumber),
                    };
                    monthPlans.set(date.getDate(), planWithStatus);
                }
            }
        }

        return monthPlans;
    }, [plans, progress]);

    /**
     * Reset the reading plan
     */
    const resetPlan = useCallback(() => {
        if (!user?.id) return;

        localStorage.removeItem(`readingPlan_v2_${user.id}`);
        localStorage.removeItem(`readingProgress_v2_${user.id}`);

        setPlans([]);
        setProgress(null);
        setStats(null);
        setTodayAssignment(null);
    }, [user?.id]);

    /**
     * SOTA Sync: Check server reading_activities and update progress
     */
    const syncWithServerProgress = async (
        userId: string,
        currentPlans: DailyPlan[],
        currentProgress: UserReadingProgress
    ): Promise<UserReadingProgress | null> => {
        try {
            // Get all reading activities for this user
            const { data: activities } = await supabase
                .from('reading_activities')
                .select('book, chapter')
                .eq('user_id', userId);

            if (!activities || activities.length === 0) return null;

            // Create a set of "Book Chapter" strings for fast lookup
            const readSet = new Set(activities.map((a: { book: string; chapter: number }) => `${a.book} ${a.chapter}`));

            let hasChanges = false;
            const newCompletedDays = [...currentProgress.completedDays];
            const newCompletedDates = [...currentProgress.completedDates];

            // Check each uncompleted plan
            currentPlans.forEach(plan => {
                if (plan.isBufferDay) return;
                if (newCompletedDays.includes(plan.dayNumber)) return;

                // Check if all chapters in this plan are read
                const range = plan.endChapter - plan.startChapter + 1;
                let allRead = true;

                // We handle single book plans mainly. Cross-book plans needs more complex logic, 
                // but v2 algorithm is mostly single book or sequential.
                // For simplicity, we check the main range.
                if (plan.book) {
                    for (let ch = plan.startChapter; ch <= plan.endChapter; ch++) {
                        if (!readSet.has(`${plan.book} ${ch}`)) {
                            allRead = false;
                            break;
                        }
                    }
                }

                if (allRead) {
                    newCompletedDays.push(plan.dayNumber);
                    // Use a proxy date (today) or we'd need to fetch actual dates
                    newCompletedDates.push(new Date().toISOString());
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                const updatedProgress: UserReadingProgress = {
                    ...currentProgress,
                    completedDays: newCompletedDays,
                    completedDates: newCompletedDates,
                    lastReadDate: new Date().toISOString(),
                    currentDay: Math.max(...newCompletedDays, 0) + 1
                };
                saveProgress(userId, updatedProgress);
                return updatedProgress;
            }

            return null;
        } catch (e) {
            console.error('Sync error:', e);
            return null;
        }
    };

    const syncWithServer = useCallback(async () => {
        if (user?.id && plans.length > 0 && progress) {
            const result = await syncWithServerProgress(user.id, plans, progress);
            if (result) {
                setProgress(result);
                setStats(calculateStats(plans, result));
                setTodayAssignment(SmartBiblePlanner.getTodayAssignment(plans, result.completedDays));
            }
        }
    }, [user?.id, plans, progress]);

    return {
        isLoading,
        isGenerating,
        plans,
        progress,
        stats,
        todayAssignment,
        generatePlan,
        completeTodayReading,
        getMonthPlans,
        resetPlan,
        syncWithServer,
    };
};

export default useReadingPlan;
