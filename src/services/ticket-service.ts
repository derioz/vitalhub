import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    runTransaction,
    limit,
    Timestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Ticket, TicketCategory, TicketPriority } from '@/types/ticket';

const COLLECTION = 'tickets';
const COUNTER_DOC = 'counters/tickets';

export const TicketService = {
    /**
     * Create a new ticket with an auto-incrementing ID.
     * Uses a transaction to ensure no duplicates.
     */
    createTicket: async (
        authorId: string,
        authorEmail: string,
        authorName: string,
        subject: string,
        description: string,
        category: TicketCategory,
        priority: TicketPriority = 'NORMAL'
    ) => {
        return await runTransaction(db, async (transaction) => {
            // 1. Get Auto-Increment ID
            const counterRef = doc(db, COUNTER_DOC);
            const counterSnap = await transaction.get(counterRef);

            let nextId = 1000;
            if (counterSnap.exists()) {
                nextId = counterSnap.data().current + 1;
            }

            // 2. Create Ticket Ref
            const ticketRef = doc(collection(db, COLLECTION));

            // 3. Prepare Data
            const ticketData: Omit<Ticket, 'id'> & { id?: string } = { // id is added by doc ref
                ticketId: nextId,
                authorId,
                authorEmail,
                authorName,
                subject,
                description,
                category,
                priority,
                status: 'OPEN',
                tags: [],
                createdAt: serverTimestamp() as Timestamp, // Cast for TS, handled by SDK
                updatedAt: serverTimestamp() as Timestamp,
            };

            // 4. Writes
            transaction.set(counterRef, { current: nextId }, { merge: true });
            transaction.set(ticketRef, ticketData);

            // Return the new ID
            return ticketRef.id;
        });
    },

    /**
     * Fetch tickets for a user or all tickets (if staff).
     * Currently fetches all for simplicity, RBAC filtered by Rules or UI.
     */
    getTickets: async (userId?: string) => {
        let q = query(
            collection(db, COLLECTION),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Ticket));
    },

    getMemberTickets: async (userId: string) => {
        const q = query(
            collection(db, COLLECTION),
            where('authorId', '==', userId)
            // Removed orderBy and limit to avoid composite index requirements for now
        );
        const snap = await getDocs(q);
        const tickets = snap.docs.map(d => ({ id: d.id, ...d.data() } as Ticket));

        // Client-side sort
        return tickets.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
    },

    getTicket: async (id: string) => {
        const ref = doc(db, COLLECTION, id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as Ticket;
    },

    addMessage: async (ticketId: string, authorId: string, authorName: string, content: string, isInternal: boolean = false) => {
        const ref = collection(db, COLLECTION, ticketId, 'messages');
        await addDoc(ref, {
            authorId,
            authorName,
            content,
            isInternal,
            attachments: [],
            createdAt: serverTimestamp()
        });
    },

    subscribeToMessages: (ticketId: string, callback: (messages: any[]) => void) => {
        const q = query(
            collection(db, COLLECTION, ticketId, 'messages'),
            orderBy('createdAt', 'asc')
        );
        return onSnapshot(q, (snap) => {
            const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            callback(msgs);
        });
    },

    updateStatus: async (ticketId: string, status: string) => {
        const ref = doc(db, COLLECTION, ticketId);
        await runTransaction(db, async (t) => {
            t.update(ref, {
                status,
                updatedAt: serverTimestamp(),
                ...(status === 'CLOSED' ? { closedAt: serverTimestamp() } : {})
            });
        });
    },

    /**
     * Get comprehensive ticket statistics
     */
    getTicketStats: async () => {
        const ticketsRef = collection(db, COLLECTION);
        const snap = await getDocs(ticketsRef);

        const stats = {
            total: 0,
            open: 0,
            inProgress: 0,
            pending: 0,
            closed: 0,
            byPriority: { URGENT: 0, HIGH: 0, NORMAL: 0, LOW: 0 },
            byCategory: {} as Record<string, number>,
            avgResolutionHours: 0,
            resolvedToday: 0,
            createdToday: 0,
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let totalResolutionTime = 0;
        let resolvedCount = 0;

        snap.docs.forEach((d) => {
            const data = d.data();
            stats.total++;

            // Status counts
            switch (data.status) {
                case 'OPEN': stats.open++; break;
                case 'IN_PROGRESS': stats.inProgress++; break;
                case 'WAITING_ON_USER': stats.pending++; break;
                case 'CLOSED':
                case 'RESOLVED':
                    stats.closed++;
                    break;
            }

            // Priority counts
            const priority = data.priority || 'NORMAL';
            if (stats.byPriority[priority as keyof typeof stats.byPriority] !== undefined) {
                stats.byPriority[priority as keyof typeof stats.byPriority]++;
            }

            // Category counts
            const category = data.category || 'OTHER';
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

            // Resolution time calculation
            if (data.closedAt && data.createdAt) {
                const created = data.createdAt.toDate?.() || new Date(data.createdAt);
                const closed = data.closedAt.toDate?.() || new Date(data.closedAt);
                totalResolutionTime += (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
                resolvedCount++;

                if (closed >= today) {
                    stats.resolvedToday++;
                }
            }

            // Created today
            const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
            if (createdAt >= today) {
                stats.createdToday++;
            }
        });

        stats.avgResolutionHours = resolvedCount > 0 ? Math.round(totalResolutionTime / resolvedCount) : 0;

        return stats;
    },

    /**
     * Assign ticket to staff member
     */
    assignTicket: async (ticketId: string, assigneeId: string, assigneeName: string) => {
        const ref = doc(db, COLLECTION, ticketId);
        await runTransaction(db, async (t) => {
            t.update(ref, {
                assignedTo: assigneeId,
                assignedToName: assigneeName,
                status: 'IN_PROGRESS',
                updatedAt: serverTimestamp()
            });
        });
    },

    /**
     * Escalate ticket priority
     */
    escalateTicket: async (ticketId: string, newPriority: TicketPriority) => {
        const ref = doc(db, COLLECTION, ticketId);
        await runTransaction(db, async (t) => {
            t.update(ref, {
                priority: newPriority,
                updatedAt: serverTimestamp()
            });
        });
    },

    /**
     * Bulk update ticket statuses
     */
    bulkUpdateStatus: async (ticketIds: string[], status: string) => {
        for (const ticketId of ticketIds) {
            const ref = doc(db, COLLECTION, ticketId);
            await runTransaction(db, async (t) => {
                t.update(ref, {
                    status,
                    updatedAt: serverTimestamp(),
                    ...(status === 'CLOSED' ? { closedAt: serverTimestamp() } : {})
                });
            });
        }
    },

    /**
     * Update arbitrary ticket metadata
     */
    updateTicketMetadata: async (ticketId: string, metadata: Partial<Ticket>) => {
        const ref = doc(db, COLLECTION, ticketId);
        await updateDoc(ref, {
            ...metadata,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Bulk assign tickets
     */
    bulkAssign: async (ticketIds: string[], assigneeId: string, assigneeName: string) => {
        for (const ticketId of ticketIds) {
            const ref = doc(db, COLLECTION, ticketId);
            await runTransaction(db, async (t) => {
                t.update(ref, {
                    assignedTo: assigneeId,
                    assignedToName: assigneeName,
                    status: 'IN_PROGRESS',
                    updatedAt: serverTimestamp()
                });
            });
        }
    },

    /**
     * Get filtered tickets
     */
    getFilteredTickets: async (filters: {
        status?: string;
        priority?: string;
        category?: string;
        assignedTo?: string;
        limit?: number;
    }) => {
        let q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));

        if (filters.status) {
            q = query(q, where('status', '==', filters.status));
        }
        if (filters.priority) {
            q = query(q, where('priority', '==', filters.priority));
        }
        if (filters.category) {
            q = query(q, where('category', '==', filters.category));
        }
        if (filters.assignedTo) {
            q = query(q, where('assignedTo', '==', filters.assignedTo));
        }
        if (filters.limit) {
            q = query(q, limit(filters.limit));
        }

        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Ticket));
    },

    /**
     * Subscribe to real-time ticket updates
     */
    subscribeToTickets: (callback: (tickets: Ticket[]) => void) => {
        const q = query(
            collection(db, COLLECTION),
            orderBy('createdAt', 'desc'),
            limit(100)
        );
        return onSnapshot(q, (snap) => {
            const tickets = snap.docs.map(d => ({ id: d.id, ...d.data() } as Ticket));
            callback(tickets);
        });
    },

    /**
     * One-time sync to backfill missing authorNames for legacy tickets
     */
    syncTicketNames: async () => {
        const snap = await getDocs(collection(db, COLLECTION));
        const updates = [];

        // Cache for users to avoid redundant fetches
        const userCache: Record<string, string> = {};

        for (const d of snap.docs) {
            const data = d.data();
            if (!data.authorName && data.authorId) {
                let name = userCache[data.authorId];
                if (!name) {
                    const userDoc = await getDoc(doc(db, 'users', data.authorId));
                    if (userDoc.exists()) {
                        name = userDoc.data().name || userDoc.data().username || data.authorEmail?.split('@')[0] || 'Unknown';
                        userCache[data.authorId] = name;
                    }
                }

                if (name) {
                    updates.push(runTransaction(db, async (t) => {
                        t.update(doc(db, COLLECTION, d.id), { authorName: name });
                    }));
                }
            }
        }

        await Promise.all(updates);
        return updates.length;
    }
};
