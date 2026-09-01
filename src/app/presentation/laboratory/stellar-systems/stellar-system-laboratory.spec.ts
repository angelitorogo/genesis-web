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

        expect(
          element.querySelector(
            '[data-testid="system-scene-controls"]',
          ),
        ).toBeTruthy();

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

        const snapshot =
          fixture
            .componentInstance
            .rendererQaSnapshot();

        expect(
          snapshot.stars,
        ).toHaveLength(
          3,
        );

        expect(
          snapshot.motions.some(
            motion =>
              motion.id ===
              'stellar-outer-relative',
          ),
        ).toBe(true);

        const primary =
          snapshot.stars.find(
            star =>
              star.label ===
              'A',
          );

        const tertiary =
          snapshot.stars.find(
            star =>
              star.label ===
              'C',
          );

        expect(
          primary
            ?.motionContributions.length,
        ).toBe(
          2,
        );

        expect(
          tertiary
            ?.motionContributions.length,
        ).toBe(
          1,
        );
      },
      30_000,
    );


    it(
      'should slow moon presentation cadence and preserve full 3D orientation for bound minor-body QA orbits',
      () => {
        const fixture =
          TestBed
            .createComponent(
              StellarSystemLaboratoryPage,
            );

        fixture.detectChanges();

        const snapshot =
          fixture
            .componentInstance
            .rendererQaSnapshot();

        expect(
          snapshot.moons.length,
        ).toBeGreaterThan(
          0,
        );

        const moonLocalContributions =
          snapshot.moons.map(
            moon =>
              moon.motionContributions[
                moon.motionContributions.length - 1
              ]!,
          );

        expect(
          moonLocalContributions.every(
            contribution =>
              contribution.presentationTimeScale !==
                undefined &&
              contribution.presentationTimeScale >
                0 &&
              contribution.presentationTimeScale <=
                1,
          ),
        ).toBe(true);

        expect(
          moonLocalContributions.some(
            contribution =>
              contribution.presentationTimeScale! <
              1,
          ),
        ).toBe(true);

        expect(
          snapshot.minorBodies.length,
        ).toBeGreaterThan(
          0,
        );

        expect(
          snapshot.habitableZone,
        ).not.toBeNull();

        expect(
          snapshot.layers.habitableZoneAvailable,
        ).toBe(true);

        expect(
          snapshot.layers.orbitalRiskTargetCount,
        ).toBe(
          snapshot.layers.orbitalApproachTargetCount +
          snapshot.layers.orbitalCollisionGeometryTargetCount,
        );

        expect(
          snapshot.orbitalRiskTargets.length,
        ).toBe(
          snapshot.layers.orbitalRiskTargetCount +
          snapshot.layers.orbitalCrossingTargetCount,
        );

        expect(
          snapshot.orbitalRiskTargets.every(
            risk =>
              risk.highestOrbitalRiskIndex01 >=
                0 &&
              risk.highestOrbitalRiskIndex01 <=
                1 &&
              snapshot.orbits.some(
                orbit =>
                  orbit.id ===
                  risk.targetOrbitId,
              ),
          ),
        ).toBe(true);

        const minorMotionIds =
          new Set(
            snapshot.minorBodies.flatMap(
              body =>
                body.motionContributions.map(
                  contribution =>
                    contribution.motionId,
                ),
            ),
          );

        const minorMotions =
          snapshot.motions.filter(
            motion =>
              minorMotionIds.has(
                motion.id,
              ),
          );

        expect(
          minorMotions.length,
        ).toBeGreaterThan(
          0,
        );

        expect(
          minorMotions.every(
            motion =>
              motion.longitudeAscendingNodeDegrees !==
                undefined &&
              motion.argumentOfPeriapsisDegrees !==
                undefined,
          ),
        ).toBe(true);


        const expandedMinorBodies =
          snapshot.minorBodies.filter(
            body =>
              body.motionContributions.some(
                contribution =>
                  contribution.linearScenePerAu !==
                    undefined,
              ),
          );

        expect(
          expandedMinorBodies.length,
        ).toBeGreaterThan(
          0,
        );

        expect(
          expandedMinorBodies.every(
            body => {
              const localContribution =
                body.motionContributions[
                  body.motionContributions.length - 1
                ]!;

              const orbit =
                snapshot.orbits.find(
                  candidate =>
                    candidate.id ===
                    body.orbitId,
                );

              return orbit?.linearScenePerAu ===
                localContribution.linearScenePerAu;
            },
          ),
        ).toBe(true);
      },
      30_000,
    );
  },
);
