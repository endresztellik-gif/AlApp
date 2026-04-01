import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuditLogger } from '@/modules/admin/hooks/useAuditLogsAdmin';

export interface Incident {
    id: string;
    entity_id: string;
    reported_by: string;
    description: string;
    created_at: string;
    entity?: {
        display_name: string;
        module: string;
        entity_type?: {
            name: string;
            id: string;
        };
    };
    reporter?: {
        full_name: string;
    };
    photos?: unknown[];
}

interface IncidentPhoto {
    id: string;
    webViewLink: string;
    name: string;
}

interface NewIncident {
    entity_id: string;
    reported_by: string;
    description: string;
    _photos?: IncidentPhoto[];
    [key: string]: unknown;
}

export function useIncidents(entityId?: string) {
    const queryClient = useQueryClient();
    const { mutate: log } = useAuditLogger();

    const fetchIncidents = async () => {
        let query = supabase
            .from('incidents')
            .select(`
                *,
                entity:entities(
                    id, 
                    display_name, 
                    module,
                    entity_type:entity_types(id, name)
                ),
                reporter:user_profiles!incidents_reported_by_fkey(full_name)
            `)
            .order('created_at', { ascending: false });

        if (entityId) {
            query = query.eq('entity_id', entityId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as Incident[];
    };

    const { data: incidents, isLoading, error } = useQuery({
        queryKey: ['incidents', entityId], // Include entityId in queryKey
        queryFn: fetchIncidents,
    });

    const createMutation = useMutation({
        mutationFn: async (newIncident: NewIncident) => {
            // 1. Create Incident
            const { _photos, ...incidentData } = newIncident;

            const { data: incident, error } = await supabase
                .from('incidents')
                .insert([incidentData])
                .select()
                .single();

            if (error) throw error;

            // 2. Insert Photos (if any)
            if (_photos && _photos.length > 0 && incident) {
                const photoRecords = _photos.map((p: IncidentPhoto) => ({
                    incident_id: incident.id,
                    drive_file_id: p.id,
                    drive_url: p.webViewLink,
                    filename: p.name
                    // uploaded_at is default now()
                }));

                const { error: photoError } = await supabase
                    .from('incident_photos')
                    .insert(photoRecords);

                if (photoError) {
                    console.error('Error saving photos metadata:', photoError);
                }
            }

            return incident;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            log({
                action: 'create',
                table_name: 'incidents',
                record_id: data?.id,
                new_values: data as Record<string, unknown>,
            });
        },
    });

    return {
        incidents,
        isLoading,
        error,
        create: createMutation.mutateAsync,
    };
}
