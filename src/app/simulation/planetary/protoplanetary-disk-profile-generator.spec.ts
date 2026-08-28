import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ProtoplanetaryDiskStage,
} from '../../domain/planetary/protoplanetary-disk-stage';

import {
  StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';

import {
  StellarYouthProfile,
} from '../../domain/stellar/stellar-youth-profile';

import {
  StellarYouthStage,
} from '../../domain/stellar/stellar-youth-stage';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ProtoplanetaryDiskProfileGenerator,
} from './protoplanetary-disk-profile-generator';

describe(
  'ProtoplanetaryDiskProfileGenerator point 17.2',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should evolve a solar-mass primordial disk through embedded, massive, evolving, dispersing and dispersed states',
      () => {
        const physical =
          physicalFor(
            1,
            1,
            1,
          );

        const embedded =
          ProtoplanetaryDiskProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              stellarYouth(
                StellarYouthStage.PROTOSTAR,
                0.10,
                0.90,
                2.7,
                3.2,
              ),
            );

        const gasRich =
          ProtoplanetaryDiskProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              stellarYouth(
                StellarYouthStage.PRE_MAIN_SEQUENCE,
                1.0,
                0.55,
                1.8,
                1.6,
              ),
            );

        const evolving =
          ProtoplanetaryDiskProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              stellarYouth(
                StellarYouthStage.PRE_MAIN_SEQUENCE,
                3.0,
                0.30,
                1.4,
                1.3,
              ),
            );

        const dispersing =
          ProtoplanetaryDiskProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              stellarYouth(
                StellarYouthStage.PRE_MAIN_SEQUENCE,
                5.0,
                0.08,
                1.08,
                1.05,
              ),
            );

        const dispersed =
          ProtoplanetaryDiskProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              stellarYouth(
                StellarYouthStage.PRE_MAIN_SEQUENCE,
                6.0,
                0.03,
                1.05,
                1.03,
              ),
            );

        expect(
          embedded?.stage,
        ).toBe(
          ProtoplanetaryDiskStage.EMBEDDED_ACCRETION_DISK,
        );

        expect(
          gasRich?.stage,
        ).toBe(
          ProtoplanetaryDiskStage.MASSIVE_PRIMORDIAL_DISK,
        );

        expect(
          evolving?.stage,
        ).toBe(
          ProtoplanetaryDiskStage.EVOLVING_PRIMORDIAL_DISK,
        );

        expect(
          dispersing?.stage,
        ).toBe(
          ProtoplanetaryDiskStage.DISPERSING_DISK,
        );

        expect(
          gasRich?.dispersalAgeMillionYears,
        ).toBeCloseTo(
          6,
          12,
        );

        expect(
          dispersed,
        ).toBeNull();
      },
    );

    it(
      'should lose primordial disk mass and accretion activity as the same host approaches dispersal',
      () => {
        const physical =
          physicalFor(
            1,
            1,
            1,
          );

        const early =
          ProtoplanetaryDiskProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              stellarYouth(
                StellarYouthStage.PRE_MAIN_SEQUENCE,
                1,
                0.55,
                1.8,
                1.6,
              ),
            )!;

        const late =
          ProtoplanetaryDiskProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              stellarYouth(
                StellarYouthStage.PRE_MAIN_SEQUENCE,
                5,
                0.08,
                1.08,
                1.05,
              ),
            )!;

        expect(
          early.diskMassSolar,
        ).toBeGreaterThan(
          late.diskMassSolar,
        );

        expect(
          early.diskToCentralMassRatio,
        ).toBeGreaterThan(
          late.diskToCentralMassRatio,
        );

        expect(
          early.accretionRateSolarMassPerYear,
        ).toBeGreaterThan(
          late.accretionRateSolarMassPerYear,
        );

        expect(
          late.surfaceDensityPowerLawExponent,
        ).toBeGreaterThan(
          early.surfaceDensityPowerLawExponent,
        );
      },
    );

    it(
      'should make lower-mass primordial disks survive longer than high-mass-host disks in V1',
      () => {
        const lowMass =
          ProtoplanetaryDiskProfileGenerator
            .generateOrNull(
              generationKey,
              physicalFor(
                0.1,
                0.15,
                0.02,
              ),
              stellarYouth(
                StellarYouthStage.PRE_MAIN_SEQUENCE,
                1,
                0.45,
                1.8,
                1.5,
              ),
            )!;

        const highMass =
          ProtoplanetaryDiskProfileGenerator
            .generateOrNull(
              generationKey,
              physicalFor(
                10,
                4,
                10_000,
              ),
              stellarYouth(
                StellarYouthStage.PRE_MAIN_SEQUENCE,
                1,
                0,
                1.02,
                1.01,
              ),
            )!;

        expect(
          lowMass.dispersalAgeMillionYears,
        ).toBeGreaterThan(
          highMass.dispersalAgeMillionYears,
        );

        expect(
          lowMass.outerRadiusAu,
        ).toBeLessThan(
          highMass.outerRadiusAu,
        );
      },
    );

    it(
      'should derive a hotter disk reference temperature from the point-17.1 luminosity excess without mutating point-15 properties',
      () => {
        const physical =
          physicalFor(
            1,
            1,
            1,
          );

        const hotter =
          ProtoplanetaryDiskProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              stellarYouth(
                StellarYouthStage.PROTOSTAR,
                0.1,
                0.9,
                2.8,
                3.5,
              ),
            )!;

        const cooler =
          ProtoplanetaryDiskProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              stellarYouth(
                StellarYouthStage.PRE_MAIN_SEQUENCE,
                1.0,
                0.3,
                1.5,
                1.2,
              ),
            )!;

        expect(
          hotter.referenceTemperatureAt1AuKelvin,
        ).toBeGreaterThan(
          cooler.referenceTemperatureAt1AuKelvin,
        );

        expect(
          physical.radiusSolar,
        ).toBe(
          1,
        );

        expect(
          physical.luminositySolar,
        ).toBe(
          1,
        );
      },
    );

    it(
      'should support a young brown-dwarf primordial disk but remove it well before the full point-17.1 brown-dwarf youth interval ends',
      () => {
        const physical =
          physicalFor(
            0.05,
            0.11,
            0.0002,
          );

        const early =
          ProtoplanetaryDiskProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              brownDwarfYouth(
                2,
              ),
            );

        const late =
          ProtoplanetaryDiskProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              brownDwarfYouth(
                20,
              ),
            );

        expect(
          early,
        ).not.toBeNull();

        expect(
          early?.dispersalAgeMillionYears,
        ).toBeCloseTo(
          12,
          12,
        );

        expect(
          late,
        ).toBeNull();
      },
    );

    it(
      'should not create a primordial disk when point 17.1 reports no youth overlay',
      () => {
        expect(
          ProtoplanetaryDiskProfileGenerator
            .generateOrNull(
              generationKey,
              physicalFor(
                1,
                1,
                1,
              ),
              null,
            ),
        ).toBeNull();
      },
    );

    it(
      'should remain deterministic and consume no seed-specific randomness for equal frozen physical/youth inputs',
      () => {
        const physical =
          physicalFor(
            0.8,
            0.75,
            0.45,
          );

        const youth =
          stellarYouth(
            StellarYouthStage.PRE_MAIN_SEQUENCE,
            2,
            0.4,
            1.6,
            1.4,
          );

        const first =
          ProtoplanetaryDiskProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              youth,
            );

        const second =
          ProtoplanetaryDiskProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              youth,
            );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );
  },
);

function physicalFor(
  massSolar:
    number,

  radiusSolar:
    number,

  luminositySolar:
    number,
): StellarPhysicalProperties {

  return new StellarPhysicalProperties(
    massSolar,
    massSolar,
    radiusSolar,
    luminositySolar,
    5_000,
  );
}

function stellarYouth(
  stage:
    StellarYouthStage,

  ageMillionYears:
    number,

  accretionActivityIndex:
    number,

  referenceRadiusMultiplier:
    number,

  referenceLuminosityMultiplier:
    number,
): StellarYouthProfile {

  const protostellarUpperAgeMillionYears =
    0.45;

  const preMainSequenceUpperAgeMillionYears =
    30;

  const stageProgress01 =
    stage ===
      StellarYouthStage.PROTOSTAR
      ? ageMillionYears /
        protostellarUpperAgeMillionYears
      : stage ===
          StellarYouthStage.PRE_MAIN_SEQUENCE
        ? (
            ageMillionYears -
            protostellarUpperAgeMillionYears
          ) /
          (
            preMainSequenceUpperAgeMillionYears -
            protostellarUpperAgeMillionYears
          )
        : (
            ageMillionYears -
            preMainSequenceUpperAgeMillionYears
          ) /
          70;

  return new StellarYouthProfile(
    stage,
    ageMillionYears,
    protostellarUpperAgeMillionYears,
    preMainSequenceUpperAgeMillionYears,
    100,
    Math.min(
      1,
      Math.max(
        0,
        stageProgress01,
      ),
    ),
    referenceRadiusMultiplier,
    referenceLuminosityMultiplier,
    accretionActivityIndex,
  );
}

function brownDwarfYouth(
  ageMillionYears:
    number,
): StellarYouthProfile {

  return new StellarYouthProfile(
    StellarYouthStage.YOUNG_BROWN_DWARF,
    ageMillionYears,
    null,
    null,
    100,
    ageMillionYears /
      100,
    1.2,
    1.3,
    0.2,
  );
}
