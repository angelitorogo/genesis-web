import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetRarityAssessment,
  planetRarityTraitsForSourcesV1,
  type PlanetRaritySourceSnapshot,
} from './planet-rarity-assessment';

import {
  PlanetRarityTrait,
} from './planet-rarity-trait';

import {
  PlanetType,
} from './planet-type';

describe(
  'PlanetRarityAssessment point 19.8',
  () => {
    const locator =
      new BodyLocator(
        3n,
        -17n,
        8n,
        0n,
      );

    const seed =
      new BodySeed(
        '11111111111111111111111111111111',
      );

    it(
      'should derive multiple independent basic rarities from physical tail values in deterministic order',
      () => {
        const sources = {
          ...ordinarySources(),
          massEarth:
            10,
          densityGramsPerCubicCentimeter:
            8.2,
          surfaceGravityEarth:
            3.1,
          envelopeMassFraction01:
            0.02,
          rotationPeriodHours:
            5.5,
          axialTiltDegrees:
            90,
          orbitalEccentricity:
            0.31,
          referenceMeanInsolationEarth:
            1_100,
          tidalHeatingProxy:
            1_200,
          metallicCoreFractionOfSolids01:
            0.42,
          iceBearingFractionOfSolids01:
            0.62,
          referenceBondAlbedo01:
            0.75,
        } satisfies PlanetRaritySourceSnapshot;

        expect(
          planetRarityTraitsForSourcesV1(
            sources,
          ),
        ).toEqual([
          PlanetRarityTrait.ULTRA_DENSE,
          PlanetRarityTrait.EXTREME_SURFACE_GRAVITY,
          PlanetRarityTrait.RAPID_ROTATOR,
          PlanetRarityTrait.EXTREME_OBLIQUITY,
          PlanetRarityTrait.HIGH_ORBITAL_ECCENTRICITY,
          PlanetRarityTrait.EXTREME_IRRADIATION,
          PlanetRarityTrait.EXTREME_TIDAL_HEATING,
          PlanetRarityTrait.MASSIVE_SOLID_WORLD,
          PlanetRarityTrait.METAL_RICH_INTERIOR,
          PlanetRarityTrait.VOLATILE_RICH_INTERIOR,
          PlanetRarityTrait.EXTREME_BASE_ALBEDO,
        ]);
      },
    );

    it(
      'should distinguish a puffy low-density envelope world and strongly retrograde rotation',
      () => {
        const sources = {
          ...ordinarySources(),
          planetType:
            PlanetType.GAS_GIANT,
          densityGramsPerCubicCentimeter:
            0.9,
          envelopeMassFraction01:
            0.6,
          axialTiltDegrees:
            150,
        } satisfies PlanetRaritySourceSnapshot;

        expect(
          planetRarityTraitsForSourcesV1(
            sources,
          ),
        ).toEqual([
          PlanetRarityTrait.PUFFY_LOW_DENSITY,
          PlanetRarityTrait.STRONGLY_RETROGRADE_ROTATION,
        ]);
      },
    );

    it(
      'should suppress rarity labels when point-19.7 says the physical/type baseline is incoherent',
      () => {
        const sources = {
          ...ordinarySources(),
          densityGramsPerCubicCentimeter:
            9,
          typePhysicallyCoherent:
            false,
        } satisfies PlanetRaritySourceSnapshot;

        expect(
          planetRarityTraitsForSourcesV1(
            sources,
          ),
        ).toEqual([]);
      },
    );

    it(
      'should freeze traits and reject duplicate, unknown or physically incorrect trait lists',
      () => {
        const sources = {
          ...ordinarySources(),
          referenceBondAlbedo01:
            0.75,
        } satisfies PlanetRaritySourceSnapshot;

        const assessment =
          assessmentFromSources(
            sources,
            [
              PlanetRarityTrait.EXTREME_BASE_ALBEDO,
            ],
          );

        expect(
          assessment.hasRarities,
        ).toBe(true);

        expect(
          assessment.rarityCount,
        ).toBe(1);

        expect(
          assessment.hasTrait(
            PlanetRarityTrait.EXTREME_BASE_ALBEDO,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            assessment.traits,
          ),
        ).toBe(true);

        expect(
          () =>
            assessmentFromSources(
              sources,
              [
                PlanetRarityTrait.EXTREME_BASE_ALBEDO,
                PlanetRarityTrait.EXTREME_BASE_ALBEDO,
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            assessmentFromSources(
              sources,
              [
                PlanetRarityTrait.ULTRA_DENSE,
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function ordinarySources():
      PlanetRaritySourceSnapshot {

      return {
        planetType:
          PlanetType.ROCKY,
        massEarth:
          1,
        radiusEarth:
          1,
        densityGramsPerCubicCentimeter:
          5.514,
        surfaceGravityEarth:
          1,
        envelopeMassFraction01:
          0,
        rotationPeriodHours:
          24,
        axialTiltDegrees:
          23.44,
        orbitalEccentricity:
          0.02,
        referenceMeanInsolationEarth:
          1,
        tidalHeatingProxy:
          0.001,
        metallicCoreFractionOfSolids01:
          0.28,
        iceBearingFractionOfSolids01:
          0.099,
        referenceBondAlbedo01:
          0.2,
        typePhysicallyCoherent:
          true,
      };
    }

    function assessmentFromSources(
      sources:
        PlanetRaritySourceSnapshot,

      traits:
        readonly PlanetRarityTrait[],
    ): PlanetRarityAssessment {

      return new PlanetRarityAssessment(
        1,
        locator,
        seed,
        sources.planetType,
        sources.massEarth,
        sources.radiusEarth,
        sources.densityGramsPerCubicCentimeter,
        sources.surfaceGravityEarth,
        sources.envelopeMassFraction01,
        sources.rotationPeriodHours,
        sources.axialTiltDegrees,
        sources.orbitalEccentricity,
        sources.referenceMeanInsolationEarth,
        sources.tidalHeatingProxy,
        sources.metallicCoreFractionOfSolids01,
        sources.iceBearingFractionOfSolids01,
        sources.referenceBondAlbedo01,
        sources.typePhysicallyCoherent,
        traits,
      );
    }
  },
);
