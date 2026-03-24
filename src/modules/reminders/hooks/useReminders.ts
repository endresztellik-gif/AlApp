import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/core/auth/useAuth';

export interface ReminderNotification {
    id: string;
    reminder_id: string;
    user_id: string;
    notify_before_minutes: number;
    sent_at: string | null;
    created_at: string;
}

export interface Reminder {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    due_at: string;
    is_done: boolean;
    created_at: string;
    updated_at: string;
    notifications: ReminderNotification[];
}

export interface NewReminder {
    title: string;
    description?: string;
    due_at: string;
    notify_before_minutes: number[];  // pl. [2880, 1440, 480]
}

export function useReminders() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: reminders, isLoading, error } = useQuery({
        queryKey: ['reminders', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('personal_reminders')
                .select(`
                    *,
                    notifications:personal_reminder_notifications(*)
                `)
                .order('due_at', { ascending: true });

            if (error) throw error;
            return data as Reminder[];
        },
        enabled: !!user,
    });

    const createMutation = useMutation({
        mutationFn: async (input: NewReminder) => {
            const { data: reminder, error: rErr } = await supabase
                .from('personal_reminders')
                .insert({
                    user_id: user!.id,
                    title: input.title,
                    description: input.description ?? null,
                    due_at: input.due_at,
                })
                .select()
                .single();

            if (rErr) throw rErr;

            if (input.notify_before_minutes.length > 0) {
                const notifs = input.notify_before_minutes.map((mins) => ({
                    reminder_id: reminder.id,
                    user_id: user!.id,
                    notify_before_minutes: mins,
                }));

                const { error: nErr } = await supabase
                    .from('personal_reminder_notifications')
                    .insert(notifs);

                if (nErr) throw nErr;
            }

            return reminder;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
        },
    });

    const toggleDoneMutation = useMutation({
        mutationFn: async ({ id, is_done }: { id: string; is_done: boolean }) => {
            const { error } = await supabase
                .from('personal_reminders')
                .update({ is_done })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('personal_reminders')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
        },
    });

    const upcoming = reminders?.filter((r) => !r.is_done && new Date(r.due_at) >= new Date()) ?? [];
    const overdue  = reminders?.filter((r) => !r.is_done && new Date(r.due_at) <  new Date()) ?? [];
    const done     = reminders?.filter((r) => r.is_done) ?? [];

    return {
        reminders,
        upcoming,
        overdue,
        done,
        isLoading,
        error,
        create: createMutation.mutateAsync,
        toggleDone: toggleDoneMutation.mutateAsync,
        remove: deleteMutation.mutateAsync,
    };
}
