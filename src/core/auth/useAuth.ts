import { useContext } from 'react';
import { AuthContext } from './AuthProvider';
import type { AuthContextType } from './AuthProvider';

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth hook-ot csak AuthProvider-en belül lehet használni.');
    }
    return context;
}
