'use client';

import { use, useEffect, useState } from 'react';
import { WikiService } from '@/services/wiki-service';
import { WikiDocument } from '@/types/wiki';
import { useAuth } from '@/components/auth-provider';
import { ArrowLeft, Edit2, Save, X } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Props {
    id: string;
}

export function WikiArticleClient({ id }: Props) {
    const { user } = useAuth();
    const router = useRouter();

    const [doc, setDoc] = useState<WikiDocument | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Edit State
    const [editContent, setEditContent] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadDoc();
    }, [id]);

    const loadDoc = async () => {
        setLoading(true);
        try {
            const data = await WikiService.getDoc(id);
            setDoc(data);
            if (data) setEditContent(data.content);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!doc || !user) return;
        setSaving(true);
        try {
            await WikiService.updateDoc(doc.id, { content: editContent }, user.displayName || 'User');
            setDoc(prev => prev ? ({ ...prev, content: editContent }) : null);
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Loading document...</div>;
    if (!doc) return <div className="p-8 text-red-500">Document not found.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/wiki" className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">{doc.title}</h1>
                        <p className="text-sm text-slate-500">
                            Category: {doc.category} • Last updated by {doc.lastUpdatedBy}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div>
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-start/10 text-brand-start border border-brand-start/20 rounded-md hover:bg-brand-start/20 transition-colors text-sm font-medium"
                        >
                            <Edit2 className="h-4 w-4" />
                            Edit Content
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 min-h-[500px]">
                {isEditing ? (
                    <textarea
                        className="w-full h-[600px] bg-transparent text-slate-200 font-mono text-sm focus:outline-none resize-y"
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                    />
                ) : (
                    <div className="prose prose-invert max-w-none prose-headings:text-brand-start prose-a:text-brand-end prose-strong:text-white">
                        <ReactMarkdown>{doc.content}</ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}
