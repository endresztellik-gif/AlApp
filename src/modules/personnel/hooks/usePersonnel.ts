import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuditLogger } from '@/modules/admin/hooks/useAuditLogsAdmin';
import { useAuth } from '@/core/auth/useAuth';

export interface Personnel {
    id: string;
    entity_type_id: string;
    display_name: string;
    is_active: boolean;
    created_at: string;
    created_by?: string;
    user_id?: string | null;
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
    intended_role?: string | null;
}

export function usePersonnel() {
    const queryClient = useQueryClient();
    const { mutate: log } = useAuditLogger();
    const { user, profile } = useAuth();

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
            is_active?: boolean;
            intended_role?: string | null;
        }) => {
            // Direct JSONB insert - much simpler!
            const { data, error } = await supabase
                .from('personnel')
                .insert({
                    entity_type_id: newPerson.entity_type_id,
                    display_name: newPerson.display_name,
                    responsible_user_id: newPerson.responsible_user_id || null,
                    is_active: newPerson.is_active ?? true,
                    field_values: newPerson.field_values,
                    intended_role: newPerson.intended_role ?? null,
                    // user role esetén az adatlap automatikusan a saját fiókhoz kötődik
                    user_id: profile?.role === 'user' ? (user?.id ?? null) : null,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (result, variables) => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            log({
                action: 'create',
                table_name: 'personnel',
                record_id: result?.id,
                new_values: variables as Record<string, unknown>,
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, updates, fieldValues }: { id: string; updates?: Partial<Personnel>; fieldValues?: Record<string, unknown> }) => {
            // Fetch current record for old_values audit trail
            const { data: currentRecord } = await supabase
                .from('personnel')
                .select('*')
                .eq('id', id)
                .single();

            // Prepare update payload
            const payload: Record<string, unknown> = {};

            // 1. Basic fields update (remove readonly fields)
            if (updates) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
                const { entity_type, field_values, responsible_user, photos, created_by, ...safeUpdates } = updates as any;
                Object.assign(payload, safeUpdates);
            }

            // UUID mezők: üres string érvénytelen PostgreSQL-ben → null
            for (const uuidField of ['responsible_user_id', 'user_id'] as const) {
                if (uuidField in payload && payload[uuidField] === '') {
                    payload[uuidField] = null;
                }
            }
            // intended_role: üres string is érvénytelen a check constraint miatt
            if ('intended_role' in payload && payload.intended_role === '') {
                payload.intended_role = null;
            }

            // 2. Field values update (merge into JSONB)
            if (fieldValues) {
                payload.field_values = {
                    ...(currentRecord?.field_values || {}),
                    ...fieldValues
                };
            }

            // Execute single update
            const { error } = await supabase
                .from('personnel')
                .update(payload)
                .eq('id', id);

            if (error) throw error;
            return { id, payload, oldRecord: currentRecord };
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            log({
                action: 'update',
                table_name: 'personnel',
                record_id: result.id,
                old_values: result.oldRecord as Record<string, unknown>,
                new_values: result.payload,
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
                action: 'delete',
                table_name: 'personnel',
                record_id: id,
            });
        }
    })

    const linkUserMutation = useMutation({
        mutationFn: async ({ personnelId, userId }: { personnelId: string; userId: string | null }) => {
            const { error } = await supabase
                .from('personnel')
                .update({ user_id: userId })
                .eq('id', personnelId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
        },
    });

    return {
        personnel,
        isLoading,
        error,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        remove: deleteMutation.mutateAsync,
        linkUser: linkUserMutation.mutateAsync,
    };
}
