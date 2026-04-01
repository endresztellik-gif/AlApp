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
    id: string;
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
                supabase.from('personnel').select('id', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('equipment').select('id', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('incidents').select('id', { count: 'exact', head: true }),

                supabase.from('personnel').select('id', { count: 'exact', head: true }).gte('created_at', startOfCurrentMonth),
                supabase.from('vehicles').select('id', { count: 'exact', head: true }).gte('created_at', startOfCurrentMonth),
                supabase.from('equipment').select('id', { count: 'exact', head: true }).gte('created_at', startOfCurrentMonth),
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
            // 1. Get field schemas that have alert thresholds
            const { data: schemas, error: schemaError } = await supabase
                .from('field_schemas')
                .select('field_key, field_name, alert_days_warning, alert_days_urgent, alert_days_critical')
                .not('alert_days_warning', 'is', null)
                .in('field_type', ['date_expiry', 'date']);

            if (schemaError) throw schemaError;
            if (!schemas || schemas.length === 0) return [];

            // Deduplicate: field_key -> schema info (same key can appear for multiple entity types)
            const schemaMap = new Map<string, { field_name: string; alert_days_warning: number; alert_days_urgent: number | null; alert_days_critical: number | null }>();
            schemas.forEach(s => {
                if (!schemaMap.has(s.field_key)) {
                    schemaMap.set(s.field_key, {
                        field_name: s.field_name,
                        alert_days_warning: s.alert_days_warning,
                        alert_days_urgent: s.alert_days_urgent,
                        alert_days_critical: s.alert_days_critical,
                    });
                }
            });

            // 2. Fetch active records from all modules
            const [vehiclesData, personnelData, equipmentData] = await Promise.all([
                supabase.from('vehicles').select('id, display_name, field_values, entity_type:entity_types(name)').eq('is_active', true),
                supabase.from('personnel').select('id, display_name, field_values, entity_type:entity_types(name)').eq('is_active', true),
                supabase.from('equipment').select('id, display_name, field_values, entity_type:entity_types(name)').eq('is_active', true),
            ]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const allRecords: Array<{ id: string; display_name: string; field_values: Record<string, unknown>; entity_type: any }> = [
                ...(vehiclesData.data || []),
                ...(personnelData.data || []),
                ...(equipmentData.data || []),
            ];

            // 3. Process in JS: scan each record's field_values JSONB for tracked date fields
            const today = new Date();
            const results: ExpiringItem[] = [];

            allRecords.forEach(record => {
                const fv = record.field_values || {};

                schemaMap.forEach((schema, fieldKey) => {
                    const dateValue = fv[fieldKey];
                    if (!dateValue) return;

                    const expiryDate = parseISO(String(dateValue));
                    if (isNaN(expiryDate.getTime())) return;

                    const daysRemaining = differenceInDays(expiryDate, today);

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

                    if (status !== 'ok') {
                        results.push({
                            id: `${record.id}-${fieldKey}`,
                            entityId: record.id,
                            entityName: record.display_name,
                            entityType: record.entity_type?.name || 'Ismeretlen',
                            fieldName: schema.field_name,
                            expiryDate: String(dateValue),
                            daysRemaining,
                            status,
                        });
                    }
                });
            });

            return results.sort((a, b) => a.daysRemaining - b.daysRemaining);
        }
    });

    return {
        stats,
        expiringItems,
        isLoading: statsLoading || expiringLoading
    };
}
