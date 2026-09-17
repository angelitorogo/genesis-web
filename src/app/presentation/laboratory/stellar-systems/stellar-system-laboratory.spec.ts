import {
  TestBed,
} from '@angular/core/testing';

import {
  provideRouter,
} from '@angular/router';

import {
  systemSceneMoonPresentationTimeScale,
} from '../../system/system-scene-secondary-motion';

import {
  StellarSystemLaboratoryPage,
} from './stellar-system-laboratory';

import { StellarSystemLaboratoryFamilyId } from './stellar-system-laboratory-fixtures';
import { systemSceneBinarySeparationAu } from '../../system/system-scene-binary-separation';
import { type MultihostHabitableHostV244, type MultihostHabitablePlanetV244 } from '../../../domain/planetary/multihost-habitability-v244';

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

    it('should switch on experimental multihost QA without altering the stored V1 stage', () => {
      const fixture = TestBed.createComponent(StellarSystemLaboratoryPage);
      fixture.componentInstance.selectCase('BINARY');
      fixture.detectChanges();
      const baseline = fixture.componentInstance.rendererQaSnapshot();
      expect(baseline.experimentalMultihostCatalog).toBeUndefined();
      fixture.componentInstance.toggleExperimentalMultihost();
      fixture.detectChanges();
      const preview = fixture.componentInstance.rendererQaSnapshot();
      expect(preview.experimentalMultihostCatalog?.version).toBe('V2_EXPERIMENTAL');
      expect(preview.formedMultihostSystemV22?.version).toBe('V2_2_FORMATION_V1');
      expect(preview.formedMultihostSystemV22?.planets.every(planet =>
        planet.origin === 'V2_2_FORMED')).toBe(true);
      for (const planet of preview.planets.filter(planet => planet.multihostOrbitV221 !== undefined)) {
        expect(planet.orbitId).not.toBeNull();
        expect(preview.orbits.some(orbit => orbit.id === planet.orbitId)).toBe(true);
        expect(preview.motions.some(motion => motion.id === planet.multihostOrbitV221!.motionId)).toBe(true);
        expect(planet.multihostOrbitV221!.translationState).toBe('ACTIVE');
      }
      expect(preview.experimentalMultihostCatalog?.windows.map(window => window.hostId))
        .toEqual(['A', 'B', 'AB']);
      expect(preview.multihostLayoutV222?.version).toBe('V2_2_4_BINARY_LAYOUT_V1');
      expect(preview.multihostLayoutV222?.hostEnvelopes.map(envelope => envelope.hostId))
        .toEqual(['A', 'B']);
      expect(preview.planets.length).toBeGreaterThan(0);
      expect(preview.planets.length).toBeLessThanOrEqual(20);
      expect(preview.planets.every(planet =>
        planet.multihostOrbitV221?.hostId === 'A' ||
        planet.multihostOrbitV221?.hostId === 'B')).toBe(true);
      expect(preview.planets.filter(planet => planet.multihostOrbitV221 !== undefined).length)
        .toBe(fixture.componentInstance.renderedMultihostPlanetCount());
      // BINARY QA deliberately hides legacy barycentric V1 planets and moons;
      // leaving QA restores the original source without changing saved data.
      expect(preview.planets.some(planet =>
        baseline.planets.some(original => original.id === planet.id))).toBe(false);
      expect(preview.scientificMultihostMoonsV242?.version).toBe('V2_4_2_MOON_SCIENCE');
      expect(preview.moons.every(moon => moon.scientificV242 === true)).toBe(true);
      expect(preview.moons.filter(moon => moon.scientificV242 === true).length)
        .toBe(fixture.componentInstance.laboratoryMultihostMoonCount());
      expect(preview.minorBodies.every(body => body.scientificV243 && !body.previewOnlyV23)).toBe(true);
      expect(preview.asteroidBelts?.every(belt => belt.scientificV243 && !belt.previewOnlyV23)).toBe(true);
      expect(preview.habitableZone).toBeNull();
      expect(preview.layers.minorBodyCount).toBe(preview.minorBodies.length);
      expect(preview.layers.habitableZoneAvailable).toBe(true);
      expect(preview.multihostHabitableZonesV23?.map(zone => zone.hostId)).toEqual(['A', 'B']);
      expect(preview.scientificMultihostHabitabilityV244?.version)
        .toBe('V2_4_4_S_TYPE_HABITABILITY');
      expect(preview.scientificMultihostHabitabilityV244?.hosts.map((host: MultihostHabitableHostV244) => host.hostId))
        .toEqual(['A', 'B']);
      expect(preview.scientificMultihostHabitabilityV244?.planets.length)
        .toBe(preview.scientificMultihostPlanetsV241?.planets.length);
      expect(preview.scientificMultihostHabitabilityV244?.planets.every((planet: MultihostHabitablePlanetV244) =>
        planet.irradiance.status === 'BOUNDED')).toBe(true);
      expect(fixture.nativeElement.querySelector('[data-testid="multihost-v244-habitability"]'))
        .toBeTruthy();
      expect(fixture.nativeElement.querySelectorAll('[data-testid="multihost-v244-host"]'))
        .toHaveLength(2);
      expect(fixture.nativeElement.querySelectorAll('[data-testid="multihost-v244-planet-habitability"]'))
        .toHaveLength(preview.scientificMultihostPlanetsV241?.planets.length ?? 0);
      expect(fixture.nativeElement.querySelectorAll('[data-testid="multihost-v23-habitable-zone"]'))
        .toHaveLength(2);
      expect(preview.layers.moonCount).toBe(preview.moons.length);
      expect(preview.motions.length).toBeGreaterThanOrEqual(baseline.motions.length);
      expect(preview.motions.slice(0, baseline.motions.length))
        .toEqual(baseline.motions);
      expect(fixture.nativeElement.querySelector('[data-testid="multihost-v22-formed-system"]'))
        .toBeTruthy();
      expect(fixture.nativeElement.querySelectorAll('[data-testid="multihost-v22-disk"]'))
        .toHaveLength(2);
      expect(fixture.nativeElement.querySelector('[data-testid="multihost-v2-laboratory-catalog"]'))
        .toBeTruthy();
      expect(fixture.nativeElement.querySelector('[data-testid="multihost-v222-layout"]'))
        .toBeTruthy();
      expect(fixture.nativeElement.querySelectorAll('[data-testid="multihost-v222-envelope"]'))
        .toHaveLength(2);
      fixture.componentInstance.toggleExperimentalMultihost();
      fixture.detectChanges();
      expect(fixture.componentInstance.rendererQaSnapshot().experimentalMultihostCatalog)
        .toBeUndefined();
      expect(fixture.componentInstance.rendererQaSnapshot().formedMultihostSystemV22)
        .toBeUndefined();
      const restored = fixture.componentInstance.rendererQaSnapshot();
      expect(restored.planets.map(planet => planet.id))
        .toEqual(baseline.planets.map(planet => planet.id));
      expect(restored.moons.map(moon => moon.id))
        .toEqual(baseline.moons.map(moon => moon.id));
      expect(restored.minorBodies.map(body => body.id))
        .toEqual(baseline.minorBodies.map(body => body.id));
    }, 30_000);

    it('frames wide/compact real binary families differently while keeping A/B locally explorable', () => {
      const fixture = TestBed.createComponent(StellarSystemLaboratoryPage);
      const page = fixture.componentInstance;
      page.selectCase('BINARY');
      page.toggleExperimentalMultihost();
      const measure = (family: StellarSystemLaboratoryFamilyId) => {
        page.selectFamily(family);
        const snapshot = page.rendererQaSnapshot();
        const a = snapshot.stars.find(star => star.label === 'A')!;
        const b = snapshot.stars.find(star => star.label === 'B')!;
        const gap = Math.hypot(
          a.position.x - b.position.x,
          a.position.y - b.position.y,
          a.position.z - b.position.z,
        );
        const disk = snapshot.multihostLayoutV222!.hostEnvelopes
          .find(envelope => envelope.hostId === 'A')!;
        const camera = snapshot.laboratoryFrameRadiusSceneV224!;
        return {
          snapshot, a, b, gap, disk, camera,
          distanceAu: systemSceneBinarySeparationAu(snapshot, snapshot.simulation.epochSimulationDay)!,
        };
      };
      const close = measure(StellarSystemLaboratoryFamilyId.D);
      const wide = measure(StellarSystemLaboratoryFamilyId.F);
      expect(wide.distanceAu).toBeGreaterThan(close.distanceAu * 10);
      expect(wide.gap).toBeGreaterThan(close.gap * 1.45);
      expect(wide.gap / wide.disk.outerEnvelopeScene)
        .toBeGreaterThan(close.gap / close.disk.outerEnvelopeScene * 1.4);
      for (const sample of [close, wide]) {
        expect(sample.a.localSystemFocusRadiusScene)
          .toBeGreaterThan(sample.disk.outerEnvelopeScene);
        expect(sample.b.localSystemFocusRadiusScene).toBeGreaterThan(0);
        for (const star of [sample.a, sample.b]) {
          expect(sample.camera).toBeGreaterThan(
            Math.hypot(star.position.x, star.position.y, star.position.z) +
              star.localSystemFocusRadiusScene!,
          );
        }
        expect(sample.snapshot.planets.every(planet =>
          sample.snapshot.orbits.some(orbit => orbit.id === planet.orbitId))).toBe(true);
        expect(sample.snapshot.habitableZone).toBeNull();
      }
      expect(wide.camera).toBeGreaterThan(close.camera);
    }, 30_000);

    it('shows read-only V2.1 host domains and per-planet provenance for binary and triple QA', () => {
      const fixture = TestBed.createComponent(StellarSystemLaboratoryPage);
      const page = fixture.componentInstance;
      page.selectCase('BINARY');
      page.toggleExperimentalMultihost();
      fixture.detectChanges();
      const binary = page.orbitalDomainsV21();
      expect(binary?.version).toBe('V2_1_QA');
      expect(binary?.domains.map(domain => domain.host.id))
        .toEqual(['A', 'B', 'AB']);
      expect(binary?.assignments.filter(assignment =>
        assignment.origin === 'V1_FROZEN').length)
        .toBe(page.rendererQaSnapshot().planets.filter(planet =>
          !planet.id.startsWith('preview-') && !planet.id.startsWith('v22-')).length);
      expect(binary?.assignments.filter(assignment =>
        assignment.origin === 'V1_FROZEN').every(assignment =>
          assignment.stability === 'NOT_REASSESSED_V1')).toBe(true);
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('[data-testid="multihost-v21-diagnostics"]'))
        .toBeTruthy();
      expect(element.querySelectorAll('[data-testid="multihost-v21-host-domain"]'))
        .toHaveLength(2);
      expect(element.querySelector('[data-testid="multihost-v21-planet-assignments"]'))
        .toBeTruthy();
      expect(element.querySelector('[data-host="AB"]')).toBeNull();
      expect(element.textContent).toContain('SOLO S-A / S-B');
      page.selectCase('TRIPLE');
      fixture.detectChanges();
      expect(page.orbitalDomainsV21()?.domains.map(domain => domain.host.id))
        .toEqual(['A', 'B', 'AB', 'C', 'ABC']);
      expect(element.querySelectorAll('[data-testid="multihost-v21-host-domain"]'))
        .toHaveLength(5);
      page.toggleExperimentalMultihost();
      fixture.detectChanges();
      expect(page.orbitalDomainsV21()).toBeNull();
      expect(element.querySelector('[data-testid="multihost-v21-diagnostics"]'))
        .toBeNull();
    }, 30_000);

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

        for (
          const moon
          of snapshot.moons
        ) {
          const localContribution =
            moon.motionContributions[
              moon.motionContributions.length - 1
            ]!;

          const localMotion =
            snapshot.motions.find(
              motion =>
                motion.id ===
                localContribution.motionId,
            );

          expect(
            localMotion,
            `${moon.label} must retain its local physical moon motion`,
          ).toBeDefined();

          expect(
            localContribution.presentationTimeScale,
            `${moon.label} must use the point-24.6 cadence limiter for the current renderer playback rate`,
          ).toBeCloseTo(
            systemSceneMoonPresentationTimeScale(
              localMotion!.periodDays,
              snapshot.simulation.playbackDaysPerRealSecond,
            ),
            12,
          );
        }

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
