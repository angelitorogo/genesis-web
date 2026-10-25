import { expect, test } from '@playwright/test';

// Isolated browser context; no IndexedDB deletion or migration of the user's V2.
const SEED = '1463-0000-0000-0000-0000-0000-0000-0003';

test('PRE-33.03a.2b.3b: nueva partida V3 → persistencia → mapa → reapertura', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByTestId('universe-seed-create-v3-button')).toHaveCount(0);
  await page.getByTestId('universe-seed-input').fill(SEED);
  await page.getByTestId('universe-seed-apply-button').click();
  await expect(page.getByTestId('universe-seed-status'))
    .toContainText('Universo creado y activado correctamente.');
  await expect(page.getByTestId('universe-active-version')).toContainText('V3');
  await expect(page.getByTestId('universe-seed-active')).toContainText(SEED);
  await page.goto('/galaxy-map');
  await expect(page.getByTestId('galaxy-map-page')).toBeVisible();
  await expect(page.getByTestId('galactic-map-scene'))
    .toHaveAttribute('data-render-state', 'ready', { timeout: 15_000 });
  await expect(page.getByTestId('galaxy-map-error')).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('galactic-map-scene'))
    .toHaveAttribute('data-render-state', 'ready', { timeout: 15_000 });
  await page.goto('/settings');
  await expect(page.getByTestId('universe-active-version')).toContainText('V3');
  await expect(page.getByTestId('universe-seed-active')).toContainText(SEED);
  // Settings must also hydrate the persisted selection after a direct F5,
  // without depending on Home/GalaxyMap to initialize the seed facade.
  await page.reload();
  await expect(page.getByTestId('universe-active-version')).toContainText('V3');
  await expect(page.getByTestId('universe-seed-active')).toContainText(SEED);
});
