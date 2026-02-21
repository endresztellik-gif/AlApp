import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/core/auth/AuthProvider';
import { FeatureFlagProvider } from '@/core/feature-flags/FeatureFlagProvider';
import { OfflineSyncProvider } from '@/core/offline/OfflineSyncProvider';

// TanStack Query kliens – cache és retry beállítások
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 perc
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

interface AppProvidersProps {
    children: ReactNode;
}

/**
 * Összes provider egyben – az alkalmazás gyökerére kerül.
 * Sorrend fontos: Query > Auth > FeatureFlags > OfflineSync
 */
export function AppProviders({ children }: AppProvidersProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <OfflineSyncProvider>
                    <FeatureFlagProvider>
                        {children}
                        <Toaster position="top-right" richColors closeButton />
                    </FeatureFlagProvider>
                </OfflineSyncProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}
