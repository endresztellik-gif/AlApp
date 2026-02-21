// ============================================================
// AlApp – Közös típusdefiníciók
// ============================================================

// --- Felhasználói szerepkörök ---
export type UserRole = 'user' | 'manager' | 'admin';

// --- Modul típusok ---
export type ModuleType = 'personnel' | 'vehicles' | 'equipment';

// --- Mező típusok ---
export type FieldType = 'text' | 'number' | 'date' | 'date_expiry' | 'select' | 'file';

// --- Lejárati állapot ---
export type ExpiryStatus = 'ok' | 'warning' | 'urgent' | 'critical' | 'expired';

// --- Feature flag kulcsok ---
export interface FeatureFlags {
    module_personnel: boolean;
    module_vehicles: boolean;
    module_equipment: boolean;
    module_calendar: boolean;
    module_incidents: boolean;
    module_other: boolean;
    feature_qr_codes: boolean;
    feature_offline_write: boolean;
}

// --- Felhasználói profil ---
export interface UserProfile {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// --- Entitás típus (pl. személyautó, utánfutó, láncfűrész) ---
export interface EntityType {
    id: string;
    name: string;
    module: ModuleType;
    icon?: string;
    isActive: boolean;
    createdAt: string;
}

// --- Mező séma (dinamikus mező definíció) ---
export interface FieldSchema {
    id: string;
    entityTypeId: string;
    fieldName: string;
    fieldKey: string;
    fieldType: FieldType;
    isRequired: boolean;
    selectOptions?: string[];
    displayOrder: number;
    alertDaysWarning: number;
    alertDaysUrgent: number;
    alertDaysCritical: number;
    createdAt: string;
}

// --- Entitás (konkrét személy, jármű, eszköz) ---
export interface Entity {
    id: string;
    entityTypeId: string;
    displayName: string;
    responsibleUserId?: string;
    module: ModuleType;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    entityType?: EntityType;
    fieldValues?: FieldValue[];
}

// --- Mező érték (dinamikus adatok) ---
export interface FieldValue {
    id: string;
    entityId: string;
    fieldSchemaId: string;
    valueText?: string;
    valueDate?: string;
    valueJson?: Record<string, unknown>;
    updatedBy?: string;
    updatedAt: string;
    fieldSchema?: FieldSchema;
}

// --- Audit log bejegyzés ---
export interface AuditLogEntry {
    id: string;
    userId?: string;
    action: 'create' | 'update' | 'delete';
    tableName: string;
    recordId: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ipAddress?: string;
    createdAt: string;
}

// --- Értesítési napló ---
export type AlertLevel = 'warning' | 'urgent' | 'critical' | 'expired';
export type NotificationType = 'email' | 'push';

export interface NotificationLogEntry {
    id: string;
    userId?: string;
    entityId?: string;
    fieldSchemaId?: string;
    notificationType: NotificationType;
    alertLevel: AlertLevel;
    sentAt: string;
    acknowledged: boolean;
}

// --- Alkalmazás-szintű hiba ---
export class AppError extends Error {
    code: string;
    originalError?: unknown;

    constructor(code: string, message: string, originalError?: unknown) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = 'AppError';
    }
}
