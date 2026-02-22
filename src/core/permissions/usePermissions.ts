import { useMemo } from 'react';
import { useAuth } from '@/core/auth/useAuth';
import type { UserRole } from '@/shared/types';

// --- Jogosultsági struktúra ---
export interface Permissions {
    // Adatok megtekintése és szerkesztése
    canViewOwnData: boolean;
    canEditOwnData: boolean;
    canViewAllData: boolean;
    canEditAllData: boolean;
    canDeleteAllData: boolean;

    // Rendszer beállítások
    canManageSystem: boolean;

    // Káresemények
    canCreateIncident: boolean;
    canViewAllIncidents: boolean;
    canManageIncidents: boolean;

    // Export
    canExportOwn: boolean;
    canExportAll: boolean;

    // Admin funkciók
    canManageUsers: boolean;
    canManageFieldSchemas: boolean;
    canManageFeatureFlags: boolean;

    // Értesítések
    canReceiveOwnNotifications: boolean;
    canReceiveAllNotifications: boolean;

    // Aktuális szerepkör
    role: UserRole | null;
}

/**
 * Jogosultságkezelő hook – a három szintű (user, reader, admin)
 * jogosultsági modell alapján számítja ki az aktuális felhasználó jogait.
 */
export function usePermissions(): Permissions {
    const { profile } = useAuth();

    return useMemo(() => {
        const role = profile?.role ?? null;
        const isAuthenticated = role !== null;

        return {
            // Adatok
            canViewOwnData: isAuthenticated,
            canEditOwnData: isAuthenticated,
            canViewAllData: role === 'reader' || role === 'admin',
            canEditAllData: role === 'admin', // Reader can edit own, DB enforces this
            canDeleteAllData: role === 'admin',
            canManageSystem: role === 'admin',

            // Káresemények
            canCreateIncident: isAuthenticated,
            canViewAllIncidents: role === 'reader' || role === 'admin', // User only sees own
            canManageIncidents: role === 'admin', // Only admin can update/delete

            // Export
            canExportOwn: isAuthenticated,
            canExportAll: role === 'reader' || role === 'admin',

            // Admin
            canManageUsers: role === 'admin',
            canManageFieldSchemas: role === 'admin',
            canManageFeatureFlags: role === 'admin',

            // Értesítések
            canReceiveOwnNotifications: role === 'user' || role === 'reader' || role === 'admin',
            canReceiveAllNotifications: role === 'admin',

            role,
        };
    }, [profile]);
}
