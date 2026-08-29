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
} from '../../domain/seed/hierarchical-seeds';

import {
  type PlanetaryArchitectureSlot,
} from '../../domain/planetary/planetary-architecture-slot';

import {
  ProtoplanetCompositionMixture,
} from '../../domain/planetary/protoplanet-composition-mixture';

import {
  type PlanetaryDesignation,
} from '../../domain/planetary/planetary-designation';

import {
  type PlanetaryOrbitHabitableZoneClassification,
} from '../../domain/planetary/planetary-orbit-habitable-zone-classification';

import {
  type PlanetaryOrbitalElements,
} from '../../domain/planetary/planetary-orbital-elements';

import {
  type PlanetaryOrbitalPeriod,
} from '../../domain/planetary/planetary-orbital-period';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  PlanetGenerator,
} from './planet-generator';

describe(
  'PlanetGenerator point 19.1',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should materialize a requested BodyLocator as a Planet while preserving every canonical point-18 identity/reference',
      () => {
        const fixture =
          systemFixture(2);

        const requestedLocator =
          new BodyLocator(
            fixture.system.locator.galaxyIndex,
            fixture.system.locator.sectorKey,
            fixture.system.locator.galacticObjectIndex,
            1n,
          );

        const planet =
          PlanetGenerator
            .generate(
              generationKey,
              fixture.system,
              requestedLocator,
            );

        expect(
          planet.planetOrdinal,
        ).toBe(2);

        expect(
          planet.architectureSlot,
        ).toBe(
          fixture.slots[1],
        );

        expect(
          planet.locator,
        ).toBe(
          fixture.slots[1].bodyLocator,
        );

        expect(
          planet.locator,
        ).not.toBe(
          requestedLocator,
        );

        expect(
          planet.seed,
        ).toBe(
          fixture.slots[1].bodySeed,
        );

        expect(
          planet.orbit,
        ).toBe(
          fixture.orbits[1],
        );

        expect(
          planet.orbitalPeriod,
        ).toBe(
          fixture.periods[1],
        );

        expect(
          planet.habitableZoneClassification,
        ).toBe(
          fixture.classifications[1],
        );

        expect(
          planet.designation,
        ).toBe(
          fixture.designations[1],
        );

        expect(
          planet.name,
        ).toBe(
          'Testara c',
        );

        expect(
          planet.massEarth,
        ).toBeGreaterThanOrEqual(
          fixture.slots[1].inheritedSolidCoreMassEarth,
        );

        expect(
          planet.radiusEarth,
        ).toBeGreaterThan(0);

        expect(
          planet.densityGramsPerCubicCentimeter,
        ).toBeGreaterThan(0);

        expect(
          planet.surfaceGravityEarth,
        ).toBeGreaterThan(0);
      },
    );

    it(
      'should materialize the complete mature planet population in frozen radial ordinal order',
      () => {
        const fixture =
          systemFixture(3);

        const planets =
          PlanetGenerator
            .generateAll(
              generationKey,
              fixture.system,
            );

        expect(
          Object.isFrozen(
            planets,
          ),
        ).toBe(true);

        expect(
          planets.map(
            planet =>
              planet.planetOrdinal,
          ),
        ).toEqual([
          1,
          2,
          3,
        ]);

        expect(
          planets.map(
            planet =>
              planet.bodyIndex,
          ),
        ).toEqual([
          0n,
          1n,
          2n,
        ]);

        expect(
          planets.map(
            planet =>
              planet.name,
          ),
        ).toEqual([
          'Testara b',
          'Testara c',
          'Testara d',
        ]);

        for (
          let index = 0;
          index <
            planets.length;
          index += 1
        ) {
          expect(
            planets[index].seed,
          ).toBe(
            fixture.slots[index].bodySeed,
          );
        }
      },
    );

    it(
      'should return an empty immutable population when point 18 produced no mature planets',
      () => {
        const fixture =
          systemFixture(0);

        const planets =
          PlanetGenerator
            .generateAll(
              generationKey,
              fixture.system,
            );

        expect(
          planets,
        ).toEqual([]);

        expect(
          Object.isFrozen(
            planets,
          ),
        ).toBe(true);
      },
    );

    it(
      'should be exactly deterministic and independent from materialization order without deriving new seeds',
      () => {
        const fixture =
          systemFixture(3);

        const before =
          PlanetGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.slots[0].bodyLocator,
            );

        PlanetGenerator
          .generate(
            generationKey,
            fixture.system,
            fixture.slots[2].bodyLocator,
          );

        const after =
          PlanetGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.slots[0].bodyLocator,
            );

        expect(
          after.planetOrdinal,
        ).toBe(
          before.planetOrdinal,
        );

        expect(
          after.locator,
        ).toBe(
          before.locator,
        );

        expect(
          after.seed,
        ).toBe(
          before.seed,
        );

        expect(
          after.orbit,
        ).toBe(
          before.orbit,
        );

        expect(
          after.designation,
        ).toBe(
          before.designation,
        );

        expect(
          after.physicalProperties,
        ).toEqual(
          before.physicalProperties,
        );
      },
    );

    it(
      'should reject a PlanetarySystem from another UniverseGenerationKey',
      () => {
        const fixture =
          systemFixture(1);

        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '1111-2222-3333-4444-5555-6666-7777-8888',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            PlanetGenerator
              .generate(
                otherGenerationKey,
                fixture.system,
                fixture.slots[0].bodyLocator,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            PlanetGenerator
              .generateAll(
                otherGenerationKey,
                fixture.system,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject BodyLocators belonging to another system or outside the mature point-18 planet population',
      () => {
        const fixture =
          systemFixture(2);

        expect(
          () =>
            PlanetGenerator
              .generate(
                generationKey,
                fixture.system,
                new BodyLocator(
                  fixture.system.locator.galaxyIndex,
                  fixture.system.locator.sectorKey,
                  fixture.system.locator.galacticObjectIndex +
                    1n,
                  0n,
                ),
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            PlanetGenerator
              .generate(
                generationKey,
                fixture.system,
                new BodyLocator(
                  fixture.system.locator.galaxyIndex,
                  fixture.system.locator.sectorKey,
                  fixture.system.locator.galacticObjectIndex,
                  2n,
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function systemFixture(
      planetCount:
        number,
    ): {
      readonly system:
        PlanetarySystem;
      readonly slots:
        readonly PlanetaryArchitectureSlot[];
      readonly orbits:
        readonly PlanetaryOrbitalElements[];
      readonly periods:
        readonly PlanetaryOrbitalPeriod[];
      readonly classifications:
        readonly PlanetaryOrbitHabitableZoneClassification[];
      readonly designations:
        readonly PlanetaryDesignation[];
    } {
      const locator =
        new SystemLocator(
          4n,
          -12n,
          7n,
        );

      const slots:
        PlanetaryArchitectureSlot[] = [];

      const orbits:
        PlanetaryOrbitalElements[] = [];

      const periods:
        PlanetaryOrbitalPeriod[] = [];

      const classifications:
        PlanetaryOrbitHabitableZoneClassification[] = [];

      const designations:
        PlanetaryDesignation[] = [];

      for (
        let index = 0;
        index <
          planetCount;
        index += 1
      ) {
        const planetOrdinal =
          index +
          1;

        const bodyLocator =
          new BodyLocator(
            locator.galaxyIndex,
            locator.sectorKey,
            locator.galacticObjectIndex,
            BigInt(
              index,
            ),
          );

        const bodySeed =
          new BodySeed(
            `${planetOrdinal}`
              .repeat(32),
          );

        const slot = {
          planetOrdinal,
          bodyLocator,
          bodySeed,
          inheritedSolidCoreMassEarth:
            0.8 +
            planetOrdinal *
              0.6,
          inheritedEnvelopeAcquisitionPotential01:
            0.25 +
            0.12 *
              index,
          inheritedVolatileRetentionPotential01:
            0.45 +
            0.10 *
              index,
          inheritedCompositionMixture:
            new ProtoplanetCompositionMixture(
              0,
              Math.max(
                0.25,
                0.75 -
                  0.15 *
                    index,
              ),
              Math.min(
                0.65,
                0.25 +
                  0.15 *
                    index,
              ),
              0,
            ),
        } as PlanetaryArchitectureSlot;

        const orbit = {
          planetOrdinal,
          bodyLocator,
          bodySeed,
          semiMajorAxisAu:
            planetOrdinal,
          periastronAu:
            planetOrdinal *
            0.98,
          apoastronAu:
            planetOrdinal *
            1.02,
        } as PlanetaryOrbitalElements;

        const period = {
          planetOrdinal,
          bodyLocator,
          bodySeed,
          sourceSemiMajorAxisAu:
            planetOrdinal,
          periodYears:
            planetOrdinal,
          periodDays:
            planetOrdinal *
            365.25,
        } as PlanetaryOrbitalPeriod;

        const classification = {
          planetOrdinal,
          bodyLocator,
          bodySeed,
        } as PlanetaryOrbitHabitableZoneClassification;

        const designation = {
          planetOrdinal,
          bodyLocator,
          bodySeed,
          name:
            `Testara ${String.fromCharCode(
              'a'.charCodeAt(0) +
              planetOrdinal,
            )}`,
        } as PlanetaryDesignation;

        slots.push(
          slot,
        );

        orbits.push(
          orbit,
        );

        periods.push(
          period,
        );

        classifications.push(
          classification,
        );

        designations.push(
          designation,
        );
      }

      const system = {
        generationKey,
        locator,
        planetCount,
        formationBlueprint: {
          maxGasCaptureBudgetEarth:
            planetCount *
            8,
        },
        architecture: {
          orbitTopology:
            PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
        },
        planetSlots:
          slots,
        orbits,
        orbitalPeriods:
          periods,
        orbitHabitableZoneClassifications:
          classifications,
        planetDesignations:
          designations,
      } as unknown as PlanetarySystem;

      return {
        system,
        slots,
        orbits,
        periods,
        classifications,
        designations,
      };
    }
  },
);
