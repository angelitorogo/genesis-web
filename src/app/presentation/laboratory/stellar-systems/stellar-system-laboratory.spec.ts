import {
  TestBed,
} from '@angular/core/testing';

import {
  provideRouter,
} from '@angular/router';

import {
  StellarSystemLaboratoryPage,
} from './stellar-system-laboratory';

describe(
  'StellarSystemLaboratoryPage',
  () => {
    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              StellarSystemLaboratoryPage,
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
      'should render the read-only phase-16 stellar-system laboratory with the production fiche renderer and the live Three.js QA scene',
      () => {
        const fixture =
          TestBed
            .createComponent(
              StellarSystemLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="stellar-system-laboratory-page"]',
          ),
        ).toBeTruthy();

        expect(
          element.textContent,
        ).toContain(
          'Sistemas estelares múltiples V1',
        );

        expect(
          element.querySelectorAll(
            'app-stellar-system-procedural-render',
          ),
        ).toHaveLength(4);

        expect(
          element.querySelector(
            '[data-testid="stellar-system-laboratory-system-scene-qa"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelectorAll(
            'app-system-scene',
          ),
        ).toHaveLength(1);

        const legend =
          element.querySelector(
            '[data-testid="stellar-system-laboratory-unit-legend"]',
          );

        expect(legend).toBeTruthy();
        expect(legend?.textContent).toContain('M☉');
        expect(legend?.textContent).toContain('masas solares');
        expect(legend?.textContent).toContain('R☉');
        expect(legend?.textContent).toContain('radios solares');
        expect(legend?.textContent).toContain('L☉');
        expect(legend?.textContent).toContain('luminosidades solares');
        expect(legend?.textContent).toContain('K');
        expect(legend?.textContent).toContain('kelvin');

        expect(
          element
            .querySelector(
              '[data-testid="stellar-system-laboratory-system-scene-stage"]',
            )
            ?.textContent
            ?.trim(),
        ).toBe(
          'CATALOGUED',
        );
      },
      30_000,
    );

    it(
      'should expose the three implemented architectures and exactly eight A-H families',
      () => {
        const fixture =
          TestBed
            .createComponent(
              StellarSystemLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        expect(
          element.querySelectorAll(
            '[data-testid="stellar-system-laboratory-case-button"]',
          ),
        ).toHaveLength(3);

        expect(
          element.querySelectorAll(
            '[data-testid="stellar-system-laboratory-family-button"]',
          ),
        ).toHaveLength(8);
      },
      30_000,
    );

    it(
      'should show DETECTED, DISCOVERED, CATALOGUED and CONFIRMED side by side for one real fixture',
      () => {
        const fixture =
          TestBed
            .createComponent(
              StellarSystemLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        expect(
          Array.from(
            element.querySelectorAll(
              '[data-testid="stellar-system-laboratory-stage"]',
            ),
          ).map(
            stage =>
              stage.getAttribute(
                'data-state',
              ),
          ),
        ).toEqual([
          'DETECTED',
          'DISCOVERED',
          'CATALOGUED',
          'CONFIRMED',
        ]);
      },
      30_000,
    );

    it(
      'should switch from SINGLE to TRIPLE and reset the family to A',
      () => {
        const fixture =
          TestBed
            .createComponent(
              StellarSystemLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-testid="stellar-system-laboratory-family-button"][data-family="H"]',
          )
          ?.click();

        fixture.detectChanges();

        element
          .querySelector<HTMLButtonElement>(
            '[data-testid="stellar-system-laboratory-case-button"][data-case="TRIPLE"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          element
            .querySelector(
              '[data-testid="stellar-system-laboratory-multiplicity"]',
            )
            ?.textContent
            ?.trim(),
        ).toBe(
          'TRIPLE',
        );

        expect(
          element
            .querySelector(
              '[data-testid="stellar-system-laboratory-family"]',
            )
            ?.textContent
            ?.trim(),
        ).toBe(
          'A',
        );

        const catalogued =
          element.querySelector(
            '[data-testid="stellar-system-laboratory-stage"][data-state="CATALOGUED"]',
          );

        expect(
          catalogued
            ?.querySelectorAll(
              '[data-component]',
            ).length,
        ).toBeGreaterThanOrEqual(3);
      },
      30_000,
    );
  },
);
