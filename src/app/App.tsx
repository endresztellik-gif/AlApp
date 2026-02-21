import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/app/providers/AppProviders';
import { router } from '@/app/routes';

/**
 * AlApp fő komponens – providerek és routing összekötése.
 */
export function App() {
    return (
        <AppProviders>
            <RouterProvider router={router} />
        </AppProviders>
    );
}
