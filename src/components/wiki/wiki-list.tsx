'use client';

import { useEffect, useState } from 'react';
import { WikiService } from '@/services/wiki-service';
import { WikiDocument } from '@/types/wiki';
import { cn } from '@/lib/utils';
import { FileText, Book } from 'lucide-react';

interface Props {
    refreshTrigger: number;
}

export function WikiList({ refreshTrigger }: Props) {
    const [docs, setDocs] = useState<WikiDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDocs();
    }, [refreshTrigger]);

    const loadDocs = async () => {
        setLoading(true);
        try {
            const data = await WikiService.getAllDocs();
            setDocs(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-slate-500 p-4">Loading documents...</div>;

    const grouped = docs.reduce((acc, doc) => {
        const cat = doc.category || 'OTHER';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(doc);
        return acc;
    }, {} as Record<string, WikiDocument[]>);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
                        <Book className="h-4 w-4 text-brand-start" />
                        {category}
                    </h3>
                    <div className="space-y-2">
                        {items.map(doc => (
                            <div
                                key={doc.id}
                                onClick={() => window.location.href = `/dashboard/wiki/${doc.id}`}
                                className="group flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-800 hover:border-brand-start/30 cursor-pointer transition-all"
                            >
                                <FileText className="h-8 w-8 text-slate-600 group-hover:text-brand-start transition-colors" />
                                <div>
                                    <p className="font-medium text-slate-200 group-hover:text-white transition-colors">{doc.title}</p>
                                    <p className="text-xs text-slate-500">
                                        Updated {doc.updatedAt?.seconds ? new Date(doc.updatedAt.seconds * 1000).toLocaleDateString() : ''}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {docs.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500">
                    No documents found. Create one to get started.
                </div>
            )}
        </div>
    );
}
