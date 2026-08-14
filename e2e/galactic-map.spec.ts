import {
  expect,
  test,
} from '@playwright/test';

async function ensureActiveUniverse(
  page:
    import('@playwright/test').Page,
): Promise<void> {

  await page.goto(
    '/settings',
  );

  await expect(
    page.getByTestId(
      'settings-page',
    ),
  ).toBeVisible();

  await page
    .getByTestId(
      'universe-seed-apply-button',
    )
    .click();

  await expect(
    page.getByTestId(
      'universe-seed-status',
    ),
  ).toContainText(
    /Universo (?:creado y )?activado correctamente\./,
  );
}

async function numericAttribute(
  locator:
    import('@playwright/test').Locator,

  name:
    string,
): Promise<number> {

  const raw =
    await locator.getAttribute(
      name,
    );

  const value =
    Number(
      raw,
    );

  expect(
    Number.isFinite(
      value,
    ),
  ).toBe(
    true,
  );

  return value;
}

test.describe(
  'GENESIS point-10.3 galactic exploration coverage',
  () => {
    test(
      'should persist an explored sector, distinguish explored/unexplored map zones and preserve point-10.2 camera interaction',
      async ({
        page,
      }) => {
        await ensureActiveUniverse(
          page,
        );

        await page.goto(
          '/exploration',
        );

        await expect(
          page.getByTestId(
            'scan-sector-action',
          ),
        ).toBeVisible();

        await page
          .getByTestId(
            'sector-x-input',
          )
          .fill(
            '0',
          );

        await page
          .getByTestId(
            'sector-y-input',
          )
          .fill(
            '0',
          );

        await page
          .getByTestId(
            'scan-sector-action',
          )
          .click();

        await expect(
          page.getByTestId(
            'exploration-sector-state',
          ),
        ).toContainText(
          'Detectada',
        );

        await page.goto(
          '/galaxy-map',
        );

        await expect(
          page.getByTestId(
            'galaxy-map-page',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'galactic-map-active-galaxy',
          ),
        ).toContainText(
          'Galaxia 0',
        );

        const scene =
          page.getByTestId(
            'galactic-map-scene',
          );

        const canvas =
          page.getByTestId(
            'galactic-map-canvas',
          );

        await expect(
          scene,
        ).toBeVisible();

        await expect(
          scene,
        ).toHaveAttribute(
          'data-render-state',
          'ready',
        );

        await expect(
          page.getByTestId(
            'galactic-map-controls',
          ),
        ).toBeVisible();

        const coverage =
          page.getByTestId(
            'galactic-map-exploration-coverage',
          );

        await expect(
          coverage,
        ).toBeVisible();

        await expect(
          coverage,
        ).toContainText(
          'Explorado',
        );

        await expect(
          coverage,
        ).toContainText(
          'No explorado',
        );

        const exploredSectorCount =
          Number(
            await scene.getAttribute(
              'data-explored-sector-count',
            ),
          );

        const totalSectorCount =
          Number(
            await scene.getAttribute(
              'data-total-sector-count',
            ),
          );

        expect(
          exploredSectorCount,
        ).toBeGreaterThanOrEqual(
          1,
        );

        expect(
          totalSectorCount,
        ).toBeGreaterThan(
          exploredSectorCount,
        );

        await expect(
          scene,
        ).toHaveAttribute(
          'data-sector-grid-side',
          '173',
        );

        const particleCount =
          Number(
            await scene.getAttribute(
              'data-particle-count',
            ),
          );

        expect(
          particleCount,
        ).toBeGreaterThan(
          0,
        );

        const canvasSize =
          await canvas.evaluate(
            (
              value,
            ) => ({
              width:
                (value as HTMLCanvasElement)
                  .width,
              height:
                (value as HTMLCanvasElement)
                  .height,
            }),
          );

        expect(
          canvasSize.width,
        ).toBeGreaterThan(
          1,
        );

        expect(
          canvasSize.height,
        ).toBeGreaterThan(
          1,
        );

        const initialDistance =
          await numericAttribute(
            scene,
            'data-camera-distance',
          );

        await canvas.hover();

        await page.mouse.wheel(
          0,
          -620,
        );

        await expect
          .poll(
            async () =>
              numericAttribute(
                scene,
                'data-camera-distance',
              ),
          )
          .toBeLessThan(
            initialDistance -
            0.05,
          );

        const bounds =
          await canvas.boundingBox();

        expect(
          bounds,
        ).not.toBeNull();

        if (
          bounds ===
          null
        ) {
          return;
        }

        const centerX =
          bounds.x +
          bounds.width /
          2;

        const centerY =
          bounds.y +
          bounds.height /
          2;

        const initialAzimuth =
          await numericAttribute(
            scene,
            'data-camera-azimuth',
          );

        await page.mouse.move(
          centerX,
          centerY,
        );

        await page.mouse.down({
          button:
            'left',
        });

        await page.mouse.move(
          centerX +
            90,
          centerY +
            24,
          {
            steps:
              5,
          },
        );

        await page.mouse.up({
          button:
            'left',
        });

        await expect
          .poll(
            async () =>
              Math.abs(
                await numericAttribute(
                  scene,
                  'data-camera-azimuth',
                ) -
                initialAzimuth,
              ),
          )
          .toBeGreaterThan(
            0.02,
          );

        const initialTargetX =
          await numericAttribute(
            scene,
            'data-camera-target-x',
          );

        const initialTargetY =
          await numericAttribute(
            scene,
            'data-camera-target-y',
          );

        await page.mouse.move(
          centerX,
          centerY,
        );

        await page.mouse.down({
          button:
            'right',
        });

        await page.mouse.move(
          centerX +
            70,
          centerY -
            42,
          {
            steps:
              5,
          },
        );

        await page.mouse.up({
          button:
            'right',
        });

        await expect
          .poll(
            async () => {
              const targetX =
                await numericAttribute(
                  scene,
                  'data-camera-target-x',
                );

              const targetY =
                await numericAttribute(
                  scene,
                  'data-camera-target-y',
                );

              return Math.hypot(
                targetX -
                  initialTargetX,
                targetY -
                  initialTargetY,
              );
            },
          )
          .toBeGreaterThan(
            0.01,
          );

        await page
          .getByTestId(
            'galactic-map-rotation-toggle',
          )
          .click();

        await expect(
          scene,
        ).toHaveAttribute(
          'data-rotation-enabled',
          'false',
        );

        await page
          .getByTestId(
            'galactic-map-rotation-toggle',
          )
          .click();

        await expect(
          scene,
        ).toHaveAttribute(
          'data-rotation-enabled',
          'true',
        );

        await page
          .getByTestId(
            'galactic-map-reset-view',
          )
          .click();

        await expect
          .poll(
            async () =>
              Math.abs(
                await numericAttribute(
                  scene,
                  'data-camera-distance',
                ) -
                initialDistance,
              ),
          )
          .toBeLessThan(
            0.001,
          );

        await canvas.click({
          position: {
            x:
              bounds.width /
              2,
            y:
              bounds.height /
              2,
          },
        });

        const selection =
          page.getByTestId(
            'galactic-map-selection',
          );

        await expect(
          selection,
        ).toBeVisible();

        await expect(
          selection,
        ).toContainText(
          'SELECCIÓN VISUAL / GPU',
        );

        await expect(
          selection,
        ).toContainText(
          'No representa una estrella',
        );

        const selectedIndex =
          await scene.getAttribute(
            'data-selected-sample-index',
          );

        expect(
          selectedIndex,
        ).not.toBeNull();

        await page.mouse.move(
          centerX,
          centerY,
        );

        await page.mouse.down({
          button:
            'left',
        });

        await page.mouse.move(
          centerX +
            75,
          centerY,
          {
            steps:
              4,
          },
        );

        await page.mouse.up({
          button:
            'left',
        });

        await expect(
          scene,
        ).toHaveAttribute(
          'data-selected-sample-index',
          selectedIndex ??
            '',
        );

        await page
          .getByTestId(
            'galactic-map-reset-view',
          )
          .click();

        await expect(
          selection,
        ).toHaveCount(
          0,
        );

        for (
          const testId
          of [
            'galactic-map-markers',
            'galactic-map-layers',
            'galactic-map-relative-position',
          ]
        ) {
          await expect(
            page.getByTestId(
              testId,
            ),
          ).toHaveCount(
            0,
          );
        }

        await expect(
          page.getByTestId(
            'galactic-map-point-boundary',
          ),
        ).toContainText(
          '10.4–10.9',
        );
      },
    );
  },
);
