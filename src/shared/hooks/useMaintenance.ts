import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuditLogger } from '@/modules/admin/hooks/useAuditLogsAdmin';

export interface MaintenanceLog {
    id: string;
    entity_id: string;
    user_id: string;
    type: 'vizsga' | 'szerviz' | 'javitas' | 'egyeb';
    date: string;
    description: string;
    cost?: number;
    new_validity_date?: string;
    created_at: string;
    user?: { full_name: string };
}

export function useMaintenance(entityId: string) {
    const queryClient = useQueryClient();
    const { mutate: log } = useAuditLogger();

    const fetchLogs = async (): Promise<MaintenanceLog[]> => {
        const { data, error } = await supabase
            .from('maintenance_logs')
            .select(`
                *,
                user:user_profiles(full_name)
            `)
            .eq('entity_id', entityId)
            .order('date', { ascending: false });

        if (error) throw error;
        return data as MaintenanceLog[];
    };

    const { data: logs, isLoading } = useQuery({
        queryKey: ['maintenance', entityId],
        queryFn: fetchLogs,
        enabled: !!entityId,
    });

    const createMutation = useMutation({
        mutationFn: async (newLog: Omit<MaintenanceLog, 'id' | 'created_at' | 'user'>) => {
            const { data, error } = await supabase
                .from('maintenance_logs')
                .insert([newLog])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (result, variables) => {
            queryClient.invalidateQueries({ queryKey: ['maintenance', entityId] });
            queryClient.invalidateQueries({ queryKey: ['vehicles', entityId] });
            queryClient.invalidateQueries({ queryKey: ['equipment', entityId] });
            log({
                action: 'create',
                table_name: 'maintenance_logs',
                record_id: result?.id,
                new_values: variables as Record<string, unknown>,
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('maintenance_logs')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['maintenance', entityId] });
            log({
                action: 'delete',
                table_name: 'maintenance_logs',
                record_id: id,
            });
        },
    });

    return {
        logs,
        isLoading,
        create: createMutation.mutateAsync,
        remove: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
    };
}
