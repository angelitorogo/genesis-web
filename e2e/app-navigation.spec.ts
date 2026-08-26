import {
  expect,
  test,
  type Page,
} from '@playwright/test';

const DEFAULT_D8B5_SEED =
  '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';

async function setGlobalDiscoveryPoints(
  page:
    Page,

  discoveryPoints:
    number,
): Promise<void> {

  await page.evaluate(
    async ({
      universeSeed,
      discoveryPointsText,
    }) => {
      const database =
        await new Promise<IDBDatabase>(
          (
            resolve,
            reject,
          ) => {
            const request =
              indexedDB.open(
                'genesis-web',
              );

            request.onsuccess =
              () =>
                resolve(
                  request.result,
                );

            request.onerror =
              () =>
                reject(
                  request.error,
                );
          },
        );

      try {
        const transaction =
          database.transaction(
            'progress',
            'readwrite',
          );

        transaction
          .objectStore(
            'progress',
          )
          .put({
            universeSeed,
            generatorVersionCode:
              1,
            scopeCode:
              0,
            scopeKey:
              'GLOBAL',
            galaxyIndex:
              null,
            discoveryPoints:
              discoveryPointsText,
            updatedAtEpochMs:
              Date.now(),
          });

        await new Promise<void>(
          (
            resolve,
            reject,
          ) => {
            transaction.oncomplete =
              () => resolve();

            transaction.onerror =
              () =>
                reject(
                  transaction.error,
                );

            transaction.onabort =
              () =>
                reject(
                  transaction.error,
                );
          },
        );
      } finally {
        database.close();
      }
    },
    {
      universeSeed:
        DEFAULT_D8B5_SEED,

      discoveryPointsText:
        discoveryPoints
          .toString(
            10,
          ),
    },
  );
}

async function exploreOneUnexploredSectorInline(
  page:
    Page,
): Promise<string | null> {

  await page.goto(
    '/galaxy-map',
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
  ).toHaveAttribute(
    'data-render-state',
    'ready',
  );

  const bounds =
    await canvas.boundingBox();

  expect(
    bounds,
  ).not.toBeNull();

  if (bounds === null) {
    throw new Error(
      'Galactic map canvas has no measurable bounds.',
    );
  }

  const candidates =
    [
      [0.32, 0.50],
      [0.68, 0.50],
      [0.50, 0.32],
      [0.50, 0.68],
      [0.36, 0.36],
      [0.64, 0.36],
      [0.36, 0.64],
      [0.64, 0.64],
    ] as const;

  for (
    const [
      xRatio,
      yRatio,
    ]
    of candidates
  ) {
    await canvas.click({
      position: {
        x:
          bounds.width *
          xRatio,
        y:
          bounds.height *
          yRatio,
      },
    });

    await scene.evaluate(
      () =>
        new Promise<void>(
          (resolve) => {
            requestAnimationFrame(
              () => {
                requestAnimationFrame(
                  () => resolve(),
                );
              },
            );
          },
        ),
    );

    if (
      await scene.getAttribute(
        'data-selected-sector-explored',
      ) !==
      'false'
    ) {
      continue;
    }

    await page
      .getByTestId(
        'galactic-map-explore-sector-link',
      )
      .click();

    const result =
      page.getByTestId(
        'galactic-map-inline-exploration-result',
      );

    await expect(
      result,
    ).toBeVisible();

    await expect(
      page.getByTestId(
        'galactic-map-inline-exploration-reward',
      ),
    ).toBeVisible();

    return result.getAttribute(
      'data-result-kind',
    );
  }

  throw new Error(
    'Could not select an unexplored sector for inline exploration.',
  );
}

const modules = [
  {
    name:
      'Galaxy Map',

    linkTestId:
      'galaxy-map-link',

    route:
      '/galaxy-map',

    pageTestId:
      'galaxy-map-page',
  },
  {
    name:
      'Observatory',

    linkTestId:
      'observatory-link',

    route:
      '/observatory',

    pageTestId:
      'observatory-page',
  },
  {
    name:
      'Genesis Archive',

    linkTestId:
      'archive-link',

    route:
      '/archive',

    pageTestId:
      'genesis-archive-page',
  },
  {
    name:
      'Statistics',

    linkTestId:
      'statistics-link',

    route:
      '/statistics',

    pageTestId:
      'statistics-page',
  },
  {
    name:
      'Settings',

    linkTestId:
      'settings-link',

    route:
      '/settings',

    pageTestId:
      'settings-page',
  },
] as const;

test.describe(
  'GENESIS navigation',
  () => {
    test(
      'should load the application shell',
      async ({
        page,
      }) => {
        await page.goto('/');

        await expect(
          page.getByTestId(
            'home-page',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'home-title',
          ),
        ).toContainText(
          'GENESIS',
        );

        await expect(
          page.getByTestId(
            'module-navigation',
          ),
        ).toBeVisible();
      },
    );

    for (
      const module
      of modules
    ) {
      test(
        `should navigate to ${module.name}`,
        async ({
          page,
        }) => {
          await page.goto('/');

          await page
            .getByTestId(
              module.linkTestId,
            )
            .click();

          await expect(
            page,
          ).toHaveURL(
            new RegExp(
              `${module.route}$`,
            ),
          );

          await expect(
            page.getByTestId(
              module.pageTestId,
            ),
          ).toBeVisible();
        },
      );
    }


    test(
      'should navigate to the point-11.1 Discovered Galaxies catalogue from Home',
      async ({
        page,
      }) => {
        await page.goto(
          '/settings',
        );

        await page
          .getByTestId(
            'universe-seed-apply-button',
          )
          .click();

        const seedStatus =
          page.getByTestId(
            'universe-seed-status',
          );

        await expect(
          seedStatus,
        ).toContainText(
          /Universo (?:creado y )?activado correctamente\./,
        );

        await expect(
          seedStatus,
        ).toHaveAttribute(
          'data-status',
          'success',
        );

        await page.goto('/');

        const galaxiesLink =
          page.getByTestId(
            'discovered-galaxies-link',
          );

        await expect(
          galaxiesLink,
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'active-galaxy-name',
          ),
        ).toContainText(
          'Elixisis',
        );

        await galaxiesLink.click();

        await expect(
          page,
        ).toHaveURL(
          /\/galaxies$/,
        );

        await expect(
          page.getByTestId(
            'discovered-galaxies-page',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'dg-summary',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'known-galaxy-count',
          ),
        ).toContainText(
          '1',
        );

        await expect(
          page.getByTestId(
            'current-focus-galaxy',
          ),
        ).toContainText(
          'Elixisis',
        );

        await expect(
          page.getByTestId(
            'discovered-galaxy-name',
          ),
        ).toContainText(
          'Elixisis',
        );

        await expect(
          page.getByTestId(
            'discovered-galaxy-card',
          ),
        ).toHaveCount(
          1,
        );

        await expect(
          page.getByTestId(
            'current-focus-badge',
          ),
        ).toContainText(
          'EN FOCO',
        );

        await expect(
          page.getByTestId(
            'discovered-galaxies-point-boundary',
          ),
        ).toBeVisible();
      },
    );


    test(
      'should open the point-11.3 general galaxy record from the discovered-galaxy catalogue',
      async ({
        page,
      }) => {
        await page.goto(
          '/settings',
        );

        await page
          .getByTestId(
            'universe-seed-apply-button',
          )
          .click();

        const seedStatus =
          page.getByTestId(
            'universe-seed-status',
          );

        await expect(
          seedStatus,
        ).toContainText(
          /Universo (?:creado y )?activado correctamente\./,
        );

        await page.goto(
          '/galaxies',
        );

        const detailLink =
          page.getByTestId(
            'discovered-galaxy-detail-link',
          );

        await expect(
          detailLink,
        ).toBeVisible();

        await detailLink
          .click();

        await expect(
          page,
        ).toHaveURL(
          /\/galaxies\/0$/,
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-page',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'galaxy-detail-name',
          ),
        ).toContainText(
          'Elixisis',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-index',
          ),
        ).toContainText(
          'Galaxia 0',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-state',
          ),
        ).toContainText(
          'Descubierta',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-exact-type',
          ),
        ).toContainText(
          'Espiral barrada',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-morphology',
          ),
        ).toContainText(
          'Disco galáctico',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-scale',
          ),
        ).toContainText(
          /Compacta|Media|Grande|Extendida/,
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-population',
          ),
        ).toContainText(
          /Baja|Moderada|Alta|Muy alta/,
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-nuclear',
          ),
        ).toContainText(
          /Sin actividad nuclear clara|Candidata a núcleo activo|Candidata a actividad nuclear extrema/,
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-focus-badge',
          ),
        ).toContainText(
          'EN FOCO',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-origin-badge',
          ),
        ).toContainText(
          'GALAXIA NATAL',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-boundary',
          ),
        ).toBeVisible();

        await page
          .getByTestId(
            'galaxy-detail-catalog-link',
          )
          .click();

        await expect(
          page,
        ).toHaveURL(
          /\/galaxies$/,
        );
      },
    );


    test(
      'should expose point-11.4 per-galaxy statistics after persisted exploration progress',
      async ({
        page,
      }) => {
        await page.goto(
          '/settings',
        );

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

        const resultKind =
          await exploreOneUnexploredSectorInline(
            page,
          );

        expect(
          resultKind,
        ).toMatch(
          /^(SYSTEM|NEBULA|STAR_CLUSTER|EXTREME_OBJECT|TRANSIENT_EVENT)$/,
        );

        const hasPersistentTarget =
          resultKind !==
          'TRANSIENT_EVENT';

        const isSystem =
          resultKind ===
          'SYSTEM';

        const isGalacticObject =
          resultKind ===
            'NEBULA' ||
          resultKind ===
            'STAR_CLUSTER' ||
          resultKind ===
            'EXTREME_OBJECT';

        await page.goto(
          '/galaxies/0',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-progress',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'galaxy-detail-progress-units',
          ),
        ).toHaveText(
          hasPersistentTarget
            ? '4'
            : '3',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-known-records',
          ),
        ).toHaveText(
          hasPersistentTarget
            ? '3'
            : '2',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-known-sectors',
          ),
        ).toHaveText(
          '1',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-known-systems',
          ),
        ).toHaveText(
          isSystem
            ? '1'
            : '0',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-known-galactic-objects',
          ),
        ).toHaveText(
          isGalacticObject
            ? '1'
            : '0',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-known-bodies',
          ),
        ).toHaveText(
          '0',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-known-civilizations',
          ),
        ).toHaveText(
          '0',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-state-detected',
          ),
        ).toHaveText(
          hasPersistentTarget
            ? '2'
            : '1',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-state-discovered',
          ),
        ).toHaveText(
          '1',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-state-visited',
          ),
        ).toHaveText(
          '0',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-state-catalogued',
          ),
        ).toHaveText(
          '0',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-state-confirmed',
          ),
        ).toHaveText(
          '0',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-progress-no-percentage',
          ),
        ).toContainText(
          'No son PD ni un porcentaje',
        );
      },
    );


    test(
      'should expose the point-11.5 focus control without offering a redundant change for the current galaxy',
      async ({
        page,
      }) => {
        await page.goto(
          '/settings',
        );

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

        await page.goto(
          '/galaxies/0',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-focus-control',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'galaxy-detail-focus-current',
          ),
        ).toContainText(
          'Esta galaxia ya define el contexto activo',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-change-focus-action',
          ),
        ).toHaveCount(
          0,
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-focus-semantics',
          ),
        ).toContainText(
          'no representa ni afirma un viaje físico o FTL',
        );

        await expect(
          page.getByTestId(
            'galaxy-detail-boundary',
          ),
        ).toContainText(
          '11.6',
        );
      },
    );


    test(
      'should expose the point-11.6 persistent return history without inventing previous galaxies in a fresh universe',
      async ({
        page,
      }) => {
        await page.goto(
          '/settings',
        );

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

        await page.goto(
          '/galaxies',
        );

        await expect(
          page.getByTestId(
            'galaxy-return-history',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'galaxy-return-history-empty',
          ),
        ).toContainText(
          'SIN GALAXIAS ANTERIORES',
        );

        await expect(
          page.getByTestId(
            'galaxy-return-action',
          ),
        ).toHaveCount(
          0,
        );

        await expect(
          page.getByTestId(
            'discovered-galaxies-point-boundary',
          ),
        ).toContainText(
          '11.6',
        );
      },
    );


    test(
      'should accumulate external-galaxy attempts, preserve point-11.6 return and show point-11.7 focus transitions',
      async ({
        page,
      }) => {
        test.setTimeout(
          60_000,
        );

        await page.goto(
          '/settings',
        );

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

        await page.goto(
          '/exploration',
        );

        const searchAction =
          page.getByTestId(
            'external-galaxy-search-action',
          );

        await expect(
          searchAction,
        ).toBeDisabled();

        await expect(
          page.getByTestId(
            'external-galaxy-search-available-attempts',
          ),
        ).toHaveText(
          '0',
        );

        await expect(
          page.getByTestId(
            'external-galaxy-search-opportunity-threshold',
          ),
        ).toContainText(
          '100 PD',
        );

        /*
         * Jumping directly to 300 PD must create three persistent attempts,
         * not collapse them into one current bucket.
         */
        await setGlobalDiscoveryPoints(
          page,
          300,
        );

        await page.reload();

        await expect(
          page.getByTestId(
            'external-galaxy-search-available-attempts',
          ),
        ).toHaveText(
          '3',
        );

        await expect(
          page.getByTestId(
            'external-galaxy-search-opportunity-toast',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'external-galaxy-search-opportunity-toast-new',
          ),
        ).toContainText(
          '3 nuevos intentos',
        );

        await expect(
          page.getByTestId(
            'external-galaxy-search-opportunity-toast-total',
          ),
        ).toContainText(
          '3 intentos disponibles',
        );

        await page
          .getByTestId(
            'external-galaxy-search-opportunity-toast-close',
          )
          .click();

        await page.reload();

        await expect(
          page.getByTestId(
            'external-galaxy-search-opportunity-toast',
          ),
        ).toHaveCount(
          0,
        );

        await expect(
          searchAction,
        ).toBeEnabled();

        await searchAction
          .click();

        await expect(
          page.getByTestId(
            'external-galaxy-search-result',
          ),
        ).toHaveAttribute(
          'data-detected',
          'false',
        );

        await expect(
          page.getByTestId(
            'external-galaxy-search-available-attempts',
          ),
        ).toHaveText(
          '2',
        );

        await expect(
          searchAction,
        ).toBeEnabled();

        /*
         * Four more thresholds are crossed while two attempts remain. The
         * stock therefore becomes six and the new toast announces only the
         * four newly earned attempts.
         */
        await setGlobalDiscoveryPoints(
          page,
          700,
        );

        await page.reload();

        await expect(
          page.getByTestId(
            'external-galaxy-search-available-attempts',
          ),
        ).toHaveText(
          '6',
        );

        await expect(
          page.getByTestId(
            'external-galaxy-search-opportunity-toast-new',
          ),
        ).toContainText(
          '4 nuevos intentos',
        );

        await expect(
          page.getByTestId(
            'external-galaxy-search-opportunity-toast-total',
          ),
        ).toContainText(
          '6 intentos disponibles',
        );

        await page
          .getByTestId(
            'external-galaxy-search-opportunity-toast-close',
          )
          .click();

        let detected =
          false;

        for (
          let attempt =
            2;
          attempt <=
            7;
          attempt +=
            1
        ) {
          const failuresBefore =
            (
              await page
                .getByTestId(
                  'external-galaxy-search-failures',
                )
                .textContent()
            )
              ?.trim() ??
            '';

          await expect(
            searchAction,
          ).toBeEnabled();

          await searchAction
            .click();

          const result =
            page.getByTestId(
              'external-galaxy-search-result',
            );

          await expect(
            result,
          ).toHaveAttribute(
            'data-failures-before',
            failuresBefore,
          );

          if (
            await result
              .getAttribute(
                'data-detected',
              ) ===
            'true'
          ) {
            detected =
              true;

            break;
          }
        }

        expect(
          detected,
        ).toBe(
          true,
        );

        const detectedGalaxyIndex =
          (
            await page
              .getByTestId(
                'external-galaxy-detection-index',
              )
              .textContent()
          )
            ?.trim() ??
          '';

        expect(
          detectedGalaxyIndex,
        ).toMatch(
          /^\d+$/,
        );

        expect(
          detectedGalaxyIndex,
        ).not.toBe(
          '0',
        );

        await expect(
          page.getByTestId(
            'external-galaxy-detection-reward',
          ),
        ).toContainText(
          '+40 PD',
        );

        await expect(
          page.getByTestId(
            'external-galaxy-search-global-points',
          ),
        ).toHaveText(
          '740',
        );

        await expect(
          page.getByTestId(
            'external-galaxy-search-available-attempts',
          ),
        ).toHaveText(
          '0',
        );

        await expect(
          page.getByTestId(
            'external-galaxy-search-opportunity-threshold',
          ),
        ).toContainText(
          '800 PD',
        );

        await expect(
          searchAction,
        ).toBeDisabled();

        await page
          .getByTestId(
            'external-galaxy-focus-action',
          )
          .click();

        const forwardFocusTransition =
          page.getByTestId(
            'galaxy-focus-transition',
          );

        await expect(
          forwardFocusTransition,
        ).toBeVisible();

        await expect(
          forwardFocusTransition,
        ).toHaveAttribute(
          'data-from-galaxy',
          '0',
        );

        await expect(
          forwardFocusTransition,
        ).toHaveAttribute(
          'data-to-galaxy',
          detectedGalaxyIndex,
        );

        await expect(
          forwardFocusTransition,
        ).toContainText(
          'REORIENTANDO EXPLORACIÓN',
        );

        await expect(
          forwardFocusTransition,
        ).toContainText(
          'no representa desplazamiento físico ni viaje FTL',
        );

        await expect(
          forwardFocusTransition,
        ).toHaveCount(
          0,
          {
            timeout:
              4_000,
          },
        );

        await expect(
          page.getByTestId(
            'external-galaxy-focus-message',
          ),
        ).toContainText(
          'historial persistido de 11.6',
        );

        await page.goto(
          '/galaxies',
        );

        const originReturn =
          page.locator(
            '[data-testid="galaxy-return-action"][data-galaxy-index="0"]',
          );

        await expect(
          originReturn,
        ).toBeVisible();

        await originReturn
          .click();

        const returnFocusTransition =
          page.getByTestId(
            'galaxy-focus-transition',
          );

        await expect(
          returnFocusTransition,
        ).toBeVisible();

        await expect(
          returnFocusTransition,
        ).toHaveAttribute(
          'data-from-galaxy',
          detectedGalaxyIndex,
        );

        await expect(
          returnFocusTransition,
        ).toHaveAttribute(
          'data-to-galaxy',
          '0',
        );

        await expect(
          returnFocusTransition,
        ).toContainText(
          'Transición de interfaz',
        );

        await expect(
          returnFocusTransition,
        ).toHaveCount(
          0,
          {
            timeout:
              4_000,
          },
        );

        await expect(
          page.getByTestId(
            'galaxy-return-success',
          ),
        ).toContainText(
          'progreso persistido se conserva',
        );

        await page.goto(
          '/exploration',
        );

        await expect(
          page.getByTestId(
            'external-galaxy-search-global-points',
          ),
        ).toHaveText(
          '740',
        );

        await expect(
          page.getByTestId(
            'external-galaxy-search-available-attempts',
          ),
        ).toHaveText(
          '0',
        );
      },
    );


    test(
      'should enter Exploration from the REALIZAR EXPLORACIÓN Home action',
      async ({
        page,
      }) => {
        await page.goto(
          '/settings',
        );

        await page
          .getByTestId(
            'universe-seed-apply-button',
          )
          .click();

        const seedStatus =
          page.getByTestId(
            'universe-seed-status',
          );

        /*
         * "success" is not enough here:
         * applyDraft() emits a transient success before the async bootstrap.
         * Wait for the final bootstrap message before leaving Settings.
         */
        await expect(
          seedStatus,
        ).toContainText(
          /Universo (?:creado y )?activado correctamente\./,
        );

        await expect(
          seedStatus,
        ).toHaveAttribute(
          'data-status',
          'success',
        );

        await page.goto('/');

        await expect(
          page.getByTestId(
            'home-page',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'perform-exploration-link',
          ),
        ).toBeVisible();

        await page
          .getByTestId(
            'perform-exploration-link',
          )
          .click();

        await expect(
          page,
        ).toHaveURL(
          /\/exploration$/,
        );

        await expect(
          page.getByTestId(
            'exploration-page',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'exploration-context',
          ),
        ).toContainText(
          'CONTEXTO PREPARADO',
        );
      },
    );


    test(
      'should keep /exploration dedicated to external-galaxy search and ignore legacy sector query parameters',
      async ({
        page,
      }) => {
        await page.goto(
          '/settings',
        );

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

        await page.goto(
          '/exploration?sectorX=20&sectorY=-42&scan=1',
        );

        await expect(
          page.getByTestId(
            'exploration-page',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'external-galaxy-search',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'exploration-operation-scope',
          ),
        ).toContainText(
          'Búsqueda extragaláctica',
        );

        for (
          const testId
          of [
            'selected-sector-from-map',
            'scan-sector-action',
            'exploration-result',
            'exploration-reward',
            'exploration-return-map-link',
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

    test(
      'should redirect an unknown route to Home',
      async ({
        page,
      }) => {
        await page.goto(
          '/ruta-inexistente',
        );

        await expect(
          page,
        ).toHaveURL(
          /\/$/,
        );

        await expect(
          page.getByTestId(
            'home-page',
          ),
        ).toBeVisible();
      },
    );

    test(
      'should show the empty state in Genesis Archive',
      async ({
        page,
      }) => {
        await page.goto(
          '/archive',
        );

        await expect(
          page.getByTestId(
            'genesis-archive-page',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'empty-state',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'empty-state',
          ),
        ).toContainText(
          'Archivo vacío',
        );
      },
    );
  },
);