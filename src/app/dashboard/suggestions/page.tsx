'use client';

import { useState } from 'react';
import { SuggestionList } from '@/components/suggestions/suggestion-list';
import { NewSuggestionModal } from '@/components/suggestions/new-suggestion-modal';
import { Plus } from 'lucide-react';

export default function SuggestionsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Suggestions</h2>
                    <p className="text-slate-400">Vote on community ideas.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 rounded-md bg-gradient-to-r from-brand-start to-brand-end px-4 py-2 text-sm font-medium text-white hover:brightness-110"
                >
                    <Plus className="h-4 w-4" />
                    Submit Idea
                </button>
            </div>

            <SuggestionList refreshTrigger={refreshTrigger} />

            <NewSuggestionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => setRefreshTrigger(prev => prev + 1)}
            />
        </div>
    );
}
