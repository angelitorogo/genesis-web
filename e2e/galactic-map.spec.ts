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


async function persistOneStaticDiscovery(
  page:
    import('@playwright/test').Page,
): Promise<string> {

  const coordinates =
    [
      [0, 0],
      [0, 2],
      [1, 0],
      [-1, 0],
      [1, 1],
      [-1, -1],
      [2, -1],
      [-2, 1],
      [2, 2],
    ] as const;

  for (
    const [
      x,
      y,
    ]
    of coordinates
  ) {
    await page
      .getByTestId(
        'sector-x-input',
      )
      .fill(
        String(
          x,
        ),
      );

    await page
      .getByTestId(
        'sector-y-input',
      )
      .fill(
        String(
          y,
        ),
      );

    await page
      .getByTestId(
        'scan-sector-action',
      )
      .click();

    await expect(
      page.getByTestId(
        'scanned-sector-coordinates',
      ),
    ).toContainText(
      `(${x}, ${y})`,
    );

    const result =
      page.getByTestId(
        'exploration-result',
      );

    await expect(
      result,
    ).toBeVisible();

    const kind =
      await result.getAttribute(
        'data-result-kind',
      );

    await expect(
      page.getByTestId(
        'exploration-sector-state',
      ),
    ).toContainText(
      'Detectada',
    );

    if (
      kind !==
      'TRANSIENT_EVENT' &&
      kind !==
      null
    ) {
      await expect(
        page.getByTestId(
          'exploration-result-state',
        ),
      ).toContainText(
        'Detectada',
      );

      return kind;
    }

    await expect(
      page.getByTestId(
        'exploration-result-state',
      ),
    ).toContainText(
      'Evento no persistido',
    );
  }

  throw new Error(
    'The frozen central point-10.6 E2E sample did not produce a static persistent discovery.',
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
  'GENESIS point-10.6 marker navigation into Archive',
  () => {
    test(
      'should select a persistent marker before GPU samples and navigate to its read-only Archive record',
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

        const persistedResultKind =
          await persistOneStaticDiscovery(
            page,
          );

        expect(
          [
            'SYSTEM',
            'NEBULA',
            'STAR_CLUSTER',
            'EXTREME_OBJECT',
          ],
        ).toContain(
          persistedResultKind,
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

        const layers =
          page.getByTestId(
            'galactic-map-layers',
          );

        await expect(
          layers,
        ).toBeVisible();

        for (
          const testId
          of [
            'galactic-map-layer-systems',
            'galactic-map-layer-nebulae',
            'galactic-map-layer-star-clusters',
            'galactic-map-layer-extreme-objects',
            'galactic-map-layer-regions',
            'galactic-map-layer-habitable-zone',
          ]
        ) {
          await expect(
            page.getByTestId(
              testId,
            ),
          ).toHaveAttribute(
            'aria-pressed',
            'true',
          );
        }

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

        const markers =
          page.getByTestId(
            'galactic-map-markers',
          );

        await expect(
          markers,
        ).toBeVisible();

        await expect(
          markers,
        ).toContainText(
          'Descubrimientos localizados',
        );

        await expect(
          markers,
        ).not.toContainText(
          'Objetos localizados',
        );

        await expect(
          markers.locator(
            '.galactic-map-scene__marker-swatch',
          ),
        ).toHaveCount(
          0,
        );

        const markerCountBeforeReload =
          Number(
            await scene.getAttribute(
              'data-discovery-marker-count',
            ),
          );

        expect(
          markerCountBeforeReload,
        ).toBeGreaterThanOrEqual(
          1,
        );

        await expect(
          page.getByTestId(
            'galactic-map-discovery-marker-count',
          ),
        ).toContainText(
          String(
            markerCountBeforeReload,
          ),
        );

        const markerLayer =
          persistedResultKind ===
            'SYSTEM'
            ? {
                testId:
                  'galactic-map-layer-systems',
                sceneAttribute:
                  'data-layer-systems-visible',
              }
            : persistedResultKind ===
                'NEBULA'
              ? {
                  testId:
                    'galactic-map-layer-nebulae',
                  sceneAttribute:
                    'data-layer-nebulae-visible',
                }
              : persistedResultKind ===
                  'STAR_CLUSTER'
                ? {
                    testId:
                      'galactic-map-layer-star-clusters',
                    sceneAttribute:
                      'data-layer-star-clusters-visible',
                  }
                : {
                    testId:
                      'galactic-map-layer-extreme-objects',
                    sceneAttribute:
                      'data-layer-extreme-objects-visible',
                  };

        await page
          .getByTestId(
            markerLayer.testId,
          )
          .click();

        await expect(
          scene,
        ).toHaveAttribute(
          markerLayer.sceneAttribute,
          'false',
        );

        await page
          .getByTestId(
            markerLayer.testId,
          )
          .click();

        await expect(
          scene,
        ).toHaveAttribute(
          markerLayer.sceneAttribute,
          'true',
        );

        for (
          const item
          of [
            {
              testId:
                'galactic-map-layer-regions',
              sceneAttribute:
                'data-layer-regions-visible',
            },
            {
              testId:
                'galactic-map-layer-habitable-zone',
              sceneAttribute:
                'data-layer-habitable-zone-visible',
            },
          ]
        ) {
          await page
            .getByTestId(
              item.testId,
            )
            .click();

          await expect(
            scene,
          ).toHaveAttribute(
            item.sceneAttribute,
            'false',
          );

          await page
            .getByTestId(
              item.testId,
            )
            .click();

          await expect(
            scene,
          ).toHaveAttribute(
            item.sceneAttribute,
            'true',
          );
        }

        expect(
          Number(
            await scene.getAttribute(
              'data-habitable-ring-count',
            ),
          ),
        ).toBeGreaterThan(
          0,
        );

        await expect(
          page.getByTestId(
            'galactic-map-point-boundary',
          ),
        ).toContainText(
          'SPECULATIVE_SIMPLIFIED',
        );

        await page.reload();

        await expect(
          scene,
        ).toHaveAttribute(
          'data-render-state',
          'ready',
        );

        await expect(
          scene,
        ).toHaveAttribute(
          'data-discovery-marker-count',
          String(
            markerCountBeforeReload,
          ),
        );

        await expect(
          markers,
        ).toBeVisible();

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

        await page.keyboard.down(
          'Control',
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
            'left',
        });

        await page.keyboard.up(
          'Control',
        );

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

        const targetBeforeGalaxySpinX =
          await numericAttribute(
            scene,
            'data-camera-target-x',
          );

        const targetBeforeGalaxySpinY =
          await numericAttribute(
            scene,
            'data-camera-target-y',
          );

        const targetBeforeGalaxySpinZ =
          await numericAttribute(
            scene,
            'data-camera-target-z',
          );

        const distanceBeforeGalaxySpin =
          await numericAttribute(
            scene,
            'data-camera-distance',
          );

        const azimuthBeforeGalaxySpin =
          await numericAttribute(
            scene,
            'data-camera-azimuth',
          );

        const polarBeforeGalaxySpin =
          await numericAttribute(
            scene,
            'data-camera-polar',
          );

        const initialGalaxySpin =
          await numericAttribute(
            scene,
            'data-galaxy-spin',
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
            80,
          centerY,
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
            async () =>
              Math.abs(
                await numericAttribute(
                  scene,
                  'data-galaxy-spin',
                ) -
                initialGalaxySpin,
              ),
          )
          .toBeGreaterThan(
            0.20,
          );

        const targetAfterGalaxySpinX =
          await numericAttribute(
            scene,
            'data-camera-target-x',
          );

        const targetAfterGalaxySpinY =
          await numericAttribute(
            scene,
            'data-camera-target-y',
          );

        const targetAfterGalaxySpinZ =
          await numericAttribute(
            scene,
            'data-camera-target-z',
          );

        const distanceAfterGalaxySpin =
          await numericAttribute(
            scene,
            'data-camera-distance',
          );

        const azimuthAfterGalaxySpin =
          await numericAttribute(
            scene,
            'data-camera-azimuth',
          );

        const polarAfterGalaxySpin =
          await numericAttribute(
            scene,
            'data-camera-polar',
          );

        const targetRadiusBeforeGalaxySpin =
          Math.hypot(
            targetBeforeGalaxySpinX,
            targetBeforeGalaxySpinY,
            targetBeforeGalaxySpinZ,
          );

        const targetRadiusAfterGalaxySpin =
          Math.hypot(
            targetAfterGalaxySpinX,
            targetAfterGalaxySpinY,
            targetAfterGalaxySpinZ,
          );

        expect(
          Math.abs(
            targetRadiusAfterGalaxySpin -
              targetRadiusBeforeGalaxySpin,
          ),
        ).toBeLessThan(
          0.001,
        );

        expect(
          Math.abs(
            distanceAfterGalaxySpin -
              distanceBeforeGalaxySpin,
          ),
        ).toBeLessThan(
          0.001,
        );

        expect(
          Math.abs(
            azimuthAfterGalaxySpin -
              azimuthBeforeGalaxySpin,
          ),
        ).toBeLessThan(
          0.001,
        );

        expect(
          Math.abs(
            polarAfterGalaxySpin -
              polarBeforeGalaxySpin,
          ),
        ).toBeLessThan(
          0.001,
        );

        expect(
          Math.abs(
            targetAfterGalaxySpinX -
              targetBeforeGalaxySpinX,
          ),
        ).toBeLessThan(
          0.001,
        );

        expect(
          Math.abs(
            targetAfterGalaxySpinY -
              targetBeforeGalaxySpinY,
          ),
        ).toBeLessThan(
          0.001,
        );

        expect(
          Math.abs(
            targetAfterGalaxySpinZ -
              targetBeforeGalaxySpinZ,
          ),
        ).toBeLessThan(
          0.001,
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

        await expect
          .poll(
            async () =>
              Math.abs(
                await numericAttribute(
                  scene,
                  'data-galaxy-spin',
                ),
              ),
          )
          .toBeLessThan(
            0.001,
          );

        // A hidden marker family must not steal the existing GPU-sample click.
        await page
          .getByTestId(
            markerLayer.testId,
          )
          .click();

        await expect(
          scene,
        ).toHaveAttribute(
          markerLayer.sceneAttribute,
          'false',
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

        // Restore the persistent family and select the real marker. The static
        // discovery is always in the frozen central ±2 sector sample, so a
        // compact grid around the visual centre avoids depending on one exact
        // deterministic intra-sector offset.
        await page
          .getByTestId(
            markerLayer.testId,
          )
          .click();

        await expect(
          scene,
        ).toHaveAttribute(
          markerLayer.sceneAttribute,
          'true',
        );

        const markerSelection =
          page.getByTestId(
            'galactic-map-marker-selection',
          );

        let markerFound =
          false;

        for (
          const offsetY
          of [
            -18,
            0,
            18,
          ]
        ) {
          for (
            const offsetX
            of [
              -18,
              0,
              18,
            ]
          ) {
            await canvas.click({
              position: {
                x:
                  bounds.width /
                    2 +
                  offsetX,
                y:
                  bounds.height /
                    2 +
                  offsetY,
              },
            });

            if (
              await markerSelection.count() >
                0
            ) {
              markerFound =
                true;

              break;
            }
          }

          if (
            markerFound
          ) {
            break;
          }
        }

        expect(
          markerFound,
        ).toBe(
          true,
        );

        await expect(
          markerSelection,
        ).toBeVisible();

        await expect(
          selection,
        ).toHaveCount(
          0,
        );

        const expectedFamilyLabel =
          persistedResultKind ===
            'SYSTEM'
            ? 'Sistema'
            : persistedResultKind ===
                'NEBULA'
              ? 'Nebulosa'
              : persistedResultKind ===
                  'STAR_CLUSTER'
                ? 'Cúmulo estelar'
                : 'Objeto extremo';

        await expect(
          page.getByTestId(
            'galactic-map-selected-marker-family',
          ),
        ).toContainText(
          expectedFamilyLabel,
        );

        await expect(
          page.getByTestId(
            'galactic-map-selected-marker-identity',
          ),
        ).toContainText(
          /^(?:\s*)(?:SYS|OBJ)-\d+/,
        );

        await expect(
          page.getByTestId(
            'galactic-map-selected-marker-state',
          ),
        ).toContainText(
          'Detectado',
        );

        const markerLink =
          page.getByTestId(
            'galactic-map-marker-link',
          );

        await expect(
          markerLink,
        ).toBeVisible();

        const markerHref =
          await markerLink.getAttribute(
            'href',
          );

        expect(
          markerHref,
        ).not.toBeNull();

        const markerUrl =
          new URL(
            markerHref ??
              '',
            'http://localhost',
          );

        expect(
          markerUrl.pathname,
        ).toMatch(
          /^\/archive\/(?:system|galactic-object)\/0\/-?\d+\/\d+$/,
        );

        expect(
          markerUrl.searchParams.get(
            'seed',
          ),
        ).toBe(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        );

        expect(
          markerUrl.searchParams.get(
            'version',
          ),
        ).toBe(
          '1',
        );

        await expect(
          page.getByTestId(
            'galactic-map-relative-position',
          ),
        ).toHaveCount(
          0,
        );

        await expect(
          page.getByTestId(
            'galactic-map-point-boundary',
          ),
        ).toContainText(
          '10.7–10.9',
        );

        await markerLink.click();

        await expect(
          page,
        ).toHaveURL(
          /\/archive\/(?:system|galactic-object)\/0\/-?\d+\/\d+\?seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1&version=1$/,
        );

        await expect(
          page.getByTestId(
            'archive-discovery-detail-page',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'archive-discovery-detail-family',
          ),
        ).toContainText(
          expectedFamilyLabel,
        );

        await expect(
          page.getByTestId(
            'archive-discovery-detail-state',
          ),
        ).toContainText(
          'Detectado',
        );

        await expect(
          page.getByTestId(
            'archive-discovery-detail-record',
          ),
        ).toHaveAttribute(
          'data-result-kind',
          persistedResultKind,
        );

        await expect(
          page.getByTestId(
            'archive-discovery-detail-map-link',
          ),
        ).toHaveAttribute(
          'href',
          '/galaxy-map',
        );
      },
    );
  },
);
