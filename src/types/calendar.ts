import { Timestamp } from 'firebase/firestore';

export interface CalendarNote {
    id: string;
    date: string; // YYYY-MM-DD format
    content: string;
    authorId: string;
    authorName: string;
    createdAt: Timestamp;
}

export interface CalendarEvent {
    id: string;
    type: 'ticket_opened' | 'ticket_closed' | 'ticket_reopened' | 'wiki_created' | 'wiki_edited' | 'suggestion_created';
    title: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

export interface DayData {
    date: Date;
    events: CalendarEvent[];
    notes: CalendarNote[];
}
