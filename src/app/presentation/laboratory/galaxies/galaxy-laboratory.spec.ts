import {
  TestBed,
} from '@angular/core/testing';

import {
  provideRouter,
} from '@angular/router';

import {
  GalaxyLaboratoryPage,
} from './galaxy-laboratory';

describe(
  'GalaxyLaboratoryPage',
  () => {
    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              GalaxyLaboratoryPage,
            ],

            providers: [
              provideRouter(
                [],
              ),
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should render the read-only V1 galaxy morphology laboratory',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalaxyLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="galaxy-laboratory-page"]',
          ),
        ).toBeTruthy();

        expect(
          element.textContent,
        ).toContain(
          'Morfologías galácticas V1',
        );
      },
    );

    it(
      'should expose exactly the five canonical morphology selectors',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalaxyLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        expect(
          element.querySelectorAll(
            '[data-testid="galaxy-laboratory-case-button"]',
          ),
        ).toHaveLength(
          5,
        );
      },
    );

    it(
      'should expose exactly eight A-H family selectors for the active morphology',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalaxyLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        expect(
          element.querySelectorAll(
            '[data-testid="galaxy-laboratory-family-button"]',
          ),
        ).toHaveLength(
          8,
        );
      },
      30_000,
    );

    it(
      'should start with real SPIRAL family A and expose its arm count and nucleus',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalaxyLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        const active =
          element
            .querySelector(
              '[data-testid="galaxy-laboratory-active-case"]',
            );

        expect(
          active
            ?.getAttribute(
              'data-galaxy-type',
            ),
        ).toBe(
          'SPIRAL',
        );

        expect(
          active
            ?.getAttribute(
              'data-family',
            ),
        ).toBe(
          'A',
        );

        expect(
          Number(
            active
              ?.getAttribute(
                'data-arm-count',
              ),
          ),
        ).toBeGreaterThanOrEqual(
          3,
        );

        expect(
          element
            .querySelector(
              '[data-testid="galaxy-laboratory-nucleus"]',
            )
            ?.textContent
            ?.trim(),
        ).toMatch(
          /^(QUIESCENT|AGN|QUASAR)$/,
        );
      },
      30_000,
    );

    it(
      'should switch SPIRAL renderer input between A-H families',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalaxyLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        const initialIndex =
          element
            .querySelector(
              '[data-testid="galaxy-laboratory-index"]',
            )
            ?.textContent
            ?.trim();

        const familyH =
          element
            .querySelector<HTMLButtonElement>(
              '[data-testid="galaxy-laboratory-family-button"][data-family="H"]',
            );

        familyH?.click();

        fixture.detectChanges();

        expect(
          familyH
            ?.getAttribute(
              'aria-pressed',
            ),
        ).toBe(
          'true',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galaxy-laboratory-family"]',
            )
            ?.textContent
            ?.trim(),
        ).toBe(
          'H',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galaxy-laboratory-index"]',
            )
            ?.textContent
            ?.trim(),
        ).not.toBe(
          initialIndex,
        );
      },
      30_000,
    );

    it(
      'should reset to family A when switching morphology',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalaxyLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-testid="galaxy-laboratory-family-button"][data-family="G"]',
          )
          ?.click();

        fixture.detectChanges();

        element
          .querySelector<HTMLButtonElement>(
            '[data-testid="galaxy-laboratory-case-button"][data-case="BARRED_SPIRAL"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          element
            .querySelector(
              '[data-testid="galaxy-laboratory-family"]',
            )
            ?.textContent
            ?.trim(),
        ).toBe(
          'A',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galaxy-laboratory-active-case"]',
            )
            ?.getAttribute(
              'data-galaxy-type',
            ),
        ).toBe(
          'BARRED_SPIRAL',
        );
      },
      30_000,
    );

    it(
      'should embed the real GalacticMapScene instead of a laboratory-only visual renderer',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalaxyLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="galaxy-laboratory-scene"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-scene"]',
          ),
        ).toBeTruthy();
      },
      30_000,
    );
  },
);
