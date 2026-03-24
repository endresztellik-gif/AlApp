import { test, expect } from '@playwright/test';
import { login, logout, ADMIN_EMAIL, ADMIN_PASSWORD, TEST_EMAIL, TEST_PASSWORD } from '../helpers/auth';
import { cleanupE2EReminders, getUserIdByEmail } from '../helpers/supabase-admin';

const E2E_TITLE = `E2E_Teszt emlékeztető ${Date.now()}`;
// Jövőbeli határidő: 1 év múlva → "upcoming" szekció (nem kollapszált "kész")
const FUTURE_DATE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

test.describe('Reminders modul', () => {

    test.beforeEach(async () => {
        // Töröljük az előző teszt maradékait
        const adminId = await getUserIdByEmail(ADMIN_EMAIL);
        if (adminId) await cleanupE2EReminders(adminId);
    });

    test.afterEach(async () => {
        const adminId = await getUserIdByEmail(ADMIN_EMAIL);
        if (adminId) await cleanupE2EReminders(adminId);
    });

    test('új emlékeztető létrehozása megjelenik a listában', async ({ page }) => {
        await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
        await page.goto('/reminders');

        // "Új emlékeztető" gomb
        await page.getByRole('button', { name: /Új emlékeztető/i }).click();

        // Form kitöltése
        await page.fill('input[placeholder*="emlékeztető"]', E2E_TITLE);
        await page.fill('input[type="date"]', FUTURE_DATE);
        await page.getByRole('button', { name: /^Mentés$/i }).click();

        // Toast és lista
        await expect(page.getByText(/létrehozva/i)).toBeVisible({ timeout: 5_000 });
        await expect(
            page.getByTestId('reminder-title').filter({ hasText: E2E_TITLE })
        ).toBeVisible({ timeout: 8_000 });
    });

    test('emlékeztető kész jelölése', async ({ page }) => {
        await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
        await page.goto('/reminders');

        // Létrehozzuk
        await page.getByRole('button', { name: /Új emlékeztető/i }).click();
        await page.fill('input[placeholder*="emlékeztető"]', E2E_TITLE);
        await page.fill('input[type="date"]', FUTURE_DATE);
        await page.getByRole('button', { name: /^Mentés$/i }).click();
        await expect(page.getByTestId('reminder-title').filter({ hasText: E2E_TITLE })).toBeVisible({ timeout: 8_000 });

        // Toggle: kész jelölés
        const card = page.locator('[data-testid="reminder-title"]', { hasText: E2E_TITLE })
            .locator('../..')  // a kártyáig felmegyünk
            .first();
        await card.getByTestId('reminder-toggle-btn').click();

        // Assert: data-done="true" és line-through class
        await expect(
            card.getByTestId('reminder-toggle-btn')
        ).toHaveAttribute('data-done', 'true', { timeout: 5_000 });
        await expect(
            page.getByTestId('reminder-title').filter({ hasText: E2E_TITLE })
        ).toHaveClass(/line-through/, { timeout: 5_000 });
    });

    test('emlékeztető törlése eltünteti a listából', async ({ page }) => {
        await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
        await page.goto('/reminders');

        // Létrehozzuk
        await page.getByRole('button', { name: /Új emlékeztető/i }).click();
        await page.fill('input[placeholder*="emlékeztető"]', E2E_TITLE);
        await page.fill('input[type="date"]', FUTURE_DATE);
        await page.getByRole('button', { name: /^Mentés$/i }).click();
        await expect(page.getByTestId('reminder-title').filter({ hasText: E2E_TITLE })).toBeVisible({ timeout: 8_000 });

        // Törlés
        const titleEl = page.getByTestId('reminder-title').filter({ hasText: E2E_TITLE });
        // Megkeressük a törlés gombot a kártyán belül
        await titleEl.locator('../../..').getByTestId('reminder-delete-btn').click();

        // Assert: eltűnt
        await expect(
            page.getByTestId('reminder-title').filter({ hasText: E2E_TITLE })
        ).not.toBeVisible({ timeout: 5_000 });
    });

    test('privacy: admin emlékeztetőjét test user NEM látja', async ({ page }) => {
        // 1. Admin létrehoz emlékeztetőt
        await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
        await page.goto('/reminders');
        await page.getByRole('button', { name: /Új emlékeztető/i }).click();
        await page.fill('input[placeholder*="emlékeztető"]', E2E_TITLE);
        await page.fill('input[type="date"]', FUTURE_DATE);
        await page.getByRole('button', { name: /^Mentés$/i }).click();
        await expect(page.getByTestId('reminder-title').filter({ hasText: E2E_TITLE })).toBeVisible({ timeout: 8_000 });
        await logout(page);

        // 2. Test user bejelentkezés
        await login(page, TEST_EMAIL, TEST_PASSWORD);
        await page.goto('/reminders');
        // Rövid várakozás, hogy betöltődjön
        await page.waitForTimeout(2_000);

        // 3. Assert: az admin emlékeztetője NEM látszik
        await expect(
            page.getByTestId('reminder-title').filter({ hasText: E2E_TITLE })
        ).not.toBeVisible({ timeout: 5_000 });
    });

});
