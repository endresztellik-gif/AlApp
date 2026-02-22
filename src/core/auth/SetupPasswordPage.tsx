import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/core/auth/useAuth';
import { validatePassword } from '@/shared/utils/passwordValidation';
import { TreePine, Lock, Eye, EyeOff, CheckCircle2, XCircle, ArrowRight, Loader2, Leaf, Shield } from 'lucide-react';

/**
 * Jelszó beállító oldal – meghívott felhasználók első belépésekor.
 */
export const SetupPasswordPage = () => {
    const { setupPassword } = useAuth();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    const validation = validatePassword(password);
    const passwordsMatch = password === confirmPassword;
    const canSubmit = validation.isValid && passwordsMatch && confirmPassword.length > 0;

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!canSubmit) return;

            setIsLoading(true);
            setError(null);
            try {
                await setupPassword(password);
                navigate('/dashboard', { replace: true });
            } catch (err: unknown) {
                console.error('[SetupPasswordPage] Password setup error:', err);
                setError(err instanceof Error ? err.message : 'Hiba történt a jelszó beállítása során');
            } finally {
                setIsLoading(false);
            }
        },
        [password, canSubmit, setupPassword, navigate]
    );

    useEffect(() => {
        if (password.length > 0 && !touched) {
            setTouched(true);
        }
    }, [password, touched]);

    const getStrengthColor = () => {
        if (!touched || password.length === 0) return 'bg-border';
        switch (validation.strength) {
            case 'strong': return 'bg-status-ok';
            case 'medium': return 'bg-secondary-500';
            case 'weak': return 'bg-status-critical';
        }
    };

    const getStrengthLabel = () => {
        if (!touched || password.length === 0) return '';
        switch (validation.strength) {
            case 'strong': return 'Erős jelszó';
            case 'medium': return 'Közepes jelszó';
            case 'weak': return 'Gyenge jelszó';
        }
    };

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

            {/* Organikus blob háttér */}
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
                className="relative w-full max-w-[480px]"
            >
                {/* Fő kártya */}
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
                                Jelszó beállítása
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Jelszó mező */}
                        <div>
                            <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-text-secondary">
                                Új jelszó
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-[14px] transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="Adja meg az új jelszavát"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-text-secondary transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Jelszó erősség mutató */}
                        {touched && password.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] font-medium text-muted-foreground">
                                        Jelszó erőssége
                                    </span>
                                    <span className={`text-[12px] font-semibold ${
                                        validation.strength === 'strong' ? 'text-status-ok' :
                                        validation.strength === 'medium' ? 'text-secondary-600' :
                                        'text-status-critical'
                                    }`}>
                                        {getStrengthLabel()}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: validation.strength === 'strong' ? '100%' :
                                                   validation.strength === 'medium' ? '66%' : '33%'
                                        }}
                                        className={`h-full ${getStrengthColor()} transition-all duration-300`}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Követelmények */}
                        {touched && password.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="rounded-xl bg-surface p-4 space-y-2"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="h-3.5 w-3.5 text-primary-600" />
                                    <span className="text-[12px] font-semibold text-text-secondary">
                                        Jelszó követelmények
                                    </span>
                                </div>
                                <RequirementItem
                                    met={password.length >= 8}
                                    text="Legalább 8 karakter"
                                />
                                <RequirementItem
                                    met={/[a-z]/.test(password)}
                                    text="Kisbetű (a-z)"
                                />
                                <RequirementItem
                                    met={/[A-Z]/.test(password)}
                                    text="Nagybetű (A-Z)"
                                />
                                <RequirementItem
                                    met={/\d/.test(password)}
                                    text="Szám (0-9)"
                                />
                                <RequirementItem
                                    met={/[@$!%*?&]/.test(password)}
                                    text="Speciális karakter (@$!%*?&)"
                                />
                            </motion.div>
                        )}

                        {/* Jelszó megerősítés */}
                        <div>
                            <label htmlFor="confirmPassword" className="mb-1.5 block text-[13px] font-semibold text-text-secondary">
                                Jelszó megerősítése
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-[14px] transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="Erősítse meg a jelszavát"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-text-secondary transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {confirmPassword.length > 0 && !passwordsMatch && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-1.5 text-[12px] text-status-critical flex items-center gap-1"
                                >
                                    <XCircle className="h-3 w-3" />
                                    A jelszavak nem egyeznek
                                </motion.p>
                            )}
                            {confirmPassword.length > 0 && passwordsMatch && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-1.5 text-[12px] text-status-ok flex items-center gap-1"
                                >
                                    <CheckCircle2 className="h-3 w-3" />
                                    A jelszavak egyeznek
                                </motion.p>
                            )}
                        </div>

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

                        {/* Beküldés gomb */}
                        <motion.button
                            type="submit"
                            disabled={!canSubmit || isLoading}
                            whileHover={canSubmit ? { y: -1, boxShadow: '0 6px 16px -4px rgba(35,86,52,0.35)' } : {}}
                            whileTap={canSubmit ? { scale: 0.98, y: 0 } : {}}
                            className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-3 text-[14px] font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ArrowRight className="h-4 w-4" />
                            )}
                            Jelszó beállítása
                        </motion.button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

// Segéd komponens a követelmények megjelenítéséhez
function RequirementItem({ met, text }: { met: boolean; text: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
        >
            {met ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-status-ok flex-shrink-0" />
            ) : (
                <XCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            )}
            <span className={`text-[12px] ${met ? 'text-text-secondary font-medium' : 'text-muted-foreground'}`}>
                {text}
            </span>
        </motion.div>
    );
}
