import {
  TestBed,
} from '@angular/core/testing';

import {
  provideRouter,
} from '@angular/router';

import {
  PlanetType,
} from '../../../domain/planetary/planet-type';

import {
  systemSceneMoonPresentationTimeScale,
} from '../../system/system-scene-secondary-motion';

import {
  StellarSystemLaboratoryPage,
} from './stellar-system-laboratory';

import {
  StellarSystemLaboratoryFamilyId,
} from './stellar-system-laboratory-fixtures';

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
      'should show all nine canonical planet types with exact totals for the selected real system',
      () => {
        const fixture =
          TestBed.createComponent(StellarSystemLaboratoryPage);

        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        const section = element.querySelector(
          '[data-testid="stellar-system-laboratory-planet-types"]',
        );
        const planets = fixture.componentInstance.rendererQaSnapshot().planets;
        const types = Object.values(PlanetType);
        const rows = Array.from(
          section?.querySelectorAll<HTMLElement>(
            '[data-testid="stellar-system-laboratory-planet-type"]',
          ) ?? [],
        );

        expect(section).toBeTruthy();
        expect(section?.textContent).toContain('Sistema simple');
        expect(section?.textContent).toContain('Familia A');
        expect(rows.map(row => row.dataset['type'])).toEqual(types);
        expect(planets.length).toBeGreaterThan(0);

        for (const type of types) {
          const row = rows.find(candidate => candidate.dataset['type'] === type);
          const expected = planets.filter(
            planet => planet.specialPresentation?.sourcePlanetType === type,
          ).length;

          expect(row?.textContent).toContain(String(expected));
          expect(fixture.componentInstance.planetTypeCounts()
            .find(entry => entry.type === type)?.count).toBe(expected);
        }

        expect(planets.every(
          planet => types.includes(
            planet.specialPresentation?.sourcePlanetType as PlanetType,
          ),
        )).toBe(true);
        expect(fixture.componentInstance.planetTypeCounts()
          .reduce((sum, entry) => sum + entry.count, 0)).toBe(planets.length);
        expect(section?.querySelector(
          '[data-testid="stellar-system-laboratory-planet-total"]',
        )?.textContent?.trim()).toBe(String(planets.length));
      },
      30_000,
    );

    it(
      'should refresh planetary counts when switching families and SINGLE/BINARY/TRIPLE without changing the renderer snapshot',
      () => {
        const fixture =
          TestBed.createComponent(StellarSystemLaboratoryPage);

        const checkSelectedSystem = (name: string, family: string): void => {
          fixture.detectChanges();

          const page = fixture.componentInstance;
          const element = fixture.nativeElement as HTMLElement;
          const section = element.querySelector(
            '[data-testid="stellar-system-laboratory-planet-types"]',
          );
          const planets = page.rendererQaSnapshot().planets;
          const rows = Array.from(
            section?.querySelectorAll<HTMLElement>(
              '[data-testid="stellar-system-laboratory-planet-type"]',
            ) ?? [],
          );

          expect(section?.textContent).toContain(name);
          expect(section?.textContent).toContain(`Familia ${family}`);
          expect(rows).toHaveLength(Object.values(PlanetType).length);
          expect(rows.reduce(
            (sum, row) => sum + Number(row.querySelector('strong')?.textContent),
            0,
          )).toBe(planets.length);
          expect(section?.querySelector(
            '[data-testid="stellar-system-laboratory-planet-total"]',
          )?.textContent?.trim()).toBe(String(planets.length));
          expect(element.querySelectorAll('app-system-scene')).toHaveLength(1);
        };

        const select = (testId: string, attribute: string, value: string): void => {
          const element = fixture.nativeElement as HTMLElement;
          const button = element.querySelector<HTMLButtonElement>(
            `[data-testid="${testId}"][data-${attribute}="${value}"]`,
          );

          expect(button).toBeTruthy();
          button!.click();
        };

        checkSelectedSystem('Sistema simple', 'A');
        select('stellar-system-laboratory-family-button', 'family', 'H');
        checkSelectedSystem('Sistema simple', 'H');
        select('stellar-system-laboratory-case-button', 'case', 'BINARY');
        checkSelectedSystem('Sistema binario', 'A');
        select('stellar-system-laboratory-case-button', 'case', 'TRIPLE');
        checkSelectedSystem('Sistema triple', 'A');
        select('stellar-system-laboratory-family-button', 'family', 'C');
        checkSelectedSystem('Sistema triple', 'C');
      },
      60_000,
    );

    it(
      'should generate BINARY from two complete SINGLE systems and use their fiches for the same render',
      () => {
        const fixture = TestBed.createComponent(StellarSystemLaboratoryPage);
        const page = fixture.componentInstance;
        fixture.detectChanges();
        const a = page.rendererQaSnapshot();
        page.selectFamily(StellarSystemLaboratoryFamilyId.B);
        fixture.detectChanges();
        const b = page.rendererQaSnapshot();
        page.selectCase('BINARY');
        fixture.detectChanges();
        const binary = page.rendererQaSnapshot();
        const frame = page.frame();
        const element = fixture.nativeElement as HTMLElement;
        expect(frame.sourceSystems?.map(source => source.family.id)).toEqual(['A', 'B']);
        expect(binary).toBe(page.rendererQaBaseSnapshot());
        expect(binary.stars.map(star => star.label)).toEqual(['A', 'B']);
        expect(binary.stars.map(star => star.id)).toEqual(['lab-a-' + a.stars[0]!.id, 'lab-b-' + b.stars[0]!.id]);
        expect(binary.stars.map(star => star.colorHex)).toEqual([a.stars[0]!.colorHex, b.stars[0]!.colorHex]);
        expect(frame.stages[2]?.card.components.map(component => component.colorHex))
          .toEqual(binary.stars.map(star => star.colorHex));
        for (const group of ['planets', 'moons', 'minorBodies'] as const) {
          expect(binary[group].map(body => body.id)).toEqual([
            ...a[group].map(body => `lab-a-${body.id}`),
            ...b[group].map(body => `lab-b-${body.id}`),
          ]);
        }
        expect(binary.habitableZones?.length).toBe(Number(a.habitableZone !== null) + Number(b.habitableZone !== null));
        expect(binary.habitableZones?.every(zone => zone.topology === 'CIRCUMSTELLAR')).toBe(true);
        expect(element.querySelector('[data-testid="stellar-system-laboratory-binary-composition-note"]')?.textContent)
          .toContain('GENERACIÓN BINARIA SOLO EN LABORATORIO');
        expect(element.querySelector('[data-testid="stellar-system-laboratory-binary-sources"]')?.textContent)
          .toContain('Sistema B: simple familia B');
        page.selectFamily(StellarSystemLaboratoryFamilyId.F);
        fixture.detectChanges();
        expect(page.frame().sourceSystems?.map(source => source.family.id)).toEqual(['F', 'G']);
        expect(page.rendererQaSnapshot()).toBe(page.rendererQaBaseSnapshot());
        page.selectCase('TRIPLE');
        fixture.detectChanges();
        expect(page.rendererQaSnapshot().stars).toHaveLength(3);
        expect(page.rendererQaSnapshot().habitableZones).toBeUndefined();
        expect(page.rendererQaSnapshot()).toBe(page.rendererQaBaseSnapshot());
      },
      90_000,
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
