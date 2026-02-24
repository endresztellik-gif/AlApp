import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, UserPlus, Shield, ShieldCheck, ShieldAlert,
    Loader2, X, Check, Ban,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUsersAdmin } from '../hooks/useUsersAdmin';

const roleLabels: Record<string, { label: string; icon: typeof Shield; color: string; bg: string }> = {
    admin: { label: 'Admin', icon: ShieldAlert, color: '#b83c3c', bg: 'rgba(184,60,60,0.09)' },
    reader: { label: 'Olvasó/Szerkesztő', icon: ShieldCheck, color: '#3d7a52', bg: 'rgba(61,122,82,0.09)' },
    user: { label: 'Felhasználó', icon: Shield, color: '#5a7060', bg: 'rgba(90,112,96,0.09)' },
};

const avatarPalette = [
    { a: 'rgba(35,86,52,1)', b: 'rgba(61,122,82,1)' },
    { a: 'rgba(60,100,70,1)', b: 'rgba(90,140,100,1)' },
    { a: 'rgba(100,80,30,1)', b: 'rgba(155,120,45,1)' },
    { a: 'rgba(40,70,55,1)', b: 'rgba(70,110,80,1)' },
];

function avatarGradient(name: string) {
    const p = avatarPalette[name.charCodeAt(0) % avatarPalette.length];
    return `linear-gradient(135deg, ${p.a}, ${p.b})`;
}

export function UsersPage() {
    const { users, isLoading, updateRole, toggleActive, inviteUser, isInviting } = useUsersAdmin();
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteRole, setInviteRole] = useState('user');
    const [editingRole, setEditingRole] = useState<string | null>(null);

    const handleInvite = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await inviteUser({ email: inviteEmail, fullName: inviteName, role: inviteRole });

            // Success toast
            toast.success('Meghívó sikeresen elküldve!', {
                description: `Email elküldve: ${inviteEmail}`
            });

            setShowInvite(false);
            setInviteEmail('');
            setInviteName('');
            setInviteRole('user');
        } catch (err) {
            console.error('Meghívás sikertelen:', err);

            // Error toast with specific message
            const errorMessage = err instanceof Error
                ? err.message
                : 'Ismeretlen hiba történt';

            toast.error('Meghívás sikertelen', {
                description: errorMessage.includes('already')
                    ? 'Ez az email cím már regisztrálva van.'
                    : errorMessage
            });
        }
    }, [inviteEmail, inviteName, inviteRole, inviteUser]);

    const inputStyle = {
        background: 'rgba(235,240,236,0.5)',
        border: '1px solid rgba(90,110,95,0.15)',
        outline: 'none',
    };

    if (isLoading) {
        return (
            <div className="space-y-3 max-w-4xl mx-auto animate-fade-in">
                <div className="skeleton h-24 rounded-2xl" />
                {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
        );
    }

    const activeCount = users.filter(u => u.is_active).length;

    return (
        <div className="space-y-5 max-w-4xl mx-auto">

            {/* ── Command Header ── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-2xl p-6 flex items-center justify-between gap-4"
                style={{
                    background: 'linear-gradient(135deg, rgba(28,72,44,0.97) 0%, rgba(45,72,50,0.94) 100%)',
                    boxShadow: '0 6px 28px -6px rgba(25,65,40,0.45), 0 0 0 1px rgba(61,158,82,0.12)',
                }}
            >
                {/* Grid texture */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,1) 19px, rgba(255,255,255,1) 20px),
                            repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,1) 19px, rgba(255,255,255,1) 20px)`,
                    }}
                />
                <div className="absolute -right-12 -top-12 w-48 h-48 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(61,158,82,0.12) 0%, transparent 70%)' }}
                />

                <div className="relative flex items-center gap-4">
                    <motion.div
                        whileHover={{ scale: 1.08 }}
                        className="p-3 rounded-2xl shrink-0"
                        style={{
                            background: 'rgba(255,255,255,0.10)',
                            boxShadow: '0 0 0 1px rgba(255,255,255,0.12)',
                        }}
                    >
                        <Users className="w-6 h-6 text-white" strokeWidth={1.75} />
                    </motion.div>
                    <div>
                        <p className="text-[9.5px] font-bold tracking-[0.2em] uppercase text-white/40 mb-1">
                            Csapattagok
                        </p>
                        <h1 className="text-[22px] font-bold text-white tracking-tight leading-none">
                            Felhasználók
                        </h1>
                    </div>
                </div>

                <div className="relative flex items-center gap-5">
                    <div className="text-center hidden sm:block">
                        <div className="text-[22px] font-black text-white leading-none">{users.length}</div>
                        <div className="text-[9px] font-semibold text-white/40 uppercase tracking-wide mt-0.5">összes</div>
                    </div>
                    <div className="w-px h-10 hidden sm:block" style={{ background: 'rgba(255,255,255,0.12)' }} />
                    <div className="text-center hidden sm:block">
                        <div className="text-[22px] font-black text-white leading-none">{activeCount}</div>
                        <div className="text-[9px] font-semibold text-white/40 uppercase tracking-wide mt-0.5">aktív</div>
                    </div>
                    <div className="w-px h-10 hidden sm:block" style={{ background: 'rgba(255,255,255,0.12)' }} />

                    <motion.button
                        whileHover={{ scale: 1.04, boxShadow: '0 6px 20px -4px rgba(35,86,52,0.55)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowInvite(!showInvite)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-semibold transition-all"
                        style={{
                            background: 'rgba(255,255,255,0.14)',
                            boxShadow: '0 0 0 1px rgba(255,255,255,0.16)',
                        }}
                    >
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">Meghívás</span>
                    </motion.button>
                </div>
            </motion.div>

            {/* ── Invite Form ── */}
            <AnimatePresence>
                {showInvite && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ ease: [0.22, 1, 0.36, 1] }}
                        onSubmit={handleInvite}
                        className="rounded-2xl overflow-hidden"
                        style={{
                            background: 'var(--color-bg-card)',
                            boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                        }}
                    >
                        <div className="px-6 py-4 border-b flex items-center justify-between"
                            style={{ borderColor: 'rgba(90,110,95,0.10)', background: 'rgba(240,245,241,0.45)' }}>
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg" style={{ background: 'rgba(61,158,82,0.10)' }}>
                                    <UserPlus className="w-3.5 h-3.5 text-primary-600" />
                                </div>
                                <h3 className="text-[13.5px] font-semibold text-text-primary">Új felhasználó meghívása</h3>
                            </div>
                            <button type="button" onClick={() => setShowInvite(false)}
                                className="p-1 rounded-lg hover:bg-black/5 transition-colors">
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid gap-3 sm:grid-cols-3">
                                {[
                                    { label: 'Teljes név', type: 'text', value: inviteName, onChange: (v: string) => setInviteName(v), placeholder: 'Teljes név' },
                                    { label: 'Email cím', type: 'email', value: inviteEmail, onChange: (v: string) => setInviteEmail(v), placeholder: 'pelda@email.com' },
                                ].map(field => (
                                    <div key={field.label}>
                                        <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                                            {field.label}
                                        </label>
                                        <input
                                            type={field.type}
                                            required
                                            value={field.value}
                                            onChange={e => field.onChange(e.target.value)}
                                            placeholder={field.placeholder}
                                            className="w-full rounded-xl px-3 py-2.5 text-[13px] text-text-primary placeholder:text-muted-foreground transition-all"
                                            style={inputStyle}
                                        />
                                    </div>
                                ))}
                                <div>
                                    <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                                        Szerepkör
                                    </label>
                                    <select
                                        value={inviteRole}
                                        onChange={e => setInviteRole(e.target.value)}
                                        className="w-full rounded-xl px-3 py-2.5 text-[13px] text-text-primary transition-all"
                                        style={inputStyle}
                                    >
                                        <option value="user">Felhasználó</option>
                                        <option value="reader">Olvasó/Szerkesztő</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                                <button type="button" onClick={() => setShowInvite(false)}
                                    className="px-4 py-2 rounded-xl text-[12.5px] font-medium text-muted-foreground hover:text-text-primary transition-colors"
                                    style={{ background: 'rgba(90,110,95,0.07)' }}>
                                    Mégse
                                </button>
                                <motion.button
                                    type="submit"
                                    disabled={isInviting}
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-[12.5px] font-semibold disabled:opacity-50"
                                >
                                    {isInviting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Meghívó küldése
                                </motion.button>
                            </div>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* ── Users List ── */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl overflow-hidden"
                style={{
                    background: 'var(--color-bg-card)',
                    boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                }}
            >
                <div className="px-5 py-3.5 border-b flex items-center gap-2.5"
                    style={{ borderColor: 'rgba(90,110,95,0.10)', background: 'rgba(240,245,241,0.45)' }}>
                    <div className="p-1.5 rounded-lg bg-primary-100">
                        <Users className="w-3.5 h-3.5 text-primary-600" />
                    </div>
                    <h2 className="text-[13px] font-semibold text-text-primary">Felhasználók listája</h2>
                    <div className="ml-auto text-[11px] font-medium text-muted-foreground">
                        {activeCount}/{users.length} aktív
                    </div>
                </div>

                <div>
                    {users.map((user, i) => {
                        const roleCfg = roleLabels[user.role] ?? roleLabels.user;
                        const RoleIcon = roleCfg.icon;
                        return (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.035 }}
                                className={`flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-black/[0.018] ${!user.is_active ? 'opacity-45' : ''}`}
                                style={{ borderTop: i > 0 ? '1px solid rgba(90,110,95,0.07)' : 'none' }}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Avatar */}
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                                        style={{
                                            background: avatarGradient(user.full_name || user.email),
                                            boxShadow: '0 2px 6px -2px rgba(0,0,0,0.2)',
                                        }}
                                    >
                                        {(user.full_name || user.email).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-semibold text-text-primary truncate leading-tight">
                                            {user.full_name || user.email.split('@')[0] || 'Névtelen'}
                                        </p>
                                        {!user.full_name && (
                                            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                                        )}
                                        {user.full_name && (
                                            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Invited badge - shows if user hasn't confirmed email yet */}
                                    {!user.email_confirmed_at && user.invited_at && (
                                        <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                            Meghívva
                                        </span>
                                    )}

                                    {editingRole === user.id ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex items-center gap-1"
                                        >
                                            {(['user', 'reader', 'admin'] as const).map(r => (
                                                <button
                                                    key={r}
                                                    onClick={() => { updateRole({ userId: user.id, role: r }); setEditingRole(null); }}
                                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                                                    style={{
                                                        background: user.role === r ? roleLabels[r].bg : 'rgba(90,110,95,0.06)',
                                                        color: user.role === r ? roleLabels[r].color : 'var(--color-text-muted)',
                                                        border: user.role === r ? `1px solid ${roleLabels[r].color}30` : '1px solid transparent',
                                                    }}
                                                >
                                                    {roleLabels[r].label}
                                                </button>
                                            ))}
                                            <button onClick={() => setEditingRole(null)} className="ml-0.5 p-1 rounded-lg hover:bg-black/5 transition-colors">
                                                <X className="w-3 h-3 text-muted-foreground" />
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <button
                                            onClick={() => setEditingRole(user.id)}
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold transition-all hover:opacity-75 active:scale-95"
                                            style={{ background: roleCfg.bg, color: roleCfg.color }}
                                        >
                                            <RoleIcon className="w-3 h-3" />
                                            {roleCfg.label}
                                        </button>
                                    )}

                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => toggleActive({ userId: user.id, isActive: !user.is_active })}
                                        className="p-1.5 rounded-lg transition-colors"
                                        style={{ background: 'rgba(90,110,95,0.07)' }}
                                        title={user.is_active ? 'Deaktiválás' : 'Aktiválás'}
                                    >
                                        {user.is_active ? (
                                            <Check className="w-3.5 h-3.5 text-status-ok" />
                                        ) : (
                                            <Ban className="w-3.5 h-3.5 text-status-critical" />
                                        )}
                                    </motion.button>
                                </div>
                            </motion.div>
                        );
                    })}

                    {users.length === 0 && (
                        <div className="px-5 py-14 text-center">
                            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                                style={{ background: 'rgba(90,110,95,0.07)' }}>
                                <Users className="w-5 h-5 text-muted-foreground opacity-40" />
                            </div>
                            <p className="text-[13px] text-muted-foreground italic">Még nincsenek felhasználók. Hívj meg valakit!</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
