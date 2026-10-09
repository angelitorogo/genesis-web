import {
  TestBed,
} from '@angular/core/testing';

import {
  provideRouter,
} from '@angular/router';

import {
  LaboratoryPage,
} from './laboratory';

describe(
  'LaboratoryPage',
  () => {
    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              LaboratoryPage,
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
      'should render the permanent read-only GENESIS visual laboratory index',
      () => {
        const fixture =
          TestBed
            .createComponent(
              LaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="laboratory-page"]',
          ),
        ).toBeTruthy();

        expect(
          element.textContent,
        ).toContain(
          'Laboratorios',
        );

        expect(
          element.textContent,
        ).toContain(
          'sin modificar la partida',
        );
      },
    );

    it(
      'should expose exactly the thirteen laboratories already implemented',
      () => {
        const fixture =
          TestBed
            .createComponent(
              LaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        expect(
          element.querySelectorAll(
            '.laboratory__card',
          ),
        ).toHaveLength(
          13,
        );
      },
    );

    it(
      'should link only to the thirteen canonical permanent laboratory routes',
      () => {
        const fixture =
          TestBed
            .createComponent(
              LaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        expect(
          element
            .querySelector<HTMLAnchorElement>(
              '[data-testid="laboratory-galaxies-link"]',
            )
            ?.getAttribute(
              'href',
            ),
        ).toBe(
          '/laboratory/galaxies',
        );

        expect(
          element
            .querySelector<HTMLAnchorElement>(
              '[data-testid="laboratory-galactic-objects-link"]',
            )
            ?.getAttribute(
              'href',
            ),
        ).toBe(
          '/laboratory/galactic-objects',
        );

        expect(
          element
            .querySelector<HTMLAnchorElement>(
              '[data-testid="laboratory-spectroscopy-link"]',
            )
            ?.getAttribute(
              'href',
            ),
        ).toBe(
          '/laboratory/spectroscopy',
        );

        expect(
          element
            .querySelector<HTMLAnchorElement>(
              '[data-testid="laboratory-stellar-systems-link"]',
            )
            ?.getAttribute(
              'href',
            ),
        ).toBe(
          '/laboratory/stellar-systems',
        );


        expect(
          element
            .querySelector<HTMLAnchorElement>(
              '[data-testid="laboratory-planetary-formation-link"]',
            )
            ?.getAttribute(
              'href',
            ),
        ).toBe(
          '/laboratory/planetary-formation',
        );


        expect(
          element
            .querySelector<HTMLAnchorElement>(
              '[data-testid="laboratory-supernovae-link"]',
            )
            ?.getAttribute(
              'href',
            ),
        ).toBe(
          '/laboratory/transient-events/supernovae',
        );


        expect(
          element
            .querySelector<HTMLAnchorElement>(
              '[data-testid="laboratory-novae-link"]',
            )
            ?.getAttribute(
              'href',
            ),
        ).toBe(
          '/laboratory/transient-events/novae',
        );

        expect(
          element
            .querySelector<HTMLAnchorElement>(
              '[data-testid="laboratory-post-supernova-audit-link"]',
            )
            ?.getAttribute(
              'href',
            ),
        ).toBe(
          '/laboratory/stellar-systems/post-supernova-audit',
        );

        expect(
          element
            .querySelector<HTMLAnchorElement>(
              '[data-testid="laboratory-kilonovae-link"]',
            )
            ?.getAttribute('href'),
        ).toBe('/laboratory/transient-events/kilonovae');

        expect(
          element
            .querySelector<HTMLAnchorElement>(
              '[data-testid="laboratory-compact-mergers-link"]',
            )
            ?.getAttribute('href'),
        ).toBe('/laboratory/transient-events/compact-mergers');


        expect(
          element
            .querySelector<HTMLAnchorElement>(
              '[data-testid="laboratory-gravitational-waves-link"]',
            )
            ?.getAttribute('href'),
        ).toBe('/laboratory/transient-events/gravitational-waves');

        expect(
          element
            .querySelector<HTMLAnchorElement>(
              '[data-testid="laboratory-tidal-disruptions-link"]',
            )
            ?.getAttribute('href'),
        ).toBe('/laboratory/transient-events/tidal-disruptions');


        expect(
          element
            .querySelector<HTMLAnchorElement>(
              '[data-testid="laboratory-gamma-ray-bursts-link"]',
            )
            ?.getAttribute('href'),
        ).toBe('/laboratory/transient-events/gamma-ray-bursts');
      },
    );
  },
);
