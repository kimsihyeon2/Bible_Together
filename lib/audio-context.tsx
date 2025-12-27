'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { saveReadingProgress, getUserCellId } from './reading-progress';
import { supabase } from './supabase';

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
    showVideoPlayer: boolean;
    toggleVideoPlayer: () => void;
    pipMode: 'none' | 'document' | 'video';
}

const AudioContext = createContext<AudioContextType | null>(null);

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
        documentPictureInPicture?: {
            requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
        };
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
    const [showVideoPlayer, setShowVideoPlayer] = useState(false);
    const [pipMode, setPipMode] = useState<'none' | 'document' | 'video'>('none');

    const playerRef = useRef<any>(null);
    const pipWindowRef = useRef<Window | null>(null);

    // For Video Element PIP fallback
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const dummyVideoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedSpeed = localStorage.getItem('audioSpeed');
            if (savedSpeed) {
                const speed = parseFloat(savedSpeed);
                if (!isNaN(speed) && speed > 0) {
                    setPlaybackRate(speed);
                }
            }
        }
    }, []);

    // Initialize Canvas and Video for fallback PIP
    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (!canvasRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 300;
            canvasRef.current = canvas;
        }

        if (!dummyVideoRef.current) {
            const video = document.createElement('video');
            video.crossOrigin = "anonymous";
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
            document.body.appendChild(video);
            dummyVideoRef.current = video;

            video.addEventListener('play', () => {
                if (playerRef.current && playerRef.current.getPlayerState() !== window.YT.PlayerState.PLAYING) {
                    playerRef.current.playVideo();
                }
            });

            video.addEventListener('pause', () => {
                if (document.pictureInPictureElement === video) {
                    if (playerRef.current && playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING) {
                        playerRef.current.pauseVideo();
                    }
                }
            });

            video.addEventListener('leavepictureinpicture', () => {
                setShowVideoPlayer(false);
                setPipMode('none');
            });
        }
    }, []);

    // Draw canvas for video PIP fallback
    const updateCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Green gradient background
        const gradient = ctx.createLinearGradient(0, 0, 300, 300);
        gradient.addColorStop(0, '#15803d');
        gradient.addColorStop(1, '#052e16');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 300, 300);

        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Icon
        ctx.font = '60px serif';
        ctx.fillText('🎧', 150, 80);

        // Title
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(`${currentBook || '성경'} ${currentChapter || ''}장`, 150, 150);

        // Subtitle
        ctx.font = '16px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('공동체 성경 읽기', 150, 190);

        // Warning message for fallback mode
        ctx.font = '12px sans-serif';
        ctx.fillStyle = 'rgba(255,200,100,0.9)';
        ctx.fillText('⚠️ 백그라운드 재생 제한 있음', 150, 250);
        ctx.fillText('Chrome 브라우저에서 사용 권장', 150, 270);

    }, [currentBook, currentChapter]);

    useEffect(() => {
        if (showVideoPlayer && pipMode === 'video') {
            updateCanvas();
        }
    }, [updateCanvas, showVideoPlayer, pipMode]);

    const timeUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const currentBookRef = useRef<string | null>(null);
    const currentChapterRef = useRef<number | null>(null);

    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
            } catch (err) {
                console.log('Wake Lock not available:', err);
            }
        }
    };

    const releaseWakeLock = async () => {
        if (wakeLockRef.current) {
            try {
                await wakeLockRef.current.release();
                wakeLockRef.current = null;
            } catch (err) {
                console.log('Wake Lock release error:', err);
            }
        }
    };

    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && isPlaying) {
                await requestWakeLock();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isPlaying]);

    useEffect(() => {
        currentBookRef.current = currentBook;
        currentChapterRef.current = currentChapter;
    }, [currentBook, currentChapter]);

    const getNextChapter = useCallback(() => {
        if (!currentBookRef.current || !currentChapterRef.current) return null;
        const book = currentBookRef.current;
        const chapter = currentChapterRef.current;
        const maxChapters = CHAPTER_COUNTS[book] || 1;
        if (chapter < maxChapters) {
            return { book, chapter: chapter + 1 };
        } else {
            const bookIndex = BIBLE_BOOKS.indexOf(book);
            if (bookIndex < BIBLE_BOOKS.length - 1) {
                return { book: BIBLE_BOOKS[bookIndex + 1], chapter: 1 };
            }
        }
        return null;
    }, []);

    const getPreviousChapter = useCallback(() => {
        if (!currentBookRef.current || !currentChapterRef.current) return null;
        const book = currentBookRef.current;
        const chapter = currentChapterRef.current;
        if (chapter > 1) {
            return { book, chapter: chapter - 1 };
        } else {
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
            container.style.cssText = 'position:fixed;bottom:0;left:0;width:300px;height:200px;z-index:9999;opacity:0;pointer-events:none;';
            document.body.appendChild(container);

            const playerDiv = document.createElement('div');
            playerDiv.id = 'yt-audio-player';
            playerDiv.style.cssText = 'width:100%;height:100%;';
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
            height: '100%',
            width: '100%',
            playerVars: {
                autoplay: 0,
                controls: 1,
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
                        requestWakeLock();

                        if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
                        timeUpdateInterval.current = setInterval(() => {
                            if (playerRef.current && playerRef.current.getCurrentTime) {
                                setCurrentTime(playerRef.current.getCurrentTime());
                            }
                        }, 250);
                    } else if (state === window.YT.PlayerState.PAUSED) {
                        setIsPlaying(false);
                        releaseWakeLock();
                    } else if (state === window.YT.PlayerState.ENDED) {
                        setIsPlaying(false);
                        if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);

                        const completedBook = currentBookRef.current;
                        const completedChapter = currentChapterRef.current;
                        if (completedBook && completedChapter) {
                            (async () => {
                                try {
                                    const { data: { user } } = await supabase.auth.getUser();
                                    if (user) {
                                        const { data: profile } = await supabase
                                            .from('profiles')
                                            .select('name')
                                            .eq('id', user.id)
                                            .single();
                                        const cellId = await getUserCellId(user.id);
                                        await saveReadingProgress(
                                            user.id,
                                            profile?.name || '익명',
                                            completedBook,
                                            completedChapter,
                                            'AUDIO',
                                            cellId || undefined
                                        );
                                    }
                                } catch (err) {
                                    console.error('Error saving audio progress:', err);
                                }
                            })();
                        }

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

    // ========================================
    // TOGGLE PIP: Document PIP → Video PIP Fallback
    // ========================================
    const toggleVideoPlayer = useCallback(async () => {
        // If already in PIP, close it
        if (showVideoPlayer) {
            if (pipMode === 'document' && pipWindowRef.current && !pipWindowRef.current.closed) {
                pipWindowRef.current.close();
            } else if (pipMode === 'video' && document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            }
            setShowVideoPlayer(false);
            setPipMode('none');
            return;
        }

        // Try Document PIP first (Best option)
        if ('documentPictureInPicture' in window) {
            try {
                const pipWindow = await window.documentPictureInPicture!.requestWindow({
                    width: 300,
                    height: 300,
                });
                pipWindowRef.current = pipWindow;

                const style = pipWindow.document.createElement('style');
                style.textContent = `
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        background: linear-gradient(135deg, #15803d 0%, #052e16 100%);
                        color: white;
                        display: flex;
                        flex-direction: column;
                        height: 100vh;
                        overflow: hidden;
                    }
                    .header {
                        padding: 12px;
                        text-align: center;
                        background: rgba(0,0,0,0.2);
                    }
                    .header h1 { font-size: 18px; font-weight: bold; }
                    .header p { font-size: 12px; opacity: 0.8; margin-top: 4px; }
                    .player-container {
                        flex: 1;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 8px;
                    }
                    #yt-audio-container {
                        width: 100% !important;
                        height: 100% !important;
                        opacity: 1 !important;
                        pointer-events: auto !important;
                        position: relative !important;
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    iframe { width: 100% !important; height: 100% !important; }
                `;
                pipWindow.document.head.appendChild(style);

                const header = pipWindow.document.createElement('div');
                header.className = 'header';
                header.innerHTML = `
                    <h1>🎧 ${currentBook || '성경'} ${currentChapter || ''}장</h1>
                    <p>공동체 성경 읽기</p>
                `;
                pipWindow.document.body.appendChild(header);

                const playerContainer = pipWindow.document.createElement('div');
                playerContainer.className = 'player-container';
                pipWindow.document.body.appendChild(playerContainer);

                const ytContainer = document.getElementById('yt-audio-container');
                if (ytContainer) {
                    playerContainer.appendChild(ytContainer);
                }

                setShowVideoPlayer(true);
                setPipMode('document');

                pipWindow.addEventListener('pagehide', () => {
                    const ytContainer = pipWindow.document.getElementById('yt-audio-container');
                    if (ytContainer) {
                        ytContainer.style.cssText = 'position:fixed;bottom:0;left:0;width:300px;height:200px;z-index:9999;opacity:0;pointer-events:none;';
                        document.body.appendChild(ytContainer);
                    }
                    pipWindowRef.current = null;
                    setShowVideoPlayer(false);
                    setPipMode('none');
                });

                return; // Success! Exit here.
            } catch (err) {
                console.error('Document PIP failed:', err);
                // Fall through to Video PIP
            }
        }

        // ========================================
        // FALLBACK: Video Element PIP
        // ========================================
        console.log('Falling back to Video Element PIP...');
        const video = dummyVideoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
            setError('PIP를 사용할 수 없습니다.');
            return;
        }

        try {
            updateCanvas();
            const stream = (canvas as any).captureStream(30);
            video.srcObject = stream;
            await video.play();
            await video.requestPictureInPicture();

            setShowVideoPlayer(true);
            setPipMode('video');

            // Show user guidance (non-blocking alert alternative)
            setError('⚠️ 이 환경에서는 화면 끄면 멈출 수 있습니다. Chrome 브라우저에서 직접 사용하시면 완벽한 백그라운드 재생이 지원됩니다.');
            // Clear error after 5 seconds
            setTimeout(() => setError(null), 5000);

        } catch (err) {
            console.error('Video PIP also failed:', err);
            setError('PIP 기능을 사용할 수 없습니다.');
        }
    }, [showVideoPlayer, pipMode, currentBook, currentChapter, updateCanvas]);

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

            // Update Document PIP header if open
            if (pipMode === 'document' && pipWindowRef.current && !pipWindowRef.current.closed) {
                const header = pipWindowRef.current.document.querySelector('.header');
                if (header) {
                    header.innerHTML = `
                        <h1>🎧 ${book} ${chapter}장</h1>
                        <p>공동체 성경 읽기</p>
                    `;
                }
            }

            // Update Video PIP canvas if in fallback mode
            if (pipMode === 'video') {
                updateCanvas();
            }

            // Media Session API
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: `${book} ${chapter}장`,
                    artist: 'Green Bible',
                    album: '오디오 성경',
                    artwork: [{ src: '/icon.png', sizes: '512x512', type: 'image/png' }]
                });

                navigator.mediaSession.setActionHandler('play', () => playerRef.current?.playVideo());
                navigator.mediaSession.setActionHandler('pause', () => playerRef.current?.pauseVideo());
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
        localStorage.setItem('audioSpeed', speed.toString());
    };

    const stop = () => {
        if (playerRef.current?.stopVideo) {
            playerRef.current.stopVideo();
        }
        if (timeUpdateInterval.current) {
            clearInterval(timeUpdateInterval.current);
        }
        if (pipWindowRef.current && !pipWindowRef.current.closed) {
            pipWindowRef.current.close();
            pipWindowRef.current = null;
        }
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(() => { });
        }
        releaseWakeLock();
        setIsPlaying(false);
        setIsLoading(false);
        setCurrentBook(null);
        setCurrentChapter(null);
        setDuration(0);
        setCurrentTime(0);
        setError(null);
        setShowVideoPlayer(false);
        setPipMode('none');
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
            showVideoPlayer,
            toggleVideoPlayer,
            pipMode,
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
