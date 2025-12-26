'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    start_date?: string;
    end_date?: string;
    event_date: string; // Keep for backward compatibility
    event_time: string | null;
    end_time: string | null;
    location: string | null;
    scope: 'GLOBAL' | 'PARISH' | 'CELL';
    parish_id: string | null;
    cell_id: string | null;
    created_by: string | null;
    created_at: string;
}

interface CalendarTabProps {
    cellId: string | null;
    parishId: string | null;
    onAddEvent: () => void;
    onEditEvent: (event: CalendarEvent) => void;
}

const CalendarTab: React.FC<CalendarTabProps> = ({ cellId, parishId, onAddEvent, onEditEvent }) => {
    const { user, profile } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const canCreateEvent = profile?.role === 'PASTOR' || profile?.role === 'SUB_ADMIN' || profile?.role === 'LEADER';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    useEffect(() => {
        fetchEvents();
    }, [currentDate, cellId]);

    const fetchEvents = async () => {
        setLoading(true);
        const startDate = new Date(year, month, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

        // Fetch events that overlap with this month
        // Either start_date is in this month, or event_date (legacy) is in this month
        const { data, error } = await supabase
            .from('calendar_events')
            .select('*')
            .or(`start_date.gte.${startDate},event_date.gte.${startDate}`)
            .or(`start_date.lte.${endDate},event_date.lte.${endDate}`)
            .order('event_date', { ascending: true })
            .order('event_time', { ascending: true });

        if (!error && data) {
            setEvents(data as CalendarEvent[]);
        }
        setLoading(false);
    };

    // Check if a date falls within an event's date range
    const getEventsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(e => {
            const eventStart = e.start_date || e.event_date;
            const eventEnd = e.end_date || e.start_date || e.event_date;
            return dateStr >= eventStart && dateStr <= eventEnd;
        });
    };

    // Check if user can edit this event
    const canEditEvent = (event: CalendarEvent) => {
        if (!user || !profile) return false;
        if (event.created_by === user.id) return true;
        if (profile.role === 'PASTOR') return true;
        if (profile.role === 'SUB_ADMIN' && event.scope !== 'GLOBAL') return true;
        return false;
    };

    const formatTime = (time: string | null) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        return `${h >= 12 ? '오후' : '오전'} ${h > 12 ? h - 12 : h === 0 ? 12 : h}:${minutes}`;
    };

    const formatDateRange = (event: CalendarEvent) => {
        const start = event.start_date || event.event_date;
        const end = event.end_date || event.start_date || event.event_date;

        if (start === end) return null; // Same day, don't show range

        const startParts = start.split('-');
        const endParts = end.split('-');
        return `${parseInt(startParts[1])}/${parseInt(startParts[2])} ~ ${parseInt(endParts[1])}/${parseInt(endParts[2])}`;
    };

    const getScopeLabel = (scope: string) => {
        switch (scope) {
            case 'GLOBAL': return '전체';
            case 'PARISH': return '교구';
            case 'CELL': return '셀';
            default: return '';
        }
    };

    const getScopeColor = (scope: string) => {
        switch (scope) {
            case 'GLOBAL': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'PARISH': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'CELL': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getBorderColor = (scope: string) => {
        switch (scope) {
            case 'GLOBAL': return 'border-purple-500';
            case 'PARISH': return 'border-blue-500';
            case 'CELL': return 'border-green-500';
            default: return 'border-primary';
        }
    };

    const goToPrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
        setSelectedDate(null);
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
        setSelectedDate(null);
    };

    const handleDateClick = (day: number) => {
        setSelectedDate(new Date(year, month, day));
    };

    const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
        calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(i);
    }

    const today = new Date();
    const isToday = (day: number) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const isSelected = (day: number) =>
        selectedDate && day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

    return (
        <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
                <button
                    onClick={goToPrevMonth}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <h3 className="text-lg font-bold">
                    {year}년 {month + 1}월
                </h3>
                <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                        <div
                            key={day}
                            className={`text-center text-xs font-semibold py-2 ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-slate-500'}`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, idx) => {
                        if (day === null) {
                            return <div key={`empty-${idx}`} className="aspect-square" />;
                        }

                        const dateEvents = getEventsForDate(new Date(year, month, day));
                        const hasEvents = dateEvents.length > 0;
                        const dayOfWeek = (startDayOfWeek + day - 1) % 7;

                        return (
                            <button
                                key={day}
                                onClick={() => handleDateClick(day)}
                                className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative
                                    ${isSelected(day)
                                        ? 'bg-primary text-white font-bold'
                                        : isToday(day)
                                            ? 'bg-primary/10 text-primary font-bold'
                                            : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }
                                    ${dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : ''}
                                    ${isSelected(day) ? 'text-white' : ''}
                                `}
                            >
                                <span className="text-sm">{day}</span>
                                {hasEvents && (
                                    <div className="flex gap-0.5 mt-0.5">
                                        {dateEvents.slice(0, 3).map((e, i) => (
                                            <span
                                                key={i}
                                                className={`w-1.5 h-1.5 rounded-full ${isSelected(day) ? 'bg-white' :
                                                    e.scope === 'GLOBAL' ? 'bg-purple-500' :
                                                        e.scope === 'PARISH' ? 'bg-blue-500' : 'bg-green-500'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Date Events */}
            {selectedDate && (
                <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
                    <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">event</span>
                        {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 ({['일', '월', '화', '수', '목', '금', '토'][selectedDate.getDay()]})
                    </h4>

                    {selectedEvents.length === 0 ? (
                        <p className="text-slate-400 text-center py-6">이 날에는 일정이 없습니다</p>
                    ) : (
                        <div className="space-y-3">
                            {selectedEvents.map(event => (
                                <div
                                    key={event.id}
                                    className={`p-4 bg-background-light dark:bg-background-dark rounded-xl border-l-4 ${getBorderColor(event.scope)} relative group`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h5 className="font-semibold">{event.title}</h5>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getScopeColor(event.scope)}`}>
                                                    {getScopeLabel(event.scope)}
                                                </span>
                                            </div>
                                            {event.description && (
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{event.description}</p>
                                            )}
                                        </div>

                                        {/* Edit Button */}
                                        {canEditEvent(event) && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditEvent(event);
                                                }}
                                                className="p-2 -mr-1 -mt-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
                                                title="이벤트 수정"
                                            >
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center flex-wrap gap-3 mt-2 text-xs text-slate-500">
                                        {/* Date Range */}
                                        {formatDateRange(event) && (
                                            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                                                <span className="material-symbols-outlined text-xs">date_range</span>
                                                {formatDateRange(event)}
                                            </span>
                                        )}

                                        {/* Time */}
                                        {event.event_time && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">schedule</span>
                                                {formatTime(event.event_time)}
                                                {event.end_time && ` ~ ${formatTime(event.end_time)}`}
                                            </span>
                                        )}

                                        {/* Location */}
                                        {event.location && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">location_on</span>
                                                {event.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add Event Button */}
            {canCreateEvent && (
                <button
                    onClick={onAddEvent}
                    className="w-full py-3 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-primary-dark transition-colors"
                >
                    <span className="material-symbols-outlined">add</span>
                    이벤트 추가
                </button>
            )}
        </div>
    );
};

export default CalendarTab;
