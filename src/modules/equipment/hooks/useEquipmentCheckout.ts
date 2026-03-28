import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/core/auth/useAuth';

export interface EquipmentCheckout {
    id: string;
    equipment_id: string;
    user_id: string;
    checked_out_at: string;
    returned_at: string | null;
    last_reminder_sent_at: string | null;
    reminder_ack: 'yes' | 'no' | null;
    notes: string | null;
    closed_by_admin: boolean;
    user?: {
        full_name: string;
        email: string;
    };
}

/** Aktív kölcsönzés lekérése egy eszközhöz */
export function useEquipmentCheckout(equipmentId: string) {
    const { user, profile } = useAuth();
    const queryClient = useQueryClient();

    const { data: activeCheckout, isLoading } = useQuery({
        queryKey: ['equipment-checkout', equipmentId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('equipment_checkouts')
                .select(`
                    *,
                    user:user_profiles(full_name, email)
                `)
                .eq('equipment_id', equipmentId)
                .is('returned_at', null)
                .maybeSingle();

            if (error) throw error;
            return data as EquipmentCheckout | null;
        },
        enabled: !!equipmentId,
    });

    const checkoutMutation = useMutation({
        mutationFn: async (notes?: string) => {
            if (!user) throw new Error('Nincs bejelentkezett felhasználó');

            const { data, error } = await supabase
                .from('equipment_checkouts')
                .insert({
                    equipment_id: equipmentId,
                    user_id: user.id,
                    notes: notes ?? null,
                })
                .select()
                .single();

            if (error) {
                // Unique constraint violation = már valaki felvette
                if (error.code === '23505') {
                    throw new Error('Ezt az eszközt már valaki felvette.');
                }
                throw error;
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment-checkout', equipmentId] });
            queryClient.invalidateQueries({ queryKey: ['equipment-checkouts-all'] });
        },
    });

    const returnMutation = useMutation({
        mutationFn: async (checkoutId: string) => {
            const { error } = await supabase
                .from('equipment_checkouts')
                .update({ returned_at: new Date().toISOString() })
                .eq('id', checkoutId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment-checkout', equipmentId] });
            queryClient.invalidateQueries({ queryKey: ['equipment-checkouts-all'] });
        },
    });

    const adminReturnMutation = useMutation({
        mutationFn: async (checkoutId: string) => {
            const { error } = await supabase
                .from('equipment_checkouts')
                .update({
                    returned_at: new Date().toISOString(),
                    closed_by_admin: true,
                })
                .eq('id', checkoutId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment-checkout', equipmentId] });
            queryClient.invalidateQueries({ queryKey: ['equipment-checkouts-all'] });
        },
    });

    const isMyCheckout = activeCheckout?.user_id === user?.id;
    const isAdmin = profile?.role === 'admin';

    return {
        activeCheckout,
        isLoading,
        isMyCheckout,
        isAdmin,
        checkout: checkoutMutation.mutateAsync,
        return: returnMutation.mutateAsync,
        adminReturn: adminReturnMutation.mutateAsync,
        isCheckingOut: checkoutMutation.isPending,
        isReturning: returnMutation.isPending || adminReturnMutation.isPending,
    };
}

/** Összes aktív kölcsönzés (leltár nézet) */
export function useAllActiveCheckouts() {
    return useQuery({
        queryKey: ['equipment-checkouts-all'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('equipment_checkouts')
                .select(`
                    *,
                    user:user_profiles(full_name, email),
                    equipment(id, display_name, entity_type:entity_types(name))
                `)
                .is('returned_at', null)
                .order('checked_out_at', { ascending: false });

            if (error) throw error;
            return data as (EquipmentCheckout & {
                equipment: { id: string; display_name: string; entity_type: { name: string } | null }
            })[];
        },
    });
}

/** Checkout előzmények egy eszközhöz (admin/reader) */
export function useEquipmentCheckoutHistory(equipmentId: string) {
    return useQuery({
        queryKey: ['equipment-checkout-history', equipmentId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('equipment_checkouts')
                .select(`
                    *,
                    user:user_profiles(full_name, email)
                `)
                .eq('equipment_id', equipmentId)
                .order('checked_out_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            return data as EquipmentCheckout[];
        },
        enabled: !!equipmentId,
    });
}
