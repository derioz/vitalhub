import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    addDoc,
    serverTimestamp,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { CalendarEvent, CalendarNote } from '@/types/calendar';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';

// Cache for user names to avoid repeated lookups
const userNameCache: Map<string, string> = new Map();

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

export class CalendarService {
    // Get all events for a specific month
    static async getEventsForMonth(year: number, month: number): Promise<CalendarEvent[]> {
        const events: CalendarEvent[] = [];

        const monthStart = startOfMonth(new Date(year, month));
        const monthEnd = endOfMonth(new Date(year, month));

        // Fetch tickets created in this month
        const ticketsRef = collection(db, 'tickets');
        const ticketsQuery = query(
            ticketsRef,
            where('createdAt', '>=', Timestamp.fromDate(monthStart)),
            where('createdAt', '<=', Timestamp.fromDate(monthEnd)),
            orderBy('createdAt', 'asc')
        );

        const ticketsSnap = await getDocs(ticketsQuery);

        // Process tickets and build events
        for (const docSnap of ticketsSnap.docs) {
            const data = docSnap.data();
            const createdAt = data.createdAt?.toDate() || new Date();
            const closedAt = data.closedAt?.toDate();

            // Get author's custom name from Firestore
            const authorName = await getUserName(data.authorId);

            // Use the actual ticketId field (auto-increment number)
            const displayTicketNumber = data.ticketId || docSnap.id.slice(-6).toUpperCase();

            // Detect if ticket was reopened (has closedAt but status is not CLOSED/RESOLVED)
            const wasReopened = closedAt && (data.status === 'OPEN' || data.status === 'IN_PROGRESS' || data.status === 'WAITING_ON_USER');

            // Check if opened and closed on same day (for linking indicator) - only if NOT reopened
            const isLinked = closedAt && !wasReopened && isSameDay(createdAt, closedAt);

            // Check if ticket spans multiple days (opened and closed on different days)
            const spansMultipleDays = closedAt && !isSameDay(createdAt, closedAt);

            events.push({
                id: `ticket-created-${docSnap.id}`,
                type: 'ticket_opened',
                title: data.subject || 'Untitled',
                timestamp: createdAt,
                metadata: {
                    ticketId: docSnap.id,
                    ticketNumber: displayTicketNumber,
                    status: data.status,
                    authorName: authorName,
                    category: data.category,
                    isLinked: isLinked,
                    wasReopened: wasReopened,
                    // Span data for multi-day tickets
                    openedAt: createdAt.toISOString(),
                    closedAt: closedAt?.toISOString(),
                    spansMultipleDays: spansMultipleDays
                }
            });

            // If ticket has closedAt, add a closed event
            if (closedAt && closedAt >= monthStart && closedAt <= monthEnd) {
                events.push({
                    id: `ticket-closed-${docSnap.id}`,
                    type: 'ticket_closed',
                    title: data.subject || 'Untitled',
                    timestamp: closedAt,
                    metadata: {
                        ticketId: docSnap.id,
                        ticketNumber: displayTicketNumber,
                        isLinked: isLinked,
                        wasReopened: wasReopened,
                        openedAt: createdAt.toISOString(),
                        closedAt: closedAt.toISOString(),
                        spansMultipleDays: spansMultipleDays
                    }
                });
            }
        }

        return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    // Get notes for a specific date
    static async getNotesForDate(dateStr: string): Promise<CalendarNote[]> {
        const notesRef = collection(db, 'calendar_notes');
        const notesQuery = query(
            notesRef,
            where('date', '==', dateStr),
            orderBy('createdAt', 'desc')
        );

        const snap = await getDocs(notesQuery);
        return snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        })) as CalendarNote[];
    }

    // Add a new note
    static async addNote(dateStr: string, content: string, authorId: string, authorName: string): Promise<void> {
        const notesRef = collection(db, 'calendar_notes');
        await addDoc(notesRef, {
            date: dateStr,
            content,
            authorId,
            authorName,
            createdAt: serverTimestamp()
        });
    }
}
