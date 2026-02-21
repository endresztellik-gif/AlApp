import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuditLogs } from '../hooks/useAuditLogsAdmin';
import { useUsersAdmin } from '../hooks/useUsersAdmin';
import {
    Calendar,
    ChevronDown,
    ChevronUp,
    Activity,
    User,
} from 'lucide-react';

const actionConfig: Record<string, { bg: string; color: string; label: string }> = {
    create: { bg: 'rgba(61,158,82,0.10)', color: '#3d9e52', label: 'létrehozás' },
    delete: { bg: 'rgba(184,60,60,0.10)', color: '#b83c3c', label: 'törlés' },
    update: { bg: 'rgba(160,120,40,0.10)', color: '#a07828', label: 'módosítás' },
    login: { bg: 'rgba(60,100,160,0.10)', color: '#3c78b8', label: 'bejelentkezés' },
    logout: { bg: 'rgba(90,90,110,0.10)', color: '#60607a', label: 'kijelentkezés' },
    export: { bg: 'rgba(80,120,160,0.10)', color: '#507896', label: 'export' },
};

export function AuditLogPage() {
    const [filters, setFilters] = useState({
        userId: '',
        action: '',
        startDate: '',
        endDate: '',
        page: 1,
    });

    const { data, isLoading } = useAuditLogs({
        userId: filters.userId || undefined,
        action: filters.action || undefined,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        page: filters.page,
        pageSize: 20,
    });

    const { users } = useUsersAdmin();

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const [expandedRows, setExpandedRows] = useState<string[]>([]);
    const toggleRow = (id: string) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const inputStyle = {
        background: 'rgba(235,240,236,0.5)',
        border: '1px solid rgba(90,110,95,0.15)',
        outline: 'none',
    };

    if (isLoading) {
        return (
            <div className="space-y-3 max-w-6xl mx-auto animate-fade-in">
                <div className="skeleton h-24 rounded-2xl" />
                <div className="skeleton h-14 rounded-xl" />
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}
            </div>
        );
    }

    return (
        <div className="space-y-5 max-w-6xl mx-auto">

            {/* ── Header Panel ── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-2xl p-6 flex items-center justify-between gap-4"
                style={{
                    background: 'linear-gradient(135deg, rgba(28,72,44,0.97) 0%, rgba(42,68,48,0.94) 100%)',
                    boxShadow: '0 6px 28px -6px rgba(25,65,40,0.45), 0 0 0 1px rgba(61,158,82,0.12)',
                }}
            >
                <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,1) 19px, rgba(255,255,255,1) 20px),
                            repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,1) 19px, rgba(255,255,255,1) 20px)`,
                    }}
                />
                <div className="absolute -right-16 -top-16 w-56 h-56 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(61,158,82,0.10) 0%, transparent 70%)' }}
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
                        <Activity className="w-6 h-6 text-white" strokeWidth={1.75} />
                    </motion.div>
                    <div>
                        <p className="text-[9.5px] font-bold tracking-[0.2em] uppercase text-white/40 mb-1">
                            Biztonsági napló
                        </p>
                        <h1 className="text-[22px] font-bold text-white tracking-tight leading-none">
                            Audit Napló
                        </h1>
                        <p className="text-[12px] text-white/50 mt-1">
                            Rendszer szintű tevékenységek nyomon követése
                        </p>
                    </div>
                </div>

                {data && (
                    <div className="relative flex items-center gap-5 shrink-0">
                        <div className="text-center hidden sm:block">
                            <div className="text-[22px] font-black text-white leading-none">{data.count}</div>
                            <div className="text-[9px] font-semibold text-white/40 uppercase tracking-wide mt-0.5">bejegyzés</div>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* ── Filter Bar ── */}
            <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl p-4 flex flex-wrap gap-3 items-end"
                style={{
                    background: 'var(--color-bg-card)',
                    boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                }}
            >
                {/* User filter */}
                <div className="flex-1 min-w-[160px]">
                    <label className="block text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                        Felhasználó
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <select
                            className="w-full pl-9 pr-3 py-2 rounded-xl text-[12.5px] text-text-primary"
                            style={inputStyle}
                            value={filters.userId}
                            onChange={e => handleFilterChange('userId', e.target.value)}
                        >
                            <option value="">Összes felhasználó</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.full_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Action filter */}
                <div className="flex-1 min-w-[140px]">
                    <label className="block text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                        Művelet
                    </label>
                    <div className="relative">
                        <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <select
                            className="w-full pl-9 pr-3 py-2 rounded-xl text-[12.5px] text-text-primary"
                            style={inputStyle}
                            value={filters.action}
                            onChange={e => handleFilterChange('action', e.target.value)}
                        >
                            <option value="">Összes</option>
                            {['create', 'update', 'delete', 'login', 'logout', 'export'].map(action => (
                                <option key={action} value={action}>{action}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Date filters */}
                <div>
                    <label className="block text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                        Kezdő dátum
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <input
                            type="date"
                            className="pl-9 pr-3 py-2 rounded-xl text-[12.5px] text-text-primary"
                            style={inputStyle}
                            value={filters.startDate}
                            onChange={e => handleFilterChange('startDate', e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                        Vége dátum
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <input
                            type="date"
                            className="pl-9 pr-3 py-2 rounded-xl text-[12.5px] text-text-primary"
                            style={inputStyle}
                            value={filters.endDate}
                            onChange={e => handleFilterChange('endDate', e.target.value)}
                        />
                    </div>
                </div>
            </motion.div>

            {/* ── Log Table ── */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl overflow-hidden"
                style={{
                    background: 'var(--color-bg-card)',
                    boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ background: 'rgba(240,245,241,0.55)', borderBottom: '1px solid rgba(90,110,95,0.10)' }}>
                                {['', 'Időpont', 'Felhasználó', 'Művelet', 'Tábla / ID'].map((h, i) => (
                                    <th key={i} className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-[0.10em]">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data?.rows.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center">
                                        <div className="w-10 h-10 rounded-xl mx-auto mb-2.5 flex items-center justify-center"
                                            style={{ background: 'rgba(90,110,95,0.07)' }}>
                                            <Activity className="w-4 h-4 text-muted-foreground opacity-40" />
                                        </div>
                                        <p className="text-[12.5px] text-muted-foreground italic">
                                            Nincs találat a megadott szűrőkkel.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                data?.rows.map((log, idx) => {
                                    const cfg = actionConfig[log.action] ?? { bg: 'rgba(74,144,217,0.10)', color: '#4A90D9', label: log.action };
                                    const isExpanded = expandedRows.includes(log.id);
                                    return (
                                        <>
                                            <tr
                                                key={log.id}
                                                onClick={() => toggleRow(log.id)}
                                                className="cursor-pointer transition-colors hover:bg-black/[0.016]"
                                                style={{ borderTop: idx > 0 ? '1px solid rgba(90,110,95,0.07)' : 'none' }}
                                            >
                                                <td className="px-4 py-3 w-8">
                                                    <div className="text-muted-foreground opacity-40">
                                                        {isExpanded
                                                            ? <ChevronUp className="w-3.5 h-3.5" />
                                                            : <ChevronDown className="w-3.5 h-3.5" />
                                                        }
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-[11.5px] font-mono text-muted-foreground">
                                                        {new Date(log.created_at).toLocaleString('hu-HU')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-[12.5px] font-semibold text-text-primary leading-tight">{log.user_full_name}</p>
                                                    <p className="text-[10.5px] text-muted-foreground">{log.user_email}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold"
                                                        style={{ background: cfg.bg, color: cfg.color }}
                                                    >
                                                        {cfg.label ?? log.action}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                                                    <span className="font-semibold text-text-secondary">{log.table_name}</span>
                                                    {log.record_id && (
                                                        <span className="opacity-40 ml-1">#{log.record_id.substring(0, 8)}…</span>
                                                    )}
                                                </td>
                                            </tr>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.tr
                                                        key={`${log.id}-detail`}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 0.15 }}
                                                    >
                                                        <td colSpan={5} className="px-4 py-4"
                                                            style={{ background: 'rgba(240,245,241,0.45)', borderTop: '1px solid rgba(90,110,95,0.07)' }}>
                                                            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                                                                {log.old_values && (
                                                                    <div className="rounded-xl p-3 overflow-auto max-h-56"
                                                                        style={{ background: 'rgba(184,60,60,0.05)', border: '1px solid rgba(184,60,60,0.14)' }}>
                                                                        <div className="text-[9.5px] font-black uppercase tracking-[0.12em] mb-2"
                                                                            style={{ color: '#b83c3c' }}>
                                                                            Régi érték
                                                                        </div>
                                                                        <pre className="text-text-secondary text-[11px] leading-relaxed whitespace-pre-wrap">
                                                                            {JSON.stringify(log.old_values, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                )}
                                                                {log.new_values && (
                                                                    <div className="rounded-xl p-3 overflow-auto max-h-56"
                                                                        style={{ background: 'rgba(61,158,82,0.05)', border: '1px solid rgba(61,158,82,0.14)' }}>
                                                                        <div className="text-[9.5px] font-black uppercase tracking-[0.12em] mb-2"
                                                                            style={{ color: '#3d9e52' }}>
                                                                            Új érték
                                                                        </div>
                                                                        <pre className="text-text-secondary text-[11px] leading-relaxed whitespace-pre-wrap">
                                                                            {JSON.stringify(log.new_values, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                )}
                                                                {!log.old_values && !log.new_values && (
                                                                    <div className="col-span-2 text-center text-[12px] text-muted-foreground py-4 italic rounded-xl"
                                                                        style={{ background: 'rgba(90,110,95,0.06)', border: '1px solid rgba(90,110,95,0.10)' }}>
                                                                        Nincsenek részletes változások rögzítve.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                )}
                                            </AnimatePresence>
                                        </>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                <div className="px-5 py-3.5 border-t flex items-center justify-between"
                    style={{ borderColor: 'rgba(90,110,95,0.10)', background: 'rgba(240,245,241,0.35)' }}>
                    <motion.button
                        whileHover={{ x: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={filters.page === 1}
                        className="px-3.5 py-1.5 text-[12px] font-semibold rounded-lg transition-colors disabled:opacity-35"
                        style={{ background: 'var(--color-bg-card)', border: '1px solid rgba(90,110,95,0.15)', color: 'var(--color-text-secondary)' }}
                    >
                        ← Előző
                    </motion.button>

                    <span className="text-[11.5px] text-muted-foreground font-medium tabular-nums">
                        {filters.page}. oldal
                        {data?.count ? ` · ${data.count} bejegyzés` : ''}
                    </span>

                    <motion.button
                        whileHover={{ x: 1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={!data?.count || data.count <= filters.page * 20}
                        className="px-3.5 py-1.5 text-[12px] font-semibold rounded-lg transition-colors disabled:opacity-35"
                        style={{ background: 'var(--color-bg-card)', border: '1px solid rgba(90,110,95,0.15)', color: 'var(--color-text-secondary)' }}
                    >
                        Következő →
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
