import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

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

describe(
  'EarlyPlanetaryDynamicsGenerator point 17.5',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const canonicalSystemSeed =
      new SystemSeed(
        'DC2EACC73FFB3E9388F8BEB9FEBE1F2E',
      );

    it(
      'should deterministically migrate a frozen 17.4 population while conserving all solid mass',
      () => {
        const disk =
          diskProfile();

        const structure =
          diskStructure(
            disk,
          );

        const population =
          candidatePopulation();

        const first =
          EarlyPlanetaryDynamicsGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              structure,
              population,
            );

        const second =
          EarlyPlanetaryDynamicsGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              structure,
              population,
            );

        expect(
          second,
        ).toEqual(
          first,
        );

        expect(
          first.survivingSolidMassEarth,
        ).toBeCloseTo(
          population.candidateSolidMassEarth,
          12,
        );

        expect(
          first.survivorCount,
        ).toBeLessThanOrEqual(
          population.candidates.length,
        );

        expect(
          first.migratedBodyCount,
        ).toBeGreaterThan(0);
      },
    );

    it(
      'should resolve convergent early encounters as perfect-merger collisions with complete source lineage',
      () => {
        const disk =
          diskProfile();

        const structure =
          diskStructure(
            disk,
          );

        const outcome =
          EarlyPlanetaryDynamicsGenerator
            .generate(
              generationKey,
              new SystemSeed(
                '00000000000000000000000000000002',
              ),
              disk,
              structure,
              candidatePopulation(),
            );

        expect(
          outcome.collisionCount,
        ).toBeGreaterThan(0);

        expect(
          outcome.survivorCount +
            outcome.collisionCount,
        ).toBe(
          outcome.sourceCandidateCount,
        );

        const lineage =
          outcome.bodies
            .flatMap(
              body =>
                body.sourceFormationOrdinals,
            )
            .sort(
              (
                first,
                second,
              ) =>
                first -
                second,
            );

        expect(
          lineage,
        ).toEqual([
          1,
          2,
          3,
          4,
          5,
        ]);

        expect(
          outcome.bodies.some(
            body =>
              body.compositionMixture
                .rockyFraction01 >
                0 &&
              body.compositionMixture
                .iceRichFraction01 >
                0,
          ),
        ).toBe(true);
      },
    );

    it(
      'should keep survivors inside the disk and avoid introducing mature-orbit or gas-envelope state',
      () => {
        const disk =
          diskProfile();

        const outcome =
          EarlyPlanetaryDynamicsGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              diskStructure(
                disk,
              ),
              candidatePopulation(),
            );

        for (
          const body
          of outcome.bodies
        ) {
          expect(
            body.orbitalRadiusAu,
          ).toBeGreaterThanOrEqual(
            disk.innerRadiusAu,
          );

          expect(
            body.orbitalRadiusAu,
          ).toBeLessThanOrEqual(
            disk.outerRadiusAu,
          );

          expect(
            'eccentricity' in body,
          ).toBe(false);

          expect(
            'inclination' in body,
          ).toBe(false);

          expect(
            'gasEnvelopeMassEarth' in body,
          ).toBe(false);
        }
      },
    );

    it(
      'should preserve composition exactly when one source candidate survives without a collision',
      () => {
        const disk =
          diskProfile();

        const source =
          candidate(
            1,
            4,
            0.4,
            ProtoplanetCandidateComposition.VOLATILE_RICH,
            0.1,
            0.1,
          );

        const population =
          new ProtoplanetCandidatePopulation(
            disk.innerRadiusAu,
            disk.outerRadiusAu,
            10,
            0.4,
            9.6,
            0.04,
            [
              source,
            ],
          );

        const outcome =
          EarlyPlanetaryDynamicsGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              diskStructure(
                disk,
              ),
              population,
            );

        expect(
          outcome.collisionCount,
        ).toBe(0);

        expect(
          outcome.bodies,
        ).toHaveLength(1);

        expect(
          outcome.bodies[0]
            .compositionMixture
            .volatileRichFraction01,
        ).toBe(1);
      },
    );

    it(
      'should support a point-17.4 disk with no candidates',
      () => {
        const disk =
          diskProfile();

        const population =
          new ProtoplanetCandidatePopulation(
            disk.innerRadiusAu,
            disk.outerRadiusAu,
            10,
            0,
            10,
            0,
            [],
          );

        const outcome =
          EarlyPlanetaryDynamicsGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              diskStructure(
                disk,
              ),
              population,
            );

        expect(
          outcome.survivorCount,
        ).toBe(0);

        expect(
          outcome.collisionCount,
        ).toBe(0);
      },
    );
  },
);

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

function candidatePopulation():
  ProtoplanetCandidatePopulation {

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

  const mass =
    candidates.reduce(
      (
        sum,
        body,
      ) =>
        sum +
        body.solidMassEarth,
      0,
    );

  return new ProtoplanetCandidatePopulation(
    0.1,
    100,
    100,
    mass,
    100 -
      mass,
    mass /
      100,
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
