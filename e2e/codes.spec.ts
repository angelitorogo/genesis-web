import { expect, test } from '@playwright/test';

const seed = 'C0DE-2026-0000-0000-0000-0000-0000-0001';
const code = 'A0C0-0000-0000-2710';

test('Códigos: canje único de 10000 PD V2, persistente tras recarga', async ({ page }) => {
  await page.goto('/settings');
  await page.getByTestId('universe-seed-input').fill(seed);
  await page.getByTestId('universe-seed-apply-button').click();
  await expect(page.getByTestId('universe-seed-status')).toContainText('Universo creado y activado correctamente.');
  await expect(page.getByTestId('universe-active-version')).toContainText('V2');
  await page.goto('/');
  await expect(page.getByTestId('codes-link')).toHaveAttribute('href', '/codes');
  await expect(page.getByTestId('discovery-points')).toContainText('0');
  await page.getByTestId('codes-link').click();
  await expect(page.getByTestId('codes-input')).toHaveValue(code);
  await page.getByTestId('codes-accept').click();
  await expect(page.getByTestId('codes-feedback')).toContainText('+10000 PD');
  await page.reload();
  await page.getByTestId('codes-input').fill(code.toLowerCase());
  await page.getByTestId('codes-accept').click();
  await expect(page.getByTestId('codes-feedback')).toContainText('ya se ha canjeado');
  await page.getByTestId('codes-input').fill('B10C-0000-0000-0002');
  await page.getByTestId('codes-accept').click();
  await expect(page.getByTestId('codes-feedback')).toContainText('2×2 desbloqueada');
  await page.getByTestId('codes-input').fill('B10C-0000-0000-000A');
  await page.getByTestId('codes-accept').click();
  await expect(page.getByTestId('codes-feedback')).toContainText('10×10 desbloqueada');
  await page.reload();
  await page.getByTestId('codes-input').fill('B10C-0000-0000-000A');
  await page.getByTestId('codes-accept').click();
  await expect(page.getByTestId('codes-feedback')).toContainText('ya se ha canjeado');
  await page.goto('/');
  await expect(page.getByTestId('discovery-points')).toContainText(/10[.,\s]?000/);
  await page.goto('/galaxy-map');
  const scene = page.getByTestId('galactic-map-scene');
  await expect(scene).toHaveAttribute('data-render-state', 'ready');
  await expect(page.getByTestId('galactic-map-block-size-10')).toBeVisible();
  await page.getByTestId('galactic-map-block-size-2').click();
  await expect(page.getByTestId('galactic-map-block-size-2')).toHaveAttribute('aria-pressed', 'true');
  const canvas = page.getByTestId('galactic-map-canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Falta el canvas del mapa galáctico.');
  const candidates = [[0.32, 0.5], [0.68, 0.5], [0.5, 0.32], [0.5, 0.68]] as const;
  let selected = false;
  for (const [x, y] of candidates) {
    await canvas.click({ position: { x: bounds.width * x, y: bounds.height * y } });
    await scene.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    if (await scene.getAttribute('data-selected-sector-explored') === 'false') { selected = true; break; }
  }
  if (!selected) throw new Error('No se ha podido seleccionar un sector sin explorar.');
  await page.getByTestId('galactic-map-explore-sector-link').click();
  await expect(page.getByTestId('galactic-map-block-processed')).toHaveText('4');
  await expect(page.getByTestId('galactic-map-block-skipped')).toHaveText('0');
  await expect(page.getByTestId('galactic-map-block-points')).toContainText(/\+[1-9]\d* PD/);
  await page.getByTestId('galactic-map-inline-exploration-close').click();
  await expect(scene).toHaveAttribute('data-explored-sector-count', '4');
});
