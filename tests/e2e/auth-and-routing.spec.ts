import { expect, test } from '@playwright/test';

test('authentication fits a 390px mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, title] of [['/login', 'Sign in'], ['/signup', 'Create an account']] as const) {
    await page.goto(path);
    await expect(page.getByText(title, { exact: true })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  }
});

test('public auth pages render', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('Sign in', { exact: true })).toBeVisible();
  await page.goto('/signup');
  await expect(page.getByText('Create an account', { exact: true })).toBeVisible();
});

test('protected dashboard redirects unauthenticated visitors', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});

for (const path of ['/projects', '/projects/00000000-0000-0000-0000-000000000001', '/memory']) {
  test(`opening ${path} requires sign-in and preserves the destination`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL((url) =>
      url.pathname === '/login' && url.searchParams.get('next') === path
    );
  });
}
