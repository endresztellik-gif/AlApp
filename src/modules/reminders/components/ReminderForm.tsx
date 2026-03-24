import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Bell } from 'lucide-react';
import type { NewReminder, Reminder } from '../hooks/useReminders';

const PRESET_MINUTES = [
    { label: 'Pontosan', value: 0 },
    { label: '1 óra előtte', value: 60 },
    { label: '8 óra előtte', value: 480 },
    { label: '1 nappal előtte', value: 1440 },
    { label: '2 nappal előtte', value: 2880 },
    { label: '3 nappal előtte', value: 4320 },
    { label: '1 héttel előtte', value: 10080 },
];

interface Props {
    onSave: (data: NewReminder) => Promise<void>;
    onClose: () => void;
    initialData?: Reminder;
}

export function ReminderForm({ onSave, onClose, initialData }: Props) {
    const isEdit = !!initialData;
    const [title, setTitle] = useState(initialData?.title ?? '');
    const [description, setDescription] = useState(initialData?.description ?? '');
    const [dueDate, setDueDate] = useState(initialData ? initialData.due_at.split('T')[0] : '');
    const [dueTime, setDueTime] = useState(initialData ? initialData.due_at.split('T')[1]?.slice(0, 5) : '08:00');
    const [selectedMinutes, setSelectedMinutes] = useState<number[]>(
        initialData ? initialData.notifications.filter(n => !n.sent_at).map(n => n.notify_before_minutes) : [1440]
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const togglePreset = (value: number) => {
        setSelectedMinutes((prev) =>
            prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) { setError('A cím kötelező'); return; }
        if (!dueDate)       { setError('A határidő dátuma kötelező'); return; }

        try {
            setSaving(true);
            await onSave({
                title: title.trim(),
                description: description.trim() || undefined,
                due_at: `${dueDate}T${dueTime}:00`,
                notify_before_minutes: selectedMinutes,
            });
            onClose();
        } catch (err) {
            setError('Mentés sikertelen. Próbáld újra.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {/* Háttér */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="fixed inset-x-4 bottom-4 z-50 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md"
            >
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Fejléc */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl"
                                style={{ background: 'linear-gradient(135deg, #4F8EF7, #6FA8FF)', boxShadow: '0 3px 8px -2px rgba(79,142,247,0.4)' }}>
                                <Bell className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="text-[16px] font-bold text-text-primary">{isEdit ? 'Emlékeztető szerkesztése' : 'Új emlékeztető'}</h2>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        {/* Cím */}
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                Cím *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="pl. Autó szerviz időpont"
                                data-testid="reminder-title-input"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                                autoFocus
                            />
                        </div>

                        {/* Leírás */}
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                Megjegyzés
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Opcionális részletek…"
                                rows={2}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition resize-none"
                            />
                        </div>

                        {/* Dátum + Idő */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Dátum *
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    min={isEdit ? undefined : new Date().toISOString().split('T')[0]}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Időpont
                                </label>
                                <input
                                    type="time"
                                    value={dueTime}
                                    onChange={(e) => setDueTime(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                                />
                            </div>
                        </div>

                        {/* Értesítési időpontok */}
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Értesítés időpontja
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {PRESET_MINUTES.map(({ label, value }) => {
                                    const active = selectedMinutes.includes(value);
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => togglePreset(value)}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-medium border transition-all"
                                            style={
                                                active
                                                    ? { background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }
                                                    : { background: '#F9FAFB', color: '#6B7280', borderColor: '#E5E7EB' }
                                            }
                                        >
                                            {active ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {error && (
                            <p className="text-[12.5px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                        )}

                        {/* Gombok */}
                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Mégsem
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                data-testid="reminder-save-btn"
                                className="flex-1 py-2.5 rounded-xl text-white text-[13.5px] font-semibold transition-all disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg, #4F8EF7, #6FA8FF)', boxShadow: '0 3px 10px -2px rgba(79,142,247,0.4)' }}
                            >
                                {saving ? 'Mentés…' : isEdit ? 'Módosítás mentése' : 'Mentés'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
