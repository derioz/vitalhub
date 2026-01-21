import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    orderBy,
    where,
    limit,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { WikiDocument, WikiCategory } from '@/types/wiki';

const COLLECTION = 'wiki_documents';

export const WikiService = {
    getAllDocs: async () => {
        const q = query(collection(db, COLLECTION), orderBy('title', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as WikiDocument));
    },

    getDoc: async (id: string) => {
        const ref = doc(db, COLLECTION, id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as WikiDocument;
    },

    createDoc: async (title: string, category: WikiCategory, content: string, authorName: string) => {
        await addDoc(collection(db, COLLECTION), {
            title,
            category,
            content,
            lastUpdatedBy: authorName,
            isPinned: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    },

    updateDoc: async (id: string, data: Partial<WikiDocument>, authorName: string) => {
        const ref = doc(db, COLLECTION, id);
        await updateDoc(ref, {
            ...data,
            lastUpdatedBy: authorName,
            updatedAt: serverTimestamp()
        });
    },

    getAnnouncements: async () => {
        const q = query(
            collection(db, COLLECTION),
            where('category', '==', 'ANNOUNCEMENT'),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as WikiDocument));
    }
};
