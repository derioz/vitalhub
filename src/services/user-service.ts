import {
    collection,
    doc,
    getDocs,
    getDoc,
    updateDoc,
    setDoc,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Role } from '@/types/user';

export const UserService = {
    createUser: async (uid: string, data: Partial<User>) => {
        const ref = doc(db, 'users', uid);
        await setDoc(ref, {
            ...data,
            id: uid,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            status: 'ACTIVE',
            roles: data.roles || ['role_vital_member']
        }, { merge: true });
    },

    getUser: async (uid: string) => {
        const ref = doc(db, 'users', uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as User;
    },

    /**
     * Get all users. 
     * Note: In a large system, this should be paginated or search-based.
     */
    getAllUsers: async () => {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
    },

    /**
     * Get all available roles, ordered by hierarchy.
     */
    getRoles: async () => {
        const q = query(collection(db, 'roles'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Role));
    },

    /**
     * Update a user's roles.
     */
    updateUserRoles: async (userId: string, roleIds: string[]) => {
        const ref = doc(db, 'users', userId);
        await updateDoc(ref, {
            roles: roleIds
        });
    },

    updateProfile: async (uid: string, data: {
        name?: string;
        photoURL?: string;
        customColor?: string;
        status?: 'ACTIVE' | 'BANNED' | 'RESTRICTED';
    }) => {
        const ref = doc(db, 'users', uid);
        await setDoc(ref, data, { merge: true });
    },

    getStaffMembers: async () => {
        // Fetch all users and filter client-side to assume no complex index needed
        // Optimized for smaller userbases. for larger, use array-contains query.
        const q = query(collection(db, 'users'));
        const snap = await getDocs(q);
        const STAFF_ROLES = ['role_support', 'role_sr_support', 'role_mod', 'role_sr_mod', 'role_admin', 'role_head_admin', 'role_owner', 'role_developer'];

        return snap.docs
            .map(d => ({ id: d.id, ...d.data() } as User))
            .filter(u => u.roles?.some(r => STAFF_ROLES.includes(r)));
    }
};
