import { test, expect } from '@playwright/test';
import { login, logout, ADMIN_EMAIL, ADMIN_PASSWORD } from '../helpers/auth';

test.describe('Auth flow', () => {

    test('sikeres admin bejelentkezés', async ({ page }) => {
        await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
        await expect(page.locator('h1').first()).toBeVisible();
        expect(page.url()).not.toContain('/login');
    });

    test('hibás jelszóval login hibaüzenetet mutat', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', ADMIN_EMAIL);
        await page.fill('input[type="password"]', 'hibas_jelszo_xyz_12345');
        await page.click('button[type="submit"]');
        await expect(page.getByText(/hibás/i)).toBeVisible({ timeout: 8_000 });
    });

    test('logout után URL /login és re-navigáció visszairányít', async ({ page }) => {
        await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
        await logout(page);
        expect(page.url()).toContain('/login');

        // Direkt navigáció védett oldalra → vissza /login
        await page.goto('/reminders');
        await page.waitForURL('**/login', { timeout: 5_000 });
        expect(page.url()).toContain('/login');
    });

    test('unauthenticated direkt URL hozzáférés → /login redirect', async ({ page }) => {
        await page.goto('/reminders');
        await page.waitForURL('**/login', { timeout: 5_000 });
        expect(page.url()).toContain('/login');
    });

});
