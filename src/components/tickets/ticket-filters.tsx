'use client';

import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { TicketCategory, TicketStatus, TicketPriority } from '@/types/ticket';
import { getCategoryOptions, TICKET_CATEGORIES } from '@/lib/ticket-categories';
import { cn } from '@/lib/utils';

export interface TicketFilters {
    search: string;
    status: TicketStatus | 'ALL';
    priority: TicketPriority | 'ALL';
    category: TicketCategory | 'ALL';
    assignee: 'ALL' | 'UNASSIGNED' | 'MINE';
}

interface TicketFiltersProps {
    filters: TicketFilters;
    onFiltersChange: (filters: TicketFilters) => void;
    currentUserId?: string;
    className?: string;
}

const STATUS_OPTIONS: { value: TicketStatus | 'ALL'; label: string; color?: string }[] = [
    { value: 'ALL', label: 'All Status' },
    { value: 'OPEN', label: '🟢 Open', color: 'text-green-400' },
    { value: 'IN_PROGRESS', label: '🔵 In Progress', color: 'text-blue-400' },
    { value: 'WAITING_ON_USER', label: '🟡 Waiting', color: 'text-yellow-400' },
    { value: 'RESOLVED', label: '🟣 Resolved', color: 'text-purple-400' },
    { value: 'CLOSED', label: '⚫ Closed', color: 'text-slate-400' },
];

const PRIORITY_OPTIONS: { value: TicketPriority | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'All Priority' },
    { value: 'URGENT', label: '🔴 Urgent' },
    { value: 'HIGH', label: '🟠 High' },
    { value: 'NORMAL', label: '🔵 Normal' },
    { value: 'LOW', label: '🟢 Low' },
];

const ASSIGNEE_OPTIONS = [
    { value: 'ALL', label: 'All Assignees' },
    { value: 'UNASSIGNED', label: '👤 Unassigned' },
    { value: 'MINE', label: '📌 Assigned to Me' },
];

export function TicketFiltersBar({ filters, onFiltersChange, className }: TicketFiltersProps) {
    const categoryOptions = getCategoryOptions();

    const activeFilterCount = [
        filters.status !== 'ALL',
        filters.priority !== 'ALL',
        filters.category !== 'ALL',
        filters.assignee !== 'ALL',
        filters.search.length > 0,
    ].filter(Boolean).length;

    const clearAllFilters = () => {
        onFiltersChange({
            search: '',
            status: 'ALL',
            priority: 'ALL',
            category: 'ALL',
            assignee: 'ALL',
        });
    };

    return (
        <div className={cn("space-y-3", className)}>
            {/* Search Bar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg">
                    <Search className="h-4 w-4 text-[#8b949e]" />
                    <input
                        type="text"
                        placeholder="Search by ticket ID, subject, or author..."
                        value={filters.search}
                        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-[#484f58] focus:outline-none"
                    />
                    {filters.search && (
                        <button
                            onClick={() => onFiltersChange({ ...filters, search: '' })}
                            className="text-[#8b949e] hover:text-white"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {activeFilterCount > 0 && (
                    <button
                        onClick={clearAllFilters}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#f97316] hover:text-[#fb923c] transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                        Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                    </button>
                )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-[#8b949e]">
                    <Filter className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Filters:</span>
                </div>

                {/* Status Filter */}
                <select
                    value={filters.status}
                    onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as TicketStatus | 'ALL' })}
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-lg border bg-[#0d1117] focus:outline-none focus:border-[#f97316] transition-colors",
                        filters.status !== 'ALL'
                            ? "border-[#f97316]/50 text-[#f97316]"
                            : "border-[#30363d] text-white"
                    )}
                >
                    {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                {/* Priority Filter */}
                <select
                    value={filters.priority}
                    onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value as TicketPriority | 'ALL' })}
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-lg border bg-[#0d1117] focus:outline-none focus:border-[#f97316] transition-colors",
                        filters.priority !== 'ALL'
                            ? "border-[#f97316]/50 text-[#f97316]"
                            : "border-[#30363d] text-white"
                    )}
                >
                    {PRIORITY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                {/* Category Filter */}
                <select
                    value={filters.category}
                    onChange={(e) => onFiltersChange({ ...filters, category: e.target.value as TicketCategory | 'ALL' })}
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-lg border bg-[#0d1117] focus:outline-none focus:border-[#f97316] transition-colors",
                        filters.category !== 'ALL'
                            ? "border-[#f97316]/50 text-[#f97316]"
                            : "border-[#30363d] text-white"
                    )}
                >
                    <option value="ALL">All Categories</option>
                    {categoryOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                {/* Assignee Filter */}
                <select
                    value={filters.assignee}
                    onChange={(e) => onFiltersChange({ ...filters, assignee: e.target.value as 'ALL' | 'UNASSIGNED' | 'MINE' })}
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-lg border bg-[#0d1117] focus:outline-none focus:border-[#f97316] transition-colors",
                        filters.assignee !== 'ALL'
                            ? "border-[#f97316]/50 text-[#f97316]"
                            : "border-[#30363d] text-white"
                    )}
                >
                    {ASSIGNEE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export const defaultFilters: TicketFilters = {
    search: '',
    status: 'ALL',
    priority: 'ALL',
    category: 'ALL',
    assignee: 'ALL',
};
