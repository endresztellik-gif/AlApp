import { test, expect } from '@playwright/test';
import { login, logout, ADMIN_EMAIL, ADMIN_PASSWORD, TEST_EMAIL, TEST_PASSWORD } from '../helpers/auth';
import { cleanupE2EReminders } from '../helpers/supabase-admin';

const E2E_TITLE = `E2E_Teszt emlékeztető ${Date.now()}`;
// Jövőbeli határidő: 1 év múlva → "upcoming" szekció (nem kollapszált "kész")
const FUTURE_DATE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

test.describe('Reminders modul', () => {

    test.beforeEach(async () => {
        await cleanupE2EReminders();
    });

    test.afterEach(async () => {
        await cleanupE2EReminders();
    });

    test('új emlékeztető létrehozása megjelenik a listában', async ({ page }) => {
        await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
        await page.goto('/reminders');

        // "Új emlékeztető" gomb
        await page.getByRole('button', { name: /Új emlékeztető/i }).click();

        // Form kitöltése
        await page.waitForSelector('[data-testid="reminder-title-input"]', { state: 'visible', timeout: 5_000 });
        await page.locator('[data-testid="reminder-title-input"]').fill(E2E_TITLE);
        await page.locator('input[type="date"]').fill(FUTURE_DATE);
        await page.getByTestId('reminder-save-btn').click();

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
        await page.waitForSelector('[data-testid="reminder-title-input"]', { state: 'visible', timeout: 5_000 });
        await page.locator('[data-testid="reminder-title-input"]').fill(E2E_TITLE);
        await page.locator('input[type="date"]').fill(FUTURE_DATE);
        await page.getByTestId('reminder-save-btn').click();
        await expect(page.getByTestId('reminder-title').filter({ hasText: E2E_TITLE })).toBeVisible({ timeout: 8_000 });

        // Toggle: kész jelölés (a toggle gomb a title melletti szülő divben van)
        await page.getByTestId('reminder-title').filter({ hasText: E2E_TITLE })
            .locator('../..')
            .getByTestId('reminder-toggle-btn')
            .click();

        // Assert: kész jelöléssel a kártya eltűnik a közelgő listából (átkerül a kész szekcióba)
        await expect(
            page.getByTestId('reminder-title').filter({ hasText: E2E_TITLE })
        ).not.toBeVisible({ timeout: 5_000 });

        // Kész szekció megnyitása és line-through ellenőrzés
        await page.locator('button').filter({ hasText: /kész/i }).click();
        await expect(
            page.getByTestId('reminder-title').filter({ hasText: E2E_TITLE })
        ).toHaveClass(/line-through/, { timeout: 5_000 });
    });

    test('emlékeztető törlése eltünteti a listából', async ({ page }) => {
        await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
        await page.goto('/reminders');

        // Létrehozzuk
        await page.getByRole('button', { name: /Új emlékeztető/i }).click();
        await page.waitForSelector('[data-testid="reminder-title-input"]', { state: 'visible', timeout: 5_000 });
        await page.locator('[data-testid="reminder-title-input"]').fill(E2E_TITLE);
        await page.locator('input[type="date"]').fill(FUTURE_DATE);
        await page.getByTestId('reminder-save-btn').click();
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
        await page.waitForSelector('[data-testid="reminder-title-input"]', { state: 'visible', timeout: 5_000 });
        await page.locator('[data-testid="reminder-title-input"]').fill(E2E_TITLE);
        await page.locator('input[type="date"]').fill(FUTURE_DATE);
        await page.getByTestId('reminder-save-btn').click();
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
