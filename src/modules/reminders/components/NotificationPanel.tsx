import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { hu } from 'date-fns/locale';
import type { NotificationHistoryItem } from '../hooks/useNotificationHistory';

interface Props {
    open: boolean;
    onClose: () => void;
    notifications: NotificationHistoryItem[];
    isLoading: boolean;
}

function notifyLabel(minutes: number): string {
    if (minutes === 0) return 'Pontosan az időpontban';
    if (minutes < 60) return `${minutes} perccel előtte`;
    if (minutes < 1440) return `${minutes / 60} órával előtte`;
    return `${minutes / 1440} nappal előtte`;
}

export function NotificationPanel({ open, onClose, notifications, isLoading }: Props) {
    const navigate = useNavigate();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open, onClose]);

    function handleItemClick() {
        onClose();
        navigate('/reminders');
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                >
                    {/* Fejléc */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-blue-500" />
                            <span className="text-[13px] font-semibold text-text-primary">Értesítések</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                    </div>

                    {/* Lista */}
                    <div className="max-h-80 overflow-y-auto">
                        {isLoading ? (
                            <div className="px-4 py-6 text-center text-[13px] text-gray-400">Betöltés…</div>
                        ) : notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                <p className="text-[13px] text-gray-400">Nincs korábbi értesítés</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <button
                                    key={n.id}
                                    onClick={handleItemClick}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                                >
                                    <p className="text-[13px] font-medium text-text-primary truncate">{n.reminder_title}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">{notifyLabel(n.notify_before_minutes)}</p>
                                    <p className="text-[11px] text-gray-400">
                                        {formatDistanceToNow(new Date(n.sent_at), { addSuffix: true, locale: hu })}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
