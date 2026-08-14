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

test.describe(
  'GENESIS point-10.1 galactic map',
  () => {
    test(
      'should render the real Three.js scene for the discovered active galaxy without pulling future map capabilities forward',
      async ({
        page,
      }) => {
        await ensureActiveUniverse(
          page,
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

        await expect(
          scene,
        ).toBeVisible();

        await expect(
          scene,
        ).toHaveAttribute(
          'data-render-state',
          'ready',
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
          await page
            .getByTestId(
              'galactic-map-canvas',
            )
            .evaluate(
              (
                canvas,
              ) => ({
                width:
                  (canvas as HTMLCanvasElement)
                    .width,
                height:
                  (canvas as HTMLCanvasElement)
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

        for (
          const testId
          of [
            'galactic-map-controls',
            'galactic-map-selection',
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
      },
    );
  },
);
