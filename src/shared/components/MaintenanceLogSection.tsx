import { useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Calendar, Plus, Trash2, ShieldCheck, Settings, AlertCircle, RefreshCw } from 'lucide-react';
import { useMaintenance, MaintenanceLog } from '../hooks/useMaintenance';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { useAuth } from '@/core/auth/useAuth';

interface Props {
    entityId: string;
}

const TYPE_CONFIG = {
    vizsga: { label: 'Műszaki vizsga', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
    szerviz: { label: 'Kötelező szerviz', icon: Settings, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
    javitas: { label: 'Javítás', icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' },
    egyeb: { label: 'Egyéb', icon: AlertCircle, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
};

export function MaintenanceLogSection({ entityId }: Props) {
    const { profile: userProfile, user } = useAuth();
    const { logs, isLoading, create, remove, isCreating } = useMaintenance(entityId);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [formData, setFormData] = useState({
        type: 'szerviz' as MaintenanceLog['type'],
        date: new Date().toISOString().split('T')[0],
        description: '',
        cost: '',
        new_validity_date: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            await create({
                entity_id: entityId,
                user_id: user.id,
                type: formData.type,
                date: new Date(formData.date).toISOString(),
                description: formData.description,
                cost: formData.cost ? Number(formData.cost) : undefined,
                new_validity_date: (formData.type === 'vizsga' && formData.new_validity_date)
                    ? new Date(formData.new_validity_date).toISOString()
                    : undefined,
            });
            setIsFormOpen(false);
            setFormData({
                type: 'szerviz',
                date: new Date().toISOString().split('T')[0],
                description: '',
                cost: '',
                new_validity_date: '',
            });
        } catch (error) {
            console.error(error);
            toast.error("Hiba történt a mentés során.");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Biztosan törölni szeretnéd ezt a bejegyzést?")) {
            try {
                await remove(id);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_err) {
                toast.error("A törlés sikertelen. Lehet, hogy nincs rá jogosultságod.");
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl overflow-hidden"
            style={{
                background: 'var(--color-bg-card)',
                boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
            }}
        >
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between"
                style={{ borderColor: 'rgba(90,110,95,0.10)', background: 'rgba(240,245,241,0.4)' }}>
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg" style={{ background: 'rgba(59,130,246,0.12)' }}>
                        <Wrench className="w-4 h-4 text-primary-600" style={{ color: '#3b82f6' }} />
                    </div>
                    <h2 className="text-[14px] font-semibold text-text-primary">
                        Karbantartási Napló
                    </h2>
                </div>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors flex items-center gap-1.5"
                >
                    {isFormOpen ? 'Mégsem' : <><Plus className="w-3 h-3" /> Új bejegyzés</>}
                </button>
            </div>

            {/* Form */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-b border-border/50"
                    >
                        <form onSubmit={handleSubmit} className="p-6 bg-slate-50/50 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Típus</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as MaintenanceLog['type'] })}
                                        className="w-full px-3 py-2 rounded-xl border border-input bg-white text-[13px] focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    >
                                        <option value="szerviz">Kötelező szerviz</option>
                                        <option value="javitas">Javítás</option>
                                        <option value="vizsga">Műszaki vizsga</option>
                                        <option value="egyeb">Egyéb</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Dátum</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-input bg-white text-[13px] focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Leírás (Mit csináltak?)</label>
                                <textarea
                                    required
                                    rows={2}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-input bg-white text-[13px] focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                                    placeholder="Pl. olajcsere, fékbetét csere..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Költség (Ft) - opc.</label>
                                    <input
                                        type="number"
                                        value={formData.cost}
                                        onChange={e => setFormData({ ...formData, cost: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-input bg-white text-[13px] focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                        placeholder="0"
                                    />
                                </div>
                                {formData.type === 'vizsga' && (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                                        <label className="block text-[11px] font-semibold text-status-ok uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                            <RefreshCw className="w-3 h-3" /> Új Lejárati Dátum
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.new_validity_date}
                                            onChange={e => setFormData({ ...formData, new_validity_date: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-[13px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        />
                                    </motion.div>
                                )}
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="px-4 py-2 rounded-xl bg-primary-600 text-white text-[13px] font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                                >
                                    Rögzítés
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List */}
            <div className="p-6">
                {isLoading ? (
                    <div className="animate-pulse space-y-3">
                        <div className="h-16 bg-muted/20 rounded-xl" />
                        <div className="h-16 bg-muted/20 rounded-xl" />
                    </div>
                ) : !logs || logs.length === 0 ? (
                    <div className="text-center py-6">
                        <Wrench className="w-8 h-8 text-muted-foreground/25 mx-auto mb-2" />
                        <p className="text-[13px] text-muted-foreground italic">Még nincs rögzítve karbantartás.</p>
                    </div>
                ) : (
                    <div className="space-y-3 relative before:absolute before:inset-y-3 before:left-[19px] before:w-0.5 before:bg-border/60">
                        {logs.map((log) => {
                            const config = TYPE_CONFIG[log.type] || TYPE_CONFIG.egyeb;
                            const Icon = config.icon;

                            return (
                                <div key={log.id} className="relative pl-12">
                                    {/* Timeline dot */}
                                    <div className={`absolute left-0 top-3 w-10 h-10 rounded-full border-4 border-white ${config.bg} ${config.color} flex items-center justify-center shadow-sm`}>
                                        <Icon className="w-4 h-4" />
                                    </div>

                                    <div className="p-4 rounded-xl border border-border/50 bg-white hover:border-border/80 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${config.bg} ${config.color} ${config.border}`}>
                                                        {config.label}
                                                    </span>
                                                    <span className="text-[12px] text-muted-foreground flex items-center gap-1 font-medium">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {format(new Date(log.date), "yyyy. MMMM d.", { locale: hu })}
                                                    </span>
                                                </div>
                                            </div>
                                            {userProfile?.role === 'admin' && (
                                                <button
                                                    onClick={() => handleDelete(log.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        <p className="text-[13px] text-text-primary font-medium leading-relaxed mb-3">
                                            {log.description}
                                        </p>

                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground border-t border-border/40 pt-2.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-4 h-4 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-[9px]">
                                                    {log.user?.full_name?.charAt(0) || '?'}
                                                </span>
                                                <span>{log.user?.full_name}</span>
                                            </div>
                                            {log.cost && (
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <span>Költség:</span>
                                                    <span className="text-text-primary">{new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(log.cost)}</span>
                                                </div>
                                            )}
                                            {log.new_validity_date && (
                                                <div className="flex items-center gap-1.5 font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                                    <RefreshCw className="w-3 h-3" />
                                                    Így meghosszabbítva: {format(new Date(log.new_validity_date), "yyyy. MM. dd.")}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
