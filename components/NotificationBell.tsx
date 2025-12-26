'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface Notification {
    id: string;
    title: string;
    body: string;
    type: string;
    is_read: boolean;
    created_at: string;
    prayer_id?: string;
}

interface NotificationBellProps {
    onPrayerClick?: (prayerId: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onPrayerClick }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Fetch notifications
    useEffect(() => {
        if (!user) return;

        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('user_notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) {
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
            }
        };

        fetchNotifications();

        // Real-time subscription
        const subscription = supabase
            .channel('user-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'user_notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const newNotif = payload.new as Notification;
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    // Show browser notification
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification(newNotif.title, {
                            body: newNotif.body || '',
                            icon: '/icons/icon-192x192.png'
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Mark notification as read
    const markAsRead = async (id: string) => {
        await supabase
            .from('user_notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', id);

        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    // Mark all as read
    const markAllAsRead = async () => {
        if (!user) return;

        setIsLoading(true);
        await supabase
            .from('user_notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('is_read', false);

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        setIsLoading(false);
    };

    // Delete single notification
    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering the parent onClick

        // Optimistic update - save previous state for rollback
        const previousNotifications = notifications;
        setNotifications(prev => prev.filter(n => n.id !== id));

        try {
            const { error } = await supabase
                .from('user_notifications')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Failed to delete notification:', error);
                // Rollback on error
                setNotifications(previousNotifications);
            }
        } catch (err) {
            console.error('Delete notification error:', err);
            setNotifications(previousNotifications);
        }
    };

    // Clear all (delete all read notifications)
    const clearAllRead = async () => {
        if (!user) return;

        setIsLoading(true);

        // Save for rollback
        const previousNotifications = notifications;

        try {
            // Delete all read notifications for this user
            const { error } = await supabase
                .from('user_notifications')
                .delete()
                .eq('user_id', user.id)
                .eq('is_read', true);

            if (error) {
                console.error('Failed to clear read notifications:', error);
                // Don't update state if delete failed
            } else {
                // Keep only unread in state
                setNotifications(prev => prev.filter(n => !n.is_read));
            }
        } catch (err) {
            console.error('Clear all read error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return '방금';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;
        return date.toLocaleDateString('ko-KR');
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'urgent_prayer': return '🙏';
            case 'announcement': return '📢';
            case 'reminder': return '⏰';
            default: return '🔔';
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
                <span className="material-symbols-outlined text-2xl text-slate-600 dark:text-slate-300">
                    notifications
                </span>

                {/* Unread Badge */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full shadow-lg"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </motion.div>
                    )}
                </AnimatePresence>
            </button>

            {/* Notification Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-slate-800 dark:text-white">알림</h3>
                            <div className="flex gap-2">
                                {notifications.some(n => n.is_read) && (
                                    <button
                                        onClick={clearAllRead}
                                        disabled={isLoading}
                                        className="text-xs text-red-500 font-medium hover:underline disabled:opacity-50"
                                    >
                                        읽은 알림 삭제
                                    </button>
                                )}
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        disabled={isLoading}
                                        className="text-xs text-primary font-medium hover:underline disabled:opacity-50"
                                    >
                                        모두 읽음
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="overflow-y-auto max-h-[60vh]">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    <span className="material-symbols-outlined text-4xl mb-2">notifications_off</span>
                                    <p className="text-sm">알림이 없습니다</p>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <motion.div
                                        key={notif.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={() => {
                                            if (!notif.is_read) markAsRead(notif.id);
                                            if (notif.prayer_id && onPrayerClick) {
                                                onPrayerClick(notif.prayer_id);
                                            }
                                            setIsOpen(false);
                                        }}
                                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800/50 ${notif.is_read
                                            ? 'bg-white dark:bg-slate-900'
                                            : 'bg-primary/5 dark:bg-primary/10'
                                            } hover:bg-slate-50 dark:hover:bg-slate-800/50`}
                                    >
                                        {/* Icon */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${notif.type === 'urgent_prayer'
                                            ? 'bg-red-100 dark:bg-red-900/30'
                                            : 'bg-slate-100 dark:bg-slate-800'
                                            }`}>
                                            {getNotificationIcon(notif.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm line-clamp-2 ${notif.is_read
                                                    ? 'text-slate-600 dark:text-slate-400'
                                                    : 'text-slate-800 dark:text-white font-medium'
                                                    }`}>
                                                    {notif.title}
                                                </p>

                                                {/* Dismiss Button */}
                                                <button
                                                    onClick={(e) => deleteNotification(notif.id, e)}
                                                    className="p-1 -mr-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors shrink-0"
                                                    title="알림 삭제"
                                                >
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            </div>

                                            {notif.body && (
                                                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                                                    {notif.body}
                                                </p>
                                            )}

                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {formatTime(notif.created_at)}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
