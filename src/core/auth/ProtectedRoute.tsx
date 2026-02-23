import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login page, but save the intended location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if user is invited and hasn't set password yet
    const needsPasswordSetup = user?.user_metadata?.password_set === false;

    // If user needs to set password (from invitation), redirect to setup page
    if (needsPasswordSetup && location.pathname !== '/auth/setup-password') {
        return <Navigate to="/auth/setup-password" replace />;
    }

    return <>{children}</>;
}
