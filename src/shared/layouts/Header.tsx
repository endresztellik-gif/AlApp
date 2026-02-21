import { useLocation } from 'react-router-dom'
import { Menu, Bell, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

interface HeaderProps {
    onMenuClick: () => void
}

const pageTitles: Record<string, string> = {
    '/':               'Áttekintő',
    '/personnel':      'Személyek',
    '/vehicles':       'Járművek',
    '/equipment':      'Eszközök',
    '/calendar':       'Naptár',
    '/incidents':      'Káresemények',
    '/settings':       'Beállítások',
    '/settings/users': 'Felhasználók',
    '/settings/field-schemas': 'Egyedi mezők',
    '/settings/feature-flags': 'Funkció jelzők',
    '/settings/audit-log':     'Audit napló',
}

export function Header({ onMenuClick }: HeaderProps) {
    const location = useLocation()
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const title = pageTitles[location.pathname] || 'AlApp'

    return (
        <header className="sticky top-0 z-20">
            {/* Glass réteg */}
            <div
                className="glass-strong border-b border-white/40"
                style={{
                    height: 58,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingLeft: isDesktop ? '1.75rem' : '1rem',
                    paddingRight: '1rem',
                }}
            >
                {/* Bal: Menu (mobil) + Oldal cím */}
                <div className="flex items-center gap-2.5">
                    {!isDesktop && (
                        <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={onMenuClick}
                            className="p-2 -ml-1 rounded-xl hover:bg-black/[0.05] transition-colors"
                            aria-label="Menü megnyitása"
                        >
                            <Menu className="w-5 h-5 text-text-secondary" />
                        </motion.button>
                    )}

                    {/* Animált oldal cím */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                        >
                            <h2 className="text-[17px] font-semibold text-text-primary tracking-[-0.01em]">
                                {title}
                            </h2>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Jobb: Akciók */}
                <div className="flex items-center gap-1">
                    {/* Keresés */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.93 }}
                        className="p-2.5 rounded-xl hover:bg-black/[0.05] transition-colors"
                        aria-label="Keresés"
                    >
                        <Search className="w-[18px] h-[18px] text-muted-foreground" />
                    </motion.button>

                    {/* Értesítések */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.93 }}
                        className="relative p-2.5 rounded-xl hover:bg-black/[0.05] transition-colors"
                        aria-label="Értesítések"
                    >
                        <Bell className="w-[18px] h-[18px] text-muted-foreground" />
                        {/* Értesítési badge */}
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.5 }}
                            className="absolute top-2 right-2 w-2 h-2 rounded-full bg-status-critical animate-pulse-gentle"
                        />
                    </motion.button>
                </div>
            </div>

            {/* Gradiens alsó szegély */}
            <div className="h-px bg-gradient-to-r from-transparent via-primary-200/60 to-transparent" />
        </header>
    )
}
