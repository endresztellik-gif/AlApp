import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { WaterFacility, WaterFacilityInput } from '../types';

export const useWaterFacilities = () => {
    const queryClient = useQueryClient();

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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['water_facilities'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<WaterFacilityInput> }) => {
            const { data, error } = await supabase
                .from('water_facilities')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['water_facilities'] });
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['water_facilities'] });
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
