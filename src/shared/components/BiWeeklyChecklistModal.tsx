import { useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Camera, AlertTriangle, Send } from 'lucide-react';
import { useOfflineSync } from '@/core/offline/OfflineSyncProvider';
import { db } from '@/core/offline/db';
import { useAuth } from '@/core/auth/useAuth';

interface Props {
    vehicleId: string;
    vehicleName: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function BiWeeklyChecklistModal({ vehicleId, vehicleName, isOpen, onClose, onSuccess }: Props) {
    const { user } = useAuth();
    const { isOnline, syncPendingData } = useOfflineSync();

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [checks, setChecks] = useState({
        oil_ok: true,
        coolant_ok: true,
        lights_ok: true,
        bodywork_ok: true,
    });

    const [issueText, setIssueText] = useState('');
    const [photoUrl] = useState<string | undefined>(undefined);

    const hasIssues = Object.values(checks).some(val => val === false);

    const handleSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);

        try {
            const checklistData = {
                vehicle_id: vehicleId,
                user_id: user.id,
                check_date: new Date().toISOString(),
                oil_ok: checks.oil_ok,
                coolant_ok: checks.coolant_ok,
                lights_ok: checks.lights_ok,
                bodywork_ok: checks.bodywork_ok,
                bodywork_issue_description: hasIssues ? issueText : undefined,
                photo_url: photoUrl,
                createdAt: Date.now()
            };

            // Always save to offline DB first for robust PWA behavior
            await db.pendingChecklists.add(checklistData);

            // Attempt to sync immediately if online
            if (isOnline) {
                await syncPendingData();
            }

            onSuccess();
            onClose();
            // Reset state
            setStep(1);
            setChecks({ oil_ok: true, coolant_ok: true, lights_ok: true, bodywork_ok: true });
            setIssueText('');

        } catch (error) {
            console.error("Failed to save checklist", error);
            toast.error("Váratlan hiba történt a rögzítés során.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const renderToggle = (key: keyof typeof checks, label: string) => (
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-border shadow-sm">
            <span className="text-[14px] font-semibold text-text-primary">{label}</span>
            <div className="flex gap-2">
                <button
                    onClick={() => setChecks(prev => ({ ...prev, [key]: true }))}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${checks[key]
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-50 text-muted-foreground border border-transparent'
                        }`}
                >
                    <CheckCircle2 className="w-4 h-4" /> Rendben
                </button>
                <button
                    onClick={() => setChecks(prev => ({ ...prev, [key]: false }))}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${!checks[key]
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-slate-50 text-muted-foreground border border-transparent'
                        }`}
                >
                    <XCircle className="w-4 h-4" /> Hibás
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 bg-slate-900 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold leading-tight">Kötelező Ellenőrzés</h2>
                            <p className="text-sm font-medium text-white/70">{vehicleName}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto bg-slate-50 flex-1 space-y-4">
                    {!isOnline && (
                        <div className="bg-amber-100 text-amber-800 p-3 rounded-xl text-[12px] font-bold flex items-center gap-2 mb-4 border border-amber-200">
                            <AlertTriangle className="w-4 h-4" />
                            Offline mód: Az adatok a telefonon mentődnek.
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-3"
                            >
                                {renderToggle('oil_ok', 'Motorolaj szint')}
                                {renderToggle('coolant_ok', 'Hűtőfolyadék')}
                                {renderToggle('lights_ok', 'Világítás és Index')}
                                {renderToggle('bodywork_ok', 'Karosszéria épsége')}

                                <div className="pt-4">
                                    <button
                                        onClick={() => hasIssues ? setStep(2) : handleSubmit()}
                                        className="w-full py-4 rounded-2xl bg-primary-600 text-white font-bold text-[15px] shadow-lg shadow-primary-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        {hasIssues ? 'Tovább a hibabejelentéshez' : 'Minden rendben, Beküldés'}
                                        {hasIssues ? null : <CheckCircle2 className="w-5 h-5" />}
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                                    <h3 className="text-[13px] font-bold text-red-800 mb-2">Hibát észleltél. Kérjük, írd le a problémát!</h3>
                                    <textarea
                                        value={issueText}
                                        onChange={e => setIssueText(e.target.value)}
                                        placeholder="Például: Bal első izzó kiégett, vagy alacsony az olajszint..."
                                        className="w-full p-3 rounded-xl border-none outline-none ring-2 ring-red-200 focus:ring-red-400 bg-white text-[14px] min-h-[100px] resize-none"
                                    />
                                </div>

                                {/* Placeholder for native camera input in PWA */}
                                <div className="p-4 bg-white border border-border shadow-sm rounded-2xl flex flex-col items-center justify-center gap-2 text-muted-foreground cursor-pointer hover:bg-slate-50 transition-colors">
                                    <Camera className="w-8 h-8 opacity-50" />
                                    <span className="text-[13px] font-semibold">Fotó készítése (Opcionális)</span>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-4 rounded-2xl bg-slate-200 text-slate-700 font-bold text-[14px] active:scale-[0.98] transition-all"
                                    >
                                        Vissza
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || issueText.length < 5}
                                        className="flex-[2] py-4 rounded-2xl bg-red-600 text-white font-bold text-[15px] shadow-lg shadow-red-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Send className="w-4 h-4" /> Hibabejelentés
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
