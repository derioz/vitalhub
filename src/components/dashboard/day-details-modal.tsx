'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import {
    ArrowLeft, Clock, Ticket, FileText, Send, Loader2, ExternalLink, Hash,
    Plus, UserPlus, XCircle, ArrowUpCircle, CheckCircle2, AlertTriangle,
    TrendingUp, Calendar
} from 'lucide-react';
import { CalendarEvent, CalendarNote } from '@/types/calendar';
import { CalendarService } from '@/services/calendar-service';
import { TicketService } from '@/services/ticket-service';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';

interface DayDetailsModalProps {
    date: Date;
    events: CalendarEvent[];
    onClose: () => void;
}

export default function DayDetailsModal({ date, events, onClose }: DayDetailsModalProps) {
    const router = useRouter();
    const { user, userData } = useAuth();
    const [notes, setNotes] = useState<CalendarNote[]>([]);
    const [newNote, setNewNote] = useState('');
    const [loadingNotes, setLoadingNotes] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const dateStr = format(date, 'yyyy-MM-dd');

    // Calculate day stats
    const ticketOpened = events.filter(e => e.type === 'ticket_opened').length;
    const ticketClosed = events.filter(e => e.type === 'ticket_closed' || e.type === 'ticket_reopened').length;
    const wikiEvents = events.filter(e => e.type === 'wiki_created' || e.type === 'wiki_edited').length;
    const suggestionEvents = events.filter(e => e.type === 'suggestion_created').length;

    useEffect(() => {
        const loadNotes = async () => {
            setLoadingNotes(true);
            try {
                const fetchedNotes = await CalendarService.getNotesForDate(dateStr);
                setNotes(fetchedNotes);
            } catch (err) {
                console.error('Failed to load notes:', err);
            } finally {
                setLoadingNotes(false);
            }
        };
        loadNotes();
    }, [dateStr]);

    const handleAddNote = async () => {
        if (!newNote.trim() || !user) return;

        setSubmitting(true);
        try {
            await CalendarService.addNote(
                dateStr,
                newNote,
                user.uid,
                userData?.name || user.displayName || 'Staff'
            );
            const updatedNotes = await CalendarService.getNotesForDate(dateStr);
            setNotes(updatedNotes);
            setNewNote('');
        } catch (err) {
            console.error('Failed to add note:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleTicketClick = (ticketId: string) => {
        onClose();
        router.push(`/dashboard/tickets/${ticketId}`);
    };

    // Quick Actions
    const handleQuickAssign = async (ticketId: string) => {
        if (!user || !userData) return;
        setActionLoading(ticketId);
        try {
            await TicketService.assignTicket(ticketId, user.uid, userData.name || 'Staff');
        } catch (err) {
            console.error('Failed to assign:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleQuickClose = async (ticketId: string) => {
        setActionLoading(ticketId);
        try {
            await TicketService.updateStatus(ticketId, 'CLOSED');
        } catch (err) {
            console.error('Failed to close:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleEscalate = async (ticketId: string) => {
        setActionLoading(ticketId);
        try {
            await TicketService.escalateTicket(ticketId, 'URGENT');
        } catch (err) {
            console.error('Failed to escalate:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'ticket_opened':
            case 'ticket_closed':
            case 'ticket_reopened':
                return Ticket;
            case 'wiki_created':
            case 'wiki_edited':
                return FileText;
            default:
                return FileText;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[#0d1117] border border-[#30363d] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-[#21262d] shrink-0 bg-gradient-to-r from-[#161b22] to-[#0d1117]">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] transition-colors group"
                        >
                            <ArrowLeft className="h-4 w-4 text-[#8b949e] group-hover:text-white transition-colors" />
                        </button>
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-[#3b82f6]" />
                                {format(date, 'EEEE, MMMM d, yyyy')}
                            </h2>
                            <p className="text-xs text-[#8b949e] mt-0.5">
                                {formatDistanceToNow(date, { addSuffix: true })}
                            </p>
                        </div>
                    </div>

                    {/* Day Stats Summary */}
                    <div className="mt-4 grid grid-cols-4 gap-2">
                        <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <Plus className="h-3 w-3 text-[#22c55e]" />
                                <span className="text-lg font-bold text-[#22c55e]">{ticketOpened}</span>
                            </div>
                            <p className="text-[9px] text-[#22c55e]/70 uppercase tracking-wide">Opened</p>
                        </div>
                        <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-[#ef4444]" />
                                <span className="text-lg font-bold text-[#ef4444]">{ticketClosed}</span>
                            </div>
                            <p className="text-[9px] text-[#ef4444]/70 uppercase tracking-wide">Closed</p>
                        </div>
                        <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-lg p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <FileText className="h-3 w-3 text-[#3b82f6]" />
                                <span className="text-lg font-bold text-[#3b82f6]">{wikiEvents}</span>
                            </div>
                            <p className="text-[9px] text-[#3b82f6]/70 uppercase tracking-wide">Wiki</p>
                        </div>
                        <div className="bg-[#a855f7]/10 border border-[#a855f7]/20 rounded-lg p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <TrendingUp className="h-3 w-3 text-[#a855f7]" />
                                <span className="text-lg font-bold text-[#a855f7]">{suggestionEvents}</span>
                            </div>
                            <p className="text-[9px] text-[#a855f7]/70 uppercase tracking-wide">Suggestions</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {/* Events Timeline */}
                    <div>
                        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            Activity Timeline
                            <span className="text-[10px] font-normal bg-[#21262d] px-2 py-0.5 rounded-full">
                                {events.length}
                            </span>
                        </h3>
                        {events.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="h-12 w-12 rounded-full bg-[#21262d] flex items-center justify-center mx-auto mb-3">
                                    <Calendar className="h-6 w-6 text-[#484f58]" />
                                </div>
                                <p className="text-sm text-[#484f58]">No events on this day</p>
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Timeline connector line */}
                                <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-gradient-to-b from-[#22c55e]/50 via-[#3b82f6]/50 to-[#ef4444]/50 rounded-full" />

                                <div className="space-y-3">
                                    {(() => {
                                        // Group events by ticket ID
                                        const ticketGroups = new Map<string, CalendarEvent[]>();
                                        const nonTicketEvents: CalendarEvent[] = [];

                                        events.forEach((event) => {
                                            const ticketId = event.metadata?.ticketId;
                                            if (ticketId) {
                                                if (!ticketGroups.has(ticketId)) {
                                                    ticketGroups.set(ticketId, []);
                                                }
                                                ticketGroups.get(ticketId)!.push(event);
                                            } else {
                                                nonTicketEvents.push(event);
                                            }
                                        });

                                        const displayItems: React.ReactNode[] = [];

                                        // Process ticket groups
                                        ticketGroups.forEach((groupEvents, ticketId) => {
                                            const hasOpen = groupEvents.find((e) => e.type === 'ticket_opened');
                                            const hasClosed = groupEvents.find((e) => e.type === 'ticket_closed' || e.type === 'ticket_reopened');
                                            const firstEvent = hasOpen || groupEvents[0];
                                            const ticketNumber = firstEvent.metadata?.ticketNumber || 'N/A';
                                            const wasReopened = firstEvent.metadata?.wasReopened;
                                            const priority = firstEvent.metadata?.priority;
                                            const category = firstEvent.metadata?.category;

                                            // If ticket was reopened OR only one type of event, show separately
                                            if (wasReopened || !hasOpen || !hasClosed) {
                                                groupEvents.forEach((event) => {
                                                    const Icon = getEventIcon(event.type);
                                                    const isOpened = event.type === 'ticket_opened';
                                                    const isClosed = event.type === 'ticket_closed' || event.type === 'ticket_reopened';
                                                    const isLoading = actionLoading === ticketId;

                                                    displayItems.push(
                                                        <div
                                                            key={event.id}
                                                            className={cn(
                                                                "relative flex items-start gap-4 p-4 rounded-xl border ml-3 transition-all group",
                                                                isOpened && "bg-[#22c55e]/5 border-[#22c55e]/20 hover:border-[#22c55e]/40",
                                                                isClosed && "bg-[#ef4444]/5 border-[#ef4444]/20 hover:border-[#ef4444]/40"
                                                            )}
                                                        >
                                                            {/* Timeline dot */}
                                                            <div className={cn(
                                                                "absolute -left-5 top-5 h-3 w-3 rounded-full border-2 border-[#0d1117]",
                                                                isOpened && "bg-[#22c55e]",
                                                                isClosed && "bg-[#ef4444]"
                                                            )} />

                                                            <div className={cn("p-2.5 rounded-lg shrink-0", isOpened && "bg-[#22c55e]/20", isClosed && "bg-[#ef4444]/20")}>
                                                                <Icon className={cn("h-4 w-4", isOpened && "text-[#22c55e]", isClosed && "text-[#ef4444]")} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide", isOpened && "bg-[#22c55e]/20 text-[#22c55e]", isClosed && "bg-[#ef4444]/20 text-[#ef4444]")}>
                                                                        {isOpened ? 'Opened' : 'Closed'}
                                                                    </span>
                                                                    <span className="flex items-center gap-1 text-xs font-mono text-[#8b949e]">
                                                                        <Hash className="h-3 w-3" />
                                                                        {ticketNumber}
                                                                    </span>
                                                                    {category && (
                                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] uppercase">
                                                                            {category}
                                                                        </span>
                                                                    )}
                                                                    {priority === 'URGENT' && (
                                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold uppercase flex items-center gap-0.5">
                                                                            <AlertTriangle className="h-2.5 w-2.5" /> URGENT
                                                                        </span>
                                                                    )}
                                                                    {wasReopened && (
                                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] font-bold uppercase">
                                                                            Reopened
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p
                                                                    className="text-sm font-medium text-white truncate cursor-pointer hover:text-[#3b82f6] transition-colors"
                                                                    onClick={() => handleTicketClick(ticketId)}
                                                                >
                                                                    {event.title}
                                                                </p>
                                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-[#484f58]">
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        {format(event.timestamp, 'h:mm a')}
                                                                    </span>
                                                                    {event.metadata?.authorName && <span>by {event.metadata.authorName}</span>}
                                                                </div>

                                                                {/* Quick Actions */}
                                                                {isOpened && (
                                                                    <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => handleQuickAssign(ticketId)}
                                                                            disabled={isLoading}
                                                                            className="px-2 py-1 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center gap-1"
                                                                        >
                                                                            <UserPlus className="h-3 w-3" />
                                                                            Assign to Me
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleEscalate(ticketId)}
                                                                            disabled={isLoading}
                                                                            className="px-2 py-1 rounded text-[10px] font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors flex items-center gap-1"
                                                                        >
                                                                            <ArrowUpCircle className="h-3 w-3" />
                                                                            Escalate
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleQuickClose(ticketId)}
                                                                            disabled={isLoading}
                                                                            className="px-2 py-1 rounded text-[10px] font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1"
                                                                        >
                                                                            <XCircle className="h-3 w-3" />
                                                                            Close
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleTicketClick(ticketId)}
                                                                            className="px-2 py-1 rounded text-[10px] font-medium bg-[#21262d] text-[#8b949e] hover:text-white hover:bg-[#30363d] transition-colors flex items-center gap-1"
                                                                        >
                                                                            <ExternalLink className="h-3 w-3" />
                                                                            Open
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            } else {
                                                // MERGED LINKED EVENT DISPLAY
                                                displayItems.push(
                                                    <div
                                                        key={ticketId}
                                                        className="relative ml-3 rounded-xl border border-[#30363d] overflow-hidden group transition-all hover:border-[#484f58]"
                                                    >
                                                        {/* Timeline dot */}
                                                        <div className="absolute -left-5 top-6 h-3 w-3 rounded-full bg-gradient-to-r from-[#22c55e] to-[#ef4444] border-2 border-[#0d1117]" />

                                                        <div className="bg-gradient-to-r from-[#22c55e]/10 via-[#161b22] to-[#ef4444]/10 p-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex items-center gap-1">
                                                                    <div className="p-2 rounded-lg bg-[#22c55e]/20">
                                                                        <Ticket className="h-4 w-4 text-[#22c55e]" />
                                                                    </div>
                                                                    <div className="text-[#484f58] text-lg">→</div>
                                                                    <div className="p-2 rounded-lg bg-[#ef4444]/20">
                                                                        <Ticket className="h-4 w-4 text-[#ef4444]" />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-gradient-to-r from-[#22c55e]/20 to-[#ef4444]/20 text-white">
                                                                            Opened & Closed
                                                                        </span>
                                                                        <span className="flex items-center gap-1 text-xs font-mono text-[#8b949e]">
                                                                            <Hash className="h-3 w-3" />
                                                                            {ticketNumber}
                                                                        </span>
                                                                        {category && (
                                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] uppercase">
                                                                                {category}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p
                                                                        className="text-sm font-medium text-white truncate cursor-pointer hover:text-[#3b82f6] transition-colors"
                                                                        onClick={() => handleTicketClick(ticketId)}
                                                                    >
                                                                        {firstEvent.title}
                                                                    </p>
                                                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-[#484f58] flex-wrap">
                                                                        <span className="flex items-center gap-1 text-[#22c55e]">
                                                                            <Clock className="h-3 w-3" />
                                                                            {format(hasOpen.timestamp, 'h:mm a')}
                                                                        </span>
                                                                        <span className="text-[#484f58]">→</span>
                                                                        <span className="flex items-center gap-1 text-[#ef4444]">
                                                                            <Clock className="h-3 w-3" />
                                                                            {format(hasClosed.timestamp, 'h:mm a')}
                                                                        </span>
                                                                        {hasOpen.metadata?.authorName && (
                                                                            <span className="text-[#8b949e]">by {hasOpen.metadata.authorName}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleTicketClick(ticketId)}
                                                                    className="p-2 rounded-lg bg-[#21262d] text-[#8b949e] hover:text-white hover:bg-[#30363d] transition-colors"
                                                                >
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        });

                                        // Process non-ticket events (wiki, suggestions, etc.)
                                        nonTicketEvents.forEach((event) => {
                                            const Icon = getEventIcon(event.type);
                                            const isWiki = event.type === 'wiki_created' || event.type === 'wiki_edited';
                                            const isSuggestion = event.type === 'suggestion_created';

                                            displayItems.push(
                                                <div
                                                    key={event.id}
                                                    className={cn(
                                                        "relative flex items-start gap-4 p-4 rounded-xl border ml-3 transition-all",
                                                        isWiki && "bg-[#3b82f6]/5 border-[#3b82f6]/20",
                                                        isSuggestion && "bg-[#a855f7]/5 border-[#a855f7]/20"
                                                    )}
                                                >
                                                    {/* Timeline dot */}
                                                    <div className={cn(
                                                        "absolute -left-5 top-5 h-3 w-3 rounded-full border-2 border-[#0d1117]",
                                                        isWiki && "bg-[#3b82f6]",
                                                        isSuggestion && "bg-[#a855f7]"
                                                    )} />

                                                    <div className={cn("p-2.5 rounded-lg shrink-0", isWiki && "bg-[#3b82f6]/20", isSuggestion && "bg-[#a855f7]/20")}>
                                                        <Icon className={cn("h-4 w-4", isWiki && "text-[#3b82f6]", isSuggestion && "text-[#a855f7]")} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide", isWiki && "bg-[#3b82f6]/20 text-[#3b82f6]", isSuggestion && "bg-[#a855f7]/20 text-[#a855f7]")}>
                                                                {event.type.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-medium text-white truncate">{event.title}</p>
                                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-[#484f58]">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {format(event.timestamp, 'h:mm a')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });

                                        return displayItems;
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5" />
                            Staff Notes
                            <span className="text-[10px] font-normal bg-[#21262d] px-2 py-0.5 rounded-full">
                                {notes.length}
                            </span>
                        </h3>

                        {loadingNotes ? (
                            <div className="flex items-center justify-center py-6 text-[#8b949e]">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span className="text-sm">Loading notes...</span>
                            </div>
                        ) : notes.length === 0 ? (
                            <div className="text-center py-6 bg-[#161b22] rounded-xl border border-[#21262d]">
                                <FileText className="h-8 w-8 text-[#484f58] mx-auto mb-2" />
                                <p className="text-sm text-[#484f58]">No notes yet</p>
                                <p className="text-xs text-[#30363d] mt-1">Add a note below to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {notes.map((note) => (
                                    <div
                                        key={note.id}
                                        className="p-4 rounded-xl bg-[#161b22] border border-[#21262d] hover:border-[#30363d] transition-colors"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] flex items-center justify-center text-[10px] font-bold text-white">
                                                {note.authorName.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium text-white">
                                                {note.authorName}
                                            </span>
                                            <span className="text-xs text-[#484f58]">
                                                {note.createdAt?.toDate
                                                    ? format(note.createdAt.toDate(), 'MMM d, h:mm a')
                                                    : 'Just now'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#e6edf3] whitespace-pre-wrap leading-relaxed">
                                            {note.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer - Fixed Note Input */}
                <div className="p-4 border-t border-[#21262d] bg-[#161b22] shrink-0">
                    <div className="flex gap-3">
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Add a staff note..."
                            rows={2}
                            className="flex-1 px-4 py-3 rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-[#484f58] text-sm resize-none focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/50 transition-all"
                        />
                        <button
                            onClick={handleAddNote}
                            disabled={!newNote.trim() || submitting}
                            className="px-5 py-3 rounded-xl bg-[#3b82f6] text-white font-medium text-sm hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shrink-0 self-end"
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
