import { motion } from 'framer-motion';
import { ToggleLeft, ToggleRight, Package, Cpu } from 'lucide-react';
import { useFeatureFlagsAdmin } from '../hooks/useFeatureFlagsAdmin';

const moduleIcons: Record<string, string> = {
    module_personnel: '👤',
    module_vehicles: '🚗',
    module_equipment: '🔧',
    module_calendar: '📅',
    module_incidents: '⚠️',
    module_other: '📦',
    feature_qr_codes: '📱',
    feature_offline_write: '📡',
};

const moduleAccents: Record<string, string> = {
    module_personnel: '#3d9e52',
    module_vehicles: '#5a7a50',
    module_equipment: '#6b8560',
    module_calendar: '#4a7255',
    module_incidents: '#a07828',
    feature_qr_codes: '#4a9060',
    feature_offline_write: '#3a8060',
};

type FlagItem = { id: string; key: string; description: string | null; enabled: boolean };

function FlagGroup({ items, title, icon: Icon, toggle, isToggling }: {
    items: FlagItem[];
    title: string;
    icon: typeof Package;
    toggle: (params: { id: string; enabled: boolean }) => void;
    isToggling: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl overflow-hidden"
            style={{
                background: 'var(--color-bg-card)',
                boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
            }}
        >
            <div className="px-5 py-3.5 border-b flex items-center gap-2.5"
                style={{ borderColor: 'rgba(90,110,95,0.10)', background: 'rgba(240,245,241,0.45)' }}>
                <div className="p-1.5 rounded-lg bg-primary-100">
                    <Icon className="w-3.5 h-3.5 text-primary-600" />
                </div>
                <h2 className="text-[13px] font-semibold text-text-primary">{title}</h2>
                <div className="ml-auto flex items-center gap-1.5">
                    <div className="text-[11px] text-muted-foreground font-medium">
                        {items.filter(f => f.enabled).length}/{items.length} aktív
                    </div>
                </div>
            </div>

            <div>
                {items.map((flag, i) => {
                    const accent = moduleAccents[flag.key] ?? '#3d9e52';
                    return (
                        <motion.div
                            key={flag.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                            className="flex items-center gap-4 px-5 py-4 hover:bg-black/[0.015] transition-colors"
                            style={{ borderTop: i > 0 ? '1px solid rgba(90,110,95,0.07)' : 'none' }}
                        >
                            {/* Status dot */}
                            <div className="relative shrink-0">
                                <motion.div
                                    animate={{
                                        scale: flag.enabled ? [1, 1.3, 1] : 1,
                                        opacity: flag.enabled ? 1 : 0.3,
                                    }}
                                    transition={{ duration: 0.5, times: [0, 0.5, 1] }}
                                    className="w-2 h-2 rounded-full"
                                    style={{ background: flag.enabled ? accent : 'rgba(90,110,95,0.3)' }}
                                />
                            </div>

                            {/* Emoji + Info */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-lg w-7 text-center shrink-0 leading-none">
                                    {moduleIcons[flag.key] ?? '📦'}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-text-primary leading-tight truncate">
                                        {flag.description}
                                    </p>
                                    <p className="text-[10.5px] text-muted-foreground font-mono mt-0.5 truncate">
                                        {flag.key}
                                    </p>
                                </div>
                            </div>

                            {/* Toggle */}
                            <motion.button
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => toggle({ id: flag.id, enabled: !flag.enabled })}
                                disabled={isToggling}
                                title={flag.enabled ? 'Kikapcsolás' : 'Bekapcsolás'}
                                className="shrink-0 transition-all disabled:opacity-50 focus:outline-none"
                            >
                                {flag.enabled ? (
                                    <ToggleRight className="w-8 h-8" style={{ color: accent }} />
                                ) : (
                                    <ToggleLeft className="w-8 h-8 text-muted-foreground opacity-40" />
                                )}
                            </motion.button>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}

export function FeatureFlagsPage() {
    const { flags, isLoading, toggle, isToggling } = useFeatureFlagsAdmin();

    if (isLoading) {
        return (
            <div className="space-y-3 max-w-3xl mx-auto animate-fade-in">
                <div className="skeleton h-24 rounded-2xl" />
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
        );
    }

    const modules = flags.filter(f => f.key.startsWith('module_'));
    const features = flags.filter(f => f.key.startsWith('feature_'));
    const enabledCount = flags.filter(f => f.enabled).length;

    return (
        <div className="space-y-5 max-w-3xl mx-auto">

            {/* ── Header Panel ── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-2xl p-6 flex items-center justify-between gap-4"
                style={{
                    background: 'linear-gradient(135deg, rgba(28,72,44,0.97) 0%, rgba(50,75,48,0.94) 100%)',
                    boxShadow: '0 6px 28px -6px rgba(25,65,40,0.45), 0 0 0 1px rgba(61,158,82,0.12)',
                }}
            >
                <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,1) 19px, rgba(255,255,255,1) 20px),
                            repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,1) 19px, rgba(255,255,255,1) 20px)`,
                    }}
                />
                <div className="absolute -right-12 -top-12 w-48 h-48 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(160,120,40,0.15) 0%, transparent 70%)' }}
                />

                <div className="relative flex items-center gap-4">
                    <motion.div
                        whileHover={{ rotate: 15, scale: 1.08 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="p-3 rounded-2xl shrink-0"
                        style={{
                            background: 'rgba(255,255,255,0.10)',
                            boxShadow: '0 0 0 1px rgba(255,255,255,0.12)',
                        }}
                    >
                        <Cpu className="w-6 h-6 text-white" strokeWidth={1.75} />
                    </motion.div>
                    <div>
                        <p className="text-[9.5px] font-bold tracking-[0.2em] uppercase text-white/40 mb-1">
                            Rendszer konfiguráció
                        </p>
                        <h1 className="text-[22px] font-bold text-white tracking-tight leading-none">
                            Modulok kezelése
                        </h1>
                        <p className="text-[12px] text-white/50 mt-1">
                            Modulok és funkciók be- és kikapcsolása
                        </p>
                    </div>
                </div>

                <div className="relative flex items-center gap-5 shrink-0">
                    <div className="text-center hidden sm:block">
                        <div className="text-[22px] font-black text-white leading-none">{enabledCount}</div>
                        <div className="text-[9px] font-semibold text-white/40 uppercase tracking-wide mt-0.5">aktív</div>
                    </div>
                    <div className="w-px h-10 hidden sm:block" style={{ background: 'rgba(255,255,255,0.12)' }} />
                    <div className="text-center hidden sm:block">
                        <div className="text-[22px] font-black text-white leading-none">{flags.length}</div>
                        <div className="text-[9px] font-semibold text-white/40 uppercase tracking-wide mt-0.5">összes</div>
                    </div>
                </div>
            </motion.div>

            <FlagGroup items={modules} title="Modulok" icon={Package} toggle={toggle} isToggling={isToggling} />
            {features.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                >
                    <FlagGroup items={features} title="Kísérleti funkciók" icon={Cpu} toggle={toggle} isToggling={isToggling} />
                </motion.div>
            )}
        </div>
    );
}
