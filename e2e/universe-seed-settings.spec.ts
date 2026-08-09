import {
  expect,
  test,
} from '@playwright/test';

test.describe(
  'GENESIS Universe Seed settings',
  () => {
    test(
      'should apply a manually entered seed',
      async ({
        page,
      }) => {
        await page.goto(
          '/settings',
        );

        await page
          .getByTestId(
            'universe-seed-input',
          )
          .fill(
            'abcd-0000-0000-0000-0000-0000-0000-0001',
          );

        await page
          .getByTestId(
            'universe-seed-apply-button',
          )
          .click();

        await expect(
          page.getByTestId(
            'universe-seed-active',
          ),
        ).toContainText(
          'ABCD-0000-0000-0000-0000-0000-0000-0001',
        );

        await expect(
          page.getByTestId(
            'universe-seed-status',
          ),
        ).toContainText(
          'Seed aplicada correctamente',
        );
      },
    );

    test(
      'should reject an invalid manually entered seed',
      async ({
        page,
      }) => {
        await page.goto(
          '/settings',
        );

        const active =
          page.getByTestId(
            'universe-seed-active',
          );

        const original =
          (
            await active.textContent()
          )?.trim();

        await page
          .getByTestId(
            'universe-seed-input',
          )
          .fill(
            'INVALID',
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
          'formato válido',
        );

        await expect(
          active,
        ).toContainText(
          original ?? '',
        );
      },
    );

    test(
      'should copy the active seed',
      async ({
        page,
      }) => {
        await page.addInitScript(
          () => {
            Object.defineProperty(
              navigator,
              'clipboard',
              {
                configurable:
                  true,

                value: {
                  writeText:
                    async (
                      value: string,
                    ) => {
                      sessionStorage.setItem(
                        'genesis-test-copied-seed',
                        value,
                      );
                    },
                },
              },
            );
          },
        );

        await page.goto(
          '/settings',
        );

        const active =
          (
            await page
              .getByTestId(
                'universe-seed-active',
              )
              .textContent()
          )?.trim();

        await page
          .getByTestId(
            'universe-seed-copy-button',
          )
          .click();

        const copied =
          await page.evaluate(
            () =>
              sessionStorage.getItem(
                'genesis-test-copied-seed',
              ),
          );

        expect(
          copied,
        ).toBe(
          active,
        );

        await expect(
          page.getByTestId(
            'universe-seed-status',
          ),
        ).toContainText(
          'Seed copiada',
        );
      },
    );
  },
);