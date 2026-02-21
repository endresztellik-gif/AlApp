import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export interface AuditLogRow {
    id: string;
    user_id: string | null;
    action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | string;
    table_name: string;
    record_id: string | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string;
    user_full_name?: string; // Joined field
    user_email?: string;     // Joined field
}

interface AuditLogFilters {
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
    const {
        userId,
        action,
        startDate,
        endDate,
        page = 1,
        pageSize = 20
    } = filters;

    return useQuery({
        queryKey: ['admin', 'audit-logs', filters],
        queryFn: async () => {
            let query = supabase
                .from('audit_log')
                .select(`
          *,
          user:user_profiles (
            full_name,
            email
          )
        `, { count: 'exact' });

            if (userId) {
                query = query.eq('user_id', userId);
            }
            if (action) {
                query = query.eq('action', action);
            }
            if (startDate) {
                query = query.gte('created_at', startDate.toISOString());
            }
            if (endDate) {
                // End of day
                const endDay = new Date(endDate);
                endDay.setHours(23, 59, 59, 999);
                query = query.lte('created_at', endDay.toISOString());
            }

            // Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to).order('created_at', { ascending: false });

            const { data, error, count } = await query;

            if (error) throw error;

            // Flatten user data for easier access
            const rows: AuditLogRow[] = (data as (AuditLogRow & { user?: { full_name?: string; email?: string } })[]).map((row) => ({
                ...row,
                user_full_name: row.user?.full_name || 'N/A',
                user_email: row.user?.email || 'N/A',
            }));

            return { rows, count };
        },
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
    });
}

export function useAuditLogger() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: {
            action: string;
            table_name: string;
            record_id?: string;
            old_values?: Record<string, unknown>;
            new_values?: Record<string, unknown>;
        }) => {
            const {
                action,
                table_name,
                record_id = null,
                old_values = null,
                new_values = null
            } = params;

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn('Audit log attempt without authenticated user');
                return;
            }

            const { error } = await supabase
                .from('audit_log')
                .insert({
                    user_id: user.id,
                    action,
                    table_name,
                    record_id,
                    old_values,
                    new_values,
                });

            if (error) throw error;
        },
        onSuccess: () => {
            // Invalidate audit logs query to show new entry immediately if viewing logs
            queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
        },
    });
}
