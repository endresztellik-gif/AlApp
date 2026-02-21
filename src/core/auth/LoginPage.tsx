import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/core/auth/useAuth';
import { TreePine, Mail, Lock, ArrowRight, Loader2, Leaf, FlaskConical } from 'lucide-react';

/**
 * Bejelentkezési oldal – email/jelszó vagy Magic Link.
 */
export const LoginPage = () => {
    const { t } = useTranslation();
    const { signIn, signInWithMagicLink, resetPassword } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [mode, setMode] = useState<'login' | 'magic-link' | 'reset'>('login');

    const handleLogin = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setIsLoading(true);
            setError(null);
            try {
                await signIn(email, password);
                navigate('/dashboard', { replace: true });
            } catch (err: unknown) {
                console.error('[LoginPage] Login error:', err);
                setError(t('auth.login_error'));
            } finally {
                setIsLoading(false);
            }
        },
        [email, password, signIn, t, navigate]
    );

    const handleMagicLink = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setIsLoading(true);
            setError(null);
            try {
                await signInWithMagicLink(email);
                setSuccessMessage(t('auth.magic_link_success'));
            } catch {
                setError(t('common.error'));
            } finally {
                setIsLoading(false);
            }
        },
        [email, signInWithMagicLink, t]
    );

    const handleResetPassword = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setIsLoading(true);
            setError(null);
            try {
                await resetPassword(email);
                setSuccessMessage(t('auth.reset_password_success'));
            } catch {
                setError(t('common.error'));
            } finally {
                setIsLoading(false);
            }
        },
        [email, resetPassword, t]
    );

    const handleSubmit =
        mode === 'login'
            ? handleLogin
            : mode === 'magic-link'
                ? handleMagicLink
                : handleResetPassword;

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
            style={{ background: 'linear-gradient(150deg, #EEF7F0 0%, #F4EFE5 40%, #F7ECD3 100%)' }}
        >
            {/* Organikus háttér dekoráció */}
            {/* Nagy levél - bal felső */}
            <motion.div
                animate={{ rotate: [0, 4, -2, 0], y: [0, -8, -3, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-16 -left-16 w-80 h-80 opacity-[0.07] pointer-events-none"
            >
                <Leaf className="w-full h-full text-primary-700" strokeWidth={0.4} />
            </motion.div>

            {/* Közepes levél - jobb alsó */}
            <motion.div
                animate={{ rotate: [0, -5, 3, 0], y: [0, 6, 2, 0] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                className="absolute -bottom-20 -right-12 w-72 h-72 opacity-[0.06] pointer-events-none"
                style={{ transform: 'scaleX(-1)' }}
            >
                <Leaf className="w-full h-full text-primary-700" strokeWidth={0.4} />
            </motion.div>

            {/* Kis levél - jobb felső */}
            <motion.div
                animate={{ rotate: [0, 8, -3, 0], x: [0, 4, -1, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
                className="absolute top-12 right-8 w-24 h-24 opacity-[0.08] pointer-events-none"
            >
                <Leaf className="w-full h-full text-secondary-600" strokeWidth={0.5} />
            </motion.div>

            {/* Organikus blob háttér — meleg folt */}
            <div
                className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(184,135,42,0.07) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                }}
            />
            <div
                className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(58,139,76,0.08) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                }}
            />

            {/* Kártya */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-[400px]"
            >
                {/* Fejlesztési banner */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-3 rounded-xl overflow-hidden"
                >
                    <div className="dev-banner px-4 py-2 flex items-center gap-2">
                        <FlaskConical className="w-3.5 h-3.5 text-secondary-700 flex-shrink-0" />
                        <span className="text-[11px] font-semibold text-secondary-700">
                            Az alkalmazás fejlesztés alatt áll
                        </span>
                    </div>
                </motion.div>

                {/* Fő login kártya */}
                <div
                    className="rounded-2xl border border-white/70 p-8"
                    style={{
                        background: 'rgba(253, 250, 245, 0.92)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        boxShadow: '0 20px 60px -12px rgba(30, 50, 35, 0.14), 0 4px 16px -4px rgba(30,50,35,0.08), 0 0 0 1px rgba(255,255,255,0.8) inset',
                    }}
                >
                    {/* Logo */}
                    <div className="mb-8 flex flex-col items-center gap-3">
                        <motion.div
                            whileHover={{ rotate: [0, -6, 5, 0], scale: 1.05 }}
                            transition={{ duration: 0.5 }}
                            className="rounded-[18px] gradient-primary p-4 shadow-lg"
                            style={{ boxShadow: '0 8px 24px -6px rgba(35,86,52,0.45)' }}
                        >
                            <TreePine className="h-9 w-9 text-white" strokeWidth={1.8} />
                        </motion.div>
                        <div className="text-center">
                            <h1 className="text-[26px] font-bold tracking-tight text-gradient leading-none mb-1.5">
                                AlApp
                            </h1>
                            <p className="text-[13px] text-muted-foreground font-medium">
                                {mode === 'reset'
                                    ? t('auth.reset_password_title')
                                    : 'Dunai Osztály nyilvántartási rendszere'}
                            </p>
                        </div>
                    </div>

                    {/* Mód váltó tab */}
                    <AnimatePresence mode="wait">
                        <form
                            key={mode}
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-text-secondary">
                                    {t('auth.email')}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-11 w-full rounded-xl border border-border bg-background pl-10 text-[14px] transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder={t('auth.email_placeholder')}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Jelszó */}
                            {mode === 'login' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-text-secondary">
                                        {t('auth.password')}
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            id="password"
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="h-11 w-full rounded-xl border border-border bg-background pl-10 text-[14px] transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                                            placeholder={t('auth.password_placeholder')}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* Hibaüzenet */}
                            <AnimatePresence>
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                                        exit={{ opacity: 0, y: -4, height: 0 }}
                                        className="rounded-xl px-4 py-2.5 text-[12.5px] text-status-critical status-critical"
                                    >
                                        {error}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            {/* Sikerüzenet */}
                            <AnimatePresence>
                                {successMessage && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                                        exit={{ opacity: 0, y: -4, height: 0 }}
                                        className="rounded-xl px-4 py-2.5 text-[12.5px] status-ok"
                                    >
                                        {successMessage}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            {/* Bejelentkezés gomb */}
                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                whileHover={{ y: -1, boxShadow: '0 6px 16px -4px rgba(35,86,52,0.35)' }}
                                whileTap={{ scale: 0.98, y: 0 }}
                                className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-3 text-[14px] font-semibold text-white transition-all duration-200 disabled:opacity-60"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="h-4 w-4" />
                                )}
                                {mode === 'login'
                                    ? t('auth.login_button')
                                    : mode === 'magic-link'
                                        ? t('auth.magic_link_button')
                                        : t('auth.reset_password_button')}
                            </motion.button>
                        </form>
                    </AnimatePresence>

                    {/* Mód váltó linkek */}
                    <div className="mt-6 flex flex-col items-center gap-2">
                        {mode === 'login' && (
                            <>
                                <button
                                    onClick={() => { setMode('magic-link'); setError(null); setSuccessMessage(null); }}
                                    className="text-[12.5px] font-medium text-primary-600 transition-colors hover:text-primary-700"
                                >
                                    {t('auth.magic_link_button')}
                                </button>
                                <button
                                    onClick={() => { setMode('reset'); setError(null); setSuccessMessage(null); }}
                                    className="text-[12px] text-muted-foreground transition-colors hover:text-text-secondary"
                                >
                                    {t('auth.forgot_password')}
                                </button>
                            </>
                        )}
                        {mode !== 'login' && (
                            <button
                                onClick={() => { setMode('login'); setError(null); setSuccessMessage(null); }}
                                className="text-[12.5px] font-medium text-primary-600 transition-colors hover:text-primary-700 flex items-center gap-1"
                            >
                                ← {t('auth.login_title')}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div >
    );
}
