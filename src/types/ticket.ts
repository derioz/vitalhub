import { Timestamp } from 'firebase/firestore';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_USER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TicketCategory =
    | 'GENERAL_SUPPORT'      // ❓ General Support Tickets
    | 'DEVELOPER'            // 💻 Developer Ticket  
    | 'MANAGEMENT'           // ♥️ Management (staff issues)
    | 'PLAYER_REPORT'        // ❤️‍🔥 Player Report
    | 'REFUND'               // 💸 Refund Requests
    | 'BUSINESS'             // 💼 Business Management
    | 'PROPERTY'             // 🏘️ Property Management
    | 'LEGAL_FACTION'        // 👮 Legal Faction Management
    | 'ILLEGAL_FACTION'      // 🔫 Illegal Faction Management
    | 'CREATOR_3D'           // 💅 3D Creator Tickets
    | 'COMMUNITY_RELATIONS'  // 😊 Community Relations
    | 'APPEAL'               // ❌ Appeals
    | 'WHITELIST_HELP';      // 🪧 Whitelist Help

export interface Ticket {
    id: string; // The Firestore Document ID (UUID)
    ticketId: number; // The readable Auto-Increment ID (e.g. #1042)
    authorId: string;
    authorEmail?: string; // Snapshot for display
    authorName?: string; // Snapshot for display
    subject: string;
    description: string;
    category: TicketCategory;
    status: TicketStatus;
    priority: TicketPriority;
    assignedToUserId?: string;
    assignedTo?: string; // Staff user ID
    assignedToName?: string; // Staff display name
    tags: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
    closedAt?: Timestamp;
}

export interface TicketMessage {
    id: string;
    ticketId: string; // Ref to Firestore Doc ID
    authorId: string;
    authorName: string;
    authorRoleColor?: string;
    content: string;
    isInternal: boolean;
    attachments: string[];
    createdAt: Timestamp;
}
