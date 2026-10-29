import {expect,test} from '@playwright/test';

/** VIDA.F — navegador aislado, sin acceder a la partida real del usuario.
 * Valida las rutas V3 y los catalogos, no inventa descubrimientos ni garantiza
 * que una semilla de E2E contenga civilizaciones o colonias.
 */
const SEED='1463-0000-0000-0000-0000-0000-0000-00F0';

test('VIDA.F: universo V3 y catalogos de planetas/lunas sobreviven a recarga',async({page})=>{
  await page.goto('/settings');
  await page.getByTestId('universe-seed-input').fill(SEED);
  await page.getByTestId('universe-seed-apply-button').click();
  // The apply action starts asynchronous V3 bootstrap. Wait for actual
  // completion before checking the persisted active seed.
  await expect(page.getByTestId('universe-seed-status'))
    .toContainText('Universo creado y activado correctamente.', { timeout: 15_000 });
  await expect(page.getByTestId('universe-active-version')).toContainText('V3');
  await expect(page.getByTestId('universe-seed-active')).toContainText(SEED);
  for(const category of ['planets','moons']){
    await page.goto(`/galaxies/0/knowledge/${category}`);
    await expect(page.getByTestId('galaxy-knowledge-catalog-page')).toBeVisible();
    await expect(page.getByTestId('gkc-error')).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId('galaxy-knowledge-catalog-page')).toBeVisible();
    await expect(page.getByTestId('gkc-error')).toHaveCount(0);
  }
  await page.goto('/settings');
  await expect(page.getByTestId('universe-seed-active')).toContainText(SEED);
});
