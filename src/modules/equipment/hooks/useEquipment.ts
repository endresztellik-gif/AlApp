import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
// TOOD: Create a specific logger hook for equipment or generic one? 
// Using the same audit logger hook is fine as it just logs to 'audit_log'.
import { useAuditLogger } from '@/modules/admin/hooks/useAuditLogsAdmin';

export interface Equipment {
    id: string;
    entity_type_id: string;
    display_name: string;
    module: 'equipment';
    is_active: boolean;
    created_at: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field_values?: Record<string, any>;
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
        const { data: entities, error: entitiesError } = await supabase
            .from('entities')
            .select(`
                *,
                entity_type:entity_types(id, name),
                responsible_user:user_profiles(full_name)
            `)
            .eq('module', 'equipment')
            .order('display_name');

        if (entitiesError) throw entitiesError;

        if (!entities || entities.length === 0) return [];

        const entityIds = entities.map(e => e.id);
        const { data: fieldValues, error: valuesError } = await supabase
            .from('field_values')
            .select(`
                entity_id,
                value_text,
                value_date,
                value_json,
                field_schema:field_schemas(field_key)
            `)
            .in('entity_id', entityIds);

        if (valuesError) throw valuesError;

        return entities.map(entity => {
            const values: Record<string, unknown> = {};
            fieldValues?.filter(fv => fv.entity_id === entity.id).forEach(fv => {
                const val = fv.value_text ?? fv.value_date ?? fv.value_json;
                const schema = fv.field_schema as unknown as { field_key: string } | null;
                if (schema?.field_key) {
                    values[schema.field_key] = val;
                }
            });
            return { ...entity, field_values: values } as Equipment;
        });
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
            const { data: entity, error: entityError } = await supabase
                .from('entities')
                .insert({
                    entity_type_id: newEquipment.entity_type_id,
                    display_name: newEquipment.display_name,
                    module: 'equipment',
                    responsible_user_id: newEquipment.responsible_user_id,
                    is_active: newEquipment.is_active
                })
                .select()
                .single();

            if (entityError) throw entityError;

            const { data: schemas } = await supabase
                .from('field_schemas')
                .select('id, field_key, field_type')
                .eq('entity_type_id', newEquipment.entity_type_id);

            if (!schemas) return entity;

            const valuesToInsert = Object.entries(newEquipment.field_values).map(([key, value]) => {
                const schema = schemas.find(s => s.field_key === key);
                if (!schema) return null;

                const entry: Record<string, unknown> = {
                    entity_id: entity.id,
                    field_schema_id: schema.id,
                };

                if (schema.field_type === 'date' || schema.field_type === 'date_expiry') {
                    entry.value_date = value || null;
                } else if (schema.field_type === 'file') {
                    entry.value_json = value || null;
                } else {
                    entry.value_text = String(value);
                }
                return entry;
            }).filter(Boolean);

            if (valuesToInsert.length > 0) {
                const { error: valuesError } = await supabase
                    .from('field_values')
                    .insert(valuesToInsert);
                if (valuesError) throw valuesError;
            }

            return entity;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['equipment'] });
            log({
                action: 'create_equipment',
                table_name: 'entities',
                new_values: variables
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, updates, fieldValues }: { id: string; updates?: Partial<Equipment>; fieldValues?: Record<string, unknown> }) => {
            if (updates) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
                const { entity_type, field_values, responsible_user, ...safeUpdates } = updates as any;
                if (Object.keys(safeUpdates).length > 0) {
                    const { error } = await supabase.from('entities').update(safeUpdates).eq('id', id);
                    if (error) throw error;
                }
            }

            if (fieldValues) {
                const { data: entity, error: entError } = await supabase.from('entities').select('entity_type_id').eq('id', id).single();
                if (entError) throw entError;
                if (!entity) throw new Error("Entity not found");

                const { data: schemas, error: schemaError } = await supabase
                    .from('field_schemas')
                    .select('id, field_key, field_type')
                    .eq('entity_type_id', entity.entity_type_id);

                if (schemaError) throw schemaError;

                if (schemas) {
                    const upsertPromises = Object.entries(fieldValues).map(async ([key, value]) => {
                        const schema = schemas.find(s => s.field_key === key);
                        if (!schema) return;

                        const entry: Record<string, unknown> = {
                            entity_id: id,
                            field_schema_id: schema.id,
                            value_text: null,
                            value_date: null,
                            value_json: null
                        };

                        if (schema.field_type === 'date' || schema.field_type === 'date_expiry') {
                            entry.value_date = value || null;
                        } else if (schema.field_type === 'file') {
                            entry.value_json = value || null;
                        } else {
                            entry.value_text = String(value);
                        }

                        const { error } = await supabase
                            .from('field_values')
                            .upsert(entry, { onConflict: 'entity_id,field_schema_id' });

                        if (error) throw error;
                    });

                    await Promise.all(upsertPromises);
                }
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['equipment'] });
            log({
                action: 'update_equipment',
                table_name: 'entities',
                record_id: variables.id,
                new_values: variables
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('entities').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['equipment'] });
            log({
                action: 'delete_equipment',
                table_name: 'entities',
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
