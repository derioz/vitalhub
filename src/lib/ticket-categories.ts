import { TicketCategory } from '@/types/ticket';

export interface CategoryConfig {
    label: string;
    emoji: string;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
}

export const TICKET_CATEGORIES: Record<TicketCategory, CategoryConfig> = {
    GENERAL_SUPPORT: {
        label: 'General Support',
        emoji: '❓',
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/20',
        description: 'Basic problems, troubleshooting, game help, general questions'
    },
    DEVELOPER: {
        label: 'Developer',
        emoji: '💻',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/20',
        description: 'Development issues, speaking directly to a developer'
    },
    MANAGEMENT: {
        label: 'Management',
        emoji: '♥️',
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/20',
        description: 'Issues with staff members in or out of city (restricted visibility)'
    },
    PLAYER_REPORT: {
        label: 'Player Report',
        emoji: '❤️‍🔥',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        description: 'Report a player for rule violations. Must include audio/visual POV'
    },
    REFUND: {
        label: 'Refund Request',
        emoji: '💸',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
        description: 'Refunds for bugs, mechanics, crashes (typically 30k+ only)'
    },
    BUSINESS: {
        label: 'Business Management',
        emoji: '💼',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        description: 'Business requests, questions, or information'
    },
    PROPERTY: {
        label: 'Property Management',
        emoji: '🏘️',
        color: 'text-teal-400',
        bgColor: 'bg-teal-500/10',
        borderColor: 'border-teal-500/20',
        description: 'Real estate questions, home issues'
    },
    LEGAL_FACTION: {
        label: 'Legal Faction',
        emoji: '👮',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        description: 'Legal factions: PD, MD, DOJ, DOC, etc.'
    },
    ILLEGAL_FACTION: {
        label: 'Illegal Faction',
        emoji: '🔫',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
        description: 'Illegal factions: gangs, racing crews, starting a gang'
    },
    CREATOR_3D: {
        label: '3D Creator',
        emoji: '💅',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
        description: 'Adding/changing 3D assets: clothes, chains, cars, liveries'
    },
    COMMUNITY_RELATIONS: {
        label: 'Community Relations',
        emoji: '😊',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20',
        description: 'Player events, server access issues, community questions'
    },
    APPEAL: {
        label: 'Appeal',
        emoji: '❌',
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/20',
        description: 'Appealing a punishment, requesting roles returned'
    },
    WHITELIST_HELP: {
        label: 'Whitelist Help',
        emoji: '🪧',
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/10',
        borderColor: 'border-indigo-500/20',
        description: 'Expedited whitelist purchase, whitelisting bot issues'
    }
};

/**
 * Get display string with emoji for a category
 */
export function getCategoryDisplay(category: TicketCategory): string {
    const config = TICKET_CATEGORIES[category];
    return config ? `${config.emoji} ${config.label}` : category;
}

/**
 * Get the category config, with fallback for legacy categories
 */
export function getCategoryConfig(category: string): CategoryConfig {
    // Handle legacy mappings
    const legacyMap: Record<string, TicketCategory> = {
        'SUPPORT': 'GENERAL_SUPPORT',
        'REPORT': 'PLAYER_REPORT',
        'OTHER': 'GENERAL_SUPPORT'
    };

    const mappedCategory = legacyMap[category] || category;

    return TICKET_CATEGORIES[mappedCategory as TicketCategory] || {
        label: category,
        emoji: '📝',
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/20',
        description: ''
    };
}

/**
 * Get all categories as options for dropdowns
 */
export function getCategoryOptions(): { value: TicketCategory; label: string }[] {
    return Object.entries(TICKET_CATEGORIES).map(([key, config]) => ({
        value: key as TicketCategory,
        label: `${config.emoji} ${config.label}`
    }));
}
