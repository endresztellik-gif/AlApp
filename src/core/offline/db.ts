import Dexie, { type EntityTable } from 'dexie';

export interface PendingChecklist {
    id?: number; // Auto-incremented local ID
    vehicle_id: string;
    user_id: string;
    check_date: string;
    oil_ok: boolean;
    coolant_ok: boolean;
    lights_ok: boolean;
    bodywork_ok: boolean;
    bodywork_issue_description?: string;
    photo_url?: string;
    // Metadata for sync
    createdAt: number;
}

const db = new Dexie('AlAppOfflineDB') as Dexie & {
    pendingChecklists: EntityTable<
        PendingChecklist,
        'id' // primary key 'id'
    >;
};

// Schema declaration:
db.version(1).stores({
    pendingChecklists: '++id, vehicle_id, user_id, createdAt' // Primary key and indexed props
});

export { db };
