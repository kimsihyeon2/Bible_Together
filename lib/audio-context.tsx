'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

// Bible books for navigation
const BIBLE_BOOKS = [
    '창세기', '출애굽기', '레위기', '민수기', '신명기', '여호수아', '사사기', '룻기',
    '사무엘상', '사무엘하', '열왕기상', '열왕기하', '역대상', '역대하', '에스라', '느헤미야',
    '에스더', '욥기', '시편', '잠언', '전도서', '아가', '이사야', '예레미야', '예레미야애가',
    '에스겔', '다니엘', '호세아', '요엘', '아모스', '오바댜', '요나', '미가', '나훔',
    '하박국', '스바냐', '학개', '스가랴', '말라기',
    '마태복음', '마가복음', '누가복음', '요한복음', '사도행전', '로마서', '고린도전서', '고린도후서',
    '갈라디아서', '에베소서', '빌립보서', '골로새서', '데살로니가전서', '데살로니가후서',
    '디모데전서', '디모데후서', '디도서', '빌레몬서', '히브리서', '야고보서', '베드로전서',
    '베드로후서', '요한일서', '요한이서', '요한삼서', '유다서', '요한계시록'
];

// Chapter counts per book
const CHAPTER_COUNTS: Record<string, number> = {
    '창세기': 50, '출애굽기': 40, '레위기': 27, '민수기': 36, '신명기': 34,
    '여호수아': 24, '사사기': 21, '룻기': 4, '사무엘상': 31, '사무엘하': 24,
    '열왕기상': 22, '열왕기하': 25, '역대상': 29, '역대하': 36, '에스라': 10,
    '느헤미야': 13, '에스더': 10, '욥기': 42, '시편': 150, '잠언': 31,
    '전도서': 12, '아가': 8, '이사야': 66, '예레미야': 52, '예레미야애가': 5,
    '에스겔': 48, '다니엘': 12, '호세아': 14, '요엘': 3, '아모스': 9,
    '오바댜': 1, '요나': 4, '미가': 7, '나훔': 3, '하박국': 3,
    '스바냐': 3, '학개': 2, '스가랴': 14, '말라기': 4,
    '마태복음': 28, '마가복음': 16, '누가복음': 24, '요한복음': 21, '사도행전': 28,
    '로마서': 16, '고린도전서': 16, '고린도후서': 13, '갈라디아서': 6, '에베소서': 6,
    '빌립보서': 4, '골로새서': 4, '데살로니가전서': 5, '데살로니가후서': 3,
    '디모데전서': 6, '디모데후서': 4, '디도서': 3, '빌레몬서': 1, '히브리서': 13,
    '야고보서': 5, '베드로전서': 5, '베드로후서': 3, '요한일서': 5, '요한이서': 1,
    '요한삼서': 1, '유다서': 1, '요한계시록': 22
};

// Speed options
export const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

interface AudioContextType {
    isPlaying: boolean;
    isLoading: boolean;
    currentBook: string | null;
    currentChapter: number | null;
    duration: number;
    currentTime: number;
    playChapter: (book: string, chapter: number) => Promise<void>;
    playNext: () => void;
    playPrevious: () => void;
    togglePlay: () => void;
    seek: (time: number) => void;
    setSpeed: (speed: number) => void;
    stop: () => void;
    playbackRate: number;
    error: string | null;
    autoPlayNext: boolean;
    setAutoPlayNext: (value: boolean) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentBook, setCurrentBook] = useState<string | null>(null);
    const [currentChapter, setCurrentChapter] = useState<number | null>(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [error, setError] = useState<string | null>(null);
    const [ytReady, setYtReady] = useState(false);
    const [autoPlayNext, setAutoPlayNext] = useState(true);

    const playerRef = useRef<any>(null);
    const timeUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const currentBookRef = useRef<string | null>(null);
    const currentChapterRef = useRef<number | null>(null);

    // Keep refs in sync
    useEffect(() => {
        currentBookRef.current = currentBook;
        currentChapterRef.current = currentChapter;
    }, [currentBook, currentChapter]);

    // Get next chapter info
    const getNextChapter = useCallback(() => {
        if (!currentBookRef.current || !currentChapterRef.current) return null;

        const book = currentBookRef.current;
        const chapter = currentChapterRef.current;
        const maxChapters = CHAPTER_COUNTS[book] || 1;

        if (chapter < maxChapters) {
            return { book, chapter: chapter + 1 };
        } else {
            // Move to next book
            const bookIndex = BIBLE_BOOKS.indexOf(book);
            if (bookIndex < BIBLE_BOOKS.length - 1) {
                return { book: BIBLE_BOOKS[bookIndex + 1], chapter: 1 };
            }
        }
        return null;
    }, []);

    // Get previous chapter info
    const getPreviousChapter = useCallback(() => {
        if (!currentBookRef.current || !currentChapterRef.current) return null;

        const book = currentBookRef.current;
        const chapter = currentChapterRef.current;

        if (chapter > 1) {
            return { book, chapter: chapter - 1 };
        } else {
            // Move to previous book
            const bookIndex = BIBLE_BOOKS.indexOf(book);
            if (bookIndex > 0) {
                const prevBook = BIBLE_BOOKS[bookIndex - 1];
                return { book: prevBook, chapter: CHAPTER_COUNTS[prevBook] || 1 };
            }
        }
        return null;
    }, []);

    // Load YouTube IFrame API
    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (window.YT && window.YT.Player) {
            setYtReady(true);
            return;
        }

        if (!document.getElementById('yt-audio-container')) {
            const container = document.createElement('div');
            container.id = 'yt-audio-container';
            container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;';
            document.body.appendChild(container);

            const playerDiv = document.createElement('div');
            playerDiv.id = 'yt-audio-player';
            container.appendChild(playerDiv);
        }

        const existingScript = document.querySelector('script[src*="www.youtube.com/iframe_api"]');
        if (!existingScript) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
        }

        window.onYouTubeIframeAPIReady = () => {
            setYtReady(true);
        };

        return () => {
            if (timeUpdateInterval.current) {
                clearInterval(timeUpdateInterval.current);
            }
        };
    }, []);

    // Initialize player
    useEffect(() => {
        if (!ytReady || playerRef.current) return;

        playerRef.current = new window.YT.Player('yt-audio-player', {
            height: '1',
            width: '1',
            playerVars: {
                autoplay: 0,
                controls: 0,
                playsinline: 1,
                origin: typeof window !== 'undefined' ? window.location.origin : '',
            },
            events: {
                onReady: () => {
                    console.log('YouTube Player Ready');
                },
                onStateChange: (event: any) => {
                    const state = event.data;
                    if (state === window.YT.PlayerState.PLAYING) {
                        setIsPlaying(true);
                        setIsLoading(false);
                        setDuration(playerRef.current.getDuration() || 0);

                        if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
                        timeUpdateInterval.current = setInterval(() => {
                            if (playerRef.current && playerRef.current.getCurrentTime) {
                                setCurrentTime(playerRef.current.getCurrentTime());
                            }
                        }, 500);
                    } else if (state === window.YT.PlayerState.PAUSED) {
                        setIsPlaying(false);
                    } else if (state === window.YT.PlayerState.ENDED) {
                        setIsPlaying(false);
                        if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);

                        // Auto-play next chapter
                        if (autoPlayNext) {
                            const next = getNextChapter();
                            if (next) {
                                setTimeout(() => {
                                    playChapterInternal(next.book, next.chapter);
                                }, 1000);
                            }
                        }
                    } else if (state === window.YT.PlayerState.BUFFERING) {
                        setIsLoading(true);
                    }
                },
                onError: (event: any) => {
                    console.error('YouTube Player Error:', event.data);
                    setError('재생 오류가 발생했습니다.');
                    setIsLoading(false);
                }
            }
        });
    }, [ytReady, autoPlayNext, getNextChapter]);

    const playChapterInternal = async (book: string, chapter: number) => {
        try {
            setIsLoading(true);
            setError(null);
            setCurrentBook(book);
            setCurrentChapter(chapter);

            const res = await fetch(`/api/audio/stream?book=${encodeURIComponent(book)}&chapter=${chapter}`);
            const data = await res.json();

            if (!res.ok || !data.videoId) {
                setError(data.error || '오디오를 찾을 수 없습니다.');
                setIsLoading(false);
                return;
            }

            if (playerRef.current && playerRef.current.loadVideoById) {
                playerRef.current.loadVideoById(data.videoId);
                playerRef.current.setPlaybackRate(playbackRate);
            } else {
                setError('플레이어 준비 중...');
                setIsLoading(false);
            }

            // Media Session API for lock screen controls
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: `${book} ${chapter}장`,
                    artist: 'Green Bible',
                    album: '오디오 성경',
                    artwork: [{ src: '/icon.png', sizes: '512x512', type: 'image/png' }]
                });

                navigator.mediaSession.setActionHandler('play', () => {
                    playerRef.current?.playVideo();
                });
                navigator.mediaSession.setActionHandler('pause', () => {
                    playerRef.current?.pauseVideo();
                });
                navigator.mediaSession.setActionHandler('previoustrack', () => {
                    const prev = getPreviousChapter();
                    if (prev) playChapterInternal(prev.book, prev.chapter);
                });
                navigator.mediaSession.setActionHandler('nexttrack', () => {
                    const next = getNextChapter();
                    if (next) playChapterInternal(next.book, next.chapter);
                });
            }

        } catch (err) {
            console.error("Play Failed:", err);
            setError("재생 실패");
            setIsLoading(false);
        }
    };

    const playChapter = async (book: string, chapter: number) => {
        await playChapterInternal(book, chapter);
    };

    const playNext = () => {
        const next = getNextChapter();
        if (next) playChapterInternal(next.book, next.chapter);
    };

    const playPrevious = () => {
        const prev = getPreviousChapter();
        if (prev) playChapterInternal(prev.book, prev.chapter);
    };

    const togglePlay = useCallback(() => {
        if (!playerRef.current) return;

        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    }, [isPlaying]);

    const seek = (time: number) => {
        if (!playerRef.current) return;
        playerRef.current.seekTo(time, true);
        setCurrentTime(time);
    };

    const setSpeed = (speed: number) => {
        if (!playerRef.current) return;
        playerRef.current.setPlaybackRate(speed);
        setPlaybackRate(speed);
    };

    const stop = () => {
        if (playerRef.current?.stopVideo) {
            playerRef.current.stopVideo();
        }
        if (timeUpdateInterval.current) {
            clearInterval(timeUpdateInterval.current);
        }
        setIsPlaying(false);
        setIsLoading(false);
        setCurrentBook(null);
        setCurrentChapter(null);
        setDuration(0);
        setCurrentTime(0);
        setError(null);
    };

    return (
        <AudioContext.Provider value={{
            isPlaying,
            isLoading,
            currentBook,
            currentChapter,
            duration,
            currentTime,
            playChapter,
            playNext,
            playPrevious,
            togglePlay,
            seek,
            setSpeed,
            stop,
            playbackRate,
            error,
            autoPlayNext,
            setAutoPlayNext,
        }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
};
