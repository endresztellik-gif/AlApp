import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuditLogger } from '@/modules/admin/hooks/useAuditLogsAdmin';

export interface Equipment {
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

export function useEquipment() {
    const queryClient = useQueryClient();
    const { mutate: log } = useAuditLogger();

    const fetchEquipment = async () => {
        const { data, error } = await supabase
            .from('equipment')
            .select(`
                *,
                entity_type:entity_types(id, name),
                responsible_user:user_profiles(full_name)
            `)
            .order('display_name');

        if (error) throw error;

        return (data || []).map(e => ({
            ...e,
            field_values: e.field_values || {}
        })) as Equipment[];
    };

    const { data: equipment, isLoading, error } = useQuery({
        queryKey: ['equipment'],
        queryFn: fetchEquipment,
    });

    const createMutation = useMutation({
        mutationFn: async (newEquipment: {
            entity_type_id: string;
            display_name: string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            field_values: Record<string, any>;
            responsible_user_id?: string;
            is_active: boolean;
        }) => {
            const { data, error } = await supabase
                .from('equipment')
                .insert({
                    entity_type_id: newEquipment.entity_type_id,
                    display_name: newEquipment.display_name,
                    responsible_user_id: newEquipment.responsible_user_id || null,
                    is_active: newEquipment.is_active,
                    field_values: newEquipment.field_values
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (result, variables) => {
            queryClient.invalidateQueries({ queryKey: ['equipment'] });
            log({
                action: 'create',
                table_name: 'equipment',
                record_id: result?.id,
                new_values: variables as Record<string, unknown>,
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, updates, fieldValues }: { id: string; updates?: Partial<Equipment>; fieldValues?: Record<string, unknown> }) => {
            // Fetch current record for old_values audit trail
            const { data: currentRecord } = await supabase
                .from('equipment')
                .select('*')
                .eq('id', id)
                .single();

            const payload: Record<string, unknown> = {};

            if (updates) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
                const { entity_type, field_values, responsible_user, photos, created_by, ...safeUpdates } = updates as any;
                Object.assign(payload, safeUpdates);
            }

            if (fieldValues) {
                payload.field_values = {
                    ...(currentRecord?.field_values || {}),
                    ...fieldValues
                };
            }

            const { error } = await supabase
                .from('equipment')
                .update(payload)
                .eq('id', id);

            if (error) throw error;
            return { id, payload, oldRecord: currentRecord };
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['equipment'] });
            log({
                action: 'update',
                table_name: 'equipment',
                record_id: result.id,
                old_values: result.oldRecord as Record<string, unknown>,
                new_values: result.payload,
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('equipment').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['equipment'] });
            log({
                action: 'delete',
                table_name: 'equipment',
                record_id: id,
            });
        }
    });

    return {
        equipment,
        isLoading,
        error,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        remove: deleteMutation.mutateAsync,
    };
}
