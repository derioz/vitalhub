'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { SuggestionService } from '@/services/suggestion-service';
import { X, Lightbulb } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NewSuggestionModal({ isOpen, onClose, onSuccess }: Props) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await SuggestionService.create(
                formData.title,
                formData.description,
                user.uid,
                user.displayName || 'User'
            );
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to submit suggestion');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 p-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-brand-start" />
                        Submit Suggestion
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400">Title</label>
                        <input
                            required
                            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-brand-start focus:outline-none"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. New Police Cars"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400">Description</label>
                        <textarea
                            required
                            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-brand-start focus:outline-none h-32"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe your idea..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-md bg-brand-end px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Idea'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
