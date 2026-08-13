import {
  expect,
  test,
} from '@playwright/test';

const CANONICAL_SEED_PATTERN =
  /^[0-9A-F]{4}(?:-[0-9A-F]{4}){7}$/;

async function readCanonicalActiveSeed(
  page:
    import('@playwright/test').Page,
): Promise<string> {

  const activeSeed =
    page.getByTestId(
      'universe-seed-active',
    );

  await expect
    .poll(
      async () =>
        (
          await activeSeed
            .textContent()
        )
          ?.trim() ??
        '',
    )
    .toMatch(
      CANONICAL_SEED_PATTERN,
    );

  return (
    await activeSeed
      .textContent()
  )
    ?.trim() ??
    '';
}

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

        const input =
          page.getByTestId(
            'universe-seed-input',
          );

        const applyButton =
          page.getByTestId(
            'universe-seed-apply-button',
          );

        const activeSeed =
          page.getByTestId(
            'universe-seed-active',
          );

        const status =
          page.getByTestId(
            'universe-seed-status',
          );

        await expect(
          input,
        ).toBeVisible();

        await input.fill(
          'abcd-0000-0000-0000-0000-0000-0000-0001',
        );

        await applyButton.click();

        await expect(
          activeSeed,
        ).toContainText(
          'ABCD-0000-0000-0000-0000-0000-0000-0001',
        );

        /*
         * Do not stop at data-status="success".
         *
         * UniverseSeedFacade briefly reports
         * "Seed aplicada correctamente." before the asynchronous
         * universe bootstrap finishes. The final bootstrap message
         * is the real completion signal.
         */
        await expect(
          status,
        ).toContainText(
          'Universo creado y activado correctamente.',
        );

        await expect(
          status,
        ).toHaveAttribute(
          'data-status',
          'success',
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

        const activeSeed =
          page.getByTestId(
            'universe-seed-active',
          );

        const input =
          page.getByTestId(
            'universe-seed-input',
          );

        const applyButton =
          page.getByTestId(
            'universe-seed-apply-button',
          );

        const status =
          page.getByTestId(
            'universe-seed-status',
          );

        const original =
          await readCanonicalActiveSeed(
            page,
          );

        await input.fill(
          'INVALID',
        );

        await applyButton.click();

        await expect(
          status,
        ).toHaveAttribute(
          'data-status',
          'error',
        );

        await expect(
          status,
        ).toContainText(
          'formato válido',
        );

        await expect
          .poll(
            async () =>
              (
                await activeSeed
                  .textContent()
              )
                ?.trim() ??
              '',
          )
          .toBe(
            original,
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
                      value:
                        string,
                    ) => {
                      sessionStorage
                        .setItem(
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

        const copyButton =
          page.getByTestId(
            'universe-seed-copy-button',
          );

        const status =
          page.getByTestId(
            'universe-seed-status',
          );

        const active =
          await readCanonicalActiveSeed(
            page,
          );

        await copyButton.click();

        await expect(
          status,
        ).toHaveAttribute(
          'data-status',
          'success',
        );

        await expect(
          status,
        ).toContainText(
          'Seed copiada',
        );

        await expect
          .poll(
            async () =>
              page.evaluate(
                () =>
                  sessionStorage
                    .getItem(
                      'genesis-test-copied-seed',
                    ),
              ),
          )
          .toBe(
            active,
          );
      },
    );
  },
);