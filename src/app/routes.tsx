import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/shared/layouts/MainLayout';
import { ProtectedRoute } from '@/core/auth/ProtectedRoute';
import { DashboardPage } from '@/modules/dashboard/pages/DashboardPage';
import { PersonnelListPage } from '@/modules/personnel/pages/PersonnelListPage';
import { PersonnelDetailPage } from '@/modules/personnel/pages/PersonnelDetailPage';
import { VehiclesListPage } from '@/modules/vehicles/pages/VehiclesListPage';
import { VehiclesDetailPage } from '@/modules/vehicles/pages/VehiclesDetailPage';
import { EquipmentPage } from '@/modules/equipment/pages/EquipmentPage';
import { EquipmentDetailPage } from '@/modules/equipment/pages/EquipmentDetailPage';
import { CalendarPage } from '@/modules/calendar/pages/CalendarPage';
import { IncidentsPage } from '@/modules/incidents/pages/IncidentsPage';
import { SettingsPage } from '@/modules/settings/pages/SettingsPage';
import { UsersPage } from '@/modules/admin/pages/UsersPage';
import { FieldSchemasPage } from '@/modules/admin/pages/FieldSchemasPage';
import { FeatureFlagsPage } from '@/modules/admin/pages/FeatureFlagsPage';
import { AuditLogPage } from '@/modules/admin/pages/AuditLogPage';
import { LoginPage } from '@/core/auth/LoginPage';
import { WaterFacilitiesListPage } from '@/modules/water-facilities/pages/WaterFacilitiesListPage';
import { WaterFacilityDetailPage } from '@/modules/water-facilities/pages/WaterFacilityDetailPage';
import { QuickReportPage } from '@/modules/vehicles/pages/QuickReportPage';

/**
 * AlApp routing konfiguráció.
 */
export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <DashboardPage /> },

            // Personnel Module
            { path: 'personnel', element: <PersonnelListPage /> },
            { path: 'personnel/:id', element: <PersonnelDetailPage /> },

            { path: 'vehicles', element: <VehiclesListPage /> },
            { path: 'vehicles/:id', element: <VehiclesDetailPage /> },
            { path: 'quick-report/:id', element: <QuickReportPage /> },
            { path: 'equipment', element: <EquipmentPage /> },
            { path: 'equipment/:id', element: <EquipmentDetailPage /> },
            { path: 'calendar', element: <CalendarPage /> },
            { path: 'incidents', element: <IncidentsPage /> },

            // Water Facilities Module
            { path: 'water-facilities', element: <WaterFacilitiesListPage /> },
            { path: 'water-facilities/:id', element: <WaterFacilityDetailPage /> },

            // Beállítások + Admin aloldalak
            { path: 'settings', element: <SettingsPage /> },
            { path: 'settings/users', element: <UsersPage /> },
            { path: 'settings/field-schemas', element: <FieldSchemasPage /> },
            { path: 'settings/feature-flags', element: <FeatureFlagsPage /> },
            { path: 'settings/audit-log', element: <AuditLogPage /> },

            { path: '*', element: <Navigate to="/" replace /> },
        ],
    },
]);
