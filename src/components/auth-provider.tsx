'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
    User as FirebaseUser,
    GoogleAuthProvider,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Types
interface AuthState {
    user: FirebaseUser | null; // The raw Firebase User
    userData: any | null; // The Firestore User Document
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
    user: null,
    userData: null,
    loading: true,
    signInWithGoogle: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    // Sync User Data
    useEffect(() => {
        let unsubscribeDoc: (() => void) | null = null;
        let unsubscribeAuth: (() => void) | null = null;

        unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            // If there's an existing doc listener, clean it up first
            if (unsubscribeDoc) {
                unsubscribeDoc();
                unsubscribeDoc = null;
            }

            if (currentUser) {
                setUser(currentUser);
                setLoading(true); // Only set loading true if we are potentially switching users

                try {
                    const userRef = doc(db, 'users', currentUser.uid);

                    // Listen to the user document
                    unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
                        if (docSnap.exists()) {
                            setUserData(docSnap.data());
                        } else {
                            // If doc doesn't exist, create it
                            const newUserData = {
                                id: currentUser.uid,
                                email: currentUser.email,
                                username: currentUser.displayName || 'Unknown',
                                avatarUrl: currentUser.photoURL || '',
                                roles: ['role_vital_member'],
                                status: 'ACTIVE',
                                onboardingCompleted: false,
                                createdAt: serverTimestamp(),
                                lastLoginAt: serverTimestamp(),
                            };
                            // We don't await this inside the synchronous snapshot callback, but we trigger it.
                            setDoc(userRef, newUserData).catch(console.error);
                            setUserData(newUserData);
                        }
                        setLoading(false); // Ensure loading is cleared once data is received
                    }, (error) => {
                        console.error("Firestore Snapshot Error:", error);
                        setLoading(false); // Ensure loading is cleared even on error
                    });

                    // Update Last Login independently to avoid write loops in snapshot
                    setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true }).catch(console.error);

                } catch (error) {
                    console.error("Auth Data Sync Error:", error);
                    setLoading(false);
                }
            } else {
                setUser(null);
                setUserData(null);
                setLoading(false);
            }
        });

        return () => {
            if (unsubscribeAuth) unsubscribeAuth();
            if (unsubscribeDoc) unsubscribeDoc();
        };
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login Failed", error);
            throw error;
        }
    };

    const logout = async () => {
        await firebaseSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
