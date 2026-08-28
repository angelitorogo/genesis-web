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
  ProtoplanetaryCondensationRegion,
} from '../../domain/planetary/protoplanetary-condensation-region';

import {
  ProtoplanetaryCondensationRegionKind,
} from '../../domain/planetary/protoplanetary-condensation-region-kind';

import {
  ProtoplanetaryDiskGap,
} from '../../domain/planetary/protoplanetary-disk-gap';

import {
  ProtoplanetaryDiskGapKind,
} from '../../domain/planetary/protoplanetary-disk-gap-kind';

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
  ProtoplanetCandidateComposition,
} from '../../domain/planetary/protoplanet-candidate-composition';

import {
  SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ProtoplanetCandidatePopulationGenerator,
} from './protoplanet-candidate-population-generator';

import {
  ProtoplanetaryDiskStructureGenerator,
} from './protoplanetary-disk-structure-generator';

describe(
  'ProtoplanetCandidatePopulationGenerator point 17.4',
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
      'should materialize a bounded deterministic population from the frozen 17.2/17.3 disk without consuming gas',
      () => {
        const disk =
          diskProfile(
            0.55,
          );

        const formation =
          richFormationProfile();

        const structure =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              formation,
            );

        const first =
          ProtoplanetCandidatePopulationGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              structure,
              formation,
            );

        const second =
          ProtoplanetCandidatePopulationGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              structure,
              formation,
            );

        expect(
          first.hasCandidates,
        ).toBe(true);

        expect(
          first.candidates.length,
        ).toBeGreaterThan(0);

        expect(
          first.candidates.length,
        ).toBeLessThanOrEqual(12);

        expect(
          second,
        ).toEqual(
          first,
        );

        expect(
          first.candidateSolidMassEarth +
            first.residualDustMassEarth,
        ).toBeCloseTo(
          first.sourceDustMassEarth,
          10,
        );

        expect(
          structure.gasMassSolar,
        ).toBeGreaterThan(0);
      },
    );

    it(
      'should keep every initial candidate inside the disk, radially separated and capped at a solid-core scale',
      () => {
        const disk =
          diskProfile(
            0.65,
          );

        const formation =
          richFormationProfile();

        const structure =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              formation,
            );

        const population =
          ProtoplanetCandidatePopulationGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              structure,
              formation,
            );

        for (
          let index = 0;
          index <
            population.candidates.length;
          index += 1
        ) {
          const candidate =
            population.candidates[
              index
            ];

          expect(
            candidate.orbitalRadiusAu,
          ).toBeGreaterThanOrEqual(
            disk.innerRadiusAu,
          );

          expect(
            candidate.orbitalRadiusAu,
          ).toBeLessThanOrEqual(
            disk.outerRadiusAu,
          );

          expect(
            candidate.solidMassEarth,
          ).toBeGreaterThanOrEqual(
            0.001,
          );

          expect(
            candidate.solidMassEarth,
          ).toBeLessThanOrEqual(
            12.5,
          );

          expect(
            candidate.growthPotential01,
          ).toBeGreaterThanOrEqual(0);

          expect(
            candidate.growthPotential01,
          ).toBeLessThanOrEqual(1);

          expect(
            candidate.gasAccretionPotential01,
          ).toBeGreaterThanOrEqual(0);

          expect(
            candidate.gasAccretionPotential01,
          ).toBeLessThanOrEqual(1);

          expect(
            'eccentricity' in candidate,
          ).toBe(false);

          expect(
            'migration' in candidate,
          ).toBe(false);

          if (
            index >
            0
          ) {
            expect(
              candidate.orbitalRadiusAu /
                population.candidates[
                  index -
                  1
                ].orbitalRadiusAu,
            ).toBeGreaterThanOrEqual(
              1.16 -
                1e-10,
            );
          }
        }
      },
    );

    it(
      'should inherit the broad solid composition from the point-17.3 condensation region and never form inside a dust-sublimation zone',
      () => {
        const disk =
          diskProfile(
            0.60,
            330,
          );

        const formation =
          richFormationProfile();

        const structure =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              formation,
            );

        const population =
          ProtoplanetCandidatePopulationGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              structure,
              formation,
            );

        expect(
          population.candidates.length,
        ).toBeGreaterThan(0);

        for (
          const candidate
          of population.candidates
        ) {
          expect(
            candidate.sourceCondensationRegionKind,
          ).not.toBe(
            ProtoplanetaryCondensationRegionKind.DUST_SUBLIMATION_ZONE,
          );

          expect(
            candidate.composition,
          ).toBe(
            expectedComposition(
              candidate.sourceCondensationRegionKind,
            ),
          );
        }
      },
    );

    it(
      'should suppress candidate sites inside a fully dust-depleted non-planetary gap',
      () => {
        const disk =
          customDiskProfile(
            0.60,
            0.1,
            100,
          );

        const structure =
          new ProtoplanetaryDiskStructure(
            disk.diskMassSolar,
            disk.innerRadiusAu,
            disk.outerRadiusAu,
            0.049,
            0.001,
            0.98,
            0.02,
            0.001 /
              0.049,
            0.3,
            0.7,
            0.5,
            [
              new ProtoplanetaryDiskGap(
                ProtoplanetaryDiskGapKind.VISCOSITY_TRANSITION_GAP,
                0.4,
                10,
                0.20,
                1,
              ),
            ],
            broadCondensationRegions(
              0.1,
              100,
            ),
          );

        const population =
          ProtoplanetCandidatePopulationGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              structure,
              richFormationProfile(),
            );

        expect(
          population.candidates.length,
        ).toBeGreaterThan(0);

        expect(
          population.candidates.some(
            candidate =>
              candidate.orbitalRadiusAu >=
                0.4 &&
              candidate.orbitalRadiusAu <=
                10,
          ),
        ).toBe(false);
      },
    );

    it(
      'should return no candidates when the complete source disk is too hot to retain condensed solids',
      () => {
        const disk =
          customDiskProfile(
            0.15,
            0.05,
            10,
          );

        const structure =
          new ProtoplanetaryDiskStructure(
            disk.diskMassSolar,
            disk.innerRadiusAu,
            disk.outerRadiusAu,
            0.049,
            0.001,
            0.98,
            0.02,
            0.001 /
              0.049,
            0.1,
            0.2,
            0.5,
            [],
            [
              new ProtoplanetaryCondensationRegion(
                ProtoplanetaryCondensationRegionKind.DUST_SUBLIMATION_ZONE,
                0.05,
                10,
                2_500,
                1_600,
              ),
            ],
          );

        const population =
          ProtoplanetCandidatePopulationGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              structure,
              richFormationProfile(),
            );

        expect(
          population.hasCandidates,
        ).toBe(false);

        expect(
          population.candidateSolidMassEarth,
        ).toBe(0);

        expect(
          population.residualDustMassEarth,
        ).toBeCloseTo(
          population.sourceDustMassEarth,
          12,
        );
      },
    );

    it(
      'should commit more solid mass into candidates as the same viable disk advances through formation',
      () => {
        const formation =
          richFormationProfile();

        const earlyDisk =
          diskProfile(
            0.20,
          );

        const lateDisk =
          diskProfile(
            0.70,
          );

        const earlyStructure =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              earlyDisk,
              formation,
            );

        const lateStructure =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              lateDisk,
              formation,
            );

        const early =
          ProtoplanetCandidatePopulationGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              earlyDisk,
              earlyStructure,
              formation,
            );

        const late =
          ProtoplanetCandidatePopulationGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              lateDisk,
              lateStructure,
              formation,
            );

        expect(
          late.dustConversionFraction01,
        ).toBeGreaterThanOrEqual(
          early.dustConversionFraction01,
        );
      },
    );

    it(
      'should respond to the frozen sector solid reservoir and planet-formation propensity',
      () => {
        const disk =
          diskProfile(
            0.60,
          );

        const poorFormation =
          new PlanetFormationProfile(
            0.08,
            0.08,
            0.40,
            0.60,
            0.16,
            0.03,
            PlanetFormationRegime.SOLID_LIMITED,
          );

        const richFormation =
          richFormationProfile();

        const poorStructure =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              poorFormation,
            );

        const richStructure =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              richFormation,
            );

        const poor =
          ProtoplanetCandidatePopulationGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              poorStructure,
              poorFormation,
            );

        const rich =
          ProtoplanetCandidatePopulationGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              richStructure,
              richFormation,
            );

        expect(
          rich.sourceDustMassEarth,
        ).toBeGreaterThan(
          poor.sourceDustMassEarth,
        );

        expect(
          rich.candidateSolidMassEarth,
        ).toBeGreaterThanOrEqual(
          poor.candidateSolidMassEarth,
        );
      },
    );

    it(
      'should isolate procedural candidate morphology by SystemSeed without changing the frozen source disk',
      () => {
        const disk =
          diskProfile(
            0.60,
          );

        const formation =
          richFormationProfile();

        const firstStructure =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              formation,
            );

        const secondSeed =
          new SystemSeed(
            '0123456789ABCDEFFEDCBA9876543210',
          );

        const secondStructure =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              secondSeed,
              disk,
              formation,
            );

        const first =
          ProtoplanetCandidatePopulationGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              firstStructure,
              formation,
            );

        const second =
          ProtoplanetCandidatePopulationGenerator
            .generate(
              generationKey,
              secondSeed,
              disk,
              secondStructure,
              formation,
            );

        expect(
          second.sourceDustMassEarth,
        ).toBeGreaterThan(0);

        expect(
          JSON.stringify(
            second.candidates,
          ),
        ).not.toBe(
          JSON.stringify(
            first.candidates,
          ),
        );
      },
    );

    it(
      'should reject a point-17.3 structure that does not belong to the supplied frozen point-17.2 disk envelope',
      () => {
        const disk =
          diskProfile(
            0.50,
          );

        const formation =
          richFormationProfile();

        const structure =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              formation,
            );

        const anotherDisk =
          customDiskProfile(
            0.50,
            0.08,
            160,
          );

        expect(
          () =>
            ProtoplanetCandidatePopulationGenerator
              .generate(
                generationKey,
                canonicalSystemSeed,
                anotherDisk,
                structure,
                formation,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function diskProfile(
  progress:
    number,

  temperatureAt1AuKelvin =
    300,
): ProtoplanetaryDiskProfile {

  const diskMassSolar =
    0.06 *
    (
      1 -
      0.75 *
        progress
    );

  return new ProtoplanetaryDiskProfile(
    progress <
      0.35
      ? ProtoplanetaryDiskStage.MASSIVE_PRIMORDIAL_DISK
      : progress <
          0.80
        ? ProtoplanetaryDiskStage.EVOLVING_PRIMORDIAL_DISK
        : ProtoplanetaryDiskStage.DISPERSING_DISK,
    progress *
      6,
    6,
    progress,
    1,
    diskMassSolar,
    diskMassSolar,
    0.05,
    30,
    120,
    temperatureAt1AuKelvin,
    0.9 +
      0.2 *
        progress,
    0.04,
    1e-8 *
      (
        1 -
        progress
      ),
  );
}

function customDiskProfile(
  progress:
    number,

  innerRadiusAu:
    number,

  outerRadiusAu:
    number,
): ProtoplanetaryDiskProfile {

  return new ProtoplanetaryDiskProfile(
    ProtoplanetaryDiskStage.EVOLVING_PRIMORDIAL_DISK,
    progress *
      6,
    6,
    progress,
    1,
    0.05,
    0.05,
    innerRadiusAu,
    Math.sqrt(
      innerRadiusAu *
      outerRadiusAu,
    ) *
      1.5,
    outerRadiusAu,
    300,
    1,
    0.04,
    5e-9,
  );
}

function richFormationProfile(): PlanetFormationProfile {

  return new PlanetFormationProfile(
    1.5,
    0.82,
    0.94,
    0.92,
    0.88,
    0.76,
    PlanetFormationRegime.GIANT_ENHANCED,
  );
}

function broadCondensationRegions(
  innerRadiusAu:
    number,

  outerRadiusAu:
    number,
): readonly ProtoplanetaryCondensationRegion[] {

  return [
    new ProtoplanetaryCondensationRegion(
      ProtoplanetaryCondensationRegionKind.ROCKY_SILICATE_SOLIDS,
      innerRadiusAu,
      0.8,
      650,
      220,
    ),
    new ProtoplanetaryCondensationRegion(
      ProtoplanetaryCondensationRegionKind.WATER_ICE_RICH_SOLIDS,
      0.8,
      12,
      170,
      60,
    ),
    new ProtoplanetaryCondensationRegion(
      ProtoplanetaryCondensationRegionKind.VOLATILE_ICE_RICH_SOLIDS,
      12,
      outerRadiusAu,
      25,
      10,
    ),
  ];
}

function expectedComposition(
  kind:
    ProtoplanetaryCondensationRegionKind,
): ProtoplanetCandidateComposition {

  if (
    kind ===
    ProtoplanetaryCondensationRegionKind.REFRACTORY_SOLIDS
  ) {
    return ProtoplanetCandidateComposition.REFRACTORY_RICH;
  }

  if (
    kind ===
    ProtoplanetaryCondensationRegionKind.ROCKY_SILICATE_SOLIDS
  ) {
    return ProtoplanetCandidateComposition.ROCKY;
  }

  if (
    kind ===
    ProtoplanetaryCondensationRegionKind.WATER_ICE_RICH_SOLIDS
  ) {
    return ProtoplanetCandidateComposition.ICE_RICH;
  }

  return ProtoplanetCandidateComposition.VOLATILE_RICH;
}
