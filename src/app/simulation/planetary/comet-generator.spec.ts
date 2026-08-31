import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  CometPeriodRegime,
} from '../../domain/planetary/comet-period-regime';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  CometGenerator,
} from './comet-generator';

describe(
  'CometGenerator point 22.6 V1',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const locator =
      new SystemLocator(
        6n,
        113n,
        9n,
      );

    const seed =
      new SystemSeed(
        '22222222222222222222222222222222',
      );

    it(
      'should preserve the exact point-22.5 comet identities/nuclei while adding deterministic bound short/long-period orbits',
      () => {
        const planetarySystem =
          systemFixture({
            residualDustMassEarth:
              5,
            sourceInnerRadiusAu:
              0.1,
            sourceOuterRadiusAu:
              50,
            sourceCandidateCount:
              10,
            sourceMigratedBodyCount:
              2,
            sourceCollisionCount:
              1,
          });

        const first =
          CometGenerator
            .generate(
              generationKey,
              planetarySystem,
            );

        const second =
          CometGenerator
            .generate(
              generationKey,
              planetarySystem,
            );

        expect(
          second,
        ).toEqual(
          first,
        );

        expect(
          first.reservoirSupportIndex01,
        ).toBeCloseTo(
          0.7026617935082301,
          12,
        );

        expect(
          first.relevantCometCount,
        ).toBe(5);

        expect(
          first.shortPeriodCometCount,
        ).toBe(3);

        expect(
          first.longPeriodCometCount,
        ).toBe(2);

        const firstComet =
          first.relevantComets[0];

        /* Frozen 22.5 regression values. */
        expect(
          firstComet.proceduralId,
        ).toBe(
          '3B810C3F52AEE2FD393BCBBD1D9DF46C',
        );

        expect(
          firstComet.localDesignation,
        ).toBe(
          'COM-001',
        );

        expect(
          firstComet.diameterKilometers,
        ).toBeCloseTo(
          44.64559764182939,
          10,
        );

        expect(
          firstComet.nucleusProperties.iceFraction01,
        ).toBeCloseTo(
          0.6935264076249033,
          12,
        );

        expect(
          firstComet.nucleusProperties.bulkDensityGramsPerCubicCentimeter,
        ).toBeCloseTo(
          0.7576666713467244,
          12,
        );

        expect(
          firstComet.nucleusProperties.geometricAlbedo,
        ).toBeCloseTo(
          0.0283815543318633,
          12,
        );

        /* New 22.6 orbit vector. */
        expect(
          firstComet.periodRegime,
        ).toBe(
          CometPeriodRegime
            .SHORT_PERIOD,
        );

        expect(
          firstComet.orbitalPeriodYears,
        ).toBeCloseTo(
          24.240795907438745,
          12,
        );

        expect(
          firstComet.orbit.semiMajorAxisAu,
        ).toBeCloseTo(
          8.375895494835634,
          12,
        );

        expect(
          firstComet.periapsisAu,
        ).toBeCloseTo(
          0.4342504570644931,
          12,
        );

        expect(
          firstComet.orbit.eccentricity,
        ).toBeCloseTo(
          0.9481547426979908,
          12,
        );

        expect(
          firstComet.apoapsisAu,
        ).toBeCloseTo(
          16.317540532606774,
          12,
        );

        for (
          const comet
          of first.relevantComets
        ) {
          expect(
            comet.isDiscoverable,
          ).toBe(true);

          expect(
            comet.orbit.eccentricity,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            comet.orbit.eccentricity,
          ).toBeLessThan(
            1,
          );

          expect(
            comet.orbit.periapsisAu,
          ).toBeGreaterThan(
            0,
          );

          expect(
            comet.orbit.apoapsisAu,
          ).toBeGreaterThan(
            comet.orbit.periapsisAu,
          );

          expect(
            'activityState' in comet,
          ).toBe(false);

          expect(
            'discoveryState' in comet,
          ).toBe(false);
        }
      },
    );

    it(
      'should derive circumbinary comet periods from the frozen A+B gravitating mass when the mature system has no planets',
      () => {
        const planetarySystem =
          systemFixture({
            residualDustMassEarth:
              5,
            sourceInnerRadiusAu:
              0.1,
            sourceOuterRadiusAu:
              50,
            sourceCandidateCount:
              10,
            sourceMigratedBodyCount:
              2,
            sourceCollisionCount:
              1,
            orbitTopology:
              PlanetarySystemOrbitTopology
                .CIRCUMBINARY,
            primaryMassSolar:
              1,
            secondaryMassSolar:
              0.5,
          });

        const generated =
          CometGenerator
            .generate(
              generationKey,
              planetarySystem,
            );

        expect(
          generated
            .relevantComets[0]
            .orbit
            .gravitatingMassSolar,
        ).toBe(1.5);

        expect(
          generated
            .relevantComets[0]
            .orbitalPeriodYears,
        ).toBeCloseTo(
          24.240795907438745,
          12,
        );

        expect(
          generated
            .relevantComets[0]
            .orbit
            .semiMajorAxisAu,
        ).toBeCloseTo(
          (
            1.5 *
            24.240795907438745 **
              2
          ) **
            (1 / 3),
          12,
        );
      },
    );

    it(
      'should preserve a zero-residual-dust mature system without inventing relevant comets',
      () => {
        const generated =
          CometGenerator
            .generate(
              generationKey,
              systemFixture({
                residualDustMassEarth:
                  0,
                sourceInnerRadiusAu:
                  0.1,
                sourceOuterRadiusAu:
                  50,
                sourceCandidateCount:
                  0,
                sourceMigratedBodyCount:
                  0,
                sourceCollisionCount:
                  0,
              }),
            );

        expect(
          generated.reservoirSupportIndex01,
        ).toBe(0);

        expect(
          generated.relevantComets,
        ).toEqual([]);
      },
    );

    it(
      'should reject foreign generation keys and unsupported generator versions',
      () => {
        const planetarySystem =
          systemFixture({
            residualDustMassEarth:
              5,
            sourceInnerRadiusAu:
              0.1,
            sourceOuterRadiusAu:
              50,
            sourceCandidateCount:
              10,
            sourceMigratedBodyCount:
              2,
            sourceCollisionCount:
              1,
          });

        const otherKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '0123-4567-89AB-CDEF-FEDC-BA98-7654-3210',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            CometGenerator
              .generate(
                otherKey,
                planetarySystem,
              ),
        ).toThrow(
          RangeError,
        );

        const unsupportedKey = {
          ...generationKey,
          generatorVersion: {
            code:
              999,
          },
        } as unknown as UniverseGenerationKey;

        expect(
          () =>
            CometGenerator
              .generate(
                unsupportedKey,
                {
                  ...planetarySystem,
                  generationKey:
                    unsupportedKey,
                } as unknown as PlanetarySystem,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function systemFixture(
      input: {
        readonly residualDustMassEarth:
          number;
        readonly sourceInnerRadiusAu:
          number;
        readonly sourceOuterRadiusAu:
          number;
        readonly sourceCandidateCount:
          number;
        readonly sourceMigratedBodyCount:
          number;
        readonly sourceCollisionCount:
          number;
        readonly orbitTopology?:
          PlanetarySystemOrbitTopology;
        readonly primaryMassSolar?:
          number;
        readonly secondaryMassSolar?:
          number | null;
      },
    ): PlanetarySystem {

      const orbitTopology =
        input.orbitTopology ??
        PlanetarySystemOrbitTopology
          .CIRCUMSTELLAR;

      const primaryMassSolar =
        input.primaryMassSolar ??
        1;

      const secondaryMassSolar =
        input.secondaryMassSolar ??
        null;

      return {
        generationKey,
        locator,
        seed,
        planetCount:
          0,
        hostStellarSystem: {
          secondaryCompanion:
            secondaryMassSolar ===
              null
              ? null
              : {
                  physicalProperties: {
                    initialMassSolar:
                      secondaryMassSolar,
                  },
                },
        },
        orbits:
          [],
        orbitalLayout: {
          orbitTopology,
          generationInnerLimitAu:
            input.sourceInnerRadiusAu,
          generationOuterLimitAu:
            input.sourceOuterRadiusAu,
        },
        orbitalPeriodLayout: {
          gravitatingMassSolar:
            null,
        },
        habitableZone: {
          referenceLuminositySolar:
            1,
        },
        formationBlueprint: {
          ...input,
          centralMassSolar:
            primaryMassSolar,
        },
      } as unknown as PlanetarySystem;
    }
  },
);
