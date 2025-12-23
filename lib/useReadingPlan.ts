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
    };
};

export default useReadingPlan;
