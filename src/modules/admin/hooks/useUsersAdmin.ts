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
    // New fields from auth.users
    email_confirmed_at?: string | null;
    invited_at?: string | null;
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
            // Get user_profiles
            const { data: profiles, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .order('full_name');
            if (profileError) throw profileError;

            // Get auth metadata
            const { data: { users: authUsers }, error: authError } =
                await supabase.auth.admin.listUsers();
            if (authError) throw authError;

            // Merge data
            return profiles.map(profile => {
                const authUser = authUsers.find(u => u.id === profile.id);
                return {
                    ...profile,
                    email_confirmed_at: authUser?.email_confirmed_at,
                    invited_at: authUser?.invited_at,
                };
            });
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
            const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
                data: {
                    full_name: fullName,
                    role
                },
                redirectTo: `${window.location.origin}/auth/setup-password`
            });

            if (error) {
                // Better error messages
                if (error.message.includes('already') || error.message.includes('User already registered')) {
                    throw new Error('Ez az email cím már használatban van.');
                }
                throw new Error(error.message || 'Hiba történt a meghívás során.');
            }
        },
        onSuccess: (_, { email, fullName, role }) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            log({
                action: 'invite_user',
                table_name: 'auth.users',
                new_values: { email, fullName, role }
            });
        },
        onError: (error) => {
            // Additional error logging for debugging
            console.error('[inviteUserMutation] Error:', error);
        }
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
