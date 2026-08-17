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
          'Caeloria',
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
          'Caeloria',
        );

        await expect(
          page.getByTestId(
            'discovered-galaxy-name',
          ),
        ).toContainText(
          'Caeloria',
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
            'scan-sector-action',
          ),
        ).toBeVisible();

        await expect(
          page.getByTestId(
            'exploration-sector-range',
          ),
        ).toContainText(
          '-86',
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
          '87',
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
          'Rango permitido: -86..86',
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