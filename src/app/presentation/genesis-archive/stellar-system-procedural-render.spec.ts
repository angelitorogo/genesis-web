import {
  TestBed,
} from '@angular/core/testing';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  ArchiveStellarSystemKnowledgeLevel,
} from './archive-stellar-system-card';

import {
  StellarSystemProceduralRender,
} from './stellar-system-procedural-render';

describe(
  'StellarSystemProceduralRender point 16.7',
  () => {
    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              StellarSystemProceduralRender,
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should render a resolved SINGLE with one solid photosphere plus external glow and layered diffraction',
      () => {
        const fixture =
          TestBed.createComponent(
            StellarSystemProceduralRender,
          );

        fixture.componentRef.setInput(
          'descriptor',
          {
            accessibleLabel:
              'Sistema simple de prueba',
            knowledgeLevel:
              ArchiveStellarSystemKnowledgeLevel.CONFIRMED,
            multiplicity:
              StellarSystemMultiplicity.SINGLE,
            components: [
              {
                label:
                  'A',
                colorHex:
                  '#AFCBFF',
                radiusScale:
                  1.12,
                massSolar:
                  1.3,
              },
            ],
            innerOrbitEccentricity:
              null,
            outerOrbitEccentricity:
              null,
            stableHabitableZoneFraction:
              null,
            hasStableHabitableZone:
              false,
          },
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelectorAll(
            '[data-component]',
          ),
        ).toHaveLength(1);

        expect(
          element.querySelector(
            '[data-component="A"]',
          )?.getAttribute(
            'data-star-treatment',
          ),
        ).toBe(
          'SINGLE_OPTICAL_V3',
        );

        expect(
          element.querySelector(
            '[data-testid="stellar-system-render-single-corona"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="stellar-system-render-single-bloom"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="stellar-system-render-single-aureole"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="stellar-system-render-single-diffraction-soft"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="stellar-system-render-single-diffraction-shoulder"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="stellar-system-render-single-diffraction"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="stellar-system-render-single-diffraction-secondary"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="stellar-system-render-single-diffraction-micro"]',
          ),
        ).toBeTruthy();

        const photospheres =
          element.querySelectorAll(
            '[data-testid="stellar-system-render-single-photosphere"]',
          );

        expect(photospheres).toHaveLength(1);
        expect(
          photospheres[0]?.getAttribute(
            'fill',
          ),
        ).toBe(
          '#AFCBFF',
        );

        expect(
          photospheres[0]?.getAttribute(
            'stroke',
          ),
        ).toBe(
          '#AFCBFF',
        );

        expect(
          element.querySelector(
            '.stellar-system-render__single-inner-photosphere',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '.stellar-system-render__single-hot-core',
          ),
        ).toBeNull();
      },
    );

    it(
      'should render one confirmed BINARY with two V3-derived optical stars, one inner orbit, foreground barycentre and stable HZ band',
      () => {
        const fixture =
          TestBed.createComponent(
            StellarSystemProceduralRender,
          );

        fixture.componentRef.setInput(
          'descriptor',
          {
            accessibleLabel:
              'Sistema binario de prueba',
            knowledgeLevel:
              ArchiveStellarSystemKnowledgeLevel.CONFIRMED,
            multiplicity:
              StellarSystemMultiplicity.BINARY,
            components: [
              {
                label:
                  'A',
                colorHex:
                  '#FFF4D8',
                radiusScale:
                  1.1,
                massSolar:
                  1.1,
              },
              {
                label:
                  'B',
                colorHex:
                  '#FFD0A0',
                radiusScale:
                  0.9,
                massSolar:
                  0.6,
              },
            ],
            innerOrbitEccentricity:
              0.25,
            outerOrbitEccentricity:
              null,
            stableHabitableZoneFraction:
              0.5,
            hasStableHabitableZone:
              true,
          },
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="stellar-system-procedural-render"]',
          )?.getAttribute(
            'data-multiplicity',
          ),
        ).toBe(
          'BINARY',
        );

        expect(
          element.querySelectorAll(
            '[data-component]',
          ),
        ).toHaveLength(2);

        expect(
          element.querySelectorAll(
            '[data-orbit-kind="inner"]',
          ),
        ).toHaveLength(1);

        expect(
          element.querySelector(
            '[data-testid="stellar-system-render-barycentre"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="stellar-system-render-habitable-zone"]',
          ),
        ).toBeTruthy();

        const components =
          element.querySelectorAll(
            '[data-component]',
          );

        expect(
          components[0]?.getAttribute(
            'data-star-treatment',
          ),
        ).toBe(
          'BINARY_OPTICAL_V1',
        );

        expect(
          components[1]?.getAttribute(
            'data-star-treatment',
          ),
        ).toBe(
          'BINARY_OPTICAL_V1',
        );

        expect(
          element.querySelectorAll(
            '[data-testid="stellar-system-render-single-corona"]',
          ),
        ).toHaveLength(2);

        expect(
          element.querySelectorAll(
            '[data-testid="stellar-system-render-single-bloom"]',
          ),
        ).toHaveLength(2);

        expect(
          element.querySelectorAll(
            '[data-testid="stellar-system-render-single-diffraction"]',
          ),
        ).toHaveLength(2);

        const photospheres =
          element.querySelectorAll(
            '[data-testid="stellar-system-render-single-photosphere"]',
          );

        expect(photospheres).toHaveLength(2);
        expect(
          photospheres[0]?.getAttribute(
            'fill',
          ),
        ).toBe(
          '#FFF4D8',
        );
        expect(
          photospheres[1]?.getAttribute(
            'fill',
          ),
        ).toBe(
          '#FFD0A0',
        );

        expect(
          element.querySelectorAll(
            '.stellar-system-render__star',
          ),
        ).toHaveLength(0);

        expect(
          element.querySelector(
            '.stellar-system-render__barycentre--foreground',
          ),
        ).toBeTruthy();
      },
    );


    it(
      'should render one confirmed TRIPLE with three V3-derived optical stars, both hierarchical orbits and a foreground inner-pair barycentre',
      () => {
        const fixture =
          TestBed.createComponent(
            StellarSystemProceduralRender,
          );

        fixture.componentRef.setInput(
          'descriptor',
          {
            accessibleLabel:
              'Sistema triple de prueba',
            knowledgeLevel:
              ArchiveStellarSystemKnowledgeLevel.CONFIRMED,
            multiplicity:
              StellarSystemMultiplicity.TRIPLE,
            components: [
              {
                label:
                  'A',
                colorHex:
                  '#FFF4D8',
                radiusScale:
                  1.1,
                massSolar:
                  1.1,
              },
              {
                label:
                  'B',
                colorHex:
                  '#FFD0A0',
                radiusScale:
                  0.9,
                massSolar:
                  0.6,
              },
              {
                label:
                  'C',
                colorHex:
                  '#FF8A32',
                radiusScale:
                  0.78,
                massSolar:
                  0.3,
              },
            ],
            innerOrbitEccentricity:
              0.25,
            outerOrbitEccentricity:
              0.55,
            stableHabitableZoneFraction:
              0.35,
            hasStableHabitableZone:
              true,
          },
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="stellar-system-procedural-render"]',
          )?.getAttribute(
            'data-multiplicity',
          ),
        ).toBe(
          'TRIPLE',
        );

        expect(
          element.querySelectorAll(
            '[data-component]',
          ),
        ).toHaveLength(3);

        expect(
          element.querySelectorAll(
            '[data-orbit-kind="inner"]',
          ),
        ).toHaveLength(1);

        expect(
          element.querySelectorAll(
            '[data-orbit-kind="outer"]',
          ),
        ).toHaveLength(1);

        const components =
          element.querySelectorAll(
            '[data-component]',
          );

        expect(
          components[0]?.getAttribute(
            'data-star-treatment',
          ),
        ).toBe(
          'TRIPLE_OPTICAL_V1',
        );

        expect(
          components[1]?.getAttribute(
            'data-star-treatment',
          ),
        ).toBe(
          'TRIPLE_OPTICAL_V1',
        );

        expect(
          components[2]?.getAttribute(
            'data-star-treatment',
          ),
        ).toBe(
          'TRIPLE_OPTICAL_V1',
        );

        expect(
          element.querySelectorAll(
            '[data-testid="stellar-system-render-single-corona"]',
          ),
        ).toHaveLength(3);

        expect(
          element.querySelectorAll(
            '[data-testid="stellar-system-render-single-bloom"]',
          ),
        ).toHaveLength(3);

        expect(
          element.querySelectorAll(
            '[data-testid="stellar-system-render-single-diffraction"]',
          ),
        ).toHaveLength(3);

        expect(
          element.querySelectorAll(
            '[data-testid="stellar-system-render-single-photosphere"]',
          ),
        ).toHaveLength(3);

        expect(
          element.querySelectorAll(
            '.stellar-system-render__star',
          ),
        ).toHaveLength(0);

        expect(
          element.querySelector(
            '.stellar-system-render__barycentre--foreground',
          ),
        ).toBeTruthy();
      },
    );
  },
);
