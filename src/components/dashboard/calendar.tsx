'use client';

import { useState, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths
} from 'date-fns';
import { CalendarService } from '@/services/calendar-service';
import { CalendarEvent } from '@/types/calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import DayDetailsModal from './day-details-modal';

interface CalendarProps {
    onDayClick?: (date: Date, events: CalendarEvent[]) => void;
}

export default function Calendar({ onDayClick }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);

    useEffect(() => {
        const loadEvents = async () => {
            setLoading(true);
            try {
                const monthEvents = await CalendarService.getEventsForMonth(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth()
                );
                setEvents(monthEvents);
            } catch (err) {
                console.error('Failed to load calendar events:', err);
            } finally {
                setLoading(false);
            }
        };
        loadEvents();
    }, [currentMonth]);

    const getEventsForDay = (day: Date): CalendarEvent[] => {
        return events.filter((event) => isSameDay(event.timestamp, day));
    };

    const handleDayClick = (day: Date) => {
        const dayEvents = getEventsForDay(day);
        setSelectedDate(day);
        setSelectedEvents(dayEvents);
        onDayClick?.(day, dayEvents);
    };

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                    {format(currentMonth, 'MMMM, yyyy')}
                </h2>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-lg overflow-hidden border border-[#30363d]">
                        <button className="px-3 py-1.5 text-xs font-medium text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors">
                            Week
                        </button>
                        <button className="px-3 py-1.5 text-xs font-medium bg-[#3b82f6] text-white">
                            Month
                        </button>
                        <button className="px-3 py-1.5 text-xs font-medium text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors">
                            Year
                        </button>
                        <button className="px-3 py-1.5 text-xs font-medium text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors">
                            Today
                        </button>
                    </div>
                    <div className="flex">
                        <button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="p-2 rounded-l-lg border border-[#30363d] hover:bg-[#21262d] transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4 text-[#8b949e]" />
                        </button>
                        <button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="p-2 rounded-r-lg border border-l-0 border-[#30363d] hover:bg-[#21262d] transition-colors"
                        >
                            <ChevronRight className="h-4 w-4 text-[#8b949e]" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return (
            <div className="grid grid-cols-7 mb-2">
                {days.map((day) => (
                    <div
                        key={day}
                        className="py-2 text-center text-xs font-medium text-[#8b949e] uppercase tracking-wider"
                    >
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const currentDay = day;
                const dayEvents = getEventsForDay(currentDay);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());

                days.push(
                    <div
                        key={day.toString()}
                        onClick={() => handleDayClick(currentDay)}
                        className={cn(
                            "min-h-[100px] p-2 border border-[#21262d] calendar-cell cursor-pointer relative",
                            !isCurrentMonth && "bg-[#0d1117] opacity-50",
                            isToday && "border-[#3b82f6] bg-[#3b82f6]/10"
                        )}
                    >
                        <span
                            className={cn(
                                "text-sm font-medium",
                                isToday ? "text-[#3b82f6]" : isCurrentMonth ? "text-[#e6edf3]" : "text-[#484f58]"
                            )}
                        >
                            {format(day, 'd')}
                        </span>

                        {/* Event pills */}
                        <div className="mt-1 space-y-1">
                            {(() => {
                                // Group events by ticket ID to identify linked pairs
                                const ticketGroups = new Map<string, CalendarEvent[]>();
                                dayEvents.forEach((event) => {
                                    const ticketId = event.metadata?.ticketId;
                                    if (ticketId) {
                                        if (!ticketGroups.has(ticketId)) {
                                            ticketGroups.set(ticketId, []);
                                        }
                                        ticketGroups.get(ticketId)!.push(event);
                                    }
                                });

                                const displayItems: React.ReactNode[] = [];
                                let count = 0;

                                ticketGroups.forEach((groupEvents, ticketId) => {
                                    if (count >= 3) return;

                                    const hasOpen = groupEvents.some((e) => e.type === 'ticket_opened');
                                    const hasClosed = groupEvents.some((e) => e.type === 'ticket_closed');
                                    const firstEvent = groupEvents[0];
                                    const title = firstEvent.title;
                                    const truncatedTitle = title.length > 12 ? title.substring(0, 10) + '...' : title;
                                    const spansMultipleDays = firstEvent.metadata?.spansMultipleDays;

                                    if (hasOpen && hasClosed) {
                                        // Same-day linked event - show gradient pill
                                        displayItems.push(
                                            <div
                                                key={ticketId}
                                                className="text-[10px] px-1.5 py-0.5 rounded truncate font-medium bg-gradient-to-r from-[#22c55e]/30 to-[#ef4444]/30 text-white border border-[#30363d]"
                                            >
                                                <span className="opacity-80">↻</span> {truncatedTitle}
                                            </div>
                                        );
                                        count++;
                                    } else {
                                        // Single events (including multi-day spans)
                                        groupEvents.forEach((event) => {
                                            if (count >= 3) return;
                                            const isOpened = event.type === 'ticket_opened';
                                            const isClosed = event.type === 'ticket_closed';

                                            // Determine span arrow
                                            let spanIcon = '';
                                            if (spansMultipleDays) {
                                                if (isOpened) spanIcon = '→';  // Continues to future
                                                if (isClosed) spanIcon = '←';  // Started in past
                                            }

                                            displayItems.push(
                                                <div
                                                    key={event.id}
                                                    className={cn(
                                                        "text-[10px] px-1.5 py-0.5 rounded truncate font-medium flex items-center gap-0.5",
                                                        isOpened && "bg-[#22c55e]/20 text-[#22c55e]",
                                                        isClosed && "bg-[#ef4444]/20 text-[#ef4444]"
                                                    )}
                                                >
                                                    {spanIcon && <span className="opacity-70">{spanIcon}</span>}
                                                    {truncatedTitle}
                                                </div>
                                            );
                                            count++;
                                        });
                                    }
                                });

                                return displayItems;
                            })()}
                            {dayEvents.length > 3 && (
                                <div className="text-[10px] px-1.5 py-0.5 rounded bg-[#3b82f6]/20 text-[#3b82f6] font-medium">
                                    +{dayEvents.length - 3} more
                                </div>
                            )}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div key={day.toString()} className="grid grid-cols-7">
                    {days}
                </div>
            );
            days = [];
        }

        return <div className="border border-[#21262d] rounded-lg overflow-hidden">{rows}</div>;
    };

    return (
        <div className="bg-[#161b22] rounded-xl p-6 border border-[#30363d]">
            {renderHeader()}
            {renderDays()}
            {loading ? (
                <div className="flex items-center justify-center h-64 text-[#8b949e]">
                    Loading calendar...
                </div>
            ) : (
                renderCells()
            )}

            {/* Day Details Modal */}
            {selectedDate && (
                <DayDetailsModal
                    date={selectedDate}
                    events={selectedEvents}
                    onClose={() => setSelectedDate(null)}
                />
            )}
        </div>
    );
}
