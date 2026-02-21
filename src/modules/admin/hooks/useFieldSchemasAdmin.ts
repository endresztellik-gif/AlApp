import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuditLogger } from './useAuditLogsAdmin';

interface EntityTypeRow {
    id: string;
    name: string;
    module: 'personnel' | 'vehicles' | 'equipment';
    icon: string | null;
    is_active: boolean;
    created_at: string;
}

interface FieldSchemaRow {
    id: string;
    entity_type_id: string;
    field_name: string;
    field_key: string;
    field_type: 'text' | 'number' | 'date' | 'date_expiry' | 'select' | 'file' | 'textarea';
    is_required: boolean;
    select_options: string[] | null;
    display_order: number;
    alert_days_warning: number;
    alert_days_urgent: number;
    alert_days_critical: number;
    created_at: string;
}

/**
 * Admin hook az entitás típusok kezeléséhez.
 */
export function useEntityTypesAdmin() {
    const queryClient = useQueryClient();
    const { mutate: log } = useAuditLogger();

    const query = useQuery({
        queryKey: ['admin', 'entity-types'],
        queryFn: async (): Promise<EntityTypeRow[]> => {
            const { data, error } = await supabase
                .from('entity_types')
                .select('*')
                .order('module, name');
            if (error) throw error;
            return data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (input: { name: string; module: string; icon?: string }) => {
            const { data, error } = await supabase
                .from('entity_types')
                .insert(input)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, input) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'entity-types'] });
            log({
                action: 'create_entity_type',
                table_name: 'entity_types',
                new_values: input
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, ...updates }: { id: string; name?: string; icon?: string; is_active?: boolean }) => {
            const { error } = await supabase
                .from('entity_types')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: (_, { id, ...updates }) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'entity-types'] });
            log({
                action: 'update_entity_type',
                table_name: 'entity_types',
                record_id: id,
                new_values: updates
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('entity_types')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'entity-types'] });
            log({
                action: 'delete_entity_type',
                table_name: 'entity_types',
                record_id: id
            });
        },
    });

    return {
        entityTypes: query.data ?? [],
        isLoading: query.isLoading,
        error: query.error,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        remove: deleteMutation.mutateAsync,
    };
}

/**
 * Admin hook a mező sémák kezeléséhez egy adott entitás típushoz.
 */
export function useFieldSchemasAdmin(entityTypeId: string | null) {
    const queryClient = useQueryClient();
    const { mutate: log } = useAuditLogger();

    const query = useQuery({
        queryKey: ['admin', 'field-schemas', entityTypeId],
        queryFn: async (): Promise<FieldSchemaRow[]> => {
            if (!entityTypeId) return [];
            const { data, error } = await supabase
                .from('field_schemas')
                .select('*')
                .eq('entity_type_id', entityTypeId)
                .order('display_order');
            if (error) throw error;
            return data;
        },
        enabled: !!entityTypeId,
    });

    const createMutation = useMutation({
        mutationFn: async (input: Omit<FieldSchemaRow, 'id' | 'created_at'>) => {
            const { data, error } = await supabase
                .from('field_schemas')
                .insert(input)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, input) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'field-schemas', entityTypeId] });
            log({
                action: 'create_field_schema',
                table_name: 'field_schemas',
                new_values: input
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<FieldSchemaRow> & { id: string }) => {
            const { error } = await supabase
                .from('field_schemas')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: (_, { id, ...updates }) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'field-schemas', entityTypeId] });
            log({
                action: 'update_field_schema',
                table_name: 'field_schemas',
                record_id: id,
                new_values: updates
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('field_schemas')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'field-schemas', entityTypeId] });
            log({
                action: 'delete_field_schema',
                table_name: 'field_schemas',
                record_id: id
            });
        },
    });

    return {
        fields: query.data ?? [],
        isLoading: query.isLoading,
        error: query.error,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        remove: deleteMutation.mutateAsync,
    };
}
