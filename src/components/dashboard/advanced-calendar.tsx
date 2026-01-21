'use client';

import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventInput, EventClickArg, DatesSetArg } from '@fullcalendar/core';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp, getDoc, doc } from 'firebase/firestore';
import { Loader2, Filter, Calendar as CalendarIcon, List, Clock, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import DayDetailsModal from './day-details-modal';
import { CalendarEvent } from '@/types/calendar';

// Event colors based on type and priority
const EVENT_COLORS = {
    ticket_opened: { bg: '#f97316', border: '#ea580c', text: '#ffffff' },
    ticket_closed: { bg: '#ef4444', border: '#dc2626', text: '#ffffff' },
    ticket_reopened: { bg: '#fbbf24', border: '#f59e0b', text: '#000000' },
    wiki_created: { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' },
    wiki_edited: { bg: '#6366f1', border: '#4f46e5', text: '#ffffff' },
    suggestion: { bg: '#8b5cf6', border: '#7c3aed', text: '#ffffff' },
    // Priority overrides for tickets
    urgent: { bg: '#dc2626', border: '#b91c1c', text: '#ffffff' },
    high: { bg: '#ea580c', border: '#c2410c', text: '#ffffff' },
};

// Filter options
type EventFilter = 'all' | 'tickets' | 'wiki' | 'suggestions';
type PriorityFilter = 'all' | 'urgent' | 'high' | 'normal' | 'low';

interface AdvancedCalendarProps {
    className?: string;
}

// Cache for user names
const userNameCache = new Map<string, string>();

async function getUserName(userId: string): Promise<string> {
    if (userNameCache.has(userId)) {
        return userNameCache.get(userId)!;
    }
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const name = userDoc.data().name || userDoc.data().displayName || 'Staff';
            userNameCache.set(userId, name);
            return name;
        }
    } catch (err) {
        console.error('Failed to fetch user name:', err);
    }
    return 'Staff';
}

export default function AdvancedCalendar({ className }: AdvancedCalendarProps) {
    const [events, setEvents] = useState<EventInput[]>([]);
    const [rawEvents, setRawEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth'>('dayGridMonth');
    const [filter, setFilter] = useState<EventFilter>('all');
    const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
    const calendarRef = useRef<FullCalendar>(null);

    // Calculate stats for current view
    const monthStats = {
        totalEvents: rawEvents.length,
        ticketsOpened: rawEvents.filter(e => e.type === 'ticket_opened').length,
        ticketsClosed: rawEvents.filter(e => e.type === 'ticket_closed' || e.type === 'ticket_reopened').length,
        urgentTickets: rawEvents.filter(e => e.metadata?.priority === 'URGENT').length,
        wikiDocs: rawEvents.filter(e => e.type === 'wiki_created' || e.type === 'wiki_edited').length,
        suggestions: rawEvents.filter(e => e.type === 'suggestion_created').length,
    };

    const fetchEvents = async (start: Date, end: Date) => {
        setLoading(true);
        try {
            const allEvents: CalendarEvent[] = [];
            const fcEvents: EventInput[] = [];

            // Fetch Tickets
            const ticketsRef = collection(db, 'tickets');
            const ticketsQuery = query(
                ticketsRef,
                where('createdAt', '>=', Timestamp.fromDate(start)),
                where('createdAt', '<=', Timestamp.fromDate(end)),
                orderBy('createdAt', 'asc')
            );
            const ticketsSnap = await getDocs(ticketsQuery);

            for (const docSnap of ticketsSnap.docs) {
                const data = docSnap.data();
                const createdAt = data.createdAt?.toDate() || new Date();
                const closedAt = data.closedAt?.toDate();
                const authorName = await getUserName(data.authorId);
                const ticketNumber = data.ticketId || docSnap.id.slice(-6).toUpperCase();
                const wasReopened = closedAt && (data.status === 'OPEN' || data.status === 'IN_PROGRESS');
                const priority = data.priority?.toLowerCase() || 'normal';

                // Determine color based on priority
                let color = EVENT_COLORS.ticket_opened;
                if (priority === 'urgent') color = EVENT_COLORS.urgent;
                else if (priority === 'high') color = EVENT_COLORS.high;

                // Opened Event
                const openEvent: CalendarEvent = {
                    id: `ticket-open-${docSnap.id}`,
                    type: 'ticket_opened',
                    title: data.subject || 'Untitled',
                    timestamp: createdAt,
                    metadata: {
                        ticketId: docSnap.id,
                        ticketNumber,
                        status: data.status,
                        priority: data.priority,
                        authorName,
                        category: data.category,
                    }
                };
                allEvents.push(openEvent);

                fcEvents.push({
                    id: openEvent.id,
                    title: `#${ticketNumber} ${data.subject || 'Ticket'}`,
                    start: createdAt,
                    end: closedAt || undefined,
                    backgroundColor: color.bg,
                    borderColor: color.border,
                    textColor: color.text,
                    extendedProps: {
                        type: 'ticket_opened',
                        priority: data.priority,
                        status: data.status,
                        ticketId: docSnap.id,
                        ticketNumber,
                        authorName,
                    }
                });

                // Closed Event (separate marker)
                if (closedAt && closedAt >= start && closedAt <= end) {
                    const closeEvent: CalendarEvent = {
                        id: `ticket-close-${docSnap.id}`,
                        type: wasReopened ? 'ticket_reopened' : 'ticket_closed',
                        title: data.subject || 'Untitled',
                        timestamp: closedAt,
                        metadata: {
                            ticketId: docSnap.id,
                            ticketNumber,
                            wasReopened,
                        }
                    };
                    allEvents.push(closeEvent);

                    fcEvents.push({
                        id: closeEvent.id,
                        title: `#${ticketNumber} Closed`,
                        start: closedAt,
                        backgroundColor: wasReopened ? EVENT_COLORS.ticket_reopened.bg : EVENT_COLORS.ticket_closed.bg,
                        borderColor: wasReopened ? EVENT_COLORS.ticket_reopened.border : EVENT_COLORS.ticket_closed.border,
                        textColor: '#ffffff',
                        extendedProps: {
                            type: wasReopened ? 'ticket_reopened' : 'ticket_closed',
                            ticketId: docSnap.id,
                            ticketNumber,
                        }
                    });
                }
            }

            // Fetch Wiki Documents
            const wikiRef = collection(db, 'wiki_documents');
            const wikiQuery = query(
                wikiRef,
                where('createdAt', '>=', Timestamp.fromDate(start)),
                where('createdAt', '<=', Timestamp.fromDate(end)),
                orderBy('createdAt', 'asc')
            );
            const wikiSnap = await getDocs(wikiQuery);

            wikiSnap.forEach((docSnap) => {
                const data = docSnap.data();
                const createdAt = data.createdAt?.toDate() || new Date();

                const wikiEvent: CalendarEvent = {
                    id: `wiki-${docSnap.id}`,
                    type: 'wiki_created',
                    title: data.title || 'Wiki Document',
                    timestamp: createdAt,
                    metadata: { docId: docSnap.id, lastUpdatedBy: data.lastUpdatedBy }
                };
                allEvents.push(wikiEvent);

                fcEvents.push({
                    id: wikiEvent.id,
                    title: `📄 ${data.title || 'Wiki Document'}`,
                    start: createdAt,
                    backgroundColor: EVENT_COLORS.wiki_created.bg,
                    borderColor: EVENT_COLORS.wiki_created.border,
                    textColor: EVENT_COLORS.wiki_created.text,
                    extendedProps: { type: 'wiki_created' }
                });
            });

            // Fetch Suggestions
            const suggestionsRef = collection(db, 'suggestions');
            const suggestionsQuery = query(
                suggestionsRef,
                where('createdAt', '>=', Timestamp.fromDate(start)),
                where('createdAt', '<=', Timestamp.fromDate(end)),
                orderBy('createdAt', 'asc')
            );
            const suggestionsSnap = await getDocs(suggestionsQuery);

            suggestionsSnap.forEach((docSnap) => {
                const data = docSnap.data();
                const createdAt = data.createdAt?.toDate() || new Date();

                const suggestionEvent: CalendarEvent = {
                    id: `suggestion-${docSnap.id}`,
                    type: 'suggestion_created',
                    title: data.title || 'Suggestion',
                    timestamp: createdAt,
                    metadata: { suggestionId: docSnap.id, status: data.status }
                };
                allEvents.push(suggestionEvent);

                fcEvents.push({
                    id: suggestionEvent.id,
                    title: `💡 ${data.title || 'Suggestion'}`,
                    start: createdAt,
                    backgroundColor: EVENT_COLORS.suggestion.bg,
                    borderColor: EVENT_COLORS.suggestion.border,
                    textColor: EVENT_COLORS.suggestion.text,
                    extendedProps: { type: 'suggestion_created', status: data.status }
                });
            });

            setRawEvents(allEvents);
            setEvents(fcEvents);
        } catch (err) {
            console.error('Failed to load calendar events:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDatesSet = (dateInfo: DatesSetArg) => {
        fetchEvents(dateInfo.start, dateInfo.end);
    };

    const handleEventClick = (clickInfo: EventClickArg) => {
        const eventDate = clickInfo.event.start;
        if (eventDate) {
            const dayEvents = rawEvents.filter(e =>
                format(e.timestamp, 'yyyy-MM-dd') === format(eventDate, 'yyyy-MM-dd')
            );
            setSelectedDate(eventDate);
            setSelectedEvents(dayEvents);
        }
    };

    const handleDateClick = (info: { date: Date }) => {
        const dayEvents = rawEvents.filter(e =>
            format(e.timestamp, 'yyyy-MM-dd') === format(info.date, 'yyyy-MM-dd')
        );
        setSelectedDate(info.date);
        setSelectedEvents(dayEvents);
    };

    const changeView = (view: typeof currentView) => {
        setCurrentView(view);
        calendarRef.current?.getApi().changeView(view);
    };

    const goToToday = () => {
        calendarRef.current?.getApi().today();
    };

    // Filter events based on selection
    const filteredEvents = events.filter(event => {
        // Type filter
        if (filter !== 'all') {
            const type = event.extendedProps?.type || '';
            if (filter === 'tickets' && !type.includes('ticket')) return false;
            if (filter === 'wiki' && !type.includes('wiki')) return false;
            if (filter === 'suggestions' && !type.includes('suggestion')) return false;
        }
        // Priority filter (only applies to tickets)
        if (priorityFilter !== 'all') {
            const priority = event.extendedProps?.priority?.toLowerCase() || 'normal';
            if (priority !== priorityFilter) return false;
        }
        return true;
    });

    return (
        <div className={cn("bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden", className)}>
            {/* Header with Stats */}
            <div className="p-4 border-b border-[#21262d]">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-[#f97316]" />
                        <h2 className="text-lg font-semibold text-white">Activity Calendar</h2>
                        <span className="text-xs text-[#484f58] bg-[#21262d] px-2 py-0.5 rounded-full">
                            {monthStats.totalEvents} events
                        </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* View Switcher */}
                        <div className="flex rounded-lg overflow-hidden border border-[#30363d]">
                            <button
                                onClick={() => changeView('dayGridMonth')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium transition-colors",
                                    currentView === 'dayGridMonth' ? "bg-[#f97316] text-white" : "text-[#8b949e] hover:text-white hover:bg-[#21262d]"
                                )}
                                title="Month View"
                            >
                                <Grid3X3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() => changeView('timeGridWeek')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium transition-colors",
                                    currentView === 'timeGridWeek' ? "bg-[#f97316] text-white" : "text-[#8b949e] hover:text-white hover:bg-[#21262d]"
                                )}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => changeView('timeGridDay')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium transition-colors",
                                    currentView === 'timeGridDay' ? "bg-[#f97316] text-white" : "text-[#8b949e] hover:text-white hover:bg-[#21262d]"
                                )}
                            >
                                Day
                            </button>
                            <button
                                onClick={() => changeView('listMonth')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium transition-colors",
                                    currentView === 'listMonth' ? "bg-[#f97316] text-white" : "text-[#8b949e] hover:text-white hover:bg-[#21262d]"
                                )}
                                title="List View"
                            >
                                <List className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {/* Today Button */}
                        <button
                            onClick={goToToday}
                            className="px-3 py-1.5 rounded-lg border border-[#30363d] text-xs font-medium text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
                        >
                            Today
                        </button>
                    </div>
                </div>

                {/* Month Stats Bar */}
                <div className="grid grid-cols-5 gap-2 mb-3">
                    <div className="bg-[#0d1117] rounded-lg p-2 text-center border border-[#21262d]">
                        <span className="text-lg font-bold text-[#f97316]">{monthStats.ticketsOpened}</span>
                        <p className="text-[9px] text-[#8b949e] uppercase">Opened</p>
                    </div>
                    <div className="bg-[#0d1117] rounded-lg p-2 text-center border border-[#21262d]">
                        <span className="text-lg font-bold text-[#ef4444]">{monthStats.ticketsClosed}</span>
                        <p className="text-[9px] text-[#8b949e] uppercase">Closed</p>
                    </div>
                    <div className="bg-[#0d1117] rounded-lg p-2 text-center border border-[#21262d]">
                        <span className="text-lg font-bold text-[#dc2626]">{monthStats.urgentTickets}</span>
                        <p className="text-[9px] text-[#8b949e] uppercase">Urgent</p>
                    </div>
                    <div className="bg-[#0d1117] rounded-lg p-2 text-center border border-[#21262d]">
                        <span className="text-lg font-bold text-[#3b82f6]">{monthStats.wikiDocs}</span>
                        <p className="text-[9px] text-[#8b949e] uppercase">Wiki</p>
                    </div>
                    <div className="bg-[#0d1117] rounded-lg p-2 text-center border border-[#21262d]">
                        <span className="text-lg font-bold text-[#8b5cf6]">{monthStats.suggestions}</span>
                        <p className="text-[9px] text-[#8b949e] uppercase">Ideas</p>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1">
                        <Filter className="h-3.5 w-3.5 text-[#8b949e]" />
                        <span className="text-xs text-[#8b949e]">Filter:</span>
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as EventFilter)}
                        className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#f97316]"
                    >
                        <option value="all">All Events</option>
                        <option value="tickets">Tickets Only</option>
                        <option value="wiki">Wiki Only</option>
                        <option value="suggestions">Suggestions Only</option>
                    </select>
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                        className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#f97316]"
                    >
                        <option value="all">All Priorities</option>
                        <option value="urgent">🔴 Urgent</option>
                        <option value="high">🟠 High</option>
                        <option value="normal">🔵 Normal</option>
                        <option value="low">⚪ Low</option>
                    </select>
                    {(filter !== 'all' || priorityFilter !== 'all') && (
                        <button
                            onClick={() => { setFilter('all'); setPriorityFilter('all'); }}
                            className="text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            {/* Calendar Legend */}
            <div className="px-4 py-2 border-b border-[#21262d] flex items-center gap-4 flex-wrap text-[10px]">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: EVENT_COLORS.ticket_opened.bg }} />
                    <span className="text-[#8b949e]">Opened</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: EVENT_COLORS.ticket_closed.bg }} />
                    <span className="text-[#8b949e]">Closed</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: EVENT_COLORS.urgent.bg }} />
                    <span className="text-[#8b949e]">Urgent</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: EVENT_COLORS.wiki_created.bg }} />
                    <span className="text-[#8b949e]">Wiki</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: EVENT_COLORS.suggestion.bg }} />
                    <span className="text-[#8b949e]">Suggestion</span>
                </div>
            </div>

            {/* Calendar */}
            <div className="p-4">
                {loading && (
                    <div className="absolute inset-0 bg-[#161b22]/80 flex items-center justify-center z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-[#3b82f6]" />
                    </div>
                )}
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    initialView={currentView}
                    headerToolbar={{
                        left: 'prev,next',
                        center: 'title',
                        right: ''
                    }}
                    events={filteredEvents}
                    datesSet={handleDatesSet}
                    eventClick={handleEventClick}
                    dateClick={handleDateClick}
                    height="auto"
                    eventDisplay="block"
                    eventTimeFormat={{
                        hour: 'numeric',
                        minute: '2-digit',
                        meridiem: 'short'
                    }}
                    dayMaxEvents={3}
                    moreLinkClick="popover"
                    nowIndicator={true}
                    // Styling
                    themeSystem="standard"
                />
            </div>

            {/* Day Details Modal */}
            {selectedDate && (
                <DayDetailsModal
                    date={selectedDate}
                    events={selectedEvents}
                    onClose={() => setSelectedDate(null)}
                />
            )}

            {/* Custom Styles for FullCalendar */}
            <style jsx global>{`
                .fc {
                    --fc-border-color: #30363d;
                    --fc-button-bg-color: #21262d;
                    --fc-button-border-color: #30363d;
                    --fc-button-text-color: #8b949e;
                    --fc-button-hover-bg-color: #30363d;
                    --fc-button-hover-border-color: #484f58;
                    --fc-button-active-bg-color: #f97316;
                    --fc-button-active-border-color: #f97316;
                    --fc-today-bg-color: rgba(249, 115, 22, 0.1);
                    --fc-page-bg-color: #161b22;
                    --fc-neutral-bg-color: #0d1117;
                    --fc-list-event-hover-bg-color: rgba(249, 115, 22, 0.1);
                }
                .fc .fc-toolbar-title {
                    color: #e6edf3;
                    font-size: 1.1rem;
                    font-weight: 600;
                }
                .fc .fc-col-header-cell-cushion,
                .fc .fc-daygrid-day-number {
                    color: #8b949e;
                    text-decoration: none;
                }
                .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
                    color: #f97316;
                    font-weight: 700;
                }
                .fc .fc-daygrid-day-events {
                    padding: 2px;
                }
                .fc-event {
                    border-radius: 4px;
                    font-size: 11px;
                    padding: 2px 4px;
                    cursor: pointer;
                }
                .fc .fc-timegrid-slot-label-cushion,
                .fc .fc-list-day-cushion,
                .fc .fc-list-event-time,
                .fc .fc-list-event-title {
                    color: #e6edf3;
                }
                .fc .fc-list-event:hover td {
                    background-color: rgba(249, 115, 22, 0.1);
                }
                .fc .fc-more-link {
                    color: #f97316;
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
}
