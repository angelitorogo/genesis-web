import { expect, test, type Page } from '@playwright/test';

const A = '1430-0000-0000-0000-0000-0000-0000-0001';
const B = '1430-0000-0000-0000-0000-0000-0000-0002';

async function select(page: Page, seed: string): Promise<void> {
  await page.goto('/settings');
  await page.getByTestId('universe-seed-input').fill(seed);
  await page.getByTestId('universe-seed-apply-button').click();
  await expect(page.getByTestId('universe-seed-status'))
    .toContainText(/Universo (creado y activado|activado) correctamente/);
  await expect(page.getByTestId('universe-seed-active')).toHaveText(seed);
  await expect(page.getByTestId('universe-active-version')).toContainText('V2');
}

/** Wait for the real map bootstrap and report its explicit failure states. */
async function readyMap(page: Page) {
  await page.goto('/galaxy-map');
  await expect(page.getByTestId('galaxy-map-page')).toBeVisible({ timeout: 15_000 });

  const mapError = page.getByTestId('galaxy-map-error');
  const mapEmpty = page.getByTestId('galaxy-map-empty');
  await expect(
    page.getByTestId('galactic-map-context').or(mapError).or(mapEmpty),
  ).toBeVisible({ timeout: 15_000 });

  if (await mapError.isVisible()) {
    throw new Error(`Fallo al cargar el mapa V2: ${await mapError.innerText()}`);
  }
  if (await mapEmpty.isVisible()) {
    throw new Error('El mapa no encuentra el universo V2 seleccionado.');
  }
  if (await page.getByTestId('galactic-map-detailed-scene-restricted').isVisible()) {
    throw new Error('El mapa V2 restringe la escena: la galaxia no está descubierta.');
  }

  const scene = page.getByTestId('galactic-map-scene');
  await expect(scene).toHaveAttribute('data-render-state', 'ready', { timeout: 15_000 });
  return scene;
}

async function points(page: Page): Promise<number> {
  await page.goto('/');
  await expect(page.getByTestId('home-dashboard')).toBeVisible();
  const label = await page.getByTestId('discovery-points').textContent();
  const result = Number(label?.match(/\d[\d.,]*/)?.[0]?.replace(/[.,]/g, '') ?? NaN);
  expect(Number.isFinite(result)).toBe(true);
  return result;
}

test('14.3 — dos universos V2, progreso, recarga y navegación conservan su identidad', async ({ page }) => {
  // Playwright uses a fresh context; the user's other browser and V1 save are untouched.
  await select(page, A);
  expect(await points(page)).toBe(0);
  const scene = await readyMap(page);
  const canvas = page.getByTestId('galactic-map-canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('No hay canvas del mapa.');
  let selected = false;
  for (const [x, y] of [[0.32, 0.5], [0.68, 0.5], [0.5, 0.32], [0.5, 0.68], [0.36, 0.36], [0.64, 0.64]] as const) {
    await canvas.click({ position: { x: bounds.width * x, y: bounds.height * y } });
    await scene.evaluate(() => new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
    if (await scene.getAttribute('data-selected-sector-explored') === 'false') { selected = true; break; }
  }
  expect(selected).toBe(true);
  await page.getByTestId('galactic-map-explore-sector-link').click();
  await expect(page.getByTestId('galactic-map-inline-exploration-reward')).toBeVisible();
  await page.getByTestId('galactic-map-inline-exploration-close').click();
  await expect(scene).toHaveAttribute('data-explored-sector-count', '1');
  const progressA = await points(page);
  expect(progressA).toBeGreaterThan(0);

  await select(page, B);
  expect(await points(page)).toBe(0);
  await page.reload();
  await expect(page.getByTestId('home-dashboard')).toBeVisible();
  expect(await points(page)).toBe(0);
  await expect(await readyMap(page)).toHaveAttribute('data-explored-sector-count', '0');

  await select(page, A);
  expect(await points(page)).toBe(progressA);
  await page.reload();
  await expect(page.getByTestId('home-dashboard')).toBeVisible();
  expect(await points(page)).toBe(progressA);
  await expect(await readyMap(page)).toHaveAttribute('data-explored-sector-count', '1');
  await page.goto('/galaxies');
  await expect(page.getByTestId('discovered-galaxies-page')).toBeVisible();
  await page.goto('/galaxies/0');
  await expect(page.getByTestId('galaxy-detail-page')).toBeVisible();
  await expect(page.getByTestId('galaxy-detail-record')).toBeVisible();
  await expect(page.getByTestId('galaxy-detail-not-found')).toHaveCount(0);
  await page.goto('/');
  expect(await points(page)).toBe(progressA);
});
