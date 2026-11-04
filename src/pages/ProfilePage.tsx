import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import TopBar, { TopBarButton } from '../components/TopBar';
import ErrorState from '../components/ErrorState';
import { authApi, errorMessage } from '../lib/api';
import { useAuth, useRequireAuth } from '../hooks/useAuth';
import { useGoBack } from '../hooks/useGoBack';
import { useLoad } from '../hooks/useLoad';

const INPUT = 'w-full rounded-xl bg-slate-100 dark:bg-slate-800/50 border-none h-12 px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/50';
const LABEL = 'text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest px-1';
const BUTTON = 'w-full h-12 rounded-xl bg-primary text-background-dark font-bold transition-all active:scale-[0.98] disabled:opacity-60';

export const ProfilePage: React.FC = () => {
    useRequireAuth();
    const goBack = useGoBack('/settings');
    // Loaded from the server: the stored user does not say whether the account has a password
    const me = useLoad(authApi.getMe);

    return (
        <PageLayout
            header={<TopBar title="Personal Information" left={<TopBarButton icon="arrow_back_ios_new" label="Back" onClick={goBack} />} />}
        >
            <main className="flex-1 px-4 py-6 pb-32 space-y-8">
                {me.error ? (
                    <ErrorState message={me.error} onRetry={me.reload} />
                ) : me.loading || !me.data ? (
                    <div className="space-y-3">
                        <div className="h-4 w-24 skeleton" />
                        <div className="h-12 w-full skeleton rounded-xl" />
                    </div>
                ) : (
                    <>
                        <NameForm key={me.data.user.id} initialName={me.data.user.name} email={me.data.user.email} />
                        <PasswordForm hasPassword={me.data.hasPassword} onChanged={me.reload} />
                    </>
                )}
            </main>
        </PageLayout>
    );
};

const NameForm: React.FC<{ initialName: string; email: string }> = ({ initialName, email }) => {
    const { updateUser } = useAuth();
    const [name, setName] = useState(initialName);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const res = await authApi.updateProfile({ name });
            updateUser(res.user);
            setName(res.user.name);
            setMessage({ ok: true, text: 'Name saved' });
        } catch (err) {
            setMessage({ ok: false, text: errorMessage(err) });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <label htmlFor="profile-name" className={LABEL}>Display name</label>
            <input id="profile-name" className={INPUT} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
            <p className="px-1 text-sm text-slate-500 dark:text-slate-400">{email}</p>
            {message && <p className={`text-sm ${message.ok ? 'text-primary' : 'text-red-400'}`}>{message.text}</p>}
            <button type="submit" disabled={saving || !name.trim()} className={BUTTON}>{saving ? 'Saving...' : 'Save name'}</button>
        </form>
    );
};

const PasswordForm: React.FC<{ hasPassword: boolean; onChanged: () => void }> = ({ hasPassword, onChanged }) => {
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (next !== confirm) {
            setMessage({ ok: false, text: 'The new passwords do not match' });
            return;
        }
        setSaving(true);
        setMessage(null);
        try {
            await authApi.changePassword({ currentPassword: hasPassword ? current : undefined, newPassword: next });
            setCurrent('');
            setNext('');
            setConfirm('');
            setMessage({ ok: true, text: 'Password changed' });
            if (!hasPassword) onChanged();
        } catch (err) {
            setMessage({ ok: false, text: errorMessage(err) });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <h2 className={LABEL}>{hasPassword ? 'Change password' : 'Set a password'}</h2>
            {!hasPassword && (
                <p className="px-1 text-sm text-slate-500 dark:text-slate-400">You sign in with Google. A password lets you also sign in with your email.</p>
            )}
            {hasPassword && (
                <>
                    <label htmlFor="profile-current" className="sr-only">Current password</label>
                    <input id="profile-current" type="password" autoComplete="current-password" placeholder="Current password" className={INPUT} value={current} onChange={(e) => setCurrent(e.target.value)} required />
                </>
            )}
            <label htmlFor="profile-new" className="sr-only">New password</label>
            <input id="profile-new" type="password" autoComplete="new-password" placeholder="New password (at least 6 characters)" className={INPUT} value={next} onChange={(e) => setNext(e.target.value)} minLength={6} required />
            <label htmlFor="profile-confirm" className="sr-only">Confirm new password</label>
            <input id="profile-confirm" type="password" autoComplete="new-password" placeholder="Confirm new password" className={INPUT} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            {message && <p className={`text-sm ${message.ok ? 'text-primary' : 'text-red-400'}`}>{message.text}</p>}
            <button type="submit" disabled={saving} className={BUTTON}>{saving ? 'Saving...' : hasPassword ? 'Change password' : 'Set password'}</button>
        </form>
    );
};

export default ProfilePage;
