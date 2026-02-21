import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuditLogger } from '@/modules/admin/hooks/useAuditLogsAdmin';

export interface Vehicle {
    id: string;
    entity_type_id: string;
    display_name: string; // Used for license plate or general name
    module: 'vehicles';
    is_active: boolean;
    created_at: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field_values?: Record<string, any>; // field_key -> value mapping
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
        // 1. Fetch entities
        const { data: entities, error: entitiesError } = await supabase
            .from('entities')
            .select(`
                *,
                entity_type:entity_types(id, name),
                responsible_user:user_profiles(full_name)
            `)
            .eq('module', 'vehicles')
            .order('display_name');

        if (entitiesError) throw entitiesError;

        if (!entities || entities.length === 0) return [];

        // 2. Fetch field values for these entities
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

        // 3. Merge values into entities
        return entities.map(entity => {
            const values: Record<string, unknown> = {};
            fieldValues?.filter(fv => fv.entity_id === entity.id).forEach(fv => {
                const val = fv.value_text ?? fv.value_date ?? fv.value_json;
                const schema = fv.field_schema as unknown as { field_key: string } | null;
                if (schema?.field_key) {
                    values[schema.field_key] = val;
                }
            });
            return { ...entity, field_values: values } as Vehicle;
        });
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
            // 1. Create entity
            const { data: entity, error: entityError } = await supabase
                .from('entities')
                .insert({
                    entity_type_id: newVehicle.entity_type_id,
                    display_name: newVehicle.display_name,
                    module: 'vehicles',
                    responsible_user_id: newVehicle.responsible_user_id
                })
                .select()
                .single();

            if (entityError) throw entityError;

            // 2. Insert field values
            const { data: schemas } = await supabase
                .from('field_schemas')
                .select('id, field_key, field_type')
                .eq('entity_type_id', newVehicle.entity_type_id);

            if (!schemas) return entity;

            const valuesToInsert = Object.entries(newVehicle.field_values).map(([key, value]) => {
                const schema = schemas.find(s => s.field_key === key);
                if (!schema) return null;

                const entry: Record<string, unknown> = {
                    entity_id: entity.id,
                    field_schema_id: schema.id,
                };

                if (schema.field_type === 'date' || schema.field_type === 'date_expiry') {
                    entry.value_date = value || null;
                } else if (schema.field_type === 'select' || schema.field_type === 'file') {
                    entry.value_text = String(value);
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
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            log({
                action: 'create_vehicle',
                table_name: 'entities',
                new_values: variables
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, updates, fieldValues }: { id: string; updates?: Partial<Vehicle>; fieldValues?: Record<string, unknown> }) => {
            // 1. Update entity basic info
            if (updates) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
                const { entity_type, field_values, responsible_user, ...safeUpdates } = updates as any;
                if (Object.keys(safeUpdates).length > 0) {
                    const { error } = await supabase.from('entities').update(safeUpdates).eq('id', id);
                    if (error) throw error;
                }
            }

            // 2. Update field values
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
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            log({
                action: 'update_vehicle',
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
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            log({
                action: 'delete_vehicle',
                table_name: 'entities',
                record_id: id
            });
        }
    })

    return {
        vehicles,
        isLoading,
        error,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        remove: deleteMutation.mutateAsync,
    };
}
