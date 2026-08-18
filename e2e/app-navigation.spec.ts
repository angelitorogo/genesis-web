import {
  expect,
  test,
} from '@playwright/test';

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

        await page.goto(
          '/exploration',
        );

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

        const result =
          page.getByTestId(
            'exploration-result',
          );

        await expect(
          result,
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'exploration-reward',
          ),
        ).toBeVisible();

        const resultKind =
          await result
            .getAttribute(
              'data-result-kind',
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
      'should complete the real 7.4-7.8 external-galaxy flow and point-11.6 return without losing progress',
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

        await expect(
          page.getByTestId(
            'external-galaxy-search',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'external-galaxy-search-effective-probability',
          ),
        ).toContainText(
          '2%',
        );

        const searchAction =
          page.getByTestId(
            'external-galaxy-search-action',
          );

        await searchAction
          .click();

        const firstSearchResult =
          page.getByTestId(
            'external-galaxy-search-result',
          );

        await expect(
          firstSearchResult,
        ).toHaveAttribute(
          'data-failures-before',
          '0',
        );

        await expect(
          firstSearchResult,
        ).toHaveAttribute(
          'data-detected',
          'false',
        );

        await expect(
          page.getByTestId(
            'external-galaxy-search-failures',
          ),
        ).toHaveText(
          '1',
        );

        /*
         * The anti-blocking streak is persistent gameplay state, not a signal
         * local to the current Angular component.
         */
        await page.reload();

        await expect(
          page.getByTestId(
            'external-galaxy-search-failures',
          ),
        ).toHaveText(
          '1',
        );

        await expect(
          page.getByTestId(
            'external-galaxy-search-effective-probability',
          ),
        ).toContainText(
          '11.8%',
        );

        let detected =
          false;

        for (
          let attempt =
            0;
          attempt <
            9;
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

          expect(
            failuresBefore,
          ).toMatch(
            /^\d+$/,
          );

          await page
            .getByTestId(
              'external-galaxy-search-action',
            )
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
            'external-galaxy-focus-action',
          ),
        ).toBeVisible();

        await page
          .getByTestId(
            'external-galaxy-focus-action',
          )
          .click();

        await expect(
          page.getByTestId(
            'external-galaxy-focus-message',
          ),
        ).toContainText(
          'historial persistido de 11.6',
        );

        await expect(
          page.getByTestId(
            'exploration-active-galaxy-index',
          ),
        ).toContainText(
          `GALAXIA ${detectedGalaxyIndex}`,
        );

        await page.goto(
          '/galaxies',
        );

        await expect(
          page.getByTestId(
            'current-focus-galaxy',
          ),
        ).toContainText(
          `Galaxia ${detectedGalaxyIndex}`,
        );

        const originReturn =
          page.locator(
            '[data-testid="galaxy-return-action"][data-galaxy-index="0"]',
          );

        await expect(
          originReturn,
        ).toHaveAttribute(
          'data-galaxy-index',
          '0',
        );

        await originReturn
          .click();

        await expect(
          page.getByTestId(
            'galaxy-return-success',
          ),
        ).toContainText(
          'progreso persistido se conserva',
        );

        await expect(
          page.getByTestId(
            'current-focus-galaxy',
          ),
        ).toContainText(
          'Galaxia 0',
        );

        await expect(
          page.locator(
            `[data-testid="discovered-galaxy-card"][data-galaxy-index="${detectedGalaxyIndex}"]`,
          ),
        ).toHaveAttribute(
          'data-galaxy-state',
          'VISITED',
        );

        await page.goto(
          '/exploration',
        );

        await expect(
          page.getByTestId(
            'external-galaxy-search-global-points',
          ),
        ).toHaveText(
          '40',
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
      'should execute the point-9.5 reward/progress sequence without revealing hidden Ground Truth',
      async ({
        page,
      }) => {
        await page.goto(
          '/',
        );

        await page
          .getByTestId(
            'settings-link',
          )
          .click();

        await expect(
          page,
        ).toHaveURL(
          /\/settings$/,
        );

        await page
          .getByTestId(
            'universe-seed-input',
          )
          .fill(
            '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
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

        await page.goBack();

        await expect(
          page,
        ).toHaveURL(
          /\/$/,
        );

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
            'scan-sector-action',
          ),
        ).toBeVisible();

        const sectorRangeText =
          await page
            .getByTestId(
              'exploration-sector-range',
            )
            .textContent();

        const sectorRangeMatch =
          sectorRangeText?.match(
            /(-?\d+)\s*…\s*(-?\d+)/,
          ) ??
          null;

        expect(
          sectorRangeMatch,
        ).not.toBeNull();

        const minSectorCoordinate =
          Number(
            sectorRangeMatch?.[1],
          );

        const maxSectorCoordinate =
          Number(
            sectorRangeMatch?.[2],
          );

        expect(
          Number.isInteger(
            minSectorCoordinate,
          ),
        ).toBeTruthy();

        expect(
          Number.isInteger(
            maxSectorCoordinate,
          ),
        ).toBeTruthy();

        await expect(
          page.getByTestId(
            'exploration-result',
          ),
        ).toHaveCount(
          0,
        );

        await expect(
          page.getByTestId(
            'exploration-reward',
          ),
        ).toHaveCount(
          0,
        );

        const xInput =
          page.getByTestId(
            'sector-x-input',
          );

        const yInput =
          page.getByTestId(
            'sector-y-input',
          );

        await xInput.fill(
          '0',
        );

        await yInput.fill(
          '0',
        );

        await page
          .getByTestId(
            'scan-sector-action',
          )
          .click();

        await expect(
          page.getByTestId(
            'sector-detection-kind',
          ),
        ).toContainText(
          'SEÑAL DETECTADA',
        );

        await expect(
          page.getByTestId(
            'preliminary-classification',
          ),
        ).toContainText(
          'Sin clasificar',
        );

        const result =
          page.getByTestId(
            'exploration-result',
          );

        await expect(
          result,
        ).toBeVisible();

        await expect(
          result,
        ).toHaveAttribute(
          'data-result-kind',
          /^(SYSTEM|NEBULA|STAR_CLUSTER|EXTREME_OBJECT|TRANSIENT_EVENT)$/,
        );

        await expect(
          page.getByTestId(
            'exploration-result-scientific-classification',
          ),
        ).toContainText(
          'Sin clasificar',
        );

        const firstKind =
          await result
            .getAttribute(
              'data-result-kind',
            );

        const firstIdentity =
          await page
            .getByTestId(
              'exploration-result-identity',
            )
            .textContent();

        const expectedFirstAward =
          firstKind === 'SYSTEM'
            ? 8
            : firstKind === 'TRANSIENT_EVENT'
              ? 2
              : 14;

        const reward =
          page.getByTestId(
            'exploration-reward',
          );

        await expect(
          reward,
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'exploration-reward-points',
          ),
        ).toContainText(
          `+${expectedFirstAward} PD`,
        );

        await expect(
          page.getByTestId(
            'exploration-sector-state',
          ),
        ).toContainText(
          'Detectada',
        );

        if (
          firstKind ===
          'TRANSIENT_EVENT'
        ) {
          await expect(
            page.getByTestId(
              'exploration-result-state',
            ),
          ).toContainText(
            'Evento no persistido',
          );
        } else {
          await expect(
            page.getByTestId(
              'exploration-result-state',
            ),
          ).toContainText(
            'Detectada',
          );
        }

        const firstGlobalPointsText =
          await page
            .getByTestId(
              'exploration-global-points',
            )
            .textContent();

        const firstGlobalPoints =
          Number(
            firstGlobalPointsText
              ?.trim() ??
            'NaN',
          );

        expect(
          Number.isFinite(
            firstGlobalPoints,
          ),
        ).toBeTruthy();

        await page
          .getByTestId(
            'scan-sector-action',
          )
          .click();

        await expect(
          result,
        ).toHaveAttribute(
          'data-result-kind',
          firstKind ?? '',
        );

        await expect(
          page.getByTestId(
            'exploration-result-identity',
          ),
        ).toHaveText(
          firstIdentity?.trim() ?? '',
        );

        await expect(
          page.getByTestId(
            'exploration-reward-points',
          ),
        ).toContainText(
          '+0 PD',
        );

        await expect(
          page.getByTestId(
            'exploration-global-points',
          ),
        ).toHaveText(
          String(
            firstGlobalPoints,
          ),
        );

        await expect(
          page.getByTestId(
            'exploration-galaxy-progress',
          ),
        ).toContainText(
          '(+0)',
        );

        await yInput.fill(
          '2',
        );

        await page
          .getByTestId(
            'scan-sector-action',
          )
          .click();

        await expect(
          page.getByTestId(
            'sector-detection-kind',
          ),
        ).toContainText(
          'ANOMALÍA DETECTADA',
        );

        await expect(
          page.getByTestId(
            'exploration-result',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'exploration-reward',
          ),
        ).toBeVisible();

        const beforeTransientGlobalText =
          await page
            .getByTestId(
              'exploration-global-points',
            )
            .textContent();

        const beforeTransientGlobal =
          Number(
            beforeTransientGlobalText
              ?.trim() ??
            'NaN',
          );

        expect(
          Number.isFinite(
            beforeTransientGlobal,
          ),
        ).toBeTruthy();

        await xInput.fill(
          '86',
        );

        await yInput.fill(
          '86',
        );

        await page
          .getByTestId(
            'scan-sector-action',
          )
          .click();

        await expect(
          page.getByTestId(
            'exploration-result',
          ),
        ).toHaveAttribute(
          'data-result-kind',
          'TRANSIENT_EVENT',
        );

        await expect(
          page.getByTestId(
            'exploration-result-subject',
          ),
        ).toContainText(
          'Sujeto transitorio',
        );

        await expect(
          page.getByTestId(
            'exploration-result-identity',
          ),
        ).toContainText(
          'EVT-',
        );

        await expect(
          page.getByTestId(
            'exploration-reward-points',
          ),
        ).toContainText(
          '+2 PD',
        );

        await expect(
          page.getByTestId(
            'exploration-sector-state',
          ),
        ).toContainText(
          'Detectada',
        );

        await expect(
          page.getByTestId(
            'exploration-result-state',
          ),
        ).toContainText(
          'Evento no persistido',
        );

        await expect(
          page.getByTestId(
            'exploration-result-scientific-classification',
          ),
        ).toContainText(
          'Sin clasificar',
        );

        await expect(
          page.getByTestId(
            'exploration-global-points',
          ),
        ).toHaveText(
          String(
            beforeTransientGlobal +
            2,
          ),
        );

        await page
          .getByTestId(
            'scan-sector-action',
          )
          .click();

        await expect(
          page.getByTestId(
            'exploration-reward-points',
          ),
        ).toContainText(
          '+0 PD',
        );

        await expect(
          page.getByTestId(
            'exploration-result-state',
          ),
        ).toContainText(
          'Evento no persistido',
        );

        await xInput.fill(
          String(
            maxSectorCoordinate + 1,
          ),
        );

        await yInput.fill(
          '0',
        );

        await page
          .getByTestId(
            'scan-sector-action',
          )
          .click();

        await expect(
          page.getByTestId(
            'sector-scan-error',
          ),
        ).toContainText(
          `Rango permitido: ${minSectorCoordinate}..${maxSectorCoordinate}`,
        );

        await expect(
          page.getByTestId(
            'sector-detection-kind',
          ),
        ).toHaveCount(
          0,
        );

        await expect(
          page.getByTestId(
            'exploration-result',
          ),
        ).toHaveCount(
          0,
        );

        await expect(
          page.getByTestId(
            'exploration-reward',
          ),
        ).toHaveCount(
          0,
        );
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