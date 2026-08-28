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
  PlanetaryOrbitalElements,
} from '../../domain/planetary/planetary-orbital-elements';

import {
  PlanetaryFormationMaturityRegime,
} from '../../domain/planetary/planetary-formation-maturity-regime';

import {
  PlanetarySystemFormationBlueprint,
} from '../../domain/planetary/planetary-system-formation-blueprint';

import {
  PlanetarySystemOrbitalLayout,
} from '../../domain/planetary/planetary-system-orbital-layout';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

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
  PlanetarySystemOrbitalPeriodGenerator,
} from './planetary-system-orbital-period-generator';

describe(
  'PlanetarySystemOrbitalPeriodGenerator point 18.4',
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
        3n,
        5n,
        7n,
      );

    it(
      'should compute host-dominated Keplerian periods without mutating point-18.3 geometry',
      () => {
        const orbitalLayout =
          layout(
            PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
            [
              1,
              4,
            ],
          );

        const before =
          orbitalLayout
            .orbits
            .map(
              orbit => ({
                a:
                  orbit.semiMajorAxisAu,
                e:
                  orbit.eccentricity,
              }),
            );

        const periods =
          PlanetarySystemOrbitalPeriodGenerator
            .generate(
              generationKey,
              singleSystem(),
              blueprint(1),
              orbitalLayout,
            );

        expect(
          periods.gravitatingMassSolar,
        ).toBe(1);

        expect(
          periods.periods[0].periodYears,
        ).toBe(1);

        expect(
          periods.periods[1].periodYears,
        ).toBe(8);

        expect(
          orbitalLayout
            .orbits
            .map(
              orbit => ({
                a:
                  orbit.semiMajorAxisAu,
                e:
                  orbit.eccentricity,
              }),
            ),
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should use A+B mass for P-type circumbinary periods and exclude tertiary mass',
      () => {
        const stellarSystem = {
          generationKey,
          locator,
          seed:
            new SystemSeed(
              '0123456789ABCDEFFEDCBA9876543210',
            ),
          multiplicity:
            StellarSystemMultiplicity.TRIPLE,
          secondaryCompanion: {
            physicalProperties: {
              initialMassSolar:
                0.5,
            },
          },
          tertiaryCompanion: {
            physicalProperties: {
              initialMassSolar:
                0.4,
            },
          },
        } as unknown as StellarSystem;

        const orbitalLayout =
          layout(
            PlanetarySystemOrbitTopology.CIRCUMBINARY,
            [
              3,
            ],
          );

        const periods =
          PlanetarySystemOrbitalPeriodGenerator
            .generate(
              generationKey,
              stellarSystem,
              blueprint(1),
              orbitalLayout,
            );

        expect(
          periods.gravitatingMassSolar,
        ).toBe(1.5);

        expect(
          periods.periods[0].periodYears,
        ).toBeCloseTo(
          Math.sqrt(
            27 /
            1.5,
          ),
          14,
        );
      },
    );

    it(
      'should reject a non-empty circumbinary period request when component B is unavailable',
      () => {
        const stellarSystem = {
          generationKey,
          locator,
          seed:
            new SystemSeed(
              '0123456789ABCDEFFEDCBA9876543210',
            ),
          multiplicity:
            StellarSystemMultiplicity.BINARY,
          secondaryCompanion:
            null,
        } as unknown as StellarSystem;

        expect(
          () =>
            PlanetarySystemOrbitalPeriodGenerator
              .generate(
                generationKey,
                stellarSystem,
                blueprint(1),
                layout(
                  PlanetarySystemOrbitTopology.CIRCUMBINARY,
                  [
                    3,
                  ],
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should return an empty period layout without requiring a companion mass when no mature planets exist',
      () => {
        const stellarSystem = {
          generationKey,
          locator,
          seed:
            new SystemSeed(
              '0123456789ABCDEFFEDCBA9876543210',
            ),
          multiplicity:
            StellarSystemMultiplicity.TRIPLE,
        } as unknown as StellarSystem;

        const periods =
          PlanetarySystemOrbitalPeriodGenerator
            .generate(
              generationKey,
              stellarSystem,
              blueprint(1),
              new PlanetarySystemOrbitalLayout(
                locator,
                PlanetarySystemOrbitTopology.CIRCUMBINARY,
                null,
                null,
                [],
              ),
            );

        expect(
          periods.planetCount,
        ).toBe(0);

        expect(
          periods.gravitatingMassSolar,
        ).toBeNull();
      },
    );

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
        secondaryCompanion:
          null,
      } as unknown as StellarSystem;
    }

    function layout(
      topology:
        PlanetarySystemOrbitTopology,

      semiMajorAxesAu:
        readonly number[],
    ): PlanetarySystemOrbitalLayout {

      const orbits =
        semiMajorAxesAu.map(
          (
            semiMajorAxisAu,
            index,
          ) =>
            new PlanetaryOrbitalElements(
              index +
                1,
              new BodyLocator(
                locator.galaxyIndex,
                locator.sectorKey,
                locator.galacticObjectIndex,
                BigInt(index),
              ),
              new BodySeed(
                index ===
                  0
                  ? '11111111111111111111111111111111'
                  : '22222222222222222222222222222222',
              ),
              semiMajorAxisAu,
              0,
              0,
              0,
              0,
            ),
        );

      return new PlanetarySystemOrbitalLayout(
        locator,
        topology,
        0.1,
        Math.max(
          10,
          ...semiMajorAxesAu,
        ),
        orbits,
      );
    }

    function blueprint(
      centralMassSolar:
        number,
    ): PlanetarySystemFormationBlueprint {

      return new PlanetarySystemFormationBlueprint(
        1,
        6,
        20,
        centralMassSolar,
        0.05,
        100,
        4_000,
        5,
        0,
        5,
        0,
        0,
        0,
        0,
        0,
        PlanetaryFormationMaturityRegime.NO_PLANET_FORMING_CORES,
        [],
      );
    }
  },
);
