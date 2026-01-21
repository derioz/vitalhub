import { Timestamp } from 'firebase/firestore';

export type SuggestionStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'IMPLEMENTED';

export interface Suggestion {
    id: string;
    title: string;
    description: string;
    authorId: string;
    authorName: string;
    status: SuggestionStatus;
    upvotes: string[]; // List of User IDs who voted
    createdAt: Timestamp;
}
