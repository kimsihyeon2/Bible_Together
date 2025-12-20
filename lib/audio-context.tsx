'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

// Define the shape of our Audio Context
interface AudioContextType {
    isPlaying: boolean;
    isLoading: boolean;
    currentBook: string | null;
    currentChapter: number | null;
    duration: number;
    currentTime: number;
    playChapter: (book: string, chapter: number) => Promise<void>;
    togglePlay: () => void;
    seek: (time: number) => void;
    setSpeed: (speed: number) => void;
    stop: () => void;
    playbackRate: number;
    error: string | null;
}

const AudioContext = createContext<AudioContextType | null>(null);

// Declare global YT types
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

    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const timeUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    // Load YouTube IFrame API
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Check if already loaded
        if (window.YT && window.YT.Player) {
            setYtReady(true);
            return;
        }

        // Create container for player (hidden)
        if (!document.getElementById('yt-audio-container')) {
            const container = document.createElement('div');
            container.id = 'yt-audio-container';
            container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;';
            document.body.appendChild(container);

            const playerDiv = document.createElement('div');
            playerDiv.id = 'yt-audio-player';
            container.appendChild(playerDiv);
        }

        // Load API script
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

    // Initialize player when API is ready
    useEffect(() => {
        if (!ytReady || playerRef.current) return;

        playerRef.current = new window.YT.Player('yt-audio-player', {
            height: '1',
            width: '1',
            playerVars: {
                autoplay: 0,
                controls: 0,
                playsinline: 1,
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

                        // Start time update interval
                        if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
                        timeUpdateInterval.current = setInterval(() => {
                            if (playerRef.current && playerRef.current.getCurrentTime) {
                                setCurrentTime(playerRef.current.getCurrentTime());
                            }
                        }, 1000);
                    } else if (state === window.YT.PlayerState.PAUSED) {
                        setIsPlaying(false);
                    } else if (state === window.YT.PlayerState.ENDED) {
                        setIsPlaying(false);
                        if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
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
    }, [ytReady]);

    const playChapter = async (book: string, chapter: number) => {
        try {
            setIsLoading(true);
            setError(null);
            setCurrentBook(book);
            setCurrentChapter(chapter);

            // Fetch video ID from API
            const res = await fetch(`/api/audio/stream?book=${encodeURIComponent(book)}&chapter=${chapter}`);
            const data = await res.json();

            if (!res.ok || !data.videoId) {
                setError(data.error || '오디오를 찾을 수 없습니다.');
                setIsLoading(false);
                return;
            }

            // Load and play video
            if (playerRef.current && playerRef.current.loadVideoById) {
                playerRef.current.loadVideoById(data.videoId);
                playerRef.current.setPlaybackRate(playbackRate);
            } else {
                setError('플레이어 준비 중...');
                setIsLoading(false);
            }

            // Setup Media Session (Lock Screen)
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: `${book} ${chapter}장`,
                    artist: 'Green Bible',
                    album: 'Community Bible Reading',
                    artwork: [
                        { src: '/icon.png', sizes: '512x512', type: 'image/png' }
                    ]
                });

                navigator.mediaSession.setActionHandler('play', () => togglePlay());
                navigator.mediaSession.setActionHandler('pause', () => togglePlay());
            }

        } catch (err) {
            console.error("Play Failed:", err);
            setError("재생 실패");
            setIsLoading(false);
        }
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
    }

    const stop = () => {
        if (playerRef.current && playerRef.current.stopVideo) {
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
            togglePlay,
            seek,
            setSpeed,
            stop,
            playbackRate,
            error
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
