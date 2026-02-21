import { createContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { FeatureFlags } from '@/shared/types';

// Alapértelmezett feature flag értékek
const DEFAULT_FLAGS: FeatureFlags = {
    module_personnel: true,
    module_vehicles: true,
    module_equipment: true,
    module_calendar: false,
    module_incidents: false,
    module_other: false,
    feature_qr_codes: false,
    feature_offline_write: false,
};

export interface FeatureFlagContextType {
    flags: FeatureFlags;
    isLoading: boolean;
    isEnabled: (key: keyof FeatureFlags) => boolean;
}

export const FeatureFlagContext = createContext<FeatureFlagContextType | null>(null);

interface FeatureFlagProviderProps {
    children: ReactNode;
}

export function FeatureFlagProvider({ children }: FeatureFlagProviderProps) {
    const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
    const [isLoading, setIsLoading] = useState(true);

    // Feature flagek betöltése a Supabase-ből
    useEffect(() => {
        async function loadFlags() {
            try {
                const { data, error } = await supabase
                    .from('feature_flags')
                    .select('key, enabled');

                if (error) {
                    console.error('[FeatureFlags] Betöltési hiba:', error);
                    setIsLoading(false);
                    return;
                }

                if (data) {
                    const loadedFlags = { ...DEFAULT_FLAGS };
                    for (const flag of data) {
                        if (flag.key in loadedFlags) {
                            (loadedFlags as Record<string, boolean>)[flag.key] = flag.enabled;
                        }
                    }
                    setFlags(loadedFlags);
                }
            } catch (err) {
                console.error('[FeatureFlags] Váratlan hiba:', err);
            } finally {
                setIsLoading(false);
            }
        }

        loadFlags();
    }, []);

    // Egyetlen flag ellenőrzése
    const isEnabled = (key: keyof FeatureFlags): boolean => {
        return flags[key] ?? false;
    };

    return (
        <FeatureFlagContext.Provider value={{ flags, isLoading, isEnabled }}>
            {children}
        </FeatureFlagContext.Provider>
    );
}
