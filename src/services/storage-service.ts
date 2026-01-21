import {
    ref,
    uploadBytes,
    getDownloadURL
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

export const StorageService = {
    uploadFile: async (path: string, file: File) => {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    }
};
