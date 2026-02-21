import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';

/**
 * Fő layout komponens – desktop-on sidebar, mobilon bottom navigation.
 * A tartalom az <Outlet /> helyére renderelődik (React Router).
 */
export function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isDesktop = useMediaQuery('(min-width: 1024px)');

    return (
        <div className="min-h-screen bg-background">
            {/* Desktop Sidebar */}
            {isDesktop && <Sidebar />}

            {/* Mobile Sidebar Overlay */}
            {!isDesktop && sidebarOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <Sidebar
                        mobile
                        onClose={() => setSidebarOpen(false)}
                    />
                </>
            )}

            {/* Main Content Area */}
            <div style={isDesktop ? { marginLeft: 268 } : undefined}>
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            {!isDesktop && <BottomNav />}
        </div>
    );
}
