import {
  BodyLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  BodySeed,
  SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  PlanetaryArchitectureSlot,
} from '../../domain/planetary/planetary-architecture-slot';

import {
  PlanetaryOrbitalElements,
} from '../../domain/planetary/planetary-orbital-elements';

import {
  PlanetaryOrbitalPairStabilityRegime,
} from '../../domain/planetary/planetary-orbital-pair-stability-regime';

import {
  PlanetaryOrbitalPeriod,
} from '../../domain/planetary/planetary-orbital-period';

import {
  ProtoplanetCompositionMixture,
} from '../../domain/planetary/protoplanet-composition-mixture';

import {
  PlanetarySystemArchitecture,
} from '../../domain/planetary/planetary-system-architecture';

import {
  PlanetarySystemArchitectureRegime,
} from '../../domain/planetary/planetary-system-architecture-regime';

import {
  PlanetarySystemOrbitalLayout,
} from '../../domain/planetary/planetary-system-orbital-layout';

import {
  PlanetarySystemOrbitalPeriodLayout,
} from '../../domain/planetary/planetary-system-orbital-period-layout';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  PlanetarySystemStabilityRegime,
} from '../../domain/planetary/planetary-system-stability-regime';

import {
  type StellarSystem,
} from '../../domain/stellar/stellar-system';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  PLANETARY_STABILITY_V1_CONSERVATIVE_STABLE_THRESHOLD,
  PLANETARY_STABILITY_V1_HILL_UNSTABLE_THRESHOLD,
  PlanetarySystemOrbitalStabilityGenerator,
} from './planetary-system-orbital-stability-generator';

describe(
  'PlanetarySystemOrbitalStabilityGenerator point 18.5',
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
        4n,
        5n,
        6n,
      );

    it(
      'should classify a widely separated non-crossing pair as stable using mutual-Hill spacing',
      () => {
        const assessment =
          assessPair(
            1,
            1.5,
            1,
            1,
          );

        expect(
          assessment.regime,
        ).toBe(
          PlanetarySystemStabilityRegime.STABLE,
        );

        expect(
          assessment.pairAssessments[0].regime,
        ).toBe(
          PlanetaryOrbitalPairStabilityRegime.STABLE,
        );

        expect(
          assessment.minimumMutualHillSeparation,
        ).toBeGreaterThanOrEqual(
          PLANETARY_STABILITY_V1_CONSERVATIVE_STABLE_THRESHOLD,
        );
      },
    );

    it(
      'should be deterministic and leave the frozen point-18.3/18.4 inputs untouched',
      () => {
        const topology =
          PlanetarySystemOrbitTopology.CIRCUMSTELLAR;

        const architecture =
          architectureFor(
            topology,
            [
              slot(
                1,
                1,
                1,
              ),
              slot(
                2,
                1.5,
                1,
              ),
            ],
          );

        const orbitalLayout =
          layoutFor(
            topology,
            [
              orbit(
                1,
                1,
                0.02,
              ),
              orbit(
                2,
                1.5,
                0.03,
              ),
            ],
            0.05,
            100,
          );

        const periodLayout =
          periodsFor(
            topology,
            orbitalLayout,
            1,
          );

        const before =
          orbitalLayout.orbits.map(
            orbitValue => ({
              a:
                orbitValue.semiMajorAxisAu,
              e:
                orbitValue.eccentricity,
            }),
          );

        const first =
          PlanetarySystemOrbitalStabilityGenerator
            .generate(
              generationKey,
              singleSystem(),
              architecture,
              orbitalLayout,
              periodLayout,
            );

        const second =
          PlanetarySystemOrbitalStabilityGenerator
            .generate(
              generationKey,
              singleSystem(),
              architecture,
              orbitalLayout,
              periodLayout,
            );

        expect(
          second.pairAssessments.map(
            pairValue => ({
              clearance:
                pairValue.radialClearanceAu,
              hill:
                pairValue.mutualHillRadiusAu,
              separation:
                pairValue.separationMutualHillRadii,
              periodRatio:
                pairValue.periodRatio,
              mutualInclination:
                pairValue.mutualInclinationDegrees,
              regime:
                pairValue.regime,
            }),
          ),
        ).toEqual(
          first.pairAssessments.map(
            pairValue => ({
              clearance:
                pairValue.radialClearanceAu,
              hill:
                pairValue.mutualHillRadiusAu,
              separation:
                pairValue.separationMutualHillRadii,
              periodRatio:
                pairValue.periodRatio,
              mutualInclination:
                pairValue.mutualInclinationDegrees,
              regime:
                pairValue.regime,
            }),
          ),
        );

        expect(
          orbitalLayout.orbits.map(
            orbitValue => ({
              a:
                orbitValue.semiMajorAxisAu,
              e:
                orbitValue.eccentricity,
            }),
          ),
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should retain a marginal band between the hard two-body Hill threshold and the conservative V1 spacing target',
      () => {
        const assessment =
          assessPair(
            1,
            1.12,
            10,
            10,
          );

        const separation =
          assessment
            .pairAssessments[0]
            .separationMutualHillRadii;

        expect(
          separation,
        ).toBeGreaterThanOrEqual(
          PLANETARY_STABILITY_V1_HILL_UNSTABLE_THRESHOLD,
        );

        expect(
          separation,
        ).toBeLessThan(
          PLANETARY_STABILITY_V1_CONSERVATIVE_STABLE_THRESHOLD,
        );

        expect(
          assessment.regime,
        ).toBe(
          PlanetarySystemStabilityRegime.MARGINAL,
        );
      },
    );

    it(
      'should flag a non-crossing but mutually Hill-packed pair as unstable',
      () => {
        const assessment =
          assessPair(
            1,
            1.08,
            20,
            20,
          );

        expect(
          assessment
            .pairAssessments[0]
            .radialClearanceAu,
        ).toBeGreaterThan(0);

        expect(
          assessment
            .pairAssessments[0]
            .separationMutualHillRadii,
        ).toBeLessThan(
          PLANETARY_STABILITY_V1_HILL_UNSTABLE_THRESHOLD,
        );

        expect(
          assessment.regime,
        ).toBe(
          PlanetarySystemStabilityRegime.UNSTABLE,
        );
      },
    );

    it(
      'should use apsidal clearance against the frozen point-16.5 circumbinary inner boundary',
      () => {
        const topology =
          PlanetarySystemOrbitTopology.CIRCUMBINARY;

        const architecture =
          architectureFor(
            topology,
            [
              slot(
                1,
                3.1,
                1,
              ),
            ],
          );

        const orbitalLayout =
          layoutFor(
            topology,
            [
              orbit(
                1,
                3.1,
                0.1,
              ),
            ],
            3,
            20,
          );

        const assessment =
          PlanetarySystemOrbitalStabilityGenerator
            .generate(
              generationKey,
              circumbinarySystem(
                3,
                null,
              ),
              architecture,
              orbitalLayout,
              periodsFor(
                topology,
                orbitalLayout,
                1.5,
              ),
            );

        expect(
          assessment.innerBoundaryClearanceAu,
        ).toBeCloseTo(
          3.1 *
            0.9 -
            3,
          14,
        );

        expect(
          assessment.regime,
        ).toBe(
          PlanetarySystemStabilityRegime.UNSTABLE,
        );
      },
    );

    it(
      'should use the tertiary-imposed outer boundary for a bounded P-type triple annulus',
      () => {
        const topology =
          PlanetarySystemOrbitTopology.CIRCUMBINARY;

        const architecture =
          architectureFor(
            topology,
            [
              slot(
                1,
                5,
                1,
              ),
            ],
          );

        const orbitalLayout =
          layoutFor(
            topology,
            [
              orbit(
                1,
                5,
                0.1,
              ),
            ],
            3,
            5.2,
          );

        const assessment =
          PlanetarySystemOrbitalStabilityGenerator
            .generate(
              generationKey,
              circumbinarySystem(
                3,
                5.2,
                StellarSystemMultiplicity.TRIPLE,
              ),
              architecture,
              orbitalLayout,
              periodsFor(
                topology,
                orbitalLayout,
                1.5,
              ),
            );

        expect(
          assessment.outerBoundaryClearanceAu,
        ).toBeCloseTo(
          5.2 -
            5.5,
          14,
        );

        expect(
          assessment.regime,
        ).toBe(
          PlanetarySystemStabilityRegime.UNSTABLE,
        );
      },
    );

    it(
      'should preserve EMPTY and DYNAMICALLY_EXCLUDED without inventing a stability verdict for absent planets',
      () => {
        const emptyArchitecture =
          new PlanetarySystemArchitecture(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
            PlanetarySystemArchitectureRegime.EMPTY,
            0,
            0,
            0,
            0,
            [],
          );

        const emptyLayout =
          new PlanetarySystemOrbitalLayout(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
            0.05,
            100,
            [],
          );

        const emptyPeriods =
          new PlanetarySystemOrbitalPeriodLayout(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
            null,
            [],
          );

        const empty =
          PlanetarySystemOrbitalStabilityGenerator
            .generate(
              generationKey,
              singleSystem(),
              emptyArchitecture,
              emptyLayout,
              emptyPeriods,
            );

        expect(
          empty.regime,
        ).toBe(
          PlanetarySystemStabilityRegime.EMPTY,
        );

        const excludedArchitecture =
          new PlanetarySystemArchitecture(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMBINARY,
            PlanetarySystemArchitectureRegime.DYNAMICALLY_EXCLUDED,
            1,
            1,
            1,
            1,
            [],
          );

        const excludedLayout =
          new PlanetarySystemOrbitalLayout(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMBINARY,
            null,
            null,
            [],
          );

        const excludedPeriods =
          new PlanetarySystemOrbitalPeriodLayout(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMBINARY,
            null,
            [],
          );

        const excluded =
          PlanetarySystemOrbitalStabilityGenerator
            .generate(
              generationKey,
              {
                ...circumbinarySystem(
                  3,
                  null,
                ),
                supportsCircumbinaryPlanets:
                  false,
              } as unknown as StellarSystem,
              excludedArchitecture,
              excludedLayout,
              excludedPeriods,
            );

        expect(
          excluded.regime,
        ).toBe(
          PlanetarySystemStabilityRegime.DYNAMICALLY_EXCLUDED,
        );
      },
    );

    function assessPair(
      innerAxisAu:
        number,

      outerAxisAu:
        number,

      innerMassEarth:
        number,

      outerMassEarth:
        number,
    ) {
      const topology =
        PlanetarySystemOrbitTopology.CIRCUMSTELLAR;

      const architecture =
        architectureFor(
          topology,
          [
            slot(
              1,
              innerAxisAu,
              innerMassEarth,
            ),
            slot(
              2,
              outerAxisAu,
              outerMassEarth,
            ),
          ],
        );

      const orbitalLayout =
        layoutFor(
          topology,
          [
            orbit(
              1,
              innerAxisAu,
              0,
            ),
            orbit(
              2,
              outerAxisAu,
              0,
            ),
          ],
          0.05,
          100,
        );

      return PlanetarySystemOrbitalStabilityGenerator
        .generate(
          generationKey,
          singleSystem(),
          architecture,
          orbitalLayout,
          periodsFor(
            topology,
            orbitalLayout,
            1,
          ),
        );
    }

    function architectureFor(
      topology:
        PlanetarySystemOrbitTopology,

      slots:
        readonly PlanetaryArchitectureSlot[],
    ): PlanetarySystemArchitecture {

      return new PlanetarySystemArchitecture(
        locator,
        topology,
        slots.length ===
          1
          ? PlanetarySystemArchitectureRegime.SINGLE_PLANET
          : PlanetarySystemArchitectureRegime.COMPACT_MULTIPLANET,
        slots.length,
        slots.reduce(
          (
            total,
            value,
          ) =>
            total +
            value.inheritedSolidCoreMassEarth,
          0,
        ),
        0,
        0,
        slots,
      );
    }

    function slot(
      ordinal:
        number,

      radiusAu:
        number,

      massEarth:
        number,
    ): PlanetaryArchitectureSlot {

      return new PlanetaryArchitectureSlot(
        ordinal,
        bodyLocator(
          ordinal,
        ),
        bodySeed(
          ordinal,
        ),
        [
          ordinal,
        ],
        [
          ordinal,
        ],
        radiusAu,
        massEarth,
        new ProtoplanetCompositionMixture(
          0,
          1,
          0,
          0,
        ),
        0.8,
        0.2,
        0.5,
        0.1,
        0,
        0,
      );
    }

    function orbit(
      ordinal:
        number,

      semiMajorAxisAu:
        number,

      eccentricity:
        number,
    ): PlanetaryOrbitalElements {

      return new PlanetaryOrbitalElements(
        ordinal,
        bodyLocator(
          ordinal,
        ),
        bodySeed(
          ordinal,
        ),
        semiMajorAxisAu,
        eccentricity,
        ordinal ===
          1
          ? 1
          : 2,
        ordinal ===
          1
          ? 10
          : 20,
        30,
      );
    }

    function layoutFor(
      topology:
        PlanetarySystemOrbitTopology,

      orbits:
        readonly PlanetaryOrbitalElements[],

      innerAu:
        number,

      outerAu:
        number,
    ): PlanetarySystemOrbitalLayout {

      return new PlanetarySystemOrbitalLayout(
        locator,
        topology,
        innerAu,
        outerAu,
        orbits,
      );
    }

    function periodsFor(
      topology:
        PlanetarySystemOrbitTopology,

      orbitalLayout:
        PlanetarySystemOrbitalLayout,

      massSolar:
        number,
    ): PlanetarySystemOrbitalPeriodLayout {

      return new PlanetarySystemOrbitalPeriodLayout(
        locator,
        topology,
        massSolar,
        orbitalLayout.orbits.map(
          orbitValue => {
            const periodYears =
              Math.sqrt(
                orbitValue.semiMajorAxisAu **
                  3 /
                massSolar,
              );

            return new PlanetaryOrbitalPeriod(
              orbitValue.planetOrdinal,
              orbitValue.bodyLocator,
              orbitValue.bodySeed,
              orbitValue.semiMajorAxisAu,
              massSolar,
              periodYears,
              periodYears *
                365.25,
            );
          },
        ),
      );
    }

    function singleSystem():
      StellarSystem {

      return {
        generationKey,
        locator,
        seed:
          new SystemSeed(
            '0123456789ABCDEFFEDCBA9876543210',
          ),
        multiplicity:
          StellarSystemMultiplicity.SINGLE,
        circumbinaryPlanetCompatibility:
          null,
      } as unknown as StellarSystem;
    }

    function circumbinarySystem(
      minimumStableSemiMajorAxisAu:
        number,

      maximumStableSemiMajorAxisAu:
        number | null,

      multiplicity =
        StellarSystemMultiplicity.BINARY,
    ): StellarSystem {

      return {
        generationKey,
        locator,
        seed:
          new SystemSeed(
            '0123456789ABCDEFFEDCBA9876543210',
          ),
        multiplicity,
        circumbinaryPlanetCompatibility: {
          isCompatible:
            true,
          minimumStableSemiMajorAxisAu,
          maximumStableSemiMajorAxisAu,
        },
      } as unknown as StellarSystem;
    }

    function bodyLocator(
      ordinal:
        number,
    ): BodyLocator {

      return new BodyLocator(
        locator.galaxyIndex,
        locator.sectorKey,
        locator.galacticObjectIndex,
        BigInt(
          ordinal -
            1,
        ),
      );
    }

    function bodySeed(
      ordinal:
        number,
    ): BodySeed {

      return new BodySeed(
        ordinal ===
          1
          ? '11111111111111111111111111111111'
          : '22222222222222222222222222222222',
      );
    }
  },
);
