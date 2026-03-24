import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env és .env.local betöltése – override: true hogy a shell env ne írja felül
dotenv.config({ path: path.resolve(__dirname, '.env.local'), override: true });
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,  // Supabase real DB – sorban futnak, hogy a cleanup megbízható legyen
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: 'list',

    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
    },
});
