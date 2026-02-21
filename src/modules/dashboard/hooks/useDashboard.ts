import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { differenceInDays, parseISO, startOfMonth } from 'date-fns';

export interface DashboardStats {
    personnelCount: number;
    vehicleCount: number;
    equipmentCount: number;
    incidentCount: number;
    personnelTrend: number; // New this month
    vehicleTrend: number;
    equipmentTrend: number;
    incidentTrend: number;
}

export interface ExpiringItem {
    id: string; // field_value id
    entityId: string;
    entityName: string;
    entityType: string;
    fieldName: string;
    expiryDate: string;
    daysRemaining: number;
    status: 'ok' | 'warning' | 'urgent' | 'critical' | 'expired';
}

export function useDashboard() {

    // 1. Fetch Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async (): Promise<DashboardStats> => {
            const startOfCurrentMonth = startOfMonth(new Date()).toISOString();

            // Parallel queries for counts and trends
            const [
                personnel,
                vehicles,
                equipment,
                incidents,
                newPersonnel,
                newVehicles,
                newEquipment,
                newIncidents
            ] = await Promise.all([
                supabase.from('entities').select('id', { count: 'exact', head: true }).eq('module', 'personnel').eq('is_active', true),
                supabase.from('entities').select('id', { count: 'exact', head: true }).eq('module', 'vehicles').eq('is_active', true),
                supabase.from('entities').select('id', { count: 'exact', head: true }).eq('module', 'equipment').eq('is_active', true),
                supabase.from('incidents').select('id', { count: 'exact', head: true }), // Open incidents? We don't have functionality to close them yet, so all.

                // Trends (created this month)
                supabase.from('entities').select('id', { count: 'exact', head: true }).eq('module', 'personnel').gte('created_at', startOfCurrentMonth),
                supabase.from('entities').select('id', { count: 'exact', head: true }).eq('module', 'vehicles').gte('created_at', startOfCurrentMonth),
                supabase.from('entities').select('id', { count: 'exact', head: true }).eq('module', 'equipment').gte('created_at', startOfCurrentMonth),
                supabase.from('incidents').select('id', { count: 'exact', head: true }).gte('created_at', startOfCurrentMonth),
            ]);

            return {
                personnelCount: personnel.count || 0,
                vehicleCount: vehicles.count || 0,
                equipmentCount: equipment.count || 0,
                incidentCount: incidents.count || 0,
                personnelTrend: newPersonnel.count || 0,
                vehicleTrend: newVehicles.count || 0,
                equipmentTrend: newEquipment.count || 0,
                incidentTrend: newIncidents.count || 0,
            };
        }
    });

    // 2. Fetch Expiring Items
    const { data: expiringItems, isLoading: expiringLoading } = useQuery({
        queryKey: ['dashboard-expiring'],
        queryFn: async (): Promise<ExpiringItem[]> => {
            // Fetch field values that are dates, and join with schema to get thresholds
            // We only care about fields that HAVE thresholds (alert_days_warning is not null)

            // Supabase join syntax is tricky for filtering on joined table columns in one go with complex logic.
            // Easier request: Fetch all field schemas with alerts, then fetch values for them.

            // 1. Get schemas that have alerts
            const { data: schemas, error: schemaError } = await supabase
                .from('field_schemas')
                .select('id, field_name, alert_days_warning, alert_days_urgent, alert_days_critical')
                .not('alert_days_warning', 'is', null);

            if (schemaError) throw schemaError;
            if (!schemas || schemas.length === 0) return [];

            const schemaIds = schemas.map(s => s.id);

            // 2. Get values for these schemas
            // Join entities to get name and type
            const { data: values, error: valuesError } = await supabase
                .from('field_values')
                .select(`
                    id,
                    value_date,
                    field_schema_id,
                    entity:entities (
                        id,
                        display_name,
                        entity_type:entity_types(name),
                        is_active
                    )
                `)
                .in('field_schema_id', schemaIds)
                .not('value_date', 'is', null);

            if (valuesError) throw valuesError;

            // 3. Process in JS
            const today = new Date();
            const results: ExpiringItem[] = [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            values?.forEach((fv: any) => {
                if (!fv.entity || !fv.entity.is_active) return; // Skip inactive entities

                const schema = schemas.find(s => s.id === fv.field_schema_id);
                if (!schema) return;

                const expiryDate = parseISO(fv.value_date);
                const daysRemaining = differenceInDays(expiryDate, today);

                // Determine status
                let status: ExpiringItem['status'] = 'ok';

                if (daysRemaining < 0) {
                    status = 'expired';
                } else if (schema.alert_days_critical && daysRemaining <= schema.alert_days_critical) {
                    status = 'critical';
                } else if (schema.alert_days_urgent && daysRemaining <= schema.alert_days_urgent) {
                    status = 'urgent';
                } else if (schema.alert_days_warning && daysRemaining <= schema.alert_days_warning) {
                    status = 'warning';
                }

                // Only add if it has a status other than 'ok' (or if we want to show all upcoming?)
                // Let's show anything that is at least within warning range.
                if (status !== 'ok') {
                    results.push({
                        id: fv.id,
                        entityId: fv.entity.id,
                        entityName: fv.entity.display_name,
                        entityType: fv.entity.entity_type?.name || 'Ismeretlen',
                        fieldName: schema.field_name,
                        expiryDate: fv.value_date,
                        daysRemaining,
                        status
                    });
                }
            });

            // Sort by days remaining (critical first)
            return results.sort((a, b) => a.daysRemaining - b.daysRemaining);
        }
    });

    return {
        stats,
        expiringItems,
        isLoading: statsLoading || expiringLoading
    };
}
