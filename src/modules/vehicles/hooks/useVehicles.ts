import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuditLogger } from '@/modules/admin/hooks/useAuditLogsAdmin';

export interface Vehicle {
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

export function useVehicles() {
    const queryClient = useQueryClient();
    const { mutate: log } = useAuditLogger();

    const fetchVehicles = async () => {
        const { data, error } = await supabase
            .from('vehicles')
            .select(`
                *,
                entity_type:entity_types(id, name),
                responsible_user:user_profiles(full_name)
            `)
            .order('display_name');

        if (error) throw error;

        return (data || []).map(v => ({
            ...v,
            field_values: v.field_values || {}
        })) as Vehicle[];
    };

    const { data: vehicles, isLoading, error } = useQuery({
        queryKey: ['vehicles'],
        queryFn: fetchVehicles,
    });

    const createMutation = useMutation({
        mutationFn: async (newVehicle: {
            entity_type_id: string;
            display_name: string;
            field_values: Record<string, unknown>;
            responsible_user_id?: string;
        }) => {
            const { data, error } = await supabase
                .from('vehicles')
                .insert({
                    entity_type_id: newVehicle.entity_type_id,
                    display_name: newVehicle.display_name,
                    responsible_user_id: newVehicle.responsible_user_id,
                    field_values: newVehicle.field_values
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (result, variables) => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            log({
                action: 'create',
                table_name: 'vehicles',
                record_id: result?.id,
                new_values: variables as Record<string, unknown>,
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, updates, fieldValues }: { id: string; updates?: Partial<Vehicle>; fieldValues?: Record<string, unknown> }) => {
            // Fetch current record for old_values audit trail
            const { data: currentRecord } = await supabase
                .from('vehicles')
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
                .from('vehicles')
                .update(payload)
                .eq('id', id);

            if (error) throw error;
            return { id, payload, oldRecord: currentRecord };
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            log({
                action: 'update',
                table_name: 'vehicles',
                record_id: result.id,
                old_values: result.oldRecord as Record<string, unknown>,
                new_values: result.payload,
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('vehicles').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            log({
                action: 'delete',
                table_name: 'vehicles',
                record_id: id,
            });
        }
    });

    return {
        vehicles,
        isLoading,
        error,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        remove: deleteMutation.mutateAsync,
    };
}
