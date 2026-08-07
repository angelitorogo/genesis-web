import {
  expect,
  test,
} from '@playwright/test';

test.describe(
  'GENESIS procedural runtime',
  () => {
    test(
      'should execute the procedural Web Worker',
      async ({
        page,
      }) => {
        await page.goto(
          '/settings',
        );

        await expect(
          page.getByTestId(
            'settings-page',
          ),
        ).toBeVisible();

        const status =
          page.getByTestId(
            'worker-diagnostic-status',
          );

        await expect(
          status,
        ).toContainText(
          'todavía no se ha comprobado',
        );

        await page
          .getByTestId(
            'worker-diagnostic-button',
          )
          .click();

        await expect(
          status,
        ).toContainText(
          'Web Worker activo',
        );
      },
    );
  },
);