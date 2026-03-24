import { Page } from '@playwright/test';

export const ADMIN_EMAIL    = process.env.SUPABASE_ADMIN_EMAIL    ?? 'endre.sztellik@gmail.com';
export const ADMIN_PASSWORD = process.env.SUPABASE_ADMIN_PASSWORD ?? '';
export const TEST_EMAIL     = process.env.SUPABASE_TEST_USER_EMAIL    ?? '';
export const TEST_PASSWORD  = process.env.SUPABASE_TEST_USER_PASSWORD ?? '';

export async function login(page: Page, email: string, password: string) {
    await page.goto('/login');
    // Az input ID-k alapján szelektálunk (megbízhatóbb React + Framer Motion esetén)
    await page.waitForSelector('#email', { state: 'visible', timeout: 8_000 });
    await page.locator('#email').fill(email);
    await page.waitForSelector('#password', { state: 'visible', timeout: 8_000 });
    await page.locator('#password').fill(password);
    // Explicit ellenőrzés hogy a value valóban bekerült
    await page.locator('#email').evaluate((el: HTMLInputElement) => el.value);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 12_000 });
}

export async function logout(page: Page) {
    // A logout gomb a Sidebar-ban van
    await page.getByRole('button', { name: /kijelentkezés/i }).click();
    await page.waitForURL('**/login', { timeout: 5_000 });
}
