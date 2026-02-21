import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Plus, Users, LayoutGrid, List
} from 'lucide-react';
import { usePersonnel, Personnel } from '../hooks/usePersonnel';
import { PersonnelCard } from '../components/PersonnelCard';
import { PersonnelForm } from '../components/PersonnelForm';

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

/* Skeleton sor */
function PersonnelSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-in">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="skeleton rounded-2xl h-48" style={{ animationDelay: `${i * 0.06}s` }} />
            ))}
        </div>
    )
}

export function PersonnelListPage() {
    const { personnel, isLoading, create, update, remove } = usePersonnel();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Personnel | undefined>(undefined);

    const filteredPersonnel = useMemo(() => {
        if (!personnel) return [];
        return personnel.filter(p =>
            p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.entity_type?.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [personnel, searchQuery]);

    const handleEdit = (person: Personnel) => {
        setEditingPerson(person);
        setIsCreateOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Biztosan törölni szeretnéd ezt a személyt?')) {
            await remove(id);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSave = async (data: any) => {
        if (editingPerson) {
            await update({ id: editingPerson.id, updates: data, fieldValues: data.field_values });
        } else {
            await create(data);
        }
    };

    const handleCloseModal = () => {
        setIsCreateOpen(false);
        setEditingPerson(undefined);
    };

    return (
        <div className="space-y-5 max-w-7xl mx-auto">

            {/* ── Oldal fejléc ── */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-sm"
                        style={{ boxShadow: '0 3px 10px -2px rgba(35,86,52,0.35)' }}>
                        <Users className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-[20px] font-bold text-text-primary tracking-tight">
                            Személyzet
                        </h1>
                        <p className="text-[12.5px] text-muted-foreground">
                            {isLoading ? 'Betöltés…' : `${personnel?.length || 0} személy nyilvántartva`}
                        </p>
                    </div>
                </div>

                <motion.button
                    whileHover={{ y: -1, boxShadow: '0 6px 16px -4px rgba(35,86,52,0.35)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-[13.5px] font-semibold transition-all self-start sm:self-auto"
                    style={{ boxShadow: '0 3px 10px -2px rgba(35,86,52,0.30)' }}
                >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    Új személy
                </motion.button>
            </motion.div>

            {/* ── Eszköztár ── */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col sm:flex-row gap-3 items-center"
                style={{
                    background: 'var(--color-bg-card)',
                    borderRadius: '1rem',
                    padding: '0.875rem',
                    boxShadow: '0 1px 4px rgba(30,50,35,0.05), 0 0 0 1px rgba(90,110,95,0.10)',
                }}
            >
                {/* Kereső */}
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Keresés név vagy típus alapján…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13.5px] text-text-primary placeholder:text-muted-foreground transition-all"
                        style={{
                            background: 'rgba(235,240,236,0.5)',
                            border: '1px solid rgba(90,110,95,0.15)',
                        }}
                    />
                    {searchQuery && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-primary-100 text-primary-700"
                        >
                            {filteredPersonnel.length} db
                        </motion.span>
                    )}
                </div>

                {/* Nézet váltó */}
                <div className="flex items-center gap-1 p-1 rounded-xl ml-auto"
                    style={{ background: 'rgba(235,240,236,0.5)', border: '1px solid rgba(90,110,95,0.12)' }}>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid'
                            ? 'bg-white shadow-sm text-primary-600'
                            : 'text-muted-foreground hover:text-text-primary'
                        }`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list'
                            ? 'bg-white shadow-sm text-primary-600'
                            : 'text-muted-foreground hover:text-text-primary'
                        }`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>

            {/* ── Tartalom ── */}
            {isLoading ? (
                <PersonnelSkeleton />
            ) : (
                <AnimatePresence mode="wait">
                    {filteredPersonnel.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-24"
                        >
                            <motion.div
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4"
                            >
                                <Users className="w-8 h-8 text-primary-300" />
                            </motion.div>
                            <h3 className="text-[15px] font-semibold text-text-primary mb-1">
                                {searchQuery ? 'Nincs találat' : 'Még nincsenek személyek'}
                            </h3>
                            <p className="text-[13px] text-muted-foreground max-w-xs mx-auto">
                                {searchQuery
                                    ? 'Próbálj más keresési feltételt.'
                                    : 'Hozz létre egy új személyt a gombra kattintva.'}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={viewMode}
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            exit={{ opacity: 0 }}
                            className={
                                viewMode === 'grid'
                                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
                                    : 'space-y-3'
                            }
                        >
                            {filteredPersonnel.map(person => (
                                <PersonnelCard
                                    key={person.id}
                                    person={person}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isCreateOpen && (
                    <PersonnelForm
                        isOpen={isCreateOpen}
                        initialData={editingPerson}
                        onSave={handleSave}
                        onCancel={handleCloseModal}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
