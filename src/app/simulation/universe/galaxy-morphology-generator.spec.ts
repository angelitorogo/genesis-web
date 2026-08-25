import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalaxyGenerator,
} from './galaxy-generator';

import {
  GalaxyMorphologyGenerator,
  V1GalaxyDraws,
} from './galaxy-morphology-generator';

describe(
  'GalaxyMorphologyGenerator',
  () => {
    const canonicalGenerationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should accept finite V1 draws in the semi-open interval [0, 1)',
      () => {
        expect(
          () =>
            makeDraws({
              type:
                0,

              nucleusState:
                1 - Number.EPSILON,
            }),
        ).not.toThrow();
      },
    );

    it(
      'should reject an invalid value in any of the sixteen V1 draw positions',
      () => {
        const invalidValues = [
          -Number.EPSILON,
          1,
          Number.NaN,
          Number.POSITIVE_INFINITY,
          Number.NEGATIVE_INFINITY,
        ];

        for (
          let drawIndex = 0;
          drawIndex < 16;
          drawIndex += 1
        ) {
          for (
            const invalidValue of invalidValues
          ) {
            const values =
              Array<number>(16)
                .fill(
                  0.5,
                );

            values[
              drawIndex
            ] =
              invalidValue;

            expect(
              () =>
                makeDrawsFromArray(
                  values,
                ),
            ).toThrow(
              RangeError,
            );
          }
        }
      },
    );

    it(
      'should preserve the exact V1 galaxy-type thresholds',
      () => {
        expect(
          generateForTypeDraw(
            0.0,
          ).type,
        ).toBe(
          GalaxyType.BARRED_SPIRAL,
        );

        expect(
          generateForTypeDraw(
            0.28,
          ).type,
        ).toBe(
          GalaxyType.SPIRAL,
        );

        expect(
          generateForTypeDraw(
            0.52,
          ).type,
        ).toBe(
          GalaxyType.ELLIPTICAL,
        );

        expect(
          generateForTypeDraw(
            0.72,
          ).type,
        ).toBe(
          GalaxyType.DWARF,
        );

        expect(
          generateForTypeDraw(
            0.88,
          ).type,
        ).toBe(
          GalaxyType.IRREGULAR,
        );
      },
    );

    it(
      'should raise mass-correlated parameters when only the mass draw increases',
      () => {
        const lower =
          GalaxyMorphologyGenerator
            .generateV1(
              makeDraws({
                type:
                  0.10,

                mass:
                  0.10,
              }),
            );

        const higher =
          GalaxyMorphologyGenerator
            .generateV1(
              makeDraws({
                type:
                  0.10,

                mass:
                  0.90,
              }),
            );

        expect(
          higher
            .physicalProperties
            .totalMassSolarMasses,
        ).toBeGreaterThan(
          lower
            .physicalProperties
            .totalMassSolarMasses,
        );

        expect(
          higher
            .physicalProperties
            .diameterLightYears,
        ).toBeGreaterThan(
          lower
            .physicalProperties
            .diameterLightYears,
        );

        expect(
          higher
            .physicalProperties
            .stellarPopulation,
        ).toBeGreaterThan(
          lower
            .physicalProperties
            .stellarPopulation,
        );

        expect(
          higher
            .physicalProperties
            .metallicitySolarRatio,
        ).toBeGreaterThan(
          lower
            .physicalProperties
            .metallicitySolarRatio,
        );

        expect(
          higher
            .physicalProperties
            .structure
            .centralConcentration,
        ).toBeGreaterThan(
          lower
            .physicalProperties
            .structure
            .centralConcentration,
        );
      },
    );

    it(
      'should reduce the star-formation component when only the age draw increases',
      () => {
        const younger =
          GalaxyMorphologyGenerator
            .generateV1(
              makeDraws({
                type:
                  0.30,

                age:
                  0.10,
              }),
            );

        const older =
          GalaxyMorphologyGenerator
            .generateV1(
              makeDraws({
                type:
                  0.30,

                age:
                  0.90,
              }),
            );

        expect(
          older
            .physicalProperties
            .ageBillionYears,
        ).toBeGreaterThan(
          younger
            .physicalProperties
            .ageBillionYears,
        );

        expect(
          older
            .physicalProperties
            .starFormationRateSolarMassesPerYear,
        ).toBeLessThan(
          younger
            .physicalProperties
            .starFormationRateSolarMassesPerYear,
        );
      },
    );

    it(
      'should map the historical no-nucleus branch to a mandatory QUIESCENT galactic centre',
      () => {
        const result =
          GalaxyMorphologyGenerator
            .generateV1(
              makeDraws({
                type:
                  0.60,

                nucleusPresence:
                  0.99,
              }),
            );

        expect(
          result.nucleus,
        ).not.toBeNull();

        expect(
          result.nucleus
            ?.state,
        ).toBe(
          GalacticNucleusState.QUIESCENT,
        );

        expect(
          result.nucleus
            ?.supermassiveBlackHole,
        ).toBeNull();
      },
    );

    it(
      'should allow a quiescent nucleus without a supermassive black hole',
      () => {
        const result =
          GalaxyMorphologyGenerator
            .generateV1(
              makeDraws({
                type:
                  0.60,

                nucleusPresence:
                  0,

                blackHolePresence:
                  0.99,
              }),
            );

        expect(
          result.nucleus
            ?.state,
        ).toBe(
          GalacticNucleusState.QUIESCENT,
        );

        expect(
          result.nucleus
            ?.supermassiveBlackHole,
        ).toBeNull();
      },
    );

    it(
      'should always attach a supermassive black hole to a QUASAR nucleus',
      () => {
        const result =
          GalaxyMorphologyGenerator
            .generateV1(
              makeDraws({
                type:
                  0.60,

                nucleusPresence:
                  0,

                blackHolePresence:
                  0,

                nucleusState:
                  0,
              }),
            );

        expect(
          result.nucleus
            ?.state,
        ).toBe(
          GalacticNucleusState.QUASAR,
        );

        expect(
          result.nucleus
            ?.supermassiveBlackHole,
        ).not.toBeNull();
      },
    );

    it(
      'should always attach a supermassive black hole to an AGN nucleus',
      () => {
        const result =
          GalaxyMorphologyGenerator
            .generateV1(
              makeDraws({
                type:
                  0.60,

                nucleusPresence:
                  0,

                blackHolePresence:
                  0,

                nucleusState:
                  0.01,
              }),
            );

        expect(
          result.nucleus
            ?.state,
        ).toBe(
          GalacticNucleusState.AGN,
        );

        expect(
          result.nucleus
            ?.supermassiveBlackHole,
        ).not.toBeNull();
      },
    );

    it(
      'should never generate a QUASAR in DWARF or IRREGULAR galaxies',
      () => {
        for (
          const typeDraw of [
            0.72,
            0.88,
          ]
        ) {
          const result =
            GalaxyMorphologyGenerator
              .generateV1(
                makeDraws({
                  type:
                    typeDraw,

                  nucleusPresence:
                    0,

                  blackHolePresence:
                    0,

                  nucleusState:
                    0,
                }),
              );

          expect(
            result.nucleus
              ?.state,
          ).toBe(
            GalacticNucleusState.AGN,
          );

          expect(
            result.nucleus
              ?.state,
          ).not.toBe(
            GalacticNucleusState.QUASAR,
          );
        }
      },
    );

    it(
      'should never let the supermassive black hole exceed one percent of galaxy mass',
      () => {
        const result =
          GalaxyMorphologyGenerator
            .generateV1(
              makeDraws({
                type:
                  0.80,

                mass:
                  0,

                nucleusPresence:
                  0,

                blackHolePresence:
                  0,

                blackHoleMass:
                  1 - Number.EPSILON,

                nucleusState:
                  0.5,
              }),
            );

        const smbhMass =
          result.nucleus
            ?.supermassiveBlackHole
            ?.massSolarMasses;

        expect(
          smbhMass,
        ).toBeDefined();

        expect(
          smbhMass as number,
        ).toBeLessThanOrEqual(
          result
            .physicalProperties
            .totalMassSolarMasses *
            0.01,
        );
      },
    );

    it(
      'should be exactly deterministic for the same immutable V1 draws',
      () => {
        const draws =
          makeDraws({
            type:
              0.30,

            mass:
              0.73,

            age:
              0.41,
          });

        const first =
          GalaxyMorphologyGenerator
            .generateV1(
              draws,
            );

        const second =
          GalaxyMorphologyGenerator
            .generateV1(
              draws,
            );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should preserve coherent V1 structural ranges for every canonical morphology',
      () => {
        const cases = [
          {
            typeDraw:
              0.10,

            type:
              GalaxyType.BARRED_SPIRAL,

            spiralArmMin:
              2,

            spiralArmMax:
              5,

            barStrengthMin:
              0.45,

            barStrengthMax:
              0.95,
          },
          {
            typeDraw:
              0.30,

            type:
              GalaxyType.SPIRAL,

            spiralArmMin:
              2,

            spiralArmMax:
              6,

            barStrengthMin:
              0.00,

            barStrengthMax:
              0.20,
          },
          {
            typeDraw:
              0.60,

            type:
              GalaxyType.ELLIPTICAL,

            spiralArmMin:
              0,

            spiralArmMax:
              0,

            barStrengthMin:
              0.00,

            barStrengthMax:
              0.05,
          },
          {
            typeDraw:
              0.80,

            type:
              GalaxyType.DWARF,

            spiralArmMin:
              0,

            spiralArmMax:
              2,

            barStrengthMin:
              0.00,

            barStrengthMax:
              0.20,
          },
          {
            typeDraw:
              0.95,

            type:
              GalaxyType.IRREGULAR,

            spiralArmMin:
              0,

            spiralArmMax:
              3,

            barStrengthMin:
              0.00,

            barStrengthMax:
              0.25,
          },
        ];

        for (
          const expected of cases
        ) {
          const result =
            GalaxyMorphologyGenerator
              .generateV1(
                makeDraws({
                  type:
                    expected.typeDraw,
                }),
              );

          expect(
            result.type,
          ).toBe(
            expected.type,
          );

          expect(
            result
              .physicalProperties
              .structure
              .spiralArmCount,
          ).toBeGreaterThanOrEqual(
            expected.spiralArmMin,
          );

          expect(
            result
              .physicalProperties
              .structure
              .spiralArmCount,
          ).toBeLessThanOrEqual(
            expected.spiralArmMax,
          );

          expect(
            result
              .physicalProperties
              .structure
              .barStrength,
          ).toBeGreaterThanOrEqual(
            expected.barStrengthMin,
          );

          expect(
            result
              .physicalProperties
              .structure
              .barStrength,
          ).toBeLessThanOrEqual(
            expected.barStrengthMax,
          );
        }
      },
    );

    it(
      'should preserve morphology contracts across the deterministic galaxy sample 0..511',
      () => {
        const generatedTypes =
          new Set<GalaxyType>();

        for (
          let galaxyIndex = 0n;
          galaxyIndex < 512n;
          galaxyIndex += 1n
        ) {
          const galaxy =
            GalaxyGenerator
              .generate(
                canonicalGenerationKey,
                galaxyIndex,
              );

          generatedTypes.add(
            galaxy.type,
          );

          expect(
            Number.isFinite(
              galaxy
                .physicalProperties
                .ageBillionYears,
            ),
          ).toBe(
            true,
          );

          expect(
            galaxy
              .physicalProperties
              .ageBillionYears,
          ).toBeGreaterThan(
            0,
          );

          expect(
            galaxy
              .physicalProperties
              .diameterLightYears,
          ).toBeGreaterThan(
            0,
          );

          expect(
            galaxy
              .physicalProperties
              .totalMassSolarMasses,
          ).toBeGreaterThan(
            0,
          );

          expect(
            galaxy
              .physicalProperties
              .stellarPopulation,
          ).toBeGreaterThan(
            0n,
          );

          expect(
            galaxy
              .physicalProperties
              .metallicitySolarRatio,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            galaxy
              .physicalProperties
              .starFormationRateSolarMassesPerYear,
          ).toBeGreaterThanOrEqual(
            0,
          );

          if (
            galaxy.nucleus
              ?.state ===
              GalacticNucleusState.AGN ||
            galaxy.nucleus
              ?.state ===
              GalacticNucleusState.QUASAR
          ) {
            expect(
              galaxy.nucleus
                .supermassiveBlackHole,
            ).not.toBeNull();
          }

          const smbh =
            galaxy.nucleus
              ?.supermassiveBlackHole;

          if (
            smbh !==
            null &&
            smbh !==
            undefined
          ) {
            expect(
              smbh.massSolarMasses,
            ).toBeLessThanOrEqual(
              galaxy
                .physicalProperties
                .totalMassSolarMasses *
                0.01,
            );
          }
        }

        expect(
          generatedTypes,
        ).toEqual(
          new Set(
            GalaxyType.values,
          ),
        );
      },
    );
  },
);

interface DrawOverrides {
  readonly type?: number;
  readonly age?: number;
  readonly diameter?: number;
  readonly mass?: number;
  readonly stars?: number;
  readonly metallicity?: number;
  readonly starFormation?: number;
  readonly centralConcentration?: number;
  readonly flattening?: number;
  readonly asymmetry?: number;
  readonly barStrength?: number;
  readonly spiralArms?: number;
  readonly nucleusPresence?: number;
  readonly blackHolePresence?: number;
  readonly blackHoleMass?: number;
  readonly nucleusState?: number;
}

function makeDraws(
  overrides:
    DrawOverrides =
      {},
): V1GalaxyDraws {

  return new V1GalaxyDraws(
    overrides.type ?? 0.5,
    overrides.age ?? 0.5,
    overrides.diameter ?? 0.5,
    overrides.mass ?? 0.5,
    overrides.stars ?? 0.5,
    overrides.metallicity ?? 0.5,
    overrides.starFormation ?? 0.5,
    overrides.centralConcentration ?? 0.5,
    overrides.flattening ?? 0.5,
    overrides.asymmetry ?? 0.5,
    overrides.barStrength ?? 0.5,
    overrides.spiralArms ?? 0.5,
    overrides.nucleusPresence ?? 0.5,
    overrides.blackHolePresence ?? 0.5,
    overrides.blackHoleMass ?? 0.5,
    overrides.nucleusState ?? 0.5,
  );
}

function makeDrawsFromArray(
  values:
    readonly number[],
): V1GalaxyDraws {

  if (
    values.length !==
    16
  ) {
    throw new RangeError(
      'Expected exactly sixteen V1 draw values.',
    );
  }

  return new V1GalaxyDraws(
    values[0],
    values[1],
    values[2],
    values[3],
    values[4],
    values[5],
    values[6],
    values[7],
    values[8],
    values[9],
    values[10],
    values[11],
    values[12],
    values[13],
    values[14],
    values[15],
  );
}

function generateForTypeDraw(
  typeDraw:
    number,
) {
  return GalaxyMorphologyGenerator
    .generateV1(
      makeDraws({
        type:
          typeDraw,
      }),
    );
}
