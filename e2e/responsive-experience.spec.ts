import {
  expect,
  type Locator,
  type Page,
  test,
} from '@playwright/test';

type ResponsiveViewport = Readonly<{
  name: string;
  width: number;
  height: number;
}>;

const responsiveViewports: readonly ResponsiveViewport[] = [
  {
    name: 'desktop',
    width: 1440,
    height: 900,
  },
  {
    name: 'tablet',
    width: 768,
    height: 1024,
  },
  {
    name: 'mobile-pwa',
    width: 390,
    height: 844,
  },
] as const;

const responsiveDestinations = [
  {
    route: '/',
    testId: 'home-page',
  },
  {
    route: '/galaxies',
    testId: 'discovered-galaxies-page',
  },
  {
    route: '/galaxies/0',
    testId: 'galaxy-detail-page',
  },
  {
    route: '/galaxy-map',
    testId: 'galaxy-map-page',
  },
  {
    route: '/archive',
    testId: 'genesis-archive-page',
  },
  {
    route: '/observatory',
    testId: 'observatory-page',
  },
  {
    route: '/statistics',
    testId: 'statistics-page',
  },
  {
    route: '/settings',
    testId: 'settings-page',
  },
  {
    route: '/exploration',
    testId: 'exploration-page',
  },
] as const;

async function expectNoHorizontalOverflow(
  page: Page,
): Promise<void> {
  const layout =
    await page.evaluate(
      () => {
        const root =
          document.documentElement;

        const body =
          document.body;

        const viewportWidth =
          window.innerWidth;

        const offenders =
          Array.from(
            body.querySelectorAll<HTMLElement>(
              '*',
            ),
          )
            .filter(
              (element) => {
                const style =
                  window.getComputedStyle(
                    element,
                  );

                if (
                  style.display === 'none'
                  || style.visibility === 'hidden'
                  || style.position === 'absolute'
                  || style.position === 'fixed'
                ) {
                  return false;
                }

                const rect =
                  element.getBoundingClientRect();

                if (
                  rect.width <= 1
                  || rect.height <= 1
                ) {
                  return false;
                }

                return (
                  rect.left < -1
                  || rect.right > viewportWidth + 1
                );
              },
            )
            .slice(
              0,
              8,
            )
            .map(
              (element) => ({
                tag:
                  element.tagName.toLowerCase(),
                className:
                  typeof element.className === 'string'
                    ? element.className
                    : '',
                testId:
                  element.getAttribute(
                    'data-testid',
                  ),
                rect:
                  element
                    .getBoundingClientRect()
                    .toJSON(),
              }),
            );

        return {
          viewportWidth,
          rootClientWidth:
            root.clientWidth,
          rootScrollWidth:
            root.scrollWidth,
          bodyScrollWidth:
            body.scrollWidth,
          offenders,
        };
      },
    );

  expect(
    layout.rootScrollWidth,
  ).toBeLessThanOrEqual(
    layout.rootClientWidth + 1,
  );

  expect(
    layout.bodyScrollWidth,
  ).toBeLessThanOrEqual(
    layout.viewportWidth + 1,
  );

  expect(
    layout.offenders,
  ).toEqual([]);
}

async function expectTouchTarget(
  locator: Locator,
): Promise<void> {
  await expect(
    locator,
  ).toBeVisible();

  const box =
    await locator.boundingBox();

  expect(
    box,
  ).not.toBeNull();

  expect(
    box?.width ?? 0,
  ).toBeGreaterThanOrEqual(
    44,
  );

  expect(
    box?.height ?? 0,
  ).toBeGreaterThanOrEqual(
    44,
  );
}

async function ensureActiveUniverse(
  page: Page,
): Promise<void> {
  await page.goto(
    '/settings',
  );

  await expect(
    page.getByTestId(
      'settings-page',
    ),
  ).toBeVisible();

  await expectNoHorizontalOverflow(
    page,
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

  await expectNoHorizontalOverflow(
    page,
  );
}

test.describe(
  'GENESIS point-9.7 responsive experience',
  () => {
    for (
      const viewport
      of responsiveViewports
    ) {
      test(
        `should preserve the main experience at ${viewport.name} ${viewport.width}x${viewport.height}`,
        async ({
          page,
        }) => {
          await page.setViewportSize({
            width:
              viewport.width,
            height:
              viewport.height,
          });

          await ensureActiveUniverse(
            page,
          );

          for (
            const destination
            of responsiveDestinations
          ) {
            await page.goto(
              destination.route,
            );

            await expect(
              page.getByTestId(
                destination.testId,
              ),
            ).toBeVisible();

            await expectNoHorizontalOverflow(
              page,
            );
          }

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
              'galaxy-detail-focus-control',
            ),
          ).toBeVisible();

          if (
            viewport.name ===
            'mobile-pwa'
          ) {
            await expectTouchTarget(
              page.getByTestId(
                'galaxy-detail-catalog-link',
              ),
            );

            await expectTouchTarget(
              page.getByTestId(
                'galaxy-detail-map-link',
              ),
            );
          }

          await expectNoHorizontalOverflow(
            page,
          );

          await page.goto('/');

          await expect(
            page.getByTestId(
              'module-navigation',
            ),
          ).toBeVisible();

          for (
            const testId
            of [
              'discovered-galaxies-link',
              'galaxy-map-link',
              'archive-link',
              'observatory-link',
              'statistics-link',
            ]
          ) {
            await expect(
              page.getByTestId(
                testId,
              ),
            ).toBeVisible();
          }

          if (
            viewport.name
            === 'mobile-pwa'
          ) {
            await expectTouchTarget(
              page.getByTestId(
                'perform-exploration-link',
              ),
            );

            for (
              const testId
              of [
                'discovered-galaxies-link',
                'galaxy-map-link',
                'archive-link',
                'observatory-link',
                'statistics-link',
              ]
            ) {
              await expectTouchTarget(
                page.getByTestId(
                  testId,
                ),
              );
            }
          }

          await page.goto(
            '/exploration',
          );

          await expect(
            page.getByTestId(
              'exploration-open-galaxy-map-link',
            ),
          ).toBeVisible();

          if (
            viewport.name
            === 'mobile-pwa'
          ) {
            await expectTouchTarget(
              page.getByTestId(
                'exploration-open-galaxy-map-link',
              ),
            );
          }

          await page.goto(
            '/exploration?sectorX=0&sectorY=0',
          );

          if (
            viewport.name
            === 'mobile-pwa'
          ) {
            await expectTouchTarget(
              page.getByTestId(
                'scan-sector-action',
              ),
            );
          }

          await page
            .getByTestId(
              'scan-sector-action',
            )
            .click();

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

          await expectNoHorizontalOverflow(
            page,
          );

          await page.goto(
            '/statistics',
          );

          if (
            viewport.name
            === 'mobile-pwa'
          ) {
            await expectTouchTarget(
              page.getByTestId(
                'statistics-home-link',
              ),
            );
          }

          await expectNoHorizontalOverflow(
            page,
          );
        },
      );
    }
  },
);
