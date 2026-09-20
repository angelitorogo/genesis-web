import { expect, test, type Page } from '@playwright/test';

const FIRST_SEED = '1401-0000-0000-0000-0000-0000-0000-0001';

async function createSeed(page: Page, seed: string): Promise<void> {
  await page.goto('/settings');
  await page.getByTestId('universe-seed-input').fill(seed);
  await page.getByTestId('universe-seed-apply-button').click();
  await expect(page.getByTestId('universe-seed-status')).toContainText(
    'Universo creado y activado correctamente.',
  );
  await expect(page.getByTestId('universe-seed-active')).toContainText(seed);
  await expect(page.getByTestId('universe-active-version')).toContainText('V2');
}

async function readyMap(page: Page): Promise<import('@playwright/test').Locator> {
  await page.goto('/galaxy-map');
  await expect(page.getByTestId('galaxy-map-page')).toBeVisible();
  const scene = page.getByTestId('galactic-map-scene');
  await expect(scene).toHaveAttribute('data-render-state', 'ready');
  await expect(page.getByTestId('galaxy-map-error')).toHaveCount(0);
  return scene;
}

async function exploreFirstNewSector(page: Page): Promise<number> {
  const scene = await readyMap(page);
  await expect(scene).toHaveAttribute('data-explored-sector-count', '0');
  const canvas = page.getByTestId('galactic-map-canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('El mapa nuevo no tiene un canvas medible.');
  const candidates = [
    [0.32, 0.5], [0.68, 0.5], [0.5, 0.32], [0.5, 0.68],
    [0.36, 0.36], [0.64, 0.36], [0.36, 0.64], [0.64, 0.64],
  ] as const;
  let selected = false;
  for (const [x, y] of candidates) {
    await canvas.click({ position: { x: bounds.width * x, y: bounds.height * y } });
    await scene.evaluate(() => new Promise<void>(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
    if (await scene.getAttribute('data-selected-sector-explored') === 'false') {
      selected = true;
      break;
    }
  }
  if (!selected) throw new Error('No se ha podido seleccionar un sector virgen de la galaxia V2.');
  await page.getByTestId('galactic-map-explore-sector-link').click();
  await expect(page.getByTestId('galactic-map-inline-exploration-result')).toBeVisible();
  await expect(page.getByTestId('galactic-map-inline-exploration-reward')).toBeVisible();
  await expect(page.getByTestId('galactic-map-inline-result-scientific-classification'))
    .toContainText('Sin clasificar');
  const awardedText = await page.getByTestId('galactic-map-inline-reward-points').textContent();
  const awarded = Number(awardedText?.match(/\+(\d+)\s*PD/)?.[1] ?? NaN);
  expect(awarded).toBeGreaterThan(0);
  await expect(page.getByTestId('galactic-map-inline-sector-state')).toHaveText('Detectada');
  await page.getByTestId('galactic-map-inline-exploration-close').click();
  await expect(scene).toHaveAttribute('data-explored-sector-count', '1');
  return awarded;
}

async function homePoints(page: Page): Promise<number> {
  await page.goto('/');
  await expect(page.getByTestId('home-dashboard')).toBeVisible();
  await expect(page.getByTestId('origin-galaxy-badge')).toBeVisible();
  const text = await page.getByTestId('discovery-points').textContent();
  const points = Number(text?.match(/\d[\d.,]*/)?.[0]?.replace(/[.,]/g, '') ?? NaN);
  expect(Number.isFinite(points)).toBe(true);
  return points;
}

test.describe('14.1 — nuevo universo V2 y primera exploración', () => {
  test('inicia una partida desde cero, explora un sector y presenta el progreso en Home', async ({ page }) => {
    // Playwright provides a fresh browser context; never open or clear the user's V1 browser.
    await page.goto('/');
    await expect(page.getByTestId('home-empty')).toBeVisible();
    await createSeed(page, FIRST_SEED);
    expect(await homePoints(page)).toBe(0);
    const awarded = await exploreFirstNewSector(page);
    expect(await homePoints(page)).toBe(awarded);
    const map = await readyMap(page);
    await expect(map).toHaveAttribute('data-explored-sector-count', '1');
  });
});
