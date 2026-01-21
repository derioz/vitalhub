import { Timestamp } from 'firebase/firestore';

export interface Role {
    id: string;
    name: string;
    color: string;
    permissions: string[];
    isSystem: boolean;
    order: number;
}

export interface User {
    id: string;
    discordId?: string;
    username: string; // Display Name
    name?: string; // Custom Display Name
    email: string;
    avatarUrl: string;
    roles: string[]; // Role IDs
    customColor?: string; // Staff-set override color
    status: 'ACTIVE' | 'BANNED' | 'RESTRICTED';
    lastLoginAt: Timestamp;
    createdAt: Timestamp;
}
