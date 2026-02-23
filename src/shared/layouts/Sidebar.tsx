import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    Users,
    Car,
    Wrench,
    CalendarDays,
    AlertTriangle,
    Settings,
    X,
    FlaskConical,
    Download,
    Droplets,
    LogOut
} from 'lucide-react'
import { useAuth } from '@/core/auth/useAuth'
import { ExportModal } from '@/modules/export/components/ExportModal'

interface SidebarProps {
    mobile?: boolean
    onClose?: () => void
}

const navItems = [
    { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { to: '/personnel', icon: Users, labelKey: 'nav.personnel' },
    { to: '/vehicles', icon: Car, labelKey: 'nav.vehicles' },
    { to: '/equipment', icon: Wrench, labelKey: 'nav.equipment' },
    { to: '/calendar', icon: CalendarDays, labelKey: 'nav.calendar' },
    { to: '/incidents', icon: AlertTriangle, labelKey: 'nav.incidents' },
    { to: '/water-facilities', icon: Droplets, labelKey: 'nav.water_facilities' },
]

const bottomNavItems = [
    { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
]

export function Sidebar({ mobile, onClose }: SidebarProps) {
    const { t } = useTranslation()
    const { user, profile, signOut } = useAuth()
    const [isExportModalOpen, setIsExportModalOpen] = useState(false)

    const handleLogout = async () => {
        try {
            await signOut()
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    // User display info
    const email = user?.email ?? 'admin@alapp.hu'
    const displayName = profile?.fullName || email.split('@')[0]
    const initials = displayName.slice(0, 2).toUpperCase()

    // Check if user has permission to export
    // Admin/Manager: All data
    // User: Own data only
    const canExport = !!user; // Everyone logged in can export (scope limited in modal)

    const sidebarContent = (
        <div className="flex flex-col h-full">

            {/* Logo / Brand */}
            <div className="flex items-center justify-between px-5 pt-6 pb-5">
                <div className="flex items-center gap-3">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3, type: 'spring' }}
                        className="w-10 h-10 rounded-[14px] shadow-md flex items-center justify-center flex-shrink-0 bg-white/90"
                        style={{ boxShadow: '0 4px 14px -3px rgba(35,86,52,0.25)' }}
                    >
                        <img
                            src="/alapp-main-logo.png"
                            alt="AlApp"
                            className="w-10 h-10 object-contain"
                        />
                    </motion.div>
                    <div>
                        <h1 className="text-[18px] font-bold tracking-tight text-gradient leading-none mb-0.5">
                            AlApp
                        </h1>
                        <p className="text-[10px] font-medium text-muted-foreground">
                            {t('sidebar.subtitle')}
                        </p>
                    </div>
                </div>
                {mobile && (
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-black/6 transition-colors ml-2"
                    >
                        <X className="w-4.5 h-4.5 text-muted-foreground" />
                    </button>
                )}
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border to-transparent mb-1" />

            {/* Navigation */}
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
                <p className="px-3 mb-2.5 mt-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">
                    {t('nav.modules')}
                </p>
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        onClick={mobile ? onClose : undefined}
                        className={({ isActive }) =>
                            `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200 group ${isActive
                                ? 'nav-pill-active text-primary-700'
                                : 'text-text-secondary hover:bg-black/[0.04] hover:text-text-primary'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {/* Bal oldali aktív csík */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            layoutId="sidebar-active-bar"
                                            className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary-500"
                                            initial={{ opacity: 0, scaleY: 0 }}
                                            animate={{ opacity: 1, scaleY: 1 }}
                                            exit={{ opacity: 0, scaleY: 0 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </AnimatePresence>

                                {/* Ikon */}
                                <motion.div
                                    animate={{ scale: isActive ? 1 : 1 }}
                                    whileHover={{ scale: 1.08 }}
                                    className={`flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-primary-500/15 text-primary-600'
                                        : 'text-muted-foreground group-hover:text-text-primary'
                                        }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                </motion.div>

                                <span className="flex-1">{t(item.labelKey)}</span>

                                {/* Jobb oldali aktív jelző (kis dot) */}
                                {isActive && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-1.5 h-1.5 rounded-full bg-primary-400 opacity-60"
                                        transition={{ delay: 0.1 }}
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="px-3 pb-4 space-y-0.5">
                {/* Divider */}
                <div className="mx-1 mb-3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Fejlesztési sáv */}
                <div className="mb-3 mx-1 rounded-xl overflow-hidden">
                    <div className="dev-banner px-3 py-2 flex items-center gap-2">
                        <FlaskConical className="w-3.5 h-3.5 text-secondary-700 flex-shrink-0" />
                        <span className="text-[10px] font-semibold text-secondary-700 tracking-wide">
                            {t('sidebar.dev_banner')}
                        </span>
                    </div>
                </div>

                {bottomNavItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={mobile ? onClose : undefined}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200 ${isActive
                                ? 'nav-pill-active text-primary-700'
                                : 'text-text-secondary hover:bg-black/[0.04] hover:text-text-primary'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-primary-500/15 text-primary-600'
                                    : 'text-muted-foreground'
                                    }`}>
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <span>{t(item.labelKey)}</span>
                            </>
                        )}
                    </NavLink>
                ))}

                {/* Export Button - Only for Admin/Manager */}
                {canExport && (
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200 text-text-secondary hover:bg-black/[0.04] hover:text-text-primary text-left"
                    >
                        <div className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground">
                            <Download className="w-4 h-4" />
                        </div>
                        <span>{t('nav.export')}</span>
                    </button>
                )}

                {/* User info */}
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="mt-2 p-3 rounded-xl bg-black/[0.04] cursor-default"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0"
                            style={{ boxShadow: '0 2px 8px -2px rgba(35,86,52,0.35)' }}
                        >
                            <span className="text-[11px] font-bold text-white">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] font-semibold text-text-primary truncate capitalize">{displayName}</p>
                            <p className="text-[10.5px] text-muted-foreground truncate">{email}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Logout button */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200 text-text-secondary hover:bg-red-50 hover:text-red-600 text-left mt-1"
                >
                    <div className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-red-600 transition-colors">
                        <LogOut className="w-4 h-4" />
                    </div>
                    <span>{t('nav.logout')}</span>
                </button>
            </div>

            <AnimatePresence>
                {isExportModalOpen && <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />}
            </AnimatePresence>
        </div>
    )

    if (mobile) {
        return (
            <motion.aside
                initial={{ x: -288 }}
                animate={{ x: 0 }}
                exit={{ x: -288 }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                style={{ width: 268 }}
                className="fixed left-0 top-0 bottom-0 gradient-sidebar border-r border-border/60 z-50 shadow-2xl"
            >
                {sidebarContent}
            </motion.aside>
        )
    }

    return (
        <aside
            style={{ width: 268 }}
            className="fixed left-0 top-0 bottom-0 gradient-sidebar border-r border-border/60 z-30"
        >
            {sidebarContent}
        </aside>
    )
}
