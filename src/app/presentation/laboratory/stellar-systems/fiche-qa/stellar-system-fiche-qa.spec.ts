import {
  TestBed,
} from '@angular/core/testing';

import {
  provideRouter,
} from '@angular/router';

import {
  DiscoveryState,
} from '../../../../domain/discovery/discovery-state';

import {
  StellarSystemLaboratoryCaseId,
} from '../stellar-system-laboratory-fixtures';

import {
  StellarSystemFicheQaPage,
} from './stellar-system-fiche-qa';

describe(
  'StellarSystemFicheQaPage point 26.2 visual closure',
  () => {
    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              StellarSystemFicheQaPage,
            ],
            providers: [
              provideRouter([]),
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should expose SINGLE/BINARY/TRIPLE, eight deterministic families and all five DiscoveryState presentation layers without persistence controls',
      () => {
        const fixture =
          TestBed.createComponent(
            StellarSystemFicheQaPage,
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelectorAll(
            '[data-testid="stellar-system-fiche-qa-case"]',
          ),
        ).toHaveLength(3);

        expect(
          element.querySelectorAll(
            '[data-testid="stellar-system-fiche-qa-family"]',
          ),
        ).toHaveLength(8);

        expect(
          Array.from(
            element.querySelectorAll(
              '[data-testid="stellar-system-fiche-qa-state"]',
            ),
          ).map(
            node =>
              node.getAttribute(
                'data-state',
              ),
          ),
        ).toEqual([
          'DETECTED',
          'DISCOVERED',
          'VISITED',
          'CATALOGUED',
          'CONFIRMED',
        ]);

        expect(
          element.querySelector(
            '[data-testid="stellar-system-fiche-qa-contract"]',
          )?.textContent,
        ).toContain(
          '0 escrituras',
        );
      },
      30_000,
    );

    it(
      'should prove DISCOVERED and VISITED reuse the exact same identified disclosure and keep physical facts/orbits locked',
      () => {
        const fixture =
          TestBed.createComponent(
            StellarSystemFicheQaPage,
          );

        const component =
          fixture.componentInstance;

        component.selectState(
          DiscoveryState.VISITED,
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          component
            .identifiedDisclosureEquivalent(),
        ).toBe(true);

        expect(
          component.card()
            .knowledgeLevel,
        ).toBe(
          'IDENTIFIED',
        );

        expect(
          component.card()
            .components.every(
              star =>
                star.facts.length === 0 &&
                star.spectralType === null &&
                star.evolutionStateLabel === null,
            ),
        ).toBe(true);

        expect(
          component.card().orbits,
        ).toEqual([]);

        expect(
          element.querySelector(
            '[data-testid="stellar-system-fiche-qa-identified-equivalence"]',
          )?.textContent,
        ).toContain(
          'MISMO DISCLOSURE',
        );

        expect(
          element.querySelector(
            '[data-testid="stellar-system-fiche-qa-orbits-locked"]',
          ),
        ).toBeTruthy();
      },
      30_000,
    );

    it(
      'should reveal catalogued stellar physics/orbits but keep confirmed characterization locked',
      () => {
        const fixture =
          TestBed.createComponent(
            StellarSystemFicheQaPage,
          );

        const component =
          fixture.componentInstance;

        component.selectState(
          DiscoveryState.CATALOGUED,
        );

        fixture.detectChanges();

        expect(
          component.card()
            .knowledgeLevel,
        ).toBe(
          'CATALOGUED',
        );

        expect(
          component.card()
            .components.every(
              star =>
                star.facts.length > 0 &&
                star.spectralType !== null &&
                star.evolutionStateLabel !== null,
            ),
        ).toBe(true);

        expect(
          component.card().orbits.length,
        ).toBeGreaterThan(0);

        expect(
          component.card()
            .habitabilityFacts,
        ).toEqual([]);

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="stellar-system-fiche-qa-confirmation-locked"]',
          ),
        ).toBeTruthy();
      },
      30_000,
    );

    it(
      'should expose confirmed-only characterization for a real binary and preserve selection independence from the campaign',
      () => {
        const fixture =
          TestBed.createComponent(
            StellarSystemFicheQaPage,
          );

        const component =
          fixture.componentInstance;

        component.selectCase(
          StellarSystemLaboratoryCaseId.BINARY,
        );
        component.selectState(
          DiscoveryState.CONFIRMED,
        );

        fixture.detectChanges();

        expect(
          component.card()
            .knowledgeLevel,
        ).toBe(
          'CONFIRMED',
        );

        expect(
          component.card()
            .habitabilityFacts.length,
        ).toBeGreaterThan(0);

        expect(
          fixture.nativeElement
            .querySelector(
              '[data-testid="stellar-system-fiche-qa-habitability"]',
            ),
        ).toBeTruthy();
      },
      30_000,
    );
  },
);
