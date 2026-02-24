import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuditLogger } from '@/modules/admin/hooks/useAuditLogsAdmin';

export interface Personnel {
    id: string;
    entity_type_id: string;
    display_name: string;
    is_active: boolean;
    created_at: string;
    created_by?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field_values: Record<string, any>; // JSONB field_key -> value mapping
    entity_type?: {
        name: string;
        id: string;
    };
    responsible_user_id?: string;
    responsible_user?: {
        full_name: string;
    };
    photos?: unknown[];
}

export function usePersonnel() {
    const queryClient = useQueryClient();
    const { mutate: log } = useAuditLogger();

    const fetchPersonnel = async () => {
        // Single query to personnel table (JSONB field_values)
        const { data, error } = await supabase
            .from('personnel')
            .select(`
                *,
                entity_type:entity_types(id, name),
                responsible_user:user_profiles(full_name)
            `)
            .order('display_name');

        if (error) throw error;

        // Parse JSONB field_values (already in correct format)
        return (data || []).map(p => ({
            ...p,
            field_values: p.field_values || {}
        })) as Personnel[];
    };

    const { data: personnel, isLoading, error } = useQuery({
        queryKey: ['personnel'],
        queryFn: fetchPersonnel,
    });

    const createMutation = useMutation({
        mutationFn: async (newPerson: {
            entity_type_id: string;
            display_name: string;
            field_values: Record<string, unknown>; // field_key -> value
            responsible_user_id?: string;
        }) => {
            // Direct JSONB insert - much simpler!
            const { data, error } = await supabase
                .from('personnel')
                .insert({
                    entity_type_id: newPerson.entity_type_id,
                    display_name: newPerson.display_name,
                    responsible_user_id: newPerson.responsible_user_id,
                    field_values: newPerson.field_values // JSONB direct insert
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            log({
                action: 'create_personnel',
                table_name: 'personnel',
                new_values: variables
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, updates, fieldValues }: { id: string; updates?: Partial<Personnel>; fieldValues?: Record<string, unknown> }) => {
            // Prepare update payload
            const payload: Record<string, unknown> = {};

            // 1. Basic fields update (remove readonly fields)
            if (updates) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
                const { entity_type, field_values, responsible_user, photos, created_by, ...safeUpdates } = updates as any;
                Object.assign(payload, safeUpdates);
            }

            // 2. Field values update (merge into JSONB)
            if (fieldValues) {
                // Get current field_values and merge with new ones
                const { data: current } = await supabase
                    .from('personnel')
                    .select('field_values')
                    .eq('id', id)
                    .single();

                payload.field_values = {
                    ...(current?.field_values || {}),
                    ...fieldValues
                };
            }

            // Execute single update
            const { error } = await supabase
                .from('personnel')
                .update(payload)
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            log({
                action: 'update_personnel',
                table_name: 'personnel',
                record_id: variables.id,
                new_values: variables
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('personnel').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            log({
                action: 'delete_personnel',
                table_name: 'personnel',
                record_id: id
            });
        }
    })

    return {
        personnel,
        isLoading,
        error,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        remove: deleteMutation.mutateAsync,
    };
}
