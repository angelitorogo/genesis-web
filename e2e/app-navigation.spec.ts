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