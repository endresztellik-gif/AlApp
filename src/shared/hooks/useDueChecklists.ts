import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/core/auth/useAuth';

export interface DueVehicle {
    id: string;
    display_name: string;
}

export function useDueChecklists() {
    const { user } = useAuth();

    const fetchDueChecklists = async (): Promise<DueVehicle[]> => {
        if (!user) return [];

        // 1. Find all vehicles assigned to this user
        const { data: assignedVehicles, error: vehiclesError } = await supabase
            .from('entities')
            .select('id, display_name')
            .eq('module', 'vehicles')
            .eq('responsible_user_id', user.id);

        if (vehiclesError) throw vehiclesError;
        if (!assignedVehicles || assignedVehicles.length === 0) return [];

        const vehicleIds = assignedVehicles.map(v => v.id);

        // 2. Find the *latest* checklist for each of those vehicles
        const { data: latestChecklists, error: checksError } = await supabase
            .from('vehicle_checklists')
            .select('vehicle_id, check_date')
            .in('vehicle_id', vehicleIds)
            .order('check_date', { ascending: false });

        if (checksError) throw checksError;

        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const dueVehicles: DueVehicle[] = [];

        // 3. Determine which ones are due
        for (const vehicle of assignedVehicles) {
            // Find the most recent checklist for this specific vehicle
            const lastCheck = latestChecklists?.find(c => c.vehicle_id === vehicle.id);

            if (!lastCheck) {
                // Never checked -> Due
                dueVehicles.push(vehicle);
            } else {
                const checkDate = new Date(lastCheck.check_date);
                if (checkDate < fourteenDaysAgo) {
                    // Checked more than 14 days ago -> Due
                    dueVehicles.push(vehicle);
                }
            }
        }

        return dueVehicles;
    };

    return useQuery({
        queryKey: ['dueChecklists', user?.id],
        queryFn: fetchDueChecklists,
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
