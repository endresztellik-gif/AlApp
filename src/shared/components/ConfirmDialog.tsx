import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    variant: 'destructive' | 'warning';
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmLabel = 'Megerősítem',
    variant,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onCancel]);

    const isDestructive = variant === 'destructive';

    const confirmStyle = isDestructive
        ? { background: 'rgba(201,59,59,0.92)', color: '#fff', border: '1px solid rgba(201,59,59,0.3)' }
        : { background: 'rgba(180,110,20,0.90)', color: '#fff', border: '1px solid rgba(180,110,20,0.3)' };

    const iconBg = isDestructive
        ? 'rgba(201,59,59,0.10)'
        : 'rgba(180,110,20,0.10)';

    const iconColor = isDestructive ? '#c93b3b' : '#b46e14';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={onCancel}
                        className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm px-4"
                    >
                        <div
                            className="rounded-2xl p-6 space-y-4"
                            style={{
                                background: 'var(--color-bg-card)',
                                boxShadow: '0 16px 48px -8px rgba(20,40,25,0.22), 0 0 0 1px rgba(90,110,95,0.12)',
                            }}
                        >
                            {/* Ikon + Cím */}
                            <div className="flex items-start gap-3.5">
                                <div
                                    className="mt-0.5 p-2.5 rounded-xl shrink-0"
                                    style={{ background: iconBg }}
                                >
                                    {isDestructive
                                        ? <Trash2 className="w-4.5 h-4.5" style={{ color: iconColor, width: 18, height: 18 }} />
                                        : <AlertTriangle className="w-4.5 h-4.5" style={{ color: iconColor, width: 18, height: 18 }} />
                                    }
                                </div>
                                <div>
                                    <p className="text-[14.5px] font-bold text-text-primary leading-tight">{title}</p>
                                    {description && (
                                        <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">{description}</p>
                                    )}
                                </div>
                            </div>

                            {/* Gombok */}
                            <div className="flex gap-2.5 pt-1">
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-text-secondary transition-colors"
                                    style={{
                                        background: 'var(--color-bg-secondary)',
                                        border: '1px solid rgba(90,110,95,0.15)',
                                    }}
                                >
                                    Mégsem
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={onConfirm}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-opacity hover:opacity-90"
                                    style={confirmStyle}
                                >
                                    {confirmLabel}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
