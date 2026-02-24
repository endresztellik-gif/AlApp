import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
// TOOD: Create a specific logger hook for equipment or generic one? 
// Using the same audit logger hook is fine as it just logs to 'audit_log'.
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
        // Single query to equipment table (JSONB field_values)
        const { data, error } = await supabase
            .from('equipment')
            .select(`
                *,
                entity_type:entity_types(id, name),
                responsible_user:user_profiles(full_name)
            `)
            .order('display_name');

        if (error) throw error;

        // Parse JSONB field_values (already in correct format)
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
            // Direct JSONB insert - much simpler!
            const { data, error } = await supabase
                .from('equipment')
                .insert({
                    entity_type_id: newEquipment.entity_type_id,
                    display_name: newEquipment.display_name,
                    responsible_user_id: newEquipment.responsible_user_id,
                    is_active: newEquipment.is_active,
                    field_values: newEquipment.field_values // JSONB direct insert
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['equipment'] });
            log({
                action: 'create_equipment',
                table_name: 'equipment',
                new_values: variables
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, updates, fieldValues }: { id: string; updates?: Partial<Equipment>; fieldValues?: Record<string, unknown> }) => {
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
                    .from('equipment')
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
                .from('equipment')
                .update(payload)
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['equipment'] });
            log({
                action: 'update_equipment',
                table_name: 'equipment',
                record_id: variables.id,
                new_values: variables
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
                action: 'delete_equipment',
                table_name: 'equipment',
                record_id: id
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
