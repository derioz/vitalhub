'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { WikiService } from '@/services/wiki-service';
import { WikiCategory } from '@/types/wiki';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { X } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NewWikiModal({ isOpen, onClose, onSuccess }: Props) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        category: 'GENERAL' as WikiCategory,
        initialContent: '# New Document\nStart writing here...'
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await WikiService.createDoc(
                formData.title,
                formData.category,
                formData.initialContent,
                user.displayName || user.email || 'Unknown'
            );
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to create document');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 p-4">
                    <h2 className="text-lg font-semibold text-white">Create Document</h2>
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
                            placeholder="e.g. Server Rules v2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400">Category</label>
                        <select
                            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-brand-start focus:outline-none"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value as WikiCategory })}
                        >
                            <option value="GENERAL">General</option>
                            <option value="RULES">Rules</option>
                            <option value="SOP">SOP</option>
                            <option value="LORE">Lore</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400">Content</label>
                        <MarkdownEditor
                            value={formData.initialContent}
                            onChange={(val) => setFormData({ ...formData, initialContent: val })}
                            placeholder="# Heading\n\nStart typing..."
                            className="mt-1 w-full min-h-[300px]"
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
                            {loading ? 'Create' : 'Create Document'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
