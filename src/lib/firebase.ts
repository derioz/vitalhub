'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDeCTvYcVUvRWO4I_DmNZgTH14487os-XY",
    authDomain: "vitalstaffpanel.firebaseapp.com",
    projectId: "vitalstaffpanel",
    storageBucket: "vitalstaffpanel.firebasestorage.app",
    messagingSenderId: "619517136721",
    appId: "1:619517136721:web:a573828084a6269a288d70",
    measurementId: "G-R28XVTQKPW"
};

import { getStorage } from 'firebase/storage';

// Singleton pattern to avoid re-initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
