import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  PlanetFormationProfile,
  PlanetFormationRegime,
} from '../../domain/planetary/planet-formation-profile';

import {
  PlanetaryFormationMaturityRegime,
} from '../../domain/planetary/planetary-formation-maturity-regime';

import {
  ProtoplanetCandidate,
} from '../../domain/planetary/protoplanet-candidate';

import {
  ProtoplanetCandidateComposition,
} from '../../domain/planetary/protoplanet-candidate-composition';

import {
  ProtoplanetCandidatePopulation,
} from '../../domain/planetary/protoplanet-candidate-population';

import {
  ProtoplanetaryCondensationRegion,
} from '../../domain/planetary/protoplanetary-condensation-region';

import {
  ProtoplanetaryCondensationRegionKind,
} from '../../domain/planetary/protoplanetary-condensation-region-kind';

import {
  ProtoplanetaryDiskProfile,
} from '../../domain/planetary/protoplanetary-disk-profile';

import {
  ProtoplanetaryDiskStage,
} from '../../domain/planetary/protoplanetary-disk-stage';

import {
  ProtoplanetaryDiskStructure,
} from '../../domain/planetary/protoplanetary-disk-structure';

import {
  SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  EarlyPlanetaryDynamicsGenerator,
} from './early-planetary-dynamics-generator';

import {
  PlanetaryFormationMaturationGenerator,
} from './planetary-formation-maturation-generator';

const SOLAR_MASS_IN_EARTH_MASSES =
  332_946.0487;

describe(
  'PlanetaryFormationMaturationGenerator point 17.7',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const systemSeed =
      new SystemSeed(
        'DC2EACC73FFB3E9388F8BEB9FEBE1F2E',
      );

    it(
      'should deterministically mature the frozen 17.2-17.5 chain into a phase-18 formation blueprint',
      () => {
        const input =
          formationInput(
            systemSeed,
          );

        const first =
          PlanetaryFormationMaturationGenerator
            .generate(
              generationKey,
              systemSeed,
              input.disk,
              input.structure,
              input.formationProfile,
              input.population,
              input.earlyDynamics,
            );

        const second =
          PlanetaryFormationMaturationGenerator
            .generate(
              generationKey,
              systemSeed,
              input.disk,
              input.structure,
              input.formationProfile,
              input.population,
              input.earlyDynamics,
            );

        expect(
          second,
        ).toEqual(
          first,
        );

        expect(
          first.anchorCount,
        ).toBe(
          input.earlyDynamics
            .survivorCount,
        );

        expect(
          first.sourceCandidateSolidMassEarth,
        ).toBeCloseTo(
          input.earlyDynamics
            .survivingSolidMassEarth,
          12,
        );

        expect(
          first.formationCompletionAgeMillionYears,
        ).toBeGreaterThanOrEqual(
          input.disk
            .dispersalAgeMillionYears,
        );
      },
    );

    it(
      'should preserve every 17.5 survivor lineage and assembly radius without inventing mature orbital elements',
      () => {
        const input =
          formationInput(
            systemSeed,
          );

        const blueprint =
          PlanetaryFormationMaturationGenerator
            .generate(
              generationKey,
              systemSeed,
              input.disk,
              input.structure,
              input.formationProfile,
              input.population,
              input.earlyDynamics,
            );

        expect(
          blueprint
            .formationAnchors
            .map(
              anchor =>
                anchor
                  .sourceFormationOrdinals,
            ),
        ).toEqual(
          input.earlyDynamics
            .bodies
            .map(
              body =>
                body
                  .sourceFormationOrdinals,
            ),
        );

        expect(
          blueprint
            .formationAnchors
            .map(
              anchor =>
                anchor
                  .assemblyRadiusAu,
            ),
        ).toEqual(
          input.earlyDynamics
            .bodies
            .map(
              body =>
                body
                  .orbitalRadiusAu,
            ),
        );

        for (
          const anchor
          of blueprint
            .formationAnchors
        ) {
          expect(
            'eccentricity' in anchor,
          ).toBe(false);

          expect(
            'inclination' in anchor,
          ).toBe(false);

          expect(
            'orbitalPeriodDays' in anchor,
          ).toBe(false);

          expect(
            'planetType' in anchor,
          ).toBe(false);

          expect(
            'radiusEarth' in anchor,
          ).toBe(false);
        }
      },
    );

    it(
      'should expose only a bounded gas-capture budget and never accrete final planet gas mass in point 17.7',
      () => {
        const input =
          formationInput(
            systemSeed,
          );

        const blueprint =
          PlanetaryFormationMaturationGenerator
            .generate(
              generationKey,
              systemSeed,
              input.disk,
              input.structure,
              input.formationProfile,
              input.population,
              input.earlyDynamics,
            );

        expect(
          blueprint.maxGasCaptureBudgetEarth,
        ).toBeGreaterThanOrEqual(0);

        expect(
          blueprint.maxGasCaptureBudgetEarth,
        ).toBeLessThanOrEqual(
          blueprint.sourceGasMassEarth,
        );

        expect(
          'planetGasMassEarth' in blueprint,
        ).toBe(false);

        expect(
          blueprint
            .formationAnchors
            .some(
              anchor =>
                anchor
                  .envelopeAcquisitionPotential01 >
                0,
            ),
        ).toBe(true);
      },
    );

    it(
      'should preserve an empty formation history as a mature no-core blueprint',
      () => {
        const disk =
          diskProfile();

        const structure =
          diskStructure(
            disk,
          );

        const population =
          new ProtoplanetCandidatePopulation(
            disk.innerRadiusAu,
            disk.outerRadiusAu,
            structure.dustMassSolar *
              SOLAR_MASS_IN_EARTH_MASSES,
            0,
            structure.dustMassSolar *
              SOLAR_MASS_IN_EARTH_MASSES,
            0,
            [],
          );

        const earlyDynamics =
          EarlyPlanetaryDynamicsGenerator
            .generate(
              generationKey,
              systemSeed,
              disk,
              structure,
              population,
            );

        const blueprint =
          PlanetaryFormationMaturationGenerator
            .generate(
              generationKey,
              systemSeed,
              disk,
              structure,
              planetFormationProfile(),
              population,
              earlyDynamics,
            );

        expect(
          blueprint.anchorCount,
        ).toBe(0);

        expect(
          blueprint.regime,
        ).toBe(
          PlanetaryFormationMaturityRegime.NO_PLANET_FORMING_CORES,
        );

        expect(
          blueprint.maxGasCaptureBudgetEarth,
        ).toBe(0);

        expect(
          blueprint.formationCompletionAgeMillionYears,
        ).toBe(
          disk.dispersalAgeMillionYears,
        );
      },
    );

    it(
      'should vary maturation descriptors with the isolated point-17.7 branch while remaining bounded',
      () => {
        const firstSeed =
          new SystemSeed(
            '00000000000000000000000000000011',
          );

        const secondSeed =
          new SystemSeed(
            '00000000000000000000000000000012',
          );

        const firstInput =
          formationInput(
            firstSeed,
          );

        const secondInput =
          formationInput(
            secondSeed,
          );

        const first =
          PlanetaryFormationMaturationGenerator
            .generate(
              generationKey,
              firstSeed,
              firstInput.disk,
              firstInput.structure,
              firstInput.formationProfile,
              firstInput.population,
              firstInput.earlyDynamics,
            );

        const second =
          PlanetaryFormationMaturationGenerator
            .generate(
              generationKey,
              secondSeed,
              secondInput.disk,
              secondInput.structure,
              secondInput.formationProfile,
              secondInput.population,
              secondInput.earlyDynamics,
            );

        const firstVector = [
          first.formationCompletionAgeMillionYears,
          ...first.formationAnchors.flatMap(
            anchor => [
              anchor.consolidationIndex01,
              anchor.envelopeAcquisitionPotential01,
              anchor.volatileRetentionPotential01,
              anchor.dynamicalExcitationIndex01,
            ],
          ),
        ];

        const secondVector = [
          second.formationCompletionAgeMillionYears,
          ...second.formationAnchors.flatMap(
            anchor => [
              anchor.consolidationIndex01,
              anchor.envelopeAcquisitionPotential01,
              anchor.volatileRetentionPotential01,
              anchor.dynamicalExcitationIndex01,
            ],
          ),
        ];

        expect(
          secondVector,
        ).not.toEqual(
          firstVector,
        );

        for (
          const blueprint
          of [
            first,
            second,
          ]
        ) {
          for (
            const anchor
            of blueprint
              .formationAnchors
          ) {
            expect(
              anchor.consolidationIndex01,
            ).toBeGreaterThanOrEqual(0);

            expect(
              anchor.consolidationIndex01,
            ).toBeLessThanOrEqual(1);

            expect(
              anchor.volatileRetentionPotential01,
            ).toBeGreaterThanOrEqual(0);

            expect(
              anchor.volatileRetentionPotential01,
            ).toBeLessThanOrEqual(1);
          }
        }
      },
    );

    it(
      'should reject a candidate population that does not belong to the supplied point-17.3 disk',
      () => {
        const input =
          formationInput(
            systemSeed,
          );

        const invalidPopulation =
          new ProtoplanetCandidatePopulation(
            input.disk.innerRadiusAu,
            input.disk.outerRadiusAu,
            input.population.sourceDustMassEarth +
              1,
            input.population.candidateSolidMassEarth,
            input.population.residualDustMassEarth +
              1,
            input.population.candidateSolidMassEarth /
              (
                input.population.sourceDustMassEarth +
                1
              ),
            input.population.candidates,
          );

        expect(
          () =>
            PlanetaryFormationMaturationGenerator
              .generate(
                generationKey,
                systemSeed,
                input.disk,
                input.structure,
                input.formationProfile,
                invalidPopulation,
                input.earlyDynamics,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function formationInput(
  systemSeed:
    SystemSeed,
): {
  readonly disk:
    ProtoplanetaryDiskProfile;

  readonly structure:
    ProtoplanetaryDiskStructure;

  readonly formationProfile:
    PlanetFormationProfile;

  readonly population:
    ProtoplanetCandidatePopulation;

  readonly earlyDynamics:
    ReturnType<
      typeof EarlyPlanetaryDynamicsGenerator.generate
    >;
} {

  const generationKey =
    new UniverseGenerationKey(
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      ),
      GeneratorVersion.V1,
    );

  const disk =
    diskProfile();

  const structure =
    diskStructure(
      disk,
    );

  const population =
    candidatePopulation(
      disk,
      structure,
    );

  const earlyDynamics =
    EarlyPlanetaryDynamicsGenerator
      .generate(
        generationKey,
        systemSeed,
        disk,
        structure,
        population,
      );

  return {
    disk,
    structure,
    formationProfile:
      planetFormationProfile(),
    population,
    earlyDynamics,
  };
}

function diskProfile():
  ProtoplanetaryDiskProfile {

  return new ProtoplanetaryDiskProfile(
    ProtoplanetaryDiskStage.EVOLVING_PRIMORDIAL_DISK,
    3,
    6,
    0.5,
    1,
    0.05,
    0.05,
    0.1,
    30,
    100,
    280,
    1,
    0.05,
    1e-8,
  );
}

function diskStructure(
  disk:
    ProtoplanetaryDiskProfile,
): ProtoplanetaryDiskStructure {

  return new ProtoplanetaryDiskStructure(
    disk.diskMassSolar,
    disk.innerRadiusAu,
    disk.outerRadiusAu,
    0.049,
    0.001,
    0.98,
    0.02,
    0.001 /
      0.049,
    0.05,
    0.75,
    0.5,
    [],
    [
      new ProtoplanetaryCondensationRegion(
        ProtoplanetaryCondensationRegionKind.ROCKY_SILICATE_SOLIDS,
        disk.innerRadiusAu,
        1.08,
        1200,
        170,
      ),
      new ProtoplanetaryCondensationRegion(
        ProtoplanetaryCondensationRegionKind.WATER_ICE_RICH_SOLIDS,
        1.08,
        disk.outerRadiusAu,
        170,
        35,
      ),
    ],
  );
}

function planetFormationProfile():
  PlanetFormationProfile {

  return new PlanetFormationProfile(
    1,
    0.75,
    0.85,
    0.85,
    0.75,
    0.68,
    PlanetFormationRegime.GIANT_ENHANCED,
  );
}

function candidatePopulation(
  disk:
    ProtoplanetaryDiskProfile,

  structure:
    ProtoplanetaryDiskStructure,
): ProtoplanetCandidatePopulation {

  const candidates = [
    candidate(
      1,
      1,
      0.08,
      ProtoplanetCandidateComposition.ROCKY,
      0.12,
      0.04,
    ),
    candidate(
      2,
      1.16,
      6.5,
      ProtoplanetCandidateComposition.ICE_RICH,
      0.95,
      0.80,
    ),
    candidate(
      3,
      2.5,
      0.25,
      ProtoplanetCandidateComposition.ICE_RICH,
      0.30,
      0.20,
    ),
    candidate(
      4,
      2.9,
      7.5,
      ProtoplanetCandidateComposition.ICE_RICH,
      0.98,
      0.88,
    ),
    candidate(
      5,
      7,
      1.2,
      ProtoplanetCandidateComposition.VOLATILE_RICH,
      0.70,
      0.72,
    ),
  ];

  const candidateMassEarth =
    candidates.reduce(
      (
        sum,
        candidateValue,
      ) =>
        sum +
        candidateValue
          .solidMassEarth,
      0,
    );

  const sourceDustMassEarth =
    structure
      .dustMassSolar *
    SOLAR_MASS_IN_EARTH_MASSES;

  return new ProtoplanetCandidatePopulation(
    disk.innerRadiusAu,
    disk.outerRadiusAu,
    sourceDustMassEarth,
    candidateMassEarth,
    sourceDustMassEarth -
      candidateMassEarth,
    candidateMassEarth /
      sourceDustMassEarth,
    candidates,
  );
}

function candidate(
  ordinal:
    number,

  radiusAu:
    number,

  solidMassEarth:
    number,

  composition:
    ProtoplanetCandidateComposition,

  growthPotential01:
    number,

  gasAccretionPotential01:
    number,
): ProtoplanetCandidate {

  const regionKind =
    composition ===
      ProtoplanetCandidateComposition.ROCKY
      ? ProtoplanetaryCondensationRegionKind.ROCKY_SILICATE_SOLIDS
      : composition ===
          ProtoplanetCandidateComposition.ICE_RICH
        ? ProtoplanetaryCondensationRegionKind.WATER_ICE_RICH_SOLIDS
        : ProtoplanetaryCondensationRegionKind.VOLATILE_ICE_RICH_SOLIDS;

  return new ProtoplanetCandidate(
    ordinal,
    radiusAu,
    solidMassEarth,
    composition,
    regionKind,
    1,
    growthPotential01,
    gasAccretionPotential01,
  );
}
