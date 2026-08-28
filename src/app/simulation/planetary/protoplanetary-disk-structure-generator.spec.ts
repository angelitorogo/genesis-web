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
  ProtoplanetaryCondensationRegionKind,
} from '../../domain/planetary/protoplanetary-condensation-region-kind';

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
  SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ProtoplanetaryDiskStructureGenerator,
} from './protoplanetary-disk-structure-generator';

describe(
  'ProtoplanetaryDiskStructureGenerator point 17.3',
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
      'should partition the frozen bulk disk exactly into a gas-dominated gas+dust reservoir',
      () => {
        const disk =
          diskProfile(
            ProtoplanetaryDiskStage.EVOLVING_PRIMORDIAL_DISK,
            0.5,
            300,
          );

        const structure =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              formationProfile(
                0.55,
              ),
            );

        expect(
          structure.gasMassSolar +
            structure.dustMassSolar,
        ).toBeCloseTo(
          disk.diskMassSolar,
          14,
        );

        expect(
          structure.gasMassFraction01 +
            structure.dustMassFraction01,
        ).toBeCloseTo(
          1,
          14,
        );

        expect(
          structure.isGasDominated,
        ).toBe(true);

        expect(
          structure.dustToGasMassRatio,
        ).toBeGreaterThan(
          0,
        );
      },
    );

    it(
      'should place more of the same frozen bulk disk into dust at higher metallicity/solid-material index',
      () => {
        const disk =
          diskProfile(
            ProtoplanetaryDiskStage.MASSIVE_PRIMORDIAL_DISK,
            0.2,
            300,
          );

        const poor =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              formationProfile(
                0.10,
              ),
            );

        const rich =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              formationProfile(
                0.95,
              ),
            );

        expect(
          rich.dustMassFraction01,
        ).toBeGreaterThan(
          poor.dustMassFraction01,
        );

        expect(
          rich.dustMassSolar,
        ).toBeGreaterThan(
          poor.dustMassSolar,
        );
      },
    );

    it(
      'should tile the complete radial disk with monotonically cooling condensation regions',
      () => {
        const disk =
          diskProfile(
            ProtoplanetaryDiskStage.EVOLVING_PRIMORDIAL_DISK,
            0.5,
            320,
          );

        const structure =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              formationProfile(
                0.6,
              ),
            );

        expect(
          structure.condensationRegions[0]
            .innerRadiusAu,
        ).toBeCloseTo(
          disk.innerRadiusAu,
          14,
        );

        expect(
          structure.condensationRegions[
            structure.condensationRegions.length -
              1
          ].outerRadiusAu,
        ).toBeCloseTo(
          disk.outerRadiusAu,
          14,
        );

        for (
          let index = 1;
          index <
            structure.condensationRegions.length;
          index += 1
        ) {
          const previous =
            structure.condensationRegions[
              index -
              1
            ];

          const current =
            structure.condensationRegions[
              index
            ];

          expect(
            current.innerRadiusAu,
          ).toBeCloseTo(
            previous.outerRadiusAu,
            12,
          );

          expect(
            current.innerEdgeTemperatureKelvin,
          ).toBeLessThanOrEqual(
            previous.innerEdgeTemperatureKelvin,
          );
        }

        expect(
          structure.condensationRegions.some(
            region =>
              region.kind ===
              ProtoplanetaryCondensationRegionKind.WATER_ICE_RICH_SOLIDS,
          ),
        ).toBe(true);
      },
    );

    it(
      'should move the water snow line outward when the same disk geometry is hotter',
      () => {
        const cooler =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              diskProfile(
                ProtoplanetaryDiskStage.EVOLVING_PRIMORDIAL_DISK,
                0.5,
                220,
              ),
              formationProfile(
                0.6,
              ),
            );

        const hotter =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              diskProfile(
                ProtoplanetaryDiskStage.EVOLVING_PRIMORDIAL_DISK,
                0.5,
                520,
              ),
              formationProfile(
                0.6,
              ),
            );

        expect(
          cooler.waterSnowLineRadiusAuOrNull,
        ).not.toBeNull();

        expect(
          hotter.waterSnowLineRadiusAuOrNull,
        ).not.toBeNull();

        expect(
          hotter.waterSnowLineRadiusAuOrNull!,
        ).toBeGreaterThan(
          cooler.waterSnowLineRadiusAuOrNull!,
        );
      },
    );

    it(
      'should create only non-overlapping gaps inside the frozen disk envelope and never attribute them to a protoplanet',
      () => {
        const disk =
          diskProfile(
            ProtoplanetaryDiskStage.EVOLVING_PRIMORDIAL_DISK,
            0.6,
            300,
          );

        const structure =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              formationProfile(
                0.7,
              ),
            );

        for (
          let index = 0;
          index <
            structure.gaps.length;
          index += 1
        ) {
          const gap =
            structure.gaps[
              index
            ];

          expect(
            gap.innerRadiusAu,
          ).toBeGreaterThanOrEqual(
            disk.innerRadiusAu,
          );

          expect(
            gap.outerRadiusAu,
          ).toBeLessThanOrEqual(
            disk.outerRadiusAu,
          );

          if (
            index >
            0
          ) {
            expect(
              gap.innerRadiusAu,
            ).toBeGreaterThanOrEqual(
              structure.gaps[
                index -
                1
              ].outerRadiusAu,
            );
          }

          expect(
            ProtoplanetaryDiskGapKind.values,
          ).toContain(
            gap.kind,
          );
        }
      },
    );

    it(
      'should introduce a deep photoevaporative gap during the dispersing stage',
      () => {
        const structure =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              diskProfile(
                ProtoplanetaryDiskStage.DISPERSING_DISK,
                0.9,
                260,
              ),
              formationProfile(
                0.6,
              ),
            );

        const photoGap =
          structure.gaps
            .find(
              gap =>
                gap.kind ===
                ProtoplanetaryDiskGapKind.PHOTOEVAPORATIVE_GAP,
            );

        expect(
          photoGap,
        ).toBeDefined();

        expect(
          photoGap!
            .gasDepletionFraction01,
        ).toBeGreaterThan(
          0.8,
        );
      },
    );

    it(
      'should remain deterministic for the same SystemSeed while isolated seed branches can vary gap morphology',
      () => {
        const disk =
          diskProfile(
            ProtoplanetaryDiskStage.EVOLVING_PRIMORDIAL_DISK,
            0.6,
            300,
          );

        const formation =
          formationProfile(
            0.65,
          );

        const first =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              formation,
            );

        const second =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              canonicalSystemSeed,
              disk,
              formation,
            );

        const anotherSystem =
          ProtoplanetaryDiskStructureGenerator
            .generate(
              generationKey,
              new SystemSeed(
                '0123456789ABCDEFFEDCBA9876543210',
              ),
              disk,
              formation,
            );

        expect(
          second,
        ).toEqual(
          first,
        );

        expect(
          JSON.stringify(
            anotherSystem.gaps,
          ),
        ).not.toBe(
          JSON.stringify(
            first.gaps,
          ),
        );

        expect(
          anotherSystem.sourceDiskMassSolar,
        ).toBe(
          first.sourceDiskMassSolar,
        );
      },
    );
  },
);

function diskProfile(
  stage:
    ProtoplanetaryDiskStage,

  progress:
    number,

  temperatureAt1AuKelvin:
    number,
): ProtoplanetaryDiskProfile {

  const dispersalAgeMillionYears =
    6;

  const ageMillionYears =
    progress *
    dispersalAgeMillionYears;

  const diskMassSolar =
    0.06 *
    (
      1 -
      0.75 *
        progress
    );

  return new ProtoplanetaryDiskProfile(
    stage,
    ageMillionYears,
    dispersalAgeMillionYears,
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

function formationProfile(
  solidMaterialIndex:
    number,
): PlanetFormationProfile {

  return new PlanetFormationProfile(
    0.1 +
      2.0 *
        solidMaterialIndex,
    solidMaterialIndex,
    0.5 +
      0.4 *
        solidMaterialIndex,
    0.6 +
      0.3 *
        solidMaterialIndex,
    0.2 +
      0.7 *
        solidMaterialIndex,
    0.05 +
      0.8 *
        solidMaterialIndex,
    solidMaterialIndex <
      0.25
      ? PlanetFormationRegime.SOLID_LIMITED
      : solidMaterialIndex <
          0.55
        ? PlanetFormationRegime.ROCKY_FAVORED
        : solidMaterialIndex <
            0.80
          ? PlanetFormationRegime.MIXED
          : PlanetFormationRegime.GIANT_ENHANCED,
  );
}
