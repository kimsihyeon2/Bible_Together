
'use client';

import React from 'react';
import { Screen } from '../types';
import { MediaTeamCredits } from '@/components/MediaTeamCredits';

interface MediaTeamScreenProps {
    navigate: (screen: Screen) => void;
}

const MediaTeamScreen: React.FC<MediaTeamScreenProps> = ({ navigate }) => {
    return (
        <div className="bg-ios-bg-light dark:bg-ios-bg-dark min-h-screen relative font-sans">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-ios-bg-light/90 dark:bg-ios-bg-dark/90 backdrop-blur-md border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-3 px-4 py-3">
                    <button
                        onClick={() => navigate(Screen.SETTINGS)}
                        className="p-2 -ml-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined text-2xl text-slate-900 dark:text-white">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">미디어 홍보팀</h1>
                </div>
            </header>

            <main>
                <MediaTeamCredits />
            </main>
        </div>
    );
};

export default MediaTeamScreen;
