import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuditLogger } from './useAuditLogsAdmin';

interface FeatureFlagRow {
    id: string;
    key: string;
    enabled: boolean;
    description: string | null;
    updated_by: string | null;
    updated_at: string;
}

/**
 * Admin hook a feature flagek kezeléséhez.
 * Listázás + toggle (be/kikapcsolás).
 */
export function useFeatureFlagsAdmin() {
    const queryClient = useQueryClient();
    const { mutate: log } = useAuditLogger();

    const query = useQuery({
        queryKey: ['admin', 'feature-flags'],
        queryFn: async (): Promise<FeatureFlagRow[]> => {
            const { data, error } = await supabase
                .from('feature_flags')
                .select('*')
                .order('key');
            if (error) throw error;
            return data;
        },
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
            const { error } = await supabase
                .from('feature_flags')
                .update({ enabled })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: (_, { id, enabled }) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
            queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
            log({
                action: enabled ? 'enable_feature' : 'disable_feature',
                table_name: 'feature_flags',
                record_id: id,
                new_values: { enabled }
            });
        },
    });

    return {
        flags: query.data ?? [],
        isLoading: query.isLoading,
        error: query.error,
        toggle: toggleMutation.mutateAsync,
        isToggling: toggleMutation.isPending,
    };
}
