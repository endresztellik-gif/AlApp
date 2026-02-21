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
 * Jogosultságkezelő hook – a három szintű (user, manager, admin)
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
            canViewAllData: role === 'manager' || role === 'admin',
            canEditAllData: role === 'manager' || role === 'admin',
            canDeleteAllData: role === 'admin',
            canManageSystem: role === 'admin',

            // Káresemények
            canCreateIncident: isAuthenticated,
            canViewAllIncidents: role === 'manager' || role === 'admin',
            canManageIncidents: role === 'manager' || role === 'admin',

            // Export
            canExportOwn: isAuthenticated,
            canExportAll: role === 'manager' || role === 'admin',

            // Admin
            canManageUsers: role === 'admin',
            canManageFieldSchemas: role === 'admin',
            canManageFeatureFlags: role === 'admin',

            // Értesítések
            canReceiveOwnNotifications: role === 'user' || role === 'manager' || role === 'admin',
            canReceiveAllNotifications: role === 'admin',

            role,
        };
    }, [profile]);
}
