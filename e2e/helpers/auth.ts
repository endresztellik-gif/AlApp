import { Page } from '@playwright/test';

export const ADMIN_EMAIL    = process.env.SUPABASE_ADMIN_EMAIL    ?? 'endre.sztellik@gmail.com';
export const ADMIN_PASSWORD = process.env.SUPABASE_ADMIN_PASSWORD ?? '';
export const TEST_EMAIL     = process.env.SUPABASE_TEST_USER_EMAIL    ?? '';
export const TEST_PASSWORD  = process.env.SUPABASE_TEST_USER_PASSWORD ?? '';

export async function login(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    // Várjuk, hogy az URL ne /login legyen (sikeres login)
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 });
}

export async function logout(page: Page) {
    // A logout gomb a Sidebar-ban van
    await page.getByRole('button', { name: /kijelentkezés/i }).click();
    await page.waitForURL('**/login', { timeout: 5_000 });
}
