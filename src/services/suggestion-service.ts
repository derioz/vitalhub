import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    query,
    orderBy,
    serverTimestamp,
    runTransaction,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Suggestion, SuggestionStatus } from '@/types/suggestion';

const COLLECTION = 'suggestions';

export const SuggestionService = {
    getAll: async () => {
        const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Suggestion));
    },

    create: async (title: string, description: string, authorId: string, authorName: string) => {
        await addDoc(collection(db, COLLECTION), {
            title,
            description,
            authorId,
            authorName,
            status: 'PENDING',
            upvotes: [],
            createdAt: serverTimestamp()
        });
    },

    toggleVote: async (suggestionId: string, userId: string) => {
        const ref = doc(db, COLLECTION, suggestionId);

        // We can use a transaction or simple array updates. 
        // Since we need to toggle, a transaction is safer to check existence.
        // simpler approach for now: check local state or just try optional logic.
        // Actually, let's use a transaction to read then write.

        await runTransaction(db, async (transaction) => {
            const sfDoc = await transaction.get(ref);
            if (!sfDoc.exists()) throw "Document does not exist!";

            const data = sfDoc.data() as Suggestion;
            const votes = data.upvotes || [];

            if (votes.includes(userId)) {
                transaction.update(ref, { upvotes: arrayRemove(userId) });
            } else {
                transaction.update(ref, { upvotes: arrayUnion(userId) });
            }
        });
    },

    updateStatus: async (suggestionId: string, status: SuggestionStatus) => {
        const ref = doc(db, COLLECTION, suggestionId);
        await updateDoc(ref, { status });
    }
};
