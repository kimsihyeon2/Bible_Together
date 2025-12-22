'use client';

import React from 'react';

interface BibleVerseCardProps {
    verse: string;
    book: string;
    chapter: number;
    verseNumber?: number;
    version?: string;
    onNavigate?: () => void;
}

/**
 * SOTA Bible Verse Card Component
 * Displays a beautifully styled verse card for sharing in chat
 * Inspired by pasture-themed design with glassmorphism
 */
export const BibleVerseCard: React.FC<BibleVerseCardProps> = ({
    verse,
    book,
    chapter,
    verseNumber,
    version = 'NIV',
    onNavigate
}) => {
    const getBookAbbrev = (bookName: string) => {
        const abbrevMap: Record<string, string> = {
            'Genesis': 'Gen', 'Exodus': 'Ex', 'Leviticus': 'Lev',
            'Numbers': 'Num', 'Deuteronomy': 'Deut', 'Joshua': 'Josh',
            'Judges': 'Judg', 'Ruth': 'Ruth', '1 Samuel': '1 Sam',
            '2 Samuel': '2 Sam', '1 Kings': '1 Kgs', '2 Kings': '2 Kgs',
            'Psalms': 'Ps', 'Proverbs': 'Prov', 'Isaiah': 'Isa',
            'Jeremiah': 'Jer', 'Matthew': 'Matt', 'Mark': 'Mark',
            'Luke': 'Luke', 'John': 'John', 'Acts': 'Acts',
            'Romans': 'Rom', '1 Corinthians': '1 Cor', '2 Corinthians': '2 Cor',
            'Galatians': 'Gal', 'Ephesians': 'Eph', 'Philippians': 'Phil',
            'Colossians': 'Col', 'Revelation': 'Rev',
            // Korean
            '창세기': '창', '출애굽기': '출', '레위기': '레',
            '민수기': '민', '신명기': '신', '여호수아': '수',
            '사사기': '삿', '룻기': '룻', '사무엘상': '삼상',
            '사무엘하': '삼하', '열왕기상': '왕상', '열왕기하': '왕하',
            '시편': '시', '잠언': '잠', '이사야': '사',
            '예레미야': '렘', '마태복음': '마', '마가복음': '막',
            '누가복음': '눅', '요한복음': '요', '사도행전': '행',
            '로마서': '롬', '고린도전서': '고전', '고린도후서': '고후',
            '갈라디아서': '갈', '에베소서': '엡', '빌립보서': '빌',
            '골로새서': '골', '요한계시록': '계',
        };
        return abbrevMap[bookName] || bookName.substring(0, 3);
    };

    const referenceText = verseNumber
        ? `${book} ${chapter}:${verseNumber}`
        : `${book} ${chapter}`;

    return (
        <div className="overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-800/90 border border-emerald-100/60 dark:border-slate-700 shadow-lg shadow-green-500/5 w-full backdrop-blur-md transition-all hover:shadow-xl hover:shadow-green-500/10 group">
            {/* Verse Content */}
            <div className="p-4 relative flex gap-3">
                {/* Accent Bar */}
                <div className="shrink-0 w-1 rounded-full bg-gradient-to-b from-emerald-400 to-teal-400 my-1" />

                {/* Text */}
                <div className="flex-1">
                    <p className="text-[15px] italic text-slate-700 dark:text-gray-300 leading-relaxed font-serif">
                        "{verse}"
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/30 dark:to-teal-900/30 px-4 py-2.5 flex items-center justify-between border-t border-emerald-100/50 dark:border-slate-700/50 backdrop-blur-sm">
                <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-emerald-800 dark:text-emerald-100">
                        {referenceText}
                    </span>
                    <span className="text-[10px] text-emerald-600/70 dark:text-emerald-300/70 uppercase tracking-wide font-medium">
                        {version}
                    </span>
                </div>

                {onNavigate && (
                    <button
                        onClick={onNavigate}
                        className="size-8 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-600 transition-all active:scale-95 border border-emerald-100 dark:border-slate-600 group-hover:scale-110"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                )}
            </div>
        </div>
    );
};

/**
 * BibleBot Message Card - For AI/Bot verse suggestions in chat
 */
export const BibleBotCard: React.FC<BibleVerseCardProps & { botName?: string }> = ({
    verse,
    book,
    chapter,
    verseNumber,
    version = 'NIV',
    onNavigate,
    botName = 'BibleBot'
}) => {
    const referenceText = verseNumber
        ? `${book} ${chapter}:${verseNumber}`
        : `${book} ${chapter}`;

    return (
        <div className="flex items-end gap-2 mb-4 group">
            {/* Bot Avatar */}
            <div className="size-[34px] rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mb-1 border-2 border-white dark:border-slate-700 shadow-sm">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">smart_toy</span>
            </div>

            <div className="flex flex-col gap-1 max-w-[90%] w-full items-start">
                {/* Bot Name */}
                <span className="text-[11px] font-semibold text-emerald-600 ml-3 flex items-center gap-1">
                    {botName}
                    <span className="size-1 rounded-full bg-emerald-500" />
                </span>

                {/* Card */}
                <div className="overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-800/90 border border-emerald-100/60 dark:border-slate-700 shadow-lg shadow-green-500/10 w-full backdrop-blur-md">
                    <div className="p-4 relative flex gap-3">
                        <div className="shrink-0 w-1 rounded-full bg-gradient-to-b from-emerald-400 to-teal-400 my-1" />
                        <div>
                            <p className="text-[15px] italic text-slate-700 dark:text-gray-300 leading-relaxed font-serif">
                                "{verse}"
                            </p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/30 dark:to-teal-900/30 px-3 py-2.5 flex items-center justify-between border-t border-emerald-100/50 dark:border-slate-700/50 backdrop-blur-sm">
                        <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-emerald-800 dark:text-emerald-100">
                                {referenceText}
                            </span>
                            <span className="text-[10px] text-emerald-600/70 dark:text-emerald-300/70 uppercase tracking-wide font-medium">
                                {version}
                            </span>
                        </div>

                        {onNavigate && (
                            <button
                                onClick={onNavigate}
                                className="size-8 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-all active:scale-95 border border-emerald-100 dark:border-slate-600"
                            >
                                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BibleVerseCard;
