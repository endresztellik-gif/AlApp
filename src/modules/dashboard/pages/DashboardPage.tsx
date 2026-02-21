import { motion } from 'framer-motion'
import {
    Users,
    Car,
    Wrench,
    AlertTriangle,
    Clock,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    Plus,
    ChevronRight,
    Leaf,
    Sprout,
} from 'lucide-react'
import { useDashboard } from '../hooks/useDashboard'
import { useNavigate } from 'react-router-dom'
import { useDueChecklists } from '@/shared/hooks/useDueChecklists'
import { BiWeeklyChecklistModal } from '@/shared/components/BiWeeklyChecklistModal'
import { useState, useEffect } from 'react'

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.07 },
    },
}

const cardVariants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const } },
}

const statusConfig = {
    critical: {
        icon: AlertCircle,
        badge: 'status-critical',
        label: 'Kritikus',
        dot: 'bg-status-critical',
        rowBg: 'hover:bg-red-50/40',
        leftBar: 'bg-status-critical',
    },
    urgent: {
        icon: Clock,
        badge: 'status-urgent',
        label: 'Sürgős',
        dot: 'bg-status-urgent',
        rowBg: 'hover:bg-orange-50/40',
        leftBar: 'bg-status-urgent',
    },
    warning: {
        icon: Clock,
        badge: 'status-warning',
        label: 'Figyelés',
        dot: 'bg-status-warning',
        rowBg: 'hover:bg-yellow-50/30',
        leftBar: 'bg-status-warning',
    },
    expired: {
        icon: AlertTriangle,
        badge: 'status-expired',
        label: 'Lejárt',
        dot: 'bg-status-expired',
        rowBg: 'hover:bg-red-50/50',
        leftBar: 'bg-status-expired',
    },
    ok: {
        icon: CheckCircle,
        badge: 'status-ok',
        label: 'Rendben',
        dot: 'bg-status-ok',
        rowBg: 'hover:bg-green-50/30',
        leftBar: 'bg-status-ok',
    },
}

/* ---------- Betöltési skeleton ---------- */
function DashboardSkeleton() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            <div className="skeleton h-28 rounded-2xl" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton h-32 rounded-2xl" />
                ))}
            </div>
            <div className="grid lg:grid-cols-5 gap-4 md:gap-6">
                <div className="skeleton lg:col-span-3 h-[460px] rounded-2xl" />
                <div className="lg:col-span-2 space-y-4">
                    <div className="skeleton h-56 rounded-2xl" />
                    <div className="skeleton h-44 rounded-2xl" />
                </div>
            </div>
        </div>
    )
}

/* ---------- Fő komponens ---------- */
export function DashboardPage() {
    const navigate = useNavigate();
    const { stats, expiringItems, isLoading } = useDashboard();

    // Bi-weekly checklist logic
    const { data: dueVehicles, refetch: refetchDue } = useDueChecklists();
    const [currentDueIndex, setCurrentDueIndex] = useState(0);
    const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);

    useEffect(() => {
        if (dueVehicles && dueVehicles.length > 0) {
            setIsChecklistModalOpen(true);
        } else {
            setIsChecklistModalOpen(false);
        }
    }, [dueVehicles]);

    const handleChecklistSuccess = () => {
        if (dueVehicles && currentDueIndex < dueVehicles.length - 1) {
            // Move to next vehicle
            setCurrentDueIndex(prev => prev + 1);
        } else {
            // Done with all
            setIsChecklistModalOpen(false);
            refetchDue();
        }
    };

    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Jó reggelt' : hour < 18 ? 'Jó napot' : 'Jó estét'
    const timeEmoji = hour < 12 ? '🌿' : hour < 18 ? '☀️' : '🌙'

    if (isLoading) return <DashboardSkeleton />

    const statCards = [
        {
            label: 'Személyek',
            value: stats?.personnelCount || 0,
            icon: Users,
            trend: `+${stats?.personnelTrend || 0} e hónapban`,
            iconGradient: 'from-primary-400 to-primary-600',
            accentTop: 'from-primary-400/30 to-transparent',
            path: '/personnel',
        },
        {
            label: 'Járművek',
            value: stats?.vehicleCount || 0,
            icon: Car,
            trend: `+${stats?.vehicleTrend || 0} e hónapban`,
            iconGradient: 'from-secondary-400 to-secondary-600',
            accentTop: 'from-secondary-400/30 to-transparent',
            path: '/vehicles',
        },
        {
            label: 'Eszközök',
            value: stats?.equipmentCount || 0,
            icon: Wrench,
            trend: `+${stats?.equipmentTrend || 0} e hónapban`,
            iconGradient: 'from-accent-dark to-accent-base',
            accentTop: 'from-accent-base/25 to-transparent',
            path: '/equipment',
        },
        {
            label: 'Káresemények',
            value: stats?.incidentCount || 0,
            icon: AlertTriangle,
            trend: `+${stats?.incidentTrend || 0} e hónapban`,
            iconGradient: 'from-status-urgent to-status-warning',
            accentTop: 'from-status-urgent/20 to-transparent',
            path: '/incidents',
        },
    ]

    const expiringCount = expiringItems?.length || 0;
    const summary = {
        expired: expiringItems?.filter(i => i.status === 'expired').length || 0,
        critical: expiringItems?.filter(i => i.status === 'critical').length || 0,
        urgent: expiringItems?.filter(i => i.status === 'urgent').length || 0,
        warning: expiringItems?.filter(i => i.status === 'warning').length || 0,
    };

    const summaryItems = [
        { label: 'Lejárt', count: summary.expired, badge: 'status-expired', bar: 'bg-status-expired' },
        { label: 'Kritikus', count: summary.critical, badge: 'status-critical', bar: 'bg-status-critical' },
        { label: 'Sürgős', count: summary.urgent, badge: 'status-urgent', bar: 'bg-status-urgent' },
        { label: 'Figyelmeztetés', count: summary.warning, badge: 'status-warning', bar: 'bg-status-warning' },
    ]
    const summaryTotal = Object.values(summary).reduce((a, b) => a + b, 0) || 1

    const quickActions = [
        { icon: AlertTriangle, label: 'Káresemény felvitele', iconGrad: 'from-status-urgent to-status-warning', bg: 'hover:bg-orange-50/50', path: '/incidents' },
        { icon: Users, label: 'Új személy', iconGrad: 'from-primary-400 to-primary-600', bg: 'hover:bg-primary-50/60', path: '/personnel' },
        { icon: Car, label: 'Új jármű', iconGrad: 'from-secondary-400 to-secondary-600', bg: 'hover:bg-secondary-50/50', path: '/vehicles' },
        { icon: Wrench, label: 'Új eszköz', iconGrad: 'from-accent-dark to-accent-base', bg: 'hover:bg-primary-50/40', path: '/equipment' },
    ]

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-5 max-w-7xl mx-auto"
        >
            {/* ── Hero Banner ── */}
            <motion.div variants={cardVariants}>
                <div
                    className="relative overflow-hidden rounded-2xl p-6 md:p-8 border border-secondary-100/60"
                    style={{
                        background: 'linear-gradient(145deg, #fdf8ee 0%, #f5edda 45%, #eadfc8 100%)',
                        boxShadow: '0 2px 12px -4px rgba(90,70,30,0.08)',
                    }}
                >
                    {/* Dekoráció – nagy lebegő levél */}
                    <motion.div
                        animate={{ rotate: [0, 3, -1, 0], y: [0, -5, -2, 0] }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -top-6 right-4 w-44 h-44 opacity-[0.09] pointer-events-none"
                    >
                        <Leaf className="w-full h-full text-primary-700" strokeWidth={0.4} />
                    </motion.div>

                    {/* Dekoráció – kis levél */}
                    <motion.div
                        animate={{ rotate: [0, -4, 2, 0], x: [0, 3, 0] }}
                        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                        className="absolute bottom-2 right-40 w-16 h-16 opacity-[0.07] pointer-events-none"
                    >
                        <Sprout className="w-full h-full text-secondary-600" strokeWidth={0.5} />
                    </motion.div>

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xl">{timeEmoji}</span>
                                <h1 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight">
                                    {greeting}!
                                </h1>
                            </div>
                            <p className="text-[13.5px] text-text-secondary max-w-md leading-relaxed">
                                Mai összefoglaló.{' '}
                                <span className={`font-semibold inline-flex items-center gap-1 ${expiringCount > 0 ? 'text-status-critical' : 'text-primary-600'}`}>
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {expiringCount} figyelmet igénylő érvényesség
                                </span>.
                            </p>
                        </div>

                        {/* Státusz összefoglaló pill */}
                        {expiringCount > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4, type: 'spring' }}
                                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-status-critical/20 bg-white/60"
                            >
                                <span className="w-2 h-2 rounded-full bg-status-critical animate-pulse-gentle" />
                                <span className="text-[12.5px] font-semibold text-status-critical">{expiringCount} riasztás</span>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* ── Statisztika kártyák ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {statCards.map((stat) => (
                    <motion.div
                        key={stat.label}
                        variants={cardVariants}
                        whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(stat.path)}
                        className="relative overflow-hidden rounded-2xl cursor-pointer"
                        style={{
                            background: 'var(--color-bg-card)',
                            boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                        }}
                    >
                        {/* Felső gradiens csík */}
                        <div className={`h-[3px] w-full bg-gradient-to-r ${stat.accentTop}`} />

                        <div className="p-4 md:p-5">
                            <div className="flex items-start justify-between mb-3">
                                {/* Ikon */}
                                <div
                                    className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.iconGradient} shadow-sm`}
                                    style={{ boxShadow: '0 2px 8px -2px rgba(0,0,0,0.18)' }}
                                >
                                    <stat.icon className="w-4.5 h-4.5 text-white" strokeWidth={2} />
                                </div>
                                <TrendingUp className="w-3.5 h-3.5 text-status-ok opacity-50 mt-0.5" />
                            </div>

                            <motion.p
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-[32px] md:text-[38px] font-extrabold text-text-primary tracking-tight leading-none"
                            >
                                {stat.value}
                            </motion.p>
                            <p className="text-[12.5px] font-semibold text-text-secondary mt-1.5">{stat.label}</p>
                            <p className="text-[10.5px] text-muted-foreground/80 mt-0.5">{stat.trend}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Fő rács ── */}
            <div className="grid lg:grid-cols-5 gap-4 md:gap-5">

                {/* Lejáró érvényességek */}
                <motion.div
                    variants={cardVariants}
                    className="lg:col-span-3 flex flex-col rounded-2xl overflow-hidden"
                    style={{
                        height: 480,
                        background: 'var(--color-bg-card)',
                        boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                    }}
                >
                    {/* Kártya fejléc */}
                    <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-primary-100">
                                <Clock className="w-4 h-4 text-primary-600" />
                            </div>
                            <h3 className="text-[14px] font-semibold text-text-primary">Lejáró érvényességek</h3>
                        </div>
                        {expiringCount > 0 && (
                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full status-warning animate-badge-pop">
                                {expiringCount} db
                            </span>
                        )}
                    </div>

                    {/* Lista */}
                    <div className="overflow-y-auto flex-1 divide-y divide-border/30">
                        {expiringItems && expiringItems.length > 0 ? (
                            expiringItems.map((item, i) => {
                                const config = statusConfig[item.status] || statusConfig.warning;
                                const isNegative = item.daysRemaining < 0;

                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                                        className={`relative flex items-center justify-between px-5 py-3.5 ${config.rowBg} transition-colors cursor-default group`}
                                    >
                                        {/* Bal oldali színes sáv */}
                                        <div className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${config.leftBar} opacity-70`} />

                                        <div className="flex items-center gap-3 min-w-0 pl-2">
                                            {/* Pulzáló dot */}
                                            <div
                                                className={`w-2 h-2 rounded-full ${config.dot} shrink-0 ${item.status === 'critical' || item.status === 'expired'
                                                        ? 'animate-pulse-gentle'
                                                        : ''
                                                    }`}
                                            />
                                            <div className="min-w-0">
                                                <span className="text-[13.5px] font-semibold text-text-primary block truncate">
                                                    {item.entityName}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground">
                                                    {item.fieldName} · {item.entityType}
                                                </span>
                                            </div>
                                        </div>

                                        <span className={`text-[11.5px] font-semibold px-3 py-1 rounded-full shrink-0 ml-3 ${config.badge}`}>
                                            {isNegative
                                                ? `${Math.abs(item.daysRemaining)} napja lejárt`
                                                : `${item.daysRemaining} nap`}
                                        </span>
                                    </motion.div>
                                )
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                                <motion.div
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    <CheckCircle className="w-12 h-12 text-status-ok opacity-40" />
                                </motion.div>
                                <p className="text-[13px] font-medium">Minden érvényesség rendben van.</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Jobb oszlop */}
                <motion.div variants={cardVariants} className="lg:col-span-2 space-y-4">

                    {/* Gyors műveletek */}
                    <div
                        className="rounded-2xl overflow-hidden"
                        style={{
                            background: 'var(--color-bg-card)',
                            boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                        }}
                    >
                        <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-primary-100">
                                <Plus className="w-4 h-4 text-primary-600" />
                            </div>
                            <h3 className="text-[14px] font-semibold text-text-primary">Gyors műveletek</h3>
                        </div>

                        <div className="p-2.5 space-y-0.5">
                            {quickActions.map((action, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ x: 3, transition: { duration: 0.15 } }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => navigate(action.path)}
                                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl ${action.bg} transition-colors text-left group`}
                                >
                                    <div
                                        className={`p-1.5 rounded-lg bg-gradient-to-br ${action.iconGrad} flex-shrink-0`}
                                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.14)' }}
                                    >
                                        <action.icon className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                                    </div>
                                    <span className="text-[13px] font-medium text-text-primary">{action.label}</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Riasztás összesítő */}
                    <div
                        className="rounded-2xl p-5"
                        style={{
                            background: 'var(--color-bg-card)',
                            boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                        }}
                    >
                        <h4 className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-4">
                            Riasztás összesítő
                        </h4>

                        <div className="space-y-3">
                            {summaryItems.map((s) => (
                                <div key={s.label} className="flex items-center gap-3">
                                    <span className="text-[11.5px] font-medium text-text-secondary w-28 shrink-0">{s.label}</span>
                                    {/* Progress sáv */}
                                    <div className="flex-1 h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(s.count / summaryTotal) * 100}%` }}
                                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                                            className={`h-full rounded-full ${s.bar}`}
                                        />
                                    </div>
                                    {/* Szám badge */}
                                    <span className={`text-[11.5px] font-bold min-w-[28px] text-right px-2 py-0.5 rounded-lg ${s.badge}`}>
                                        {s.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Checklist Modal Popup (Forces user to complete) */}
            {dueVehicles && dueVehicles.length > 0 && dueVehicles[currentDueIndex] && (
                <BiWeeklyChecklistModal
                    isOpen={isChecklistModalOpen}
                    onClose={() => setIsChecklistModalOpen(false)}
                    vehicleId={dueVehicles[currentDueIndex].id}
                    vehicleName={dueVehicles[currentDueIndex].display_name}
                    onSuccess={handleChecklistSuccess}
                />
            )}
        </motion.div>
    )
}
