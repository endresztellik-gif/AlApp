import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    Users,
    Car,
    Wrench,
    AlertTriangle,
    Droplets
} from 'lucide-react'

const items = [
    { to: '/', icon: LayoutDashboard, label: 'Áttekintő' },
    { to: '/personnel', icon: Users, label: 'Személyek' },
    { to: '/vehicles', icon: Car, label: 'Járművek' },
    { to: '/equipment', icon: Wrench, label: 'Eszközök' },
    { to: '/incidents', icon: AlertTriangle, label: 'Kár' },
    { to: '/water-facilities', icon: Droplets, label: 'Víz' },
]

export function BottomNav() {
    const location = useLocation()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-30 glass-strong border-t border-white/40 safe-area-bottom">
            {/* Felső gradiens szegély */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-200/50 to-transparent" />

            <div
                className="flex items-center justify-around px-2"
                style={{ height: 'var(--bottom-nav-height)' }}
            >
                {items.map((item) => {
                    const isActive = item.to === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(item.to)

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className="flex flex-col items-center gap-0.5 min-w-[52px] py-1.5 px-2 relative"
                        >
                            {/* Aktív háttér pill */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        layoutId="bottom-nav-pill"
                                        className="absolute inset-x-1 top-1 bottom-1 rounded-xl bg-primary-500/10"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </AnimatePresence>

                            {/* Ikon */}
                            <motion.div
                                animate={{
                                    y: isActive ? -1 : 0,
                                    scale: isActive ? 1.08 : 1,
                                }}
                                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                className={`relative z-10 p-1 rounded-lg transition-colors duration-200 ${isActive ? 'text-primary-600' : 'text-muted-foreground'
                                    }`}
                            >
                                <item.icon className="w-[19px] h-[19px]" strokeWidth={isActive ? 2.2 : 1.8} />
                            </motion.div>

                            {/* Cimke */}
                            <motion.span
                                animate={{ opacity: isActive ? 1 : 0.6 }}
                                className={`relative z-10 text-[9.5px] font-semibold transition-colors duration-200 ${isActive ? 'text-primary-600' : 'text-muted-foreground'
                                    }`}
                            >
                                {item.label}
                            </motion.span>
                        </NavLink>
                    )
                })}
            </div>
        </nav>
    )
}
