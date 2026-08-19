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
      'should start with the real frozen spiral representative',
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
          element
            .querySelector(
              '[data-testid="galaxy-laboratory-active-case"]',
            )
            ?.getAttribute(
              'data-galaxy-type',
            ),
        ).toBe(
          'SPIRAL',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galaxy-laboratory-index"]',
            )
            ?.textContent
            ?.trim(),
        ).toBe(
          '3',
        );
      },
    );

    it(
      'should switch the production-renderer input to the selected barred-spiral representative',
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

        const barred =
          element
            .querySelector<HTMLButtonElement>(
              '[data-testid="galaxy-laboratory-case-button"][data-case="BARRED_SPIRAL"]',
            );

        barred?.click();

        fixture.detectChanges();

        expect(
          barred
            ?.getAttribute(
              'aria-pressed',
            ),
        ).toBe(
          'true',
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
    );
  },
);
