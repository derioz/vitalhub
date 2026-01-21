'use client';

import { useState } from 'react';
import { SuggestionService } from '@/services/suggestion-service';
import { useAuth } from '@/components/auth-provider';
import { X, Lightbulb, Loader2 } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NewSuggestionModal({ isOpen, onClose, onSuccess }: Props) {
    const { user, userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
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
                userData?.name || user.displayName || 'Unknown'
            );
            onSuccess();
            onClose();
            setFormData({ title: '', description: '' });
        } catch (err) {
            console.error(err);
            alert('Failed to submit suggestion');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl border border-[#30363d] bg-[#161b22] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-[#30363d] p-4 bg-[#0d1117]/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        Submit Suggestion
                    </h2>
                    <button onClick={onClose} className="text-[#8b949e] hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider">Title</label>
                        <input
                            required
                            className="w-full px-3 py-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all font-medium placeholder:text-[#484f58]"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="What's your idea?"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider">Description</label>
                        <textarea
                            required
                            rows={5}
                            className="w-full px-3 py-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all resize-none placeholder:text-[#484f58]"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Tell us more about how this improves the city..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-[#8b949e] hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-[#d29922] hover:bg-[#b08800] rounded-lg text-sm font-bold text-white shadow-lg shadow-yellow-900/20 transition-all disabled:opacity-50"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loading ? 'Submitting...' : 'Send Suggestion'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
