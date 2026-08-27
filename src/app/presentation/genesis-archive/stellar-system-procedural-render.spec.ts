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
      'should render one confirmed binary with two stars, one inner orbit, barycentre and stable HZ band',
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
      },
    );
  },
);
