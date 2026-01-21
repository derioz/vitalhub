import { Timestamp } from 'firebase/firestore';

export type WikiCategory = 'GENERAL' | 'RULES' | 'SOP' | 'LORE' | 'OTHER';

export interface WikiDocument {
    id: string;
    title: string;
    content: string; // Markdown supported
    category: WikiCategory;
    lastUpdatedBy: string; // User Name
    isPinned: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
