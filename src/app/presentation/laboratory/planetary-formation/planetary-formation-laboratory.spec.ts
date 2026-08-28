import {
  TestBed,
} from '@angular/core/testing';

import {
  provideRouter,
} from '@angular/router';

import {
  vi,
} from 'vitest';

import {
  PlanetaryFormationLaboratoryPage,
} from './planetary-formation-laboratory';

import {
  PlanetaryFormationLaboratoryFixtures,
  type PlanetaryFormationLaboratoryFrame,
} from './planetary-formation-laboratory-fixtures';

describe(
  'PlanetaryFormationLaboratoryPage',
  () => {
    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              PlanetaryFormationLaboratoryPage,
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

    afterEach(
      () => {
        vi.restoreAllMocks();
      },
    );

    it(
      'should expose laboratory 05 with eight lazy families and all seven phase-17 stages',
      () => {
        const fixture =
          TestBed.createComponent(
            PlanetaryFormationLaboratoryPage,
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="planetary-formation-laboratory-page"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelectorAll(
            '[data-testid="planetary-formation-family-button"]',
          ),
        ).toHaveLength(8);

        expect(
          element.querySelectorAll(
            '[data-testid="planetary-formation-stage-button"]',
          ),
        ).toHaveLength(0);

        expect(
          element.querySelector(
            '[data-testid="planetary-formation-laboratory-empty"]',
          )?.textContent,
        ).toContain(
          'Selecciona una familia A–H',
        );
      },
    );

    it(
      'should materialize one frame only after a family is selected and expose 17.1-17.7',
      () => {
        const frameSpy =
          vi.spyOn(
            PlanetaryFormationLaboratoryFixtures,
            'frame',
          ).mockReturnValue(
            fakeFrame(),
          );

        const fixture =
          TestBed.createComponent(
            PlanetaryFormationLaboratoryPage,
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-testid="planetary-formation-family-button"][data-family="A"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          frameSpy,
        ).toHaveBeenCalledWith(
          'A',
        );

        expect(
          element.querySelectorAll(
            '[data-testid="planetary-formation-stage-button"]',
          ),
        ).toHaveLength(7);

        expect(
          Array.from(
            element.querySelectorAll(
              '[data-testid="planetary-formation-stage-button"]',
            ),
          ).map(
            button =>
              button.getAttribute(
                'data-stage',
              ),
          ),
        ).toEqual([
          '17.1',
          '17.2',
          '17.3',
          '17.4',
          '17.5',
          '17.6',
          '17.7',
        ]);
      },
    );

    it(
      'should render point-17.7 anchors as formation anchors and freeze the phase-18 boundary',
      () => {
        vi.spyOn(
          PlanetaryFormationLaboratoryFixtures,
          'frame',
        ).mockReturnValue(
          fakeFrame(),
        );

        const fixture =
          TestBed.createComponent(
            PlanetaryFormationLaboratoryPage,
          );

        const component =
          fixture.componentInstance;

        component.selectFamily(
          'A',
        );

        component.selectStage(
          '17.7',
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="planetary-formation-blueprint-readout"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelectorAll(
            '[data-testid="planetary-formation-anchor"]',
          ),
        ).toHaveLength(1);

        expect(
          element.textContent,
        ).toContain(
          'ANCLAS · NO PLANETAS',
        );

        const boundary =
          element.querySelector(
            '[data-testid="planetary-formation-phase-boundary"]',
          );

        expect(
          boundary?.textContent,
        ).toContain(
          'PlanetarySystemFormationBlueprint',
        );

        expect(
          boundary?.textContent,
        ).toContain(
          'eccentricity',
        );

        expect(
          boundary?.textContent,
        ).toContain(
          'todavía no existen planetas maduros',
        );
      },
    );

    it(
      'should label candidates and keep card-to-diagram lineage selection synchronized',
      () => {
        vi.spyOn(
          PlanetaryFormationLaboratoryFixtures,
          'frame',
        ).mockReturnValue(
          fakeFrame(),
        );

        const fixture =
          TestBed.createComponent(
            PlanetaryFormationLaboratoryPage,
          );

        const component =
          fixture.componentInstance;

        component.selectFamily(
          'A',
        );

        component.selectStage(
          '17.4',
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        const card =
          element.querySelector<HTMLButtonElement>(
            '[data-testid="planetary-formation-candidate-card"][data-lineage="1"]',
          );

        expect(
          element.querySelector(
            '[data-testid="planetary-formation-candidate-marker"]',
          )?.textContent,
        ).toContain(
          '#1',
        );

        card?.click();
        fixture.detectChanges();

        expect(
          card?.classList.contains(
            'formation-lab__list-item--selected',
          ),
        ).toBe(
          true,
        );

        expect(
          element.querySelector(
            '[data-testid="planetary-formation-candidate-marker"]',
          )?.classList.contains(
            'formation-lab__subject--selected',
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      'should render an explicit migration trajectory, translate NONE, and expose the point-17.6 scientific overlay',
      () => {
        vi.spyOn(
          PlanetaryFormationLaboratoryFixtures,
          'frame',
        ).mockReturnValue(
          fakeFrame(),
        );

        const fixture =
          TestBed.createComponent(
            PlanetaryFormationLaboratoryPage,
          );

        const component =
          fixture.componentInstance;

        component.selectFamily(
          'A',
        );
        component.selectStage(
          '17.5',
        );
        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '.formation-lab__migration-origin',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '.formation-lab__migration',
          )?.getAttribute(
            'marker-end',
          ),
        ).toBe(
          'url(#phase17-migration-arrow)',
        );

        expect(
          component.migrationDirectionLabel(
            'NONE',
          ),
        ).toBe(
          'SIN MIGRACIÓN',
        );

        component.selectStage(
          '17.6',
        );
        fixture.detectChanges();

        expect(
          element.querySelector(
            '[data-testid="planetary-formation-analysis-overlay"]',
          )?.textContent,
        ).toContain(
          'MISMO SNAPSHOT',
        );
      },
    );

    it(
      'should identify condensation regions and the H2O snow line directly on point 17.3',
      () => {
        vi.spyOn(
          PlanetaryFormationLaboratoryFixtures,
          'frame',
        ).mockReturnValue(
          fakeFrame(),
        );

        const fixture =
          TestBed.createComponent(
            PlanetaryFormationLaboratoryPage,
          );

        const component =
          fixture.componentInstance;

        component.selectFamily(
          'A',
        );
        component.selectStage(
          '17.3',
        );
        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '.formation-lab__radial-code',
          )?.textContent,
        ).toContain(
          'R1',
        );

        expect(
          element.querySelector(
            '.formation-lab__snow-line-label',
          )?.textContent,
        ).toContain(
          'H₂O',
        );
      },
    );

    it(
      'should keep the star prominent in 17.1 and reduce it once the disk becomes the visual subject',
      () => {
        const fixture =
          TestBed.createComponent(
            PlanetaryFormationLaboratoryPage,
          );

        const component =
          fixture.componentInstance;

        component.selectStage(
          '17.1',
        );

        const stellarRadius =
          component.starVisualRadius(
            1.8,
          );

        component.selectStage(
          '17.2',
        );

        const diskRadius =
          component.starVisualRadius(
            1.8,
          );

        expect(
          diskRadius,
        ).toBeLessThan(
          stellarRadius,
        );
      },
    );

    it(
      'should render participant convergence for a real V1 perfect-merger visual',
      () => {
        vi.spyOn(
          PlanetaryFormationLaboratoryFixtures,
          'frame',
        ).mockReturnValue(
          fakeFusionFrame(),
        );

        const fixture =
          TestBed.createComponent(
            PlanetaryFormationLaboratoryPage,
          );

        const component =
          fixture.componentInstance;

        component.selectFamily(
          'A',
        );
        component.selectStage(
          '17.5',
        );
        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelectorAll(
            '.formation-lab__fusion-connector',
          ),
        ).toHaveLength(
          2,
        );

        expect(
          element.querySelector(
            '[data-testid="planetary-formation-fusion-visual"]',
          )?.textContent,
        ).toContain(
          'FUSIÓN 1',
        );

        expect(
          element.querySelector(
            '[data-testid="planetary-formation-fusion-card"]',
          )?.textContent,
        ).toContain(
          'linaje [1, 2]',
        );
      },
    );
  },
);

function fakeFrame():
  PlanetaryFormationLaboratoryFrame {

  const rocky =
    {
      name:
        'ROCKY',
    };

  return {
    family: {
      id:
        'A',
      label:
        'Familia A',
      formationMatchOrdinal:
        0,
    },
    locator: {
      galaxyIndex:
        0n,
      sectorKey:
        0n,
      galacticObjectIndex:
        42n,
    },
    snapshot: {
      systemSeed: {
        normalizedValue:
          '00112233445566778899AABBCCDDEEFF',
      },
      stellarPhysicalProperties: {
        initialMassSolar:
          1,
      },
      stellarYouthProfile: {
        stage: {
          name:
            'PRE_MAIN_SEQUENCE',
        },
        ageMillionYears:
          1.2,
        stageProgress01:
          0.4,
        referenceRadiusMultiplier:
          1.6,
        referenceLuminosityMultiplier:
          1.4,
        accretionActivityIndex:
          0.3,
      },
      diskProfile: {
        stage: {
          name:
            'MASSIVE_PRIMORDIAL_DISK',
        },
        ageMillionYears:
          1.2,
        diskMassSolar:
          0.05,
        diskToCentralMassRatio:
          0.05,
        innerRadiusAu:
          0.08,
        characteristicRadiusAu:
          30,
        outerRadiusAu:
          120,
        evolutionProgress01:
          0.2,
      },
      diskStructure: {
        gasMassFraction01:
          0.98,
        dustMassFraction01:
          0.02,
        gasDepletionIndex01:
          0.1,
        dustSettlingIndex01:
          0.25,
        gaps: [
          {
            kind: {
              name:
                'VISCOSITY_TRANSITION_GAP',
            },
            innerRadiusAu:
              8,
            outerRadiusAu:
              10,
          },
        ],
        condensationRegions: [
          {
            kind: {
              name:
                'ROCKY_SILICATE_SOLIDS',
            },
            innerRadiusAu:
              0.08,
            outerRadiusAu:
              12,
          },
        ],
        waterSnowLineRadiusAuOrNull:
          3.1,
      },
      candidatePopulation: {
        candidates: [
          {
            formationOrdinal:
              1,
            orbitalRadiusAu:
              2.2,
            solidMassEarth:
              0.8,
            composition:
              rocky,
            growthPotential01:
              0.7,
            gasAccretionPotential01:
              0.25,
          },
        ],
        candidateSolidMassEarth:
          0.8,
        residualDustMassEarth:
          1.2,
        dustConversionFraction01:
          0.4,
      },
      earlyDynamics: {
        sourceCandidateCount:
          1,
        survivorCount:
          1,
        migratedBodyCount:
          1,
        collisionCount:
          0,
        collisions: [],
        bodies: [
          {
            sourceFormationOrdinals: [
              1,
            ],
            formationMassWeightedRadiusAu:
              2.2,
            orbitalRadiusAu:
              1.9,
            solidMassEarth:
              0.8,
            compositionMixture: {
              dominantComposition:
                rocky,
            },
            hasMigrated:
              true,
            migrationDirection:
              'INWARD',
            migrationStrength01:
              0.2,
            collisionCount:
              0,
          },
        ],
      },
    },
    analysis: {
      stellarYouthStage: {
        name:
          'PRE_MAIN_SEQUENCE',
      },
      diskStage: {
        name:
          'MASSIVE_PRIMORDIAL_DISK',
      },
      gapCount:
        1,
      condensationRegionCount:
        1,
      initialCandidateCount:
        1,
      survivingBodyCount:
        1,
      migratedBodyCount:
        1,
      collisionCount:
        0,
    },
    blueprint: {
      regime:
        'SOLID_CORE_SYSTEM',
      formationCompletionAgeMillionYears:
        28,
      maxGasCaptureBudgetEarth:
        5,
      residualDustMassEarth:
        1.2,
      formationAnchors: [
        {
          anchorOrdinal:
            1,
          sourceFormationOrdinals: [
            1,
          ],
          assemblyRadiusAu:
            1.9,
          solidCoreMassEarth:
            0.8,
          compositionMixture: {
            dominantComposition:
              rocky,
          },
          consolidationIndex01:
            0.78,
          envelopeAcquisitionPotential01:
            0.2,
          volatileRetentionPotential01:
            0.25,
          dynamicalExcitationIndex01:
            0.15,
          collisionCount:
            0,
        },
      ],
    },
  } as unknown as
    PlanetaryFormationLaboratoryFrame;
}


function fakeFusionFrame():
  PlanetaryFormationLaboratoryFrame {

  const base =
    fakeFrame();

  const rocky =
    {
      name:
        'ROCKY',
    };

  return {
    ...base,
    snapshot: {
      ...base.snapshot,
      candidatePopulation: {
        ...base.snapshot.candidatePopulation,
        candidates: [
          {
            formationOrdinal: 1,
            orbitalRadiusAu: 2.2,
            solidMassEarth: 0.8,
            composition: rocky,
            growthPotential01: 0.7,
            gasAccretionPotential01: 0.25,
          },
          {
            formationOrdinal: 2,
            orbitalRadiusAu: 2.8,
            solidMassEarth: 0.6,
            composition: rocky,
            growthPotential01: 0.6,
            gasAccretionPotential01: 0.2,
          },
        ],
      },
      earlyDynamics: {
        sourceCandidateCount: 2,
        survivorCount: 1,
        migratedBodyCount: 0,
        collisionCount: 1,
        collisions: [
          {
            eventOrdinal: 1,
            participantSourceFormationOrdinals: [
              1,
              2,
            ],
            orbitalRadiusAu: 2.5,
            combinedSolidMassEarth: 1.4,
            impactSeverity01: 0.45,
          },
        ],
        bodies: [
          {
            sourceFormationOrdinals: [
              1,
              2,
            ],
            formationMassWeightedRadiusAu: 2.46,
            orbitalRadiusAu: 2.46,
            solidMassEarth: 1.4,
            compositionMixture: {
              dominantComposition: rocky,
            },
            hasMigrated: false,
            migrationDirection: 'NONE',
            migrationStrength01: 0,
            collisionCount: 1,
          },
        ],
      },
    },
  } as unknown as
    PlanetaryFormationLaboratoryFrame;
}
