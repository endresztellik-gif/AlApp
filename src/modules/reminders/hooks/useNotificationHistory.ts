import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'notifications_last_viewed_at';

export interface NotificationHistoryItem {
    id: string;
    reminder_id: string;
    reminder_title: string;
    sent_at: string;
    notify_before_minutes: number;
}

function getLastViewedAt(): Date {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Date(stored) : new Date(0);
}

export function useNotificationHistory() {
    const { data: notifications = [], isLoading } = useQuery<NotificationHistoryItem[]>({
        queryKey: ['notification-history'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('personal_reminder_notifications')
                .select('id, reminder_id, sent_at, notify_before_minutes, personal_reminders(title)')
                .not('sent_at', 'is', null)
                .order('sent_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            return (data ?? []).map((row: {
                id: string;
                reminder_id: string;
                sent_at: string;
                notify_before_minutes: number;
                personal_reminders: { title: string } | null;
            }) => ({
                id: row.id,
                reminder_id: row.reminder_id,
                reminder_title: row.personal_reminders?.title ?? '(törölt emlékeztető)',
                sent_at: row.sent_at,
                notify_before_minutes: row.notify_before_minutes,
            }));
        },
        refetchInterval: 60_000,
    });

    const lastViewedAt = getLastViewedAt();
    const unreadCount = notifications.filter(n => new Date(n.sent_at) > lastViewedAt).length;

    function markAllRead() {
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }

    return { notifications, unreadCount, isLoading, markAllRead };
}
