'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

// Web Audio API context
let audioContext: AudioContext | null = null;

const playAlertSound = () => {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioContext;
        const t = ctx.currentTime;

        // Create oscillators for a pleasant chord (Major Triad)
        // C5 (523.25), E5 (659.25), G5 (783.99)
        const notes = [523.25, 659.25, 783.99];

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.frequency.value = freq;
            osc.type = 'sine';

            // Envelope
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.3, t + 0.1); // Attack
            gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5 + (i * 0.1)); // Decay

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(t);
            osc.stop(t + 2);
        });

    } catch (e) {
        console.error('Failed to play sound:', e);
    }
};

interface UrgentAlertOverlayProps {
    onClose?: () => void;
}

export const UrgentAlertOverlay = () => {
    const [alert, setAlert] = useState<{ title: string, body: string, prayerId?: string } | null>(null);
    const { user } = useAuth();

    // Expose a global function to trigger alert (from PushNotificationManager)
    useEffect(() => {
        (window as any).triggerUrgentAlert = (payload: any) => {
            setAlert({
                title: payload.notification?.title || '긴급 기도 요청',
                body: payload.notification?.body || '',
                prayerId: payload.data?.prayerId
            });
            playAlertSound();

            // Vibrate if supported
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]); // Vibration pattern
            }
        };

        return () => {
            delete (window as any).triggerUrgentAlert;
        };
    }, []);

    const handleDismiss = () => {
        setAlert(null);
    };

    const handleGoToPrayer = () => {
        // Logic to navigate or open prayer details
        // For now, just dismiss, but in real app could route to /prayers/:id
        handleDismiss();
    };

    return (
        <AnimatePresence>
            {alert && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={handleDismiss}
                    />

                    {/* Alert Card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-red-500/50"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-center">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="inline-block bg-white/20 p-3 rounded-full mb-3 backdrop-blur-md"
                            >
                                <span className="material-symbols-outlined text-3xl text-white">campaign</span>
                            </motion.div>
                            <h2 className="text-2xl font-bold text-white leading-tight">
                                긴급 기도 요청
                            </h2>
                            <p className="text-red-100 text-sm mt-1">
                                지금 함께 기도해주세요!
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                                {alert.title.replace('🙏 긴급 기도:', '').trim()}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                {alert.body}
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={handleGoToPrayer}
                                    className="w-full py-3.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>🙏</span> 함께 기도하기
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="w-full py-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
                                >
                                    나중에 보기
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
