import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuditLogger } from '@/modules/admin/hooks/useAuditLogsAdmin';
import { WaterFacility, WaterFacilityInput } from '../types';

export const useWaterFacilities = () => {
    const queryClient = useQueryClient();
    const { mutate: log } = useAuditLogger();

    const fetchWaterFacilities = async (): Promise<WaterFacility[]> => {
        const { data, error } = await supabase
            .from('water_facilities')
            .select('*')
            .order('name');

        if (error) throw error;
        return data || [];
    };

    const { data: facilities, isLoading, error } = useQuery({
        queryKey: ['water_facilities'],
        queryFn: fetchWaterFacilities,
    });

    const createMutation = useMutation({
        mutationFn: async (newFacility: WaterFacilityInput) => {
            const { data, error } = await supabase
                .from('water_facilities')
                .insert(newFacility)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (result, variables) => {
            queryClient.invalidateQueries({ queryKey: ['water_facilities'] });
            log({
                action: 'create',
                table_name: 'water_facilities',
                record_id: result?.id,
                new_values: variables as unknown as Record<string, unknown>,
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<WaterFacilityInput> }) => {
            // Fetch current record for old_values audit trail
            const { data: currentRecord } = await supabase
                .from('water_facilities')
                .select('*')
                .eq('id', id)
                .single();

            const { data, error } = await supabase
                .from('water_facilities')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { result: data, oldRecord: currentRecord, id };
        },
        onSuccess: ({ result, oldRecord, id }) => {
            queryClient.invalidateQueries({ queryKey: ['water_facilities'] });
            log({
                action: 'update',
                table_name: 'water_facilities',
                record_id: id,
                old_values: oldRecord as Record<string, unknown>,
                new_values: result as Record<string, unknown>,
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('water_facilities')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['water_facilities'] });
            log({
                action: 'delete',
                table_name: 'water_facilities',
                record_id: id,
            });
        },
    });

    return {
        facilities,
        isLoading,
        error,
        createFacility: createMutation.mutateAsync,
        updateFacility: updateMutation.mutateAsync,
        deleteFacility: deleteMutation.mutateAsync,
    };
};

export const useWaterFacility = (id?: string) => {
    const fetchWaterFacility = async (): Promise<WaterFacility | null> => {
        if (!id) return null;
        const { data, error } = await supabase
            .from('water_facilities')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    };

    const { data: facility, isLoading, error } = useQuery({
        queryKey: ['water_facilities', id],
        queryFn: fetchWaterFacility,
        enabled: !!id,
    });

    return { facility, isLoading, error };
};
