import { motion } from 'framer-motion';
import { Trash2, Clock, CheckCircle2, Circle, Bell } from 'lucide-react';
import { formatDistanceToNow, isPast, format } from 'date-fns';
import { hu } from 'date-fns/locale';
import type { Reminder } from '../hooks/useReminders';

const NOTIFY_LABELS: Record<number, string> = {
    0:     'Pontosan',
    60:    '1 óra előtte',
    120:   '2 óra előtte',
    480:   '8 óra előtte',
    1440:  '1 nappal',
    2880:  '2 nappal',
    4320:  '3 nappal',
    10080: '1 héttel',
};

function notifyLabel(mins: number): string {
    return NOTIFY_LABELS[mins] ?? `${mins} perccel előtte`;
}

interface Props {
    reminder: Reminder;
    onToggleDone: (id: string, is_done: boolean) => void;
    onDelete: (id: string) => void;
}

export function ReminderCard({ reminder, onToggleDone, onDelete }: Props) {
    const due = new Date(reminder.due_at);
    const overdue = isPast(due) && !reminder.is_done;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-2xl border p-4 flex flex-col gap-2 transition-all ${
                reminder.is_done
                    ? 'bg-gray-50 border-gray-100 opacity-60'
                    : overdue
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-100 shadow-sm'
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                {/* Kész checkbox */}
                <button
                    onClick={() => onToggleDone(reminder.id, !reminder.is_done)}
                    className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-green-500 transition-colors"
                >
                    {reminder.is_done ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                        <Circle className="w-5 h-5" />
                    )}
                </button>

                {/* Tartalom */}
                <div className="flex-1 min-w-0">
                    <p className={`text-[14px] font-semibold leading-snug ${reminder.is_done ? 'line-through text-gray-400' : 'text-text-primary'}`}>
                        {reminder.title}
                    </p>
                    {reminder.description && (
                        <p className="text-[12.5px] text-muted-foreground mt-0.5 line-clamp-2">
                            {reminder.description}
                        </p>
                    )}
                </div>

                {/* Törlés */}
                <button
                    onClick={() => onDelete(reminder.id)}
                    className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Határidő */}
            <div className={`flex items-center gap-1.5 text-[12px] font-medium ${overdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{format(due, 'yyyy. MM. dd. HH:mm', { locale: hu })}</span>
                {!reminder.is_done && (
                    <span className="opacity-70">
                        ({formatDistanceToNow(due, { addSuffix: true, locale: hu })})
                    </span>
                )}
            </div>

            {/* Értesítési időpontok */}
            {reminder.notifications.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {reminder.notifications.map((n) => (
                        <span
                            key={n.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                n.sent_at
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                        >
                            <Bell className="w-2.5 h-2.5" />
                            {notifyLabel(n.notify_before_minutes)}
                            {n.sent_at && ' ✓'}
                        </span>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
