'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

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
    playbackRate: number;
    error: string | null;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentBook, setCurrentBook] = useState<string | null>(null);
    const [currentChapter, setCurrentChapter] = useState<number | null>(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [error, setError] = useState<string | null>(null);

    // The actual Audio HTML element
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio element on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio();

            // Event Listeners
            const audio = audioRef.current;

            const onTimeUpdate = () => setCurrentTime(audio.currentTime);
            const onLoadedMetadata = () => setDuration(audio.duration);
            const onEnded = () => setIsPlaying(false);
            const onError = (e: any) => {
                console.error("Audio Error:", e);
                setIsLoading(false);
                setIsPlaying(false);
                setError("오디오를 재생할 수 없습니다.");
            };
            const onCanPlay = () => setIsLoading(false);
            const onWaiting = () => setIsLoading(true);

            audio.addEventListener('timeupdate', onTimeUpdate);
            audio.addEventListener('loadedmetadata', onLoadedMetadata);
            audio.addEventListener('ended', onEnded);
            audio.addEventListener('error', onError);
            audio.addEventListener('canplay', onCanPlay);
            audio.addEventListener('waiting', onWaiting);

            return () => {
                audio.removeEventListener('timeupdate', onTimeUpdate);
                audio.removeEventListener('loadedmetadata', onLoadedMetadata);
                audio.removeEventListener('ended', onEnded);
                audio.removeEventListener('error', onError);
                audio.removeEventListener('canplay', onCanPlay);
                audio.removeEventListener('waiting', onWaiting);
                audio.pause();
                audio.src = "";
            };
        }
    }, []);

    const playChapter = async (book: string, chapter: number) => {
        if (!audioRef.current) return;

        try {
            setIsLoading(true);
            setError(null);
            setCurrentBook(book);
            setCurrentChapter(chapter);

            // Construct the runtime resolver URL
            // This will redirect to the actual YouTube stream
            const streamUrl = `/api/audio/stream?book=${encodeURIComponent(book)}&chapter=${chapter}`;

            audioRef.current.src = streamUrl;
            audioRef.current.playbackRate = playbackRate;
            await audioRef.current.play();
            setIsPlaying(true);

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

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const seek = (time: number) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const setSpeed = (speed: number) => {
        if (!audioRef.current) return;
        audioRef.current.playbackRate = speed;
        setPlaybackRate(speed);
    }

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
