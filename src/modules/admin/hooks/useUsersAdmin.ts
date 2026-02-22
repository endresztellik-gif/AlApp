import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuditLogger } from './useAuditLogsAdmin';

type UserRole = 'admin' | 'reader' | 'user';

interface UserRow {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Admin hook a felhasználók kezeléséhez.
 * Listázás, szerepkör módosítás, aktiválás/deaktiválás, meghívás.
 */
export function useUsersAdmin() {
    const queryClient = useQueryClient();
    const { mutate: log } = useAuditLogger();

    const query = useQuery({
        queryKey: ['admin', 'users'],
        queryFn: async (): Promise<UserRow[]> => {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .order('full_name');
            if (error) throw error;
            return data;
        },
    });

    // Szerepkör módosítása
    const updateRoleMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
            const { error } = await supabase
                .from('user_profiles')
                .update({ role })
                .eq('id', userId);
            if (error) throw error;
        },
        onSuccess: (_, { userId, role }) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            log({
                action: 'update_role',
                table_name: 'user_profiles',
                record_id: userId,
                new_values: { role }
            });
        },
    });

    // Aktiválás/deaktiválás
    const toggleActiveMutation = useMutation({
        mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
            const { error } = await supabase
                .from('user_profiles')
                .update({ is_active: isActive })
                .eq('id', userId);
            if (error) throw error;
        },
        onSuccess: (_, { userId, isActive }) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            log({
                action: isActive ? 'activate_user' : 'deactivate_user',
                table_name: 'user_profiles',
                record_id: userId,
                new_values: { is_active: isActive }
            });
        },
    });

    // Felhasználó meghívása (Supabase Auth admin API-n keresztül)
    const inviteUserMutation = useMutation({
        mutationFn: async ({ email, fullName, role }: { email: string; fullName: string; role: string }) => {
            // Supabase Auth meghívó – a user_profiles sort a trigger hozza létre
            const { error } = await supabase.auth.admin.createUser({
                email,
                email_confirm: true,
                user_metadata: { full_name: fullName, role },
            });
            if (error) throw error;
        },
        onSuccess: (_, { email, fullName, role }) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            log({
                action: 'invite_user',
                table_name: 'auth.users',
                new_values: { email, fullName, role }
            });
        },
    });

    return {
        users: query.data ?? [],
        isLoading: query.isLoading,
        error: query.error,
        updateRole: updateRoleMutation.mutateAsync,
        toggleActive: toggleActiveMutation.mutateAsync,
        inviteUser: inviteUserMutation.mutateAsync,
        isInviting: inviteUserMutation.isPending,
    };
}
