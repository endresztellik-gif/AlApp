import { motion } from 'framer-motion'
import { Users, Plus, Search, Filter } from 'lucide-react'

export function PersonnelPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Személyek</h1>
                    <p className="text-sm text-muted-foreground">Kollégák nyilvántartása és képzettségei</p>
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white font-medium text-sm shadow-md hover:shadow-lg transition-shadow">
                    <Plus className="w-4 h-4" />
                    Új személy
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Keresés név vagy azonosító alapján..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
                    />
                </div>
                <button className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                </button>
            </div>

            {/* Empty State */}
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-primary-200" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Még nincsenek személyek</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    A személyek modul aktiválása és a Supabase backend elkészülte után itt jelennek meg a kollégák.
                </p>
            </div>
        </motion.div>
    )
}
