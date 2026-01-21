'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { StorageService } from '@/services/storage-service';
import { UserService } from '@/services/user-service';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Camera, Save, Loader2, User as UserIcon } from 'lucide-react';

export default function ProfilePage() {
    const { user, userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const [displayName, setDisplayName] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setPreviewUrl(user.photoURL || '');
        }
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setSuccess('');

        try {
            let photoURL = user.photoURL;

            if (avatarFile) {
                const ext = avatarFile.name.split('.').pop();
                const path = `avatars/${user.uid}/${Date.now()}.${ext}`;
                photoURL = await StorageService.uploadFile(path, avatarFile);
            }

            // Update Firebase Auth
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName,
                    photoURL
                });
            }

            // Update Firestore User Document
            await UserService.updateProfile(user.uid, {
                name: displayName,
                photoURL: photoURL || undefined
            });

            setSuccess('Profile updated successfully!');
            // Context will auto-update via onSnapshot in AuthProvider
        } catch (err) {
            console.error(err);
            alert('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
                <p className="text-slate-400">Manage your account details and appearance.</p>
            </div>

            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer">
                            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800">
                                {previewUrl ? (
                                    <img src={previewUrl} className="h-full w-full object-cover" alt="Avatar" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-slate-500">
                                        <UserIcon className="h-10 w-10" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera className="h-6 w-6 text-white" />
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                            />
                        </div>
                        <p className="text-sm text-slate-500">Click to upload new avatar</p>
                    </div>

                    {/* Fields */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400">Display Name</label>
                        <input
                            type="text"
                            required
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-brand-start focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400">Email</label>
                        <input
                            type="text"
                            disabled
                            value={user.email || ''}
                            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-500 cursor-not-allowed"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-end text-white rounded-md hover:bg-orange-500 disabled:opacity-50 font-medium"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        {success && (
                            <p className="text-green-400 text-sm mt-2">{success}</p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
