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

    it('30.4 exposes classification laboratory card 21', () => {
      const fixture = TestBed.createComponent(LaboratoryPage);
      fixture.detectChanges();
      const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
        '[data-testid="laboratory-mystery-classification-link"]');
      expect(link?.getAttribute('href')).toBe('/laboratory/mysteries/classification');
      expect(link?.textContent).toContain('21');
    });

    it('30.3 exposes the scientific action laboratory card 20', () => {
      const fixture = TestBed.createComponent(LaboratoryPage);
      fixture.detectChanges();
      const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
        '[data-testid="laboratory-mystery-actions-link"]');
      expect(link?.getAttribute('href')).toBe('/laboratory/mysteries/actions');
      expect(link?.textContent).toContain('20');
    });

    it('30.2 exposes the permanent evidence laboratory card', () => {
      const fixture = TestBed.createComponent(LaboratoryPage);
      fixture.detectChanges();
      const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
        '[data-testid="laboratory-mystery-evidence-link"]');
      expect(link?.getAttribute('href')).toBe('/laboratory/mysteries/evidence');
    });

    it('should expose the 29.11 permanent historical-effects route', () => {
      const fixture = TestBed.createComponent(LaboratoryPage);
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
        '[data-testid="laboratory-transient-historical-effects-link"]',
      )?.getAttribute('href')).toBe('/laboratory/transient-events/historical-effects');
    });

    it('should expose the exact 29.12 time-control laboratory URL', () => {
      const fixture = TestBed.createComponent(LaboratoryPage);
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      expect(root.querySelector<HTMLAnchorElement>(
        '[data-testid="laboratory-transient-time-control-link"]'
      )?.getAttribute('href')).toBe('/laboratory/transient-events/time-control');
    });

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
      'should expose exactly the twenty-one laboratories already implemented',
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
          21,
        );
      },
    );

    it(
      'should link to the canonical permanent laboratory routes',
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


        expect(
          element
            .querySelector<HTMLAnchorElement>(
              '[data-testid="laboratory-fast-radio-bursts-link"]',
            )
            ?.getAttribute('href'),
        ).toBe('/laboratory/transient-events/fast-radio-bursts');


        expect(
          element
            .querySelector<HTMLAnchorElement>(
              '[data-testid="laboratory-great-stellar-flares-link"]',
            )
            ?.getAttribute('href'),
        ).toBe('/laboratory/transient-events/great-stellar-flares');

        expect(
          element.querySelector<HTMLAnchorElement>(
            '[data-testid="laboratory-transient-follow-up-link"]',
          )?.getAttribute('href'),
        ).toBe('/laboratory/transient-events/follow-up');
      },
    );
  },
);
