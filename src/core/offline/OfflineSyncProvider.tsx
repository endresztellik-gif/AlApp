import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { db } from './db';
import { supabase } from '@/lib/supabase';

interface OfflineSyncContextType {
    isOnline: boolean;
    pendingCount: number;
    syncPendingData: () => Promise<void>;
    isSyncing: boolean;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    // Watch Dexie for changes to update the badge/counter
    const updatePendingCount = useCallback(async () => {
        try {
            const count = await db.pendingChecklists.count();
            setPendingCount(count);
        } catch (error) {
            console.error("Error reading Dexie count", error);
        }
    }, []);

    // The actual sync logic
    const syncPendingData = useCallback(async () => {
        if (!navigator.onLine || isSyncing) return;

        try {
            setIsSyncing(true);
            const pendingItems = await db.pendingChecklists.toArray();

            if (pendingItems.length === 0) {
                setIsSyncing(false);
                return;
            }

            console.log(`Attempting to sync ${pendingItems.length} offline checklists...`);

            // Sync one by one, if fails keep it in Dexie
            for (const item of pendingItems) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id, createdAt: _createdAt, ...supabasePayload } = item;

                const { error } = await supabase
                    .from('vehicle_checklists')
                    .insert([{
                        ...supabasePayload,
                        is_synced: true
                    }]);

                if (!error) {
                    // Success, remove from local DB
                    if (id) await db.pendingChecklists.delete(id);
                } else {
                    console.error("Failed to sync checklist", error);
                }
            }

            await updatePendingCount();

        } catch (error) {
            console.error("Sync process failed", error);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, updatePendingCount]);

    // Listeners for network status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncPendingData(); // Trigger sync when reconnecting
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial count check
        updatePendingCount();

        // Also trigger sync on initial load if online
        if (navigator.onLine) {
            syncPendingData();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [syncPendingData, updatePendingCount]);

    return (
        <OfflineSyncContext.Provider value={{ isOnline, pendingCount, syncPendingData, isSyncing }}>
            {children}
        </OfflineSyncContext.Provider>
    );
}

export function useOfflineSync() {
    const context = useContext(OfflineSyncContext);
    if (context === undefined) {
        throw new Error('useOfflineSync must be used within an OfflineSyncProvider');
    }
    return context;
}
