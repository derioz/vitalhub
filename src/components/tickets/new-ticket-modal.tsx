import { useState, useRef } from 'react';
import { useAuth } from '@/components/auth-provider';
import { TicketService } from '@/services/ticket-service';
import { FiveManageService } from '@/services/fivemanage-service';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { TicketCategory, TicketPriority } from '@/types/ticket';
import { TICKET_CATEGORIES, getCategoryOptions } from '@/lib/ticket-categories';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NewTicketModal({ isOpen, onClose, onSuccess }: Props) {
    const { user, userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        category: 'GENERAL_SUPPORT' as TicketCategory,
        priority: 'NORMAL' as TicketPriority
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await TicketService.createTicket(
                user.uid,
                user.email || 'Unknown',
                userData?.name || user.displayName || 'Unknown',
                formData.subject,
                formData.description,
                formData.category,
                formData.priority
            );
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to create ticket');
        } finally {
            setLoading(false);
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await FiveManageService.uploadImage(file);
            setFormData(prev => ({
                ...prev,
                description: prev.description ? `${prev.description}\n\n![Image](${url})` : `![Image](${url})`
            }));
        } catch (err) {
            console.error(err);
            alert('Image upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const categoryOptions = getCategoryOptions();
    const selectedCategoryConfig = TICKET_CATEGORIES[formData.category];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-xl border border-[#30363d] bg-[#161b22] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between border-b border-[#30363d] p-4 bg-[#0d1117]/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        Create New Ticket
                    </h2>
                    <button onClick={onClose} className="text-[#8b949e] hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto custom-scrollbar">
                    {/* Category & Priority Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block textxs font-bold text-[#8b949e] uppercase tracking-wider mb-1.5">Category</label>
                            <select
                                className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2.5 text-white focus:border-[#f97316] focus:outline-none transition-all text-sm appearance-none"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value as TicketCategory })}
                            >
                                {categoryOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-1.5">Urgency</label>
                            <select
                                className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2.5 text-white focus:border-[#f97316] focus:outline-none transition-all text-sm appearance-none"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                            >
                                <option value="LOW">🟢 Low (Non-urgent)</option>
                                <option value="NORMAL">🔵 Normal (Standard)</option>
                                <option value="HIGH">🟠 High (Important)</option>
                                <option value="URGENT">🔴 Urgent (Critical)</option>
                            </select>
                        </div>
                    </div>

                    {selectedCategoryConfig?.description && (
                        <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] text-xs text-[#8b949e]">
                            {selectedCategoryConfig.description}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-1.5">Subject</label>
                        <input
                            required
                            className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-4 py-2.5 text-white focus:border-[#f97316] focus:outline-none transition-all placeholder:text-[#484f58] text-sm font-medium"
                            value={formData.subject}
                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="Briefly describe the issue..."
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider">Description</label>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="text-xs text-[#f97316] hover:text-[#ea580c] flex items-center gap-1 font-bold transition-colors"
                            >
                                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                                {uploading ? 'Uploading...' : 'Add Image'}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                        </div>
                        <textarea
                            required
                            rows={8}
                            className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-4 py-3 text-white focus:border-[#f97316] focus:outline-none transition-all placeholder:text-[#484f58] resize-none text-sm leading-relaxed"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Please provide detailed information. You can drag and drop images or paste links here."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-[#30363d]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-bold text-[#8b949e] hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-lg bg-[#238636] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#2ea043] disabled:opacity-50 transition-all shadow-md shadow-green-900/10"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loading ? 'Creating...' : 'Create Ticket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
