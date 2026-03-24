import { test, expect } from '@playwright/test';
import { login, ADMIN_EMAIL, ADMIN_PASSWORD } from '../helpers/auth';

test.describe('Navigáció – smoke test', () => {

    test.beforeEach(async ({ page }) => {
        await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    });

    const routes: { path: string; expectedText: string | RegExp }[] = [
        { path: '/',                  expectedText: /.+/ },            // h1 tartalom dinamikus
        { path: '/personnel',         expectedText: /Személ/ },
        { path: '/vehicles',          expectedText: /Járm/ },
        { path: '/equipment',         expectedText: /Eszköz/ },
        { path: '/calendar',          expectedText: /Szabadság-naptár/ },
        { path: '/incidents',         expectedText: /Káresemény/ },
        { path: '/water-facilities',  expectedText: /Vízi/ },
        { path: '/reminders',         expectedText: /Emlékeztet/ },
        { path: '/settings',          expectedText: /Beállítás/ },
    ];

    for (const { path, expectedText } of routes) {
        test(`${path} oldal betölt`, async ({ page }) => {
            await page.goto(path);
            if (path === '/') {
                // Dashboard: dinamikus greeting, csak h1 létezését ellenőrizzük
                await expect(page.locator('h1').first()).toBeVisible({ timeout: 8_000 });
            } else {
                await expect(
                    page.getByText(expectedText).first()
                ).toBeVisible({ timeout: 8_000 });
            }
        });
    }

    test('Bottom nav Emlékeztetők link /reminders-re navigál', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('link', { name: 'Emlékeztetők' }).click();
        await page.waitForURL('**/reminders', { timeout: 5_000 });
        expect(page.url()).toContain('/reminders');
    });

});
