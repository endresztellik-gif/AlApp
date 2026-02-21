import { useContext } from 'react';
import { FeatureFlagContext } from './FeatureFlagProvider';
import type { FeatureFlagContextType } from './FeatureFlagProvider';

export function useFeatureFlags(): FeatureFlagContextType {
    const context = useContext(FeatureFlagContext);
    if (!context) {
        throw new Error('useFeatureFlags hook-ot csak FeatureFlagProvider-en belül lehet használni.');
    }
    return context;
}
