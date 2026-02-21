import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Users, ToggleLeft, Database, Shield, ChevronRight, Settings, Activity } from 'lucide-react'

const settingsSections = [
    {
        icon: Users,
        title: 'Felhasználók kezelése',
        description: 'Meghívás, szerepkörök, aktiválás/deaktiválás',
        tag: 'Admin',
        to: '/settings/users',
        color: { from: 'from-primary-400', to: 'to-primary-600', shadow: 'rgba(35,86,52,0.30)' },
        accent: '#3d9e52',
        accentBg: 'rgba(61,158,82,0.08)',
        num: '01',
    },
    {
        icon: Database,
        title: 'Mezőséma kezelés',
        description: 'Entitás típusok és dinamikus mezők beállítása',
        tag: 'Admin',
        to: '/settings/field-schemas',
        color: { from: 'from-secondary-400', to: 'to-secondary-600', shadow: 'rgba(80,100,60,0.30)' },
        accent: '#5a7a50',
        accentBg: 'rgba(90,122,80,0.08)',
        num: '02',
    },
    {
        icon: ToggleLeft,
        title: 'Modulok kezelése',
        description: 'Modulok és funkciók aktiválása/deaktiválása',
        tag: 'Admin',
        to: '/settings/feature-flags',
        color: { from: 'from-accent-dark', to: 'to-accent-base', shadow: 'rgba(140,95,30,0.30)' },
        accent: '#a07828',
        accentBg: 'rgba(160,120,40,0.08)',
        num: '03',
    },
    {
        icon: Shield,
        title: 'Jogosultságok',
        description: 'Felhasználói szerepkörök és hozzáférési szintek',
        tag: 'Admin',
        to: '/settings/users',
        color: { from: 'from-primary-300', to: 'to-primary-500', shadow: 'rgba(35,86,52,0.25)' },
        accent: '#2d6440',
        accentBg: 'rgba(45,100,64,0.08)',
        num: '04',
    },
    {
        icon: Activity,
        title: 'Audit Napló',
        description: 'Tevékenységek és biztonsági napló',
        tag: 'Admin',
        to: '/settings/audit-log',
        color: { from: 'from-primary-400', to: 'to-primary-600', shadow: 'rgba(35,86,52,0.30)' },
        accent: '#235634',
        accentBg: 'rgba(35,86,52,0.08)',
        num: '05',
    },
]

export function SettingsPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl mx-auto space-y-6"
        >
            {/* ── Command Panel Header ── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-2xl p-7"
                style={{
                    background: 'linear-gradient(140deg, rgba(28,72,44,0.97) 0%, rgba(40,68,46,0.95) 60%, rgba(55,80,45,0.92) 100%)',
                    boxShadow: '0 6px 32px -6px rgba(25,65,40,0.50), 0 0 0 1px rgba(61,158,82,0.15)',
                }}
            >
                {/* Topographic grid overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `
                            repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(255,255,255,0.04) 23px, rgba(255,255,255,0.04) 24px),
                            repeating-linear-gradient(90deg, transparent, transparent 23px, rgba(255,255,255,0.04) 23px, rgba(255,255,255,0.04) 24px)
                        `,
                    }}
                />
                {/* Radial glow top-right */}
                <div
                    className="absolute -right-20 -top-20 w-72 h-72 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(61,158,82,0.12) 0%, transparent 65%)' }}
                />
                {/* Bottom fade */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.08), transparent)' }}
                />

                <div className="relative flex items-center gap-5">
                    <motion.div
                        whileHover={{ rotate: 20, scale: 1.08 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                        className="shrink-0 p-3.5 rounded-2xl"
                        style={{
                            background: 'rgba(255,255,255,0.10)',
                            boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 4px 12px -2px rgba(0,0,0,0.25)',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <Settings className="w-6 h-6 text-white" strokeWidth={1.75} />
                    </motion.div>

                    <div className="flex-1 min-w-0">
                        <p className="text-[9.5px] font-bold tracking-[0.22em] uppercase text-white/40 mb-1.5">
                            AlApp · Dunai Osztály nyilvántartási rendszere
                        </p>
                        <h1 className="text-[26px] font-bold text-white tracking-tight leading-none">
                            Beállítások
                        </h1>
                        <p className="text-[12.5px] text-white/50 mt-1.5 leading-snug">
                            Rendszer konfiguráció és adminisztráció
                        </p>
                    </div>

                    <div className="shrink-0 text-right hidden sm:block">
                        <div className="text-[9px] font-mono font-bold tracking-widest text-white/25 uppercase">
                            Admin Panel
                        </div>
                        <div className="text-[11px] font-mono text-white/20 mt-0.5">
                            {settingsSections.length} szekció
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── Section Cards Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {settingsSections.map((section, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 + i * 0.055, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ y: -3, transition: { duration: 0.18, ease: 'easeOut' } }}
                        className={i === 4 ? 'sm:col-span-2' : ''}
                    >
                        <Link
                            to={section.to}
                            className="group relative flex items-start gap-4 p-5 rounded-2xl overflow-hidden transition-shadow block h-full"
                            style={{
                                background: 'var(--color-bg-card)',
                                borderLeft: `3px solid ${section.accent}`,
                                boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                            }}
                        >
                            {/* Watermark icon */}
                            <div
                                className="absolute right-3 bottom-2 pointer-events-none transition-opacity duration-300 opacity-[0.055] group-hover:opacity-[0.10]"
                            >
                                <section.icon className="w-[52px] h-[52px]" style={{ color: section.accent }} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 relative z-10">
                                {/* Number + Tag row */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span
                                        className="text-[10px] font-black font-mono tabular-nums"
                                        style={{ color: section.accent, letterSpacing: '0.05em' }}
                                    >
                                        {section.num}
                                    </span>
                                    <div
                                        className="h-px flex-1 max-w-[20px] rounded-full"
                                        style={{ background: section.accent, opacity: 0.3 }}
                                    />
                                    <span
                                        className="text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
                                        style={{ background: section.accentBg, color: section.accent }}
                                    >
                                        {section.tag}
                                    </span>
                                </div>

                                <h3 className="text-[13.5px] font-bold text-text-primary leading-tight pr-6">
                                    {section.title}
                                </h3>
                                <p className="text-[11.5px] text-muted-foreground mt-1 leading-relaxed">
                                    {section.description}
                                </p>
                            </div>

                            {/* Chevron */}
                            <div className="shrink-0 mt-1 relative z-10 opacity-20 group-hover:opacity-60 transition-all duration-200 group-hover:translate-x-0.5">
                                <ChevronRight className="w-4 h-4 text-text-secondary" />
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}
