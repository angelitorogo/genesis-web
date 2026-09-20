import { expect, test, type Page } from '@playwright/test';

const SEED = '1503-0000-0000-0000-0000-0000-0000-0001';

async function mapReady(page: Page) {
  await page.goto('/galaxy-map');
  await expect(page.getByTestId('galaxy-map-page')).toBeVisible();

  // Surface a real map/bootstrap error rather than reporting a missing canvas.
  const mapError = page.getByTestId('galaxy-map-error');
  const mapEmpty = page.getByTestId('galaxy-map-empty');
  await expect(
    page.getByTestId('galactic-map-context').or(mapError).or(mapEmpty),
  ).toBeVisible({ timeout: 15_000 });
  if (await mapError.isVisible()) {
    throw new Error(`No se pudo abrir el mapa V2: ${await mapError.innerText()}`);
  }
  if (await mapEmpty.isVisible()) {
    throw new Error('El mapa no encuentra el universo V2 que se acaba de crear.');
  }

  const scene = page.getByTestId('galactic-map-scene');
  await expect(scene).toHaveAttribute('data-render-state', 'ready', { timeout: 15_000 });
  return scene;
}

test('15.3 — retains galactic map camera and render orientation after navigation and F5', async ({ page }) => {
  // Playwright uses its own isolated browser profile; never touch the user's save.
  await page.goto('/settings');
  await page.getByTestId('universe-seed-input').fill(SEED);
  await page.getByTestId('universe-seed-apply-button').click();
  // The active seed changes before IndexedDB bootstrap finishes. Wait for the
  // persisted-creation confirmation before navigating away from Settings.
  await expect(page.getByTestId('universe-seed-status'))
    .toHaveText(/Universo (creado y activado|activado) correctamente\./, { timeout: 15_000 });
  await expect(page.getByTestId('universe-seed-active')).toHaveText(SEED);
  await expect(page.getByTestId('universe-active-version')).toContainText('V2');
  const scene = await mapReady(page);
  const canvas = page.getByTestId('galactic-map-canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Missing galactic map canvas');
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  const initialDistance = Number(await scene.getAttribute('data-camera-distance'));
  await page.mouse.move(cx, cy);
  await page.mouse.wheel(0, -460);
  await expect.poll(async () => Number(await scene.getAttribute('data-camera-distance')))
    .toBeLessThan(initialDistance - 0.05);
  await page.mouse.down();
  await page.mouse.move(cx + 55, cy + 30, { steps: 6 });
  await page.mouse.up();
  // Rotate the rendered galaxy independently from the camera.
  await page.mouse.move(cx, cy);
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(cx + 70, cy, { steps: 6 });
  await page.mouse.up({ button: 'right' });
  await page.getByTestId('galactic-map-layer-nebulae').click();
  await expect(page.getByTestId('galactic-map-layer-nebulae')).toHaveAttribute('aria-pressed', 'false');
  const attributes = [
    'data-camera-distance', 'data-camera-azimuth', 'data-camera-polar',
    'data-camera-target-x', 'data-camera-target-y', 'data-camera-target-z',
    'data-galaxy-spin',
  ];
  const saved = await Promise.all(attributes.map(name => scene.getAttribute(name)));
  expect(saved.every(v => v !== null && Number.isFinite(Number(v)))).toBe(true);

  await page.getByTestId('galaxy-map-home-link').click();
  await expect(page.getByTestId('home-dashboard')).toBeVisible();
  await page.getByTestId('galaxy-map-link').click();
  const restored = page.getByTestId('galactic-map-scene');
  await expect(restored).toHaveAttribute('data-render-state', 'ready');
  for (let i = 0; i < attributes.length; i++) {
    expect(Number(await restored.getAttribute(attributes[i]!))).toBeCloseTo(Number(saved[i]), 5);
  }
  await expect(page.getByTestId('galactic-map-layer-nebulae')).toHaveAttribute('aria-pressed', 'false');

  await page.reload();
  await expect(restored).toHaveAttribute('data-render-state', 'ready');
  for (let i = 0; i < attributes.length; i++) {
    expect(Number(await restored.getAttribute(attributes[i]!))).toBeCloseTo(Number(saved[i]), 5);
  }
  await page.getByTestId('galactic-map-reset-view').click();
  await expect.poll(async () => Number(await restored.getAttribute('data-camera-distance')))
    .toBeGreaterThan(3);
  await expect(restored).toHaveAttribute('data-galaxy-spin', '0');
});
