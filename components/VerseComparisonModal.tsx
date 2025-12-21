import React, { useEffect, useState } from 'react';
import { BIBLE_BOOKS, TRANSLATIONS } from '@/lib/constants';

type ComparisonData = {
    translation: string;
    text: string;
    name: string;
};



interface Props {
    book: string;
    chapter: number;
    verse: number;
    onClose: () => void;
}

export default function VerseComparisonModal({ book, chapter, verse, onClose }: Props) {
    const [comparisons, setComparisons] = useState<ComparisonData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllTranslations = async () => {
            setLoading(true);
            const translations = ['KRV', 'KLB', 'EASY'];
            const fileMap: Record<string, string> = {
                'KRV': 'ko_krv.json',
                'KLB': 'ko_klb.json',
                'EASY': 'ko_easy.json'
            };

            const results: ComparisonData[] = [];

            try {
                // Parallel fetch for speed
                await Promise.all(translations.map(async (ver) => {
                    try {
                        const response = await fetch(`/bible/${fileMap[ver]}`);
                        if (!response.ok) return;
                        const data = await response.json();
                        // Structure: Book -> Chapter -> Verse
                        // Note: Chapter/Verse keys are usually strings in JSON
                        const verseText = data[book]?.[chapter.toString()]?.[verse.toString()];

                        if (verseText) {
                            results.push({
                                translation: ver,
                                name: TRANSLATIONS[ver as keyof typeof TRANSLATIONS].name,
                                text: verseText
                            });
                        }
                    } catch (err) {
                        console.error(`Failed to fetch ${ver}`, err);
                    }
                }));

                // Sort by standard order
                const order = ['KRV', 'KLB', 'EASY'];
                results.sort((a, b) => order.indexOf(a.translation) - order.indexOf(b.translation));

                setComparisons(results);
            } catch (e) {
                console.error("Comparison fetch error", e);
            } finally {
                setLoading(false);
            }
        };

        if (book && chapter && verse) {
            fetchAllTranslations();
        }
    }, [book, chapter, verse]);

    return (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                            역본 비교
                        </h3>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">
                            {book} {chapter}장 {verse}절
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 overscroll-contain">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse">
                                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20 mb-2"></div>
                                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full mb-1"></div>
                                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        comparisons.map((item) => (
                            <div key={item.translation} className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                                <span className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-slate-900"></span>
                                <h4 className="text-sm font-bold text-primary mb-1.5 flex items-center gap-2">
                                    {item.name}
                                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-slate-700 font-mono">
                                        {item.translation}
                                    </span>
                                </h4>
                                <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                                    {item.text}
                                </p>
                            </div>
                        ))
                    )}

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                        구입, 무료 역본에 한하여 복사할 수 있습니다.<br />
                        저작권 보호를 받는 역본은 개인적 용도로만 사용해주세요.
                    </div>
                </div>
            </div>
        </div>
    );
}
