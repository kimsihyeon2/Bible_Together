'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    start_date?: string;
    end_date?: string;
    event_date: string;
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
    onAddEvent: (selectedDate: Date | null) => void;
    onEditEvent: (event: CalendarEvent) => void;
}

// Helper to format date as YYYY-MM-DD without timezone issues
const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Get pastel background for multi-day events
const getEventBgColor = (scope: string, isSelected: boolean = false) => {
    if (isSelected) return 'bg-white/40';
    switch (scope) {
        case 'GLOBAL': return 'bg-purple-300/70 dark:bg-purple-500/50';
        case 'PARISH': return 'bg-blue-300/70 dark:bg-blue-500/50';
        case 'CELL': return 'bg-green-300/70 dark:bg-green-500/50';
        default: return 'bg-primary/30';
    }
};

const getDotColor = (scope: string) => {
    switch (scope) {
        case 'GLOBAL': return 'bg-purple-500';
        case 'PARISH': return 'bg-blue-500';
        case 'CELL': return 'bg-green-500';
        default: return 'bg-primary';
    }
};

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
        const monthStart = formatLocalDate(new Date(year, month, 1));
        const monthEnd = formatLocalDate(new Date(year, month + 1, 0));

        // For an event to overlap with this month:
        // - Event's start_date <= monthEnd AND event's end_date >= monthStart
        // OR for legacy events:
        // - event_date is within the month
        const { data, error } = await supabase
            .from('calendar_events')
            .select('*')
            .or(
                `and(start_date.lte.${monthEnd},end_date.gte.${monthStart}),` +
                `and(start_date.is.null,event_date.gte.${monthStart},event_date.lte.${monthEnd})`
            )
            .order('event_date', { ascending: true })
            .order('event_time', { ascending: true });

        if (!error && data) {
            setEvents(data as CalendarEvent[]);
        }
        setLoading(false);
    };

    // Build calendar grid data
    const calendarDays: (number | null)[] = useMemo(() => {
        const days: (number | null)[] = [];
        for (let i = 0; i < startDayOfWeek; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    }, [startDayOfWeek, daysInMonth]);

    // Separate single-day and multi-day events
    const { singleDayEvents, multiDayEvents } = useMemo(() => {
        const single: CalendarEvent[] = [];
        const multi: CalendarEvent[] = [];

        events.forEach(event => {
            const start = event.start_date || event.event_date;
            const end = event.end_date || event.start_date || event.event_date;
            if (start === end) {
                single.push(event);
            } else {
                multi.push(event);
            }
        });

        return { singleDayEvents: single, multiDayEvents: multi };
    }, [events]);

    // Get events for a specific date
    const getEventsForDate = (date: Date) => {
        const dateStr = formatLocalDate(date);
        return events.filter(e => {
            const eventStart = e.start_date || e.event_date;
            const eventEnd = e.end_date || e.start_date || e.event_date;
            return dateStr >= eventStart && dateStr <= eventEnd;
        });
    };

    // Get single-day events for a date
    const getSingleDayEventsForDate = (day: number) => {
        const dateStr = formatLocalDate(new Date(year, month, day));
        return singleDayEvents.filter(e => {
            const eventDate = e.start_date || e.event_date;
            return eventDate === dateStr;
        });
    };

    // Calculate multi-day event bar positions for each week row
    const getWeekEventBars = useMemo(() => {
        const weeks: { rowStart: number; bars: { event: CalendarEvent; startCol: number; endCol: number; }[] }[] = [];
        const totalCells = calendarDays.length;
        const numWeeks = Math.ceil(totalCells / 7);

        for (let week = 0; week < numWeeks; week++) {
            const weekBars: { event: CalendarEvent; startCol: number; endCol: number; }[] = [];
            const rowStart = week * 7;

            multiDayEvents.forEach(event => {
                const eventStart = event.start_date || event.event_date;
                const eventEnd = event.end_date || event.start_date || event.event_date;

                // Check each day in this week
                let startCol = -1;
                let endCol = -1;

                for (let col = 0; col < 7; col++) {
                    const cellIndex = rowStart + col;
                    if (cellIndex >= totalCells) break;

                    const day = calendarDays[cellIndex];
                    if (day === null) continue;

                    const dateStr = formatLocalDate(new Date(year, month, day));

                    if (dateStr >= eventStart && dateStr <= eventEnd) {
                        if (startCol === -1) startCol = col;
                        endCol = col;
                    }
                }

                if (startCol !== -1) {
                    weekBars.push({ event, startCol, endCol });
                }
            });

            weeks.push({ rowStart, bars: weekBars });
        }

        return weeks;
    }, [calendarDays, multiDayEvents, year, month]);

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
        if (start === end) return null;
        const startParts = start.split('-');
        const endParts = end.split('-');
        return `${parseInt(startParts[1])}/${parseInt(startParts[2])} ~ ${parseInt(endParts[1])}/${parseInt(endParts[2])}`;
    };

    const getScopeLabel = (scope: string) => {
        switch (scope) { case 'GLOBAL': return '전체'; case 'PARISH': return '교구'; case 'CELL': return '셀'; default: return ''; }
    };

    const getScopeColor = (scope: string) => {
        switch (scope) {
            case 'GLOBAL': return 'bg-purple-100 text-purple-700';
            case 'PARISH': return 'bg-blue-100 text-blue-700';
            case 'CELL': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getBorderColor = (scope: string) => {
        switch (scope) { case 'GLOBAL': return 'border-purple-500'; case 'PARISH': return 'border-blue-500'; case 'CELL': return 'border-green-500'; default: return 'border-primary'; }
    };

    const goToPrevMonth = () => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDate(null); };
    const goToNextMonth = () => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDate(null); };
    const handleDateClick = (day: number) => { setSelectedDate(new Date(year, month, day)); };

    const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];
    const today = new Date();
    const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isSelected = (day: number) => selectedDate && day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

    // Render calendar weeks with event bars
    const renderCalendarWeeks = () => {
        const weeks: React.ReactNode[] = [];
        const totalCells = calendarDays.length;
        const numWeeks = Math.ceil(totalCells / 7);

        for (let week = 0; week < numWeeks; week++) {
            const rowStart = week * 7;
            const weekData = getWeekEventBars[week];

            weeks.push(
                <div key={`week-${week}`} className="relative">
                    {/* Date cells */}
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 7 }, (_, col) => {
                            const cellIndex = rowStart + col;
                            if (cellIndex >= totalCells) {
                                return <div key={`empty-end-${col}`} className="aspect-square" />;
                            }

                            const day = calendarDays[cellIndex];
                            if (day === null) {
                                return <div key={`empty-${cellIndex}`} className="aspect-square" />;
                            }

                            const singleEvents = getSingleDayEventsForDate(day);
                            const dayOfWeek = col;

                            return (
                                <button
                                    key={day}
                                    onClick={() => handleDateClick(day)}
                                    className={`aspect-square rounded-xl flex flex-col items-center justify-start pt-1 transition-all relative
                                        ${isSelected(day) ? 'bg-primary text-white font-bold z-20 ring-2 ring-primary ring-offset-1' :
                                            isToday(day) ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}
                                        ${dayOfWeek === 0 && !isSelected(day) ? 'text-red-500' : ''}
                                        ${dayOfWeek === 6 && !isSelected(day) ? 'text-blue-500' : ''}
                                    `}
                                >
                                    <span className="text-sm">{day}</span>
                                    {/* Single-day event dots */}
                                    {singleEvents.length > 0 && (
                                        <div className="flex gap-0.5 mt-0.5">
                                            {singleEvents.slice(0, 3).map((e, i) => (
                                                <span key={i} className={`w-1.5 h-1.5 rounded-full ${isSelected(day) ? 'bg-white' : getDotColor(e.scope)}`} />
                                            ))}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Multi-day event bars overlay */}
                    <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: `${Math.min(weekData.bars.length, 3) * 6 + 2}px` }}>
                        {weekData.bars.slice(0, 3).map((bar, idx) => {
                            const leftPercent = (bar.startCol / 7) * 100;
                            const widthPercent = ((bar.endCol - bar.startCol + 1) / 7) * 100;
                            const isStart = formatLocalDate(new Date(year, month, calendarDays[rowStart + bar.startCol] || 1)) === (bar.event.start_date || bar.event.event_date);
                            const isEnd = formatLocalDate(new Date(year, month, calendarDays[rowStart + bar.endCol] || 1)) === (bar.event.end_date || bar.event.start_date || bar.event.event_date);

                            return (
                                <div
                                    key={`${bar.event.id}-${week}`}
                                    className={`absolute h-[5px] ${getEventBgColor(bar.event.scope)}
                                        ${isStart ? 'rounded-l-full ml-1' : ''}
                                        ${isEnd ? 'rounded-r-full mr-1' : ''}
                                    `}
                                    style={{
                                        left: `calc(${leftPercent}% + 2px)`,
                                        width: `calc(${widthPercent}% - 4px)`,
                                        bottom: `${idx * 6 + 2}px`,
                                    }}
                                    title={bar.event.title}
                                />
                            );
                        })}
                    </div>
                </div>
            );
        }

        return weeks;
    };

    return (
        <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
                <button onClick={goToPrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <h3 className="text-lg font-bold">{year}년 {month + 1}월</h3>
                <button onClick={goToNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                        <div key={day} className={`text-center text-xs font-semibold py-2 ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-slate-500'}`}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar weeks with event bars */}
                <div className="space-y-1">
                    {renderCalendarWeeks()}
                </div>
            </div>

            {/* Monthly Event Summary */}
            {events.length > 0 && (
                <div className="bg-surface-light dark:bg-surface-dark rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 px-4 py-3 border-b border-primary/10">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">calendar_month</span>
                                {month + 1}월 일정 요약
                                <span className="text-xs font-normal bg-primary/20 px-2 py-0.5 rounded-full">{events.length}개</span>
                            </h4>
                        </div>
                    </div>
                    <div className="p-3 space-y-2 max-h-[40vh] overflow-y-auto">
                        {[...events]
                            .sort((a, b) => {
                                const dateA = a.start_date || a.event_date;
                                const dateB = b.start_date || b.event_date;
                                return dateA.localeCompare(dateB);
                            })
                            .map(event => {
                                const start = event.start_date || event.event_date;
                                const end = event.end_date || event.start_date || event.event_date;
                                const startParts = start.split('-');
                                const endParts = end.split('-');
                                const isMultiDay = start !== end;
                                const dateDisplay = isMultiDay
                                    ? `${parseInt(startParts[1])}/${parseInt(startParts[2])} ~ ${parseInt(endParts[1])}/${parseInt(endParts[2])}`
                                    : `${parseInt(startParts[1])}/${parseInt(startParts[2])}`;

                                return (
                                    <div
                                        key={event.id}
                                        onClick={() => {
                                            const clickDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
                                            setSelectedDate(clickDate);
                                        }}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md
                                            ${event.scope === 'GLOBAL' ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-400' :
                                                event.scope === 'PARISH' ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400' :
                                                    'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400'}
                                        `}
                                    >
                                        {/* Date Badge */}
                                        <div className={`shrink-0 text-center min-w-[60px] px-2 py-1 rounded-lg text-xs font-bold
                                            ${event.scope === 'GLOBAL' ? 'bg-purple-200 dark:bg-purple-700 text-purple-800 dark:text-purple-100' :
                                                event.scope === 'PARISH' ? 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-100' :
                                                    'bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-100'}
                                        `}>
                                            {dateDisplay}
                                        </div>

                                        {/* Event Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm truncate">{event.title}</span>
                                                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium
                                                    ${event.scope === 'GLOBAL' ? 'bg-purple-100 text-purple-600' :
                                                        event.scope === 'PARISH' ? 'bg-blue-100 text-blue-600' :
                                                            'bg-green-100 text-green-600'}
                                                `}>
                                                    {getScopeLabel(event.scope)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                                {event.event_time && (
                                                    <span className="flex items-center gap-0.5">
                                                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                                                        {formatTime(event.event_time)}
                                                    </span>
                                                )}
                                                {event.location && (
                                                    <span className="flex items-center gap-0.5 truncate">
                                                        <span className="material-symbols-outlined text-[12px]">location_on</span>
                                                        {event.location}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <span className="material-symbols-outlined text-slate-400 text-lg shrink-0">chevron_right</span>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

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
                                <div key={event.id} className={`p-4 bg-background-light dark:bg-background-dark rounded-xl border-l-4 ${getBorderColor(event.scope)} relative group`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h5 className="font-semibold">{event.title}</h5>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getScopeColor(event.scope)}`}>
                                                    {getScopeLabel(event.scope)}
                                                </span>
                                            </div>
                                            {event.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{event.description}</p>}
                                        </div>
                                        {canEditEvent(event) && (
                                            <button onClick={(e) => { e.stopPropagation(); onEditEvent(event); }}
                                                className="p-2 -mr-1 -mt-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                                title="이벤트 수정">
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center flex-wrap gap-3 mt-2 text-xs text-slate-500">
                                        {formatDateRange(event) && (
                                            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                                                <span className="material-symbols-outlined text-xs">date_range</span>
                                                {formatDateRange(event)}
                                            </span>
                                        )}
                                        {event.event_time && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">schedule</span>
                                                {formatTime(event.event_time)}{event.end_time && ` ~ ${formatTime(event.end_time)}`}
                                            </span>
                                        )}
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
                <button onClick={() => onAddEvent(selectedDate)} className="w-full py-3 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-primary-dark transition-colors">
                    <span className="material-symbols-outlined">add</span>
                    이벤트 추가
                </button>
            )}
        </div>
    );
};

export default CalendarTab;
