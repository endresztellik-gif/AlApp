import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/shared/types';
import type { User, Session } from '@supabase/supabase-js';

// --- Auth kontextus típus ---
export interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithMagicLink: (email: string) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    setupPassword: (password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Profil lekérdezése a user_profiles táblából
    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('[AuthProvider] Error fetching profile:', error);
                return null;
            }
            // Assuming 'data' directly matches UserProfile structure or can be cast
            // If not, further mapping would be needed here.
            return data as UserProfile;
        } catch (error) {
            console.error('[AuthProvider] Unexpected error in fetchProfile:', error);
            return null;
        }
    }, []);

    // Kezdeti session lekérdezése + auth állapotváltozás figyelése
    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            if (currentSession?.user) {
                const p = await fetchProfile(currentSession.user.id);
                setProfile(p);
            }
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
                setProfile(null);
                setIsLoading(false);
                return;
            }

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user && !profile) {
                // fetch profile
                fetchProfile(session.user.id).then(p => {
                    if (p) setProfile(p);
                });
            }

            setIsLoading(false);
        });
        return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- profile intentionally excluded to avoid re-subscribing
    }, [fetchProfile]);

    // --- Auth műveletek ---
    const signIn = useCallback(async (email: string, password: string) => {
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Supabase request timed out after 15s')), 15000)
            );

            const authPromise = supabase.auth.signInWithPassword({ email, password });

            const result = await Promise.race([authPromise, timeoutPromise]) as Awaited<typeof authPromise>;
            const { data, error } = result;

            if (error) throw new Error(error.message);

            // Konkrétan beállítjuk a state-et, ha az event nem jönne meg
            if (data.session) {
                setSession(data.session);
                setUser(data.session.user);

                // Fetch profile immediately
                try {
                    const profile = await fetchProfile(data.session.user.id);
                    if (profile) setProfile(profile);
                } catch (err) {
                    console.error('[AuthProvider] Manual profile fetch failed:', err);
                }
            }

        } catch (err) {
            console.error('[AuthProvider] SignIn Error stuck/catch:', err);
            throw err;
        }
    }, [fetchProfile]);

    const signInWithMagicLink = useCallback(async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw new Error(error.message);
    }, []);

    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);
    }, []);

    const resetPassword = useCallback(async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw new Error(error.message);
    }, []);

    const setupPassword = useCallback(async (password: string) => {
        // User already authenticated via invitation token
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error(error.message);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                isLoading,
                isAuthenticated: !!session,
                signIn,
                signInWithMagicLink,
                signOut,
                resetPassword,
                setupPassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
