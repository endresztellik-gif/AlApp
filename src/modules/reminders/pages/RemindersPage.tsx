import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, CheckCheck, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useReminders } from '../hooks/useReminders';
import type { Reminder } from '../hooks/useReminders';
import { ReminderCard } from '../components/ReminderCard';
import { ReminderForm } from '../components/ReminderForm';
import { PushSubscriptionManager } from '../components/PushSubscriptionManager';

function RemindersSkeleton() {
    return (
        <div className="space-y-3 animate-fade-in">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="skeleton rounded-2xl h-24"
                    style={{ animationDelay: `${i * 0.08}s` }}
                />
            ))}
        </div>
    );
}

function SectionHeader({ icon: Icon, label, count, color }: {
    icon: React.ElementType;
    label: string;
    count: number;
    color: string;
}) {
    return (
        <div className="flex items-center gap-2 mb-2">
            <Icon className={`w-4 h-4 ${color}`} />
            <span className={`text-[12.5px] font-semibold uppercase tracking-wide ${color}`}>
                {label}
            </span>
            <span className="ml-auto text-[11px] text-muted-foreground">{count} db</span>
        </div>
    );
}

export function RemindersPage() {
    const { upcoming, overdue, done, isLoading, create, update, toggleDone, remove } = useReminders();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
    const [showDone, setShowDone] = useState(false);

    const handleToggleDone = async (id: string, is_done: boolean) => {
        try {
            await toggleDone({ id, is_done });
            toast.success(is_done ? 'Kész!' : 'Visszaállítva');
        } catch {
            toast.error('Hiba történt');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await remove(id);
            toast.success('Emlékeztető törölve');
        } catch {
            toast.error('Törlés sikertelen');
        }
    };

    return (
        <div className="space-y-5 max-w-2xl mx-auto">
            {/* Fejléc */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
                <div className="flex items-center gap-3">
                    <div
                        className="p-2.5 rounded-xl shadow-sm"
                        style={{
                            background: 'linear-gradient(135deg, #4F8EF7, #6FA8FF)',
                            boxShadow: '0 3px 10px -2px rgba(79,142,247,0.35)',
                        }}
                    >
                        <Bell className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-[20px] font-bold text-text-primary tracking-tight">
                            Emlékeztetők
                        </h1>
                        <p className="text-[12.5px] text-muted-foreground">
                            Csak te látod – személyes határidők
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <PushSubscriptionManager />
                    <motion.button
                        whileHover={{ y: -1, boxShadow: '0 6px 16px -4px rgba(79,142,247,0.4)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13.5px] font-semibold transition-all"
                        style={{
                            background: 'linear-gradient(135deg, #4F8EF7, #6FA8FF)',
                            boxShadow: '0 3px 10px -2px rgba(79,142,247,0.30)',
                        }}
                    >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        Új emlékeztető
                    </motion.button>
                </div>
            </motion.div>

            {isLoading ? (
                <RemindersSkeleton />
            ) : (
                <AnimatePresence>
                    {/* Lejárt */}
                    {overdue.length > 0 && (
                        <motion.div
                            key="overdue"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <SectionHeader
                                icon={AlertCircle}
                                label="Lejárt"
                                count={overdue.length}
                                color="text-red-500"
                            />
                            <div className="space-y-2">
                                {overdue.map((r) => (
                                    <ReminderCard
                                        key={r.id}
                                        reminder={r}
                                        onToggleDone={handleToggleDone}
                                        onDelete={handleDelete}
                                        onEdit={setEditingReminder}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Közelgő */}
                    {upcoming.length > 0 && (
                        <motion.div
                            key="upcoming"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.05 }}
                        >
                            <SectionHeader
                                icon={Clock}
                                label="Közelgő"
                                count={upcoming.length}
                                color="text-blue-500"
                            />
                            <div className="space-y-2">
                                {upcoming.map((r) => (
                                    <ReminderCard
                                        key={r.id}
                                        reminder={r}
                                        onToggleDone={handleToggleDone}
                                        onDelete={handleDelete}
                                        onEdit={setEditingReminder}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Üres állapot */}
                    {upcoming.length === 0 && overdue.length === 0 && (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-16 text-center"
                        >
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                                style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}>
                                <Bell className="w-8 h-8 text-blue-400" />
                            </div>
                            <p className="text-[15px] font-semibold text-text-primary">Nincs aktív emlékeztető</p>
                            <p className="text-[13px] text-muted-foreground mt-1">
                                Hozz létre egyet az "Új emlékeztető" gombbal
                            </p>
                        </motion.div>
                    )}

                    {/* Kész lista – összecsukható */}
                    {done.length > 0 && (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <button
                                onClick={() => setShowDone((v) => !v)}
                                className="flex items-center gap-2 mb-2 group"
                            >
                                <SectionHeader
                                    icon={CheckCheck}
                                    label="Kész"
                                    count={done.length}
                                    color="text-gray-400"
                                />
                            </button>
                            <AnimatePresence>
                                {showDone && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-2 overflow-hidden"
                                    >
                                        {done.map((r) => (
                                            <ReminderCard
                                                key={r.id}
                                                reminder={r}
                                                onToggleDone={handleToggleDone}
                                                onDelete={handleDelete}
                                                onEdit={setEditingReminder}
                                            />
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Létrehozó form */}
            {isFormOpen && (
                <ReminderForm
                    onSave={async (data) => {
                        await create(data);
                        toast.success('Emlékeztető létrehozva!');
                    }}
                    onClose={() => setIsFormOpen(false)}
                />
            )}

            {/* Szerkesztő form */}
            {editingReminder && (
                <ReminderForm
                    initialData={editingReminder}
                    onSave={async (data) => {
                        await update({ id: editingReminder.id, ...data });
                        toast.success('Emlékeztető frissítve!');
                    }}
                    onClose={() => setEditingReminder(null)}
                />
            )}
        </div>
    );
}
