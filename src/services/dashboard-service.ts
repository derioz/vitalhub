import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface DashboardStats {
    pendingTickets: number;
    openTickets: number;
    closedTicketsThisWeek: number;
    totalSuggestions: number;
    pendingSuggestions: number;
    wikiDocuments: number;
    totalStaff: number;
}

export interface RecentActivity {
    id: string;
    type: 'ticket' | 'suggestion' | 'wiki';
    title: string;
    timestamp: Date;
    status?: string;
}

export class DashboardService {
    static async getStats(): Promise<DashboardStats> {
        const stats: DashboardStats = {
            pendingTickets: 0,
            openTickets: 0,
            closedTicketsThisWeek: 0,
            totalSuggestions: 0,
            pendingSuggestions: 0,
            wikiDocuments: 0,
            totalStaff: 0
        };

        try {
            // Tickets
            const ticketsRef = collection(db, 'tickets');
            const ticketsSnap = await getDocs(ticketsRef);
            ticketsSnap.forEach((doc) => {
                const data = doc.data();
                if (data.status === 'open') stats.openTickets++;
                if (data.status === 'pending') stats.pendingTickets++;
            });

            // Suggestions
            const suggestionsRef = collection(db, 'suggestions');
            const suggestionsSnap = await getDocs(suggestionsRef);
            stats.totalSuggestions = suggestionsSnap.size;
            suggestionsSnap.forEach((doc) => {
                const data = doc.data();
                if (data.status === 'pending' || data.status === 'open') {
                    stats.pendingSuggestions++;
                }
            });

            // Wiki
            const wikiRef = collection(db, 'wiki_documents');
            const wikiSnap = await getDocs(wikiRef);
            stats.wikiDocuments = wikiSnap.size;

            // Staff (users with elevated roles)
            const usersRef = collection(db, 'users');
            const usersSnap = await getDocs(usersRef);
            usersSnap.forEach((doc) => {
                const data = doc.data();
                const roles = data.roles || [];
                if (roles.some((r: string) => ['role_support', 'role_sr_support', 'role_mod', 'role_sr_mod', 'role_admin', 'role_head_admin', 'role_owner', 'role_developer'].includes(r))) {
                    stats.totalStaff++;
                }
            });

        } catch (err) {
            console.error('Failed to fetch dashboard stats:', err);
        }

        return stats;
    }

    static async getRecentActivity(limitCount: number = 5): Promise<RecentActivity[]> {
        const activities: RecentActivity[] = [];

        try {
            // Recent Tickets
            const ticketsRef = collection(db, 'tickets');
            const ticketsQuery = query(ticketsRef, orderBy('createdAt', 'desc'), limit(limitCount));
            const ticketsSnap = await getDocs(ticketsQuery);
            ticketsSnap.forEach((doc) => {
                const data = doc.data();
                activities.push({
                    id: doc.id,
                    type: 'ticket',
                    title: data.subject || 'Untitled Ticket',
                    timestamp: data.createdAt?.toDate() || new Date(),
                    status: data.status
                });
            });

            // Sort by timestamp
            activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        } catch (err) {
            console.error('Failed to fetch recent activity:', err);
        }

        return activities.slice(0, limitCount);
    }
}
