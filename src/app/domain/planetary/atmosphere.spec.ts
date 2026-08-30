import {
  BodyLocator,
  SystemLocator,
} from '../generation/procedural-locator';

import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  Atmosphere,
} from './atmosphere';

import {
  type Planet,
} from './planet';

import {
  PlanetType,
} from './planet-type';

import {
  type PlanetarySystem,
} from './planetary-system';

describe(
  'Atmosphere point 20.1',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const systemLocator =
      new SystemLocator(
        4n,
        -9n,
        12n,
      );

    const locator =
      new BodyLocator(
        4n,
        -9n,
        12n,
        1n,
      );

    const seed =
      new BodySeed(
        '22222222222222222222222222222222',
      );

    it(
      'should bind the exact coherent Planet and reuse its canonical BodyLocator/BodySeed without point-20.2 bulk properties',
      () => {
        const planet =
          planetFixture();

        const atmosphere =
          new Atmosphere(
            planet,
          );

        expect(
          atmosphere.hostPlanet,
        ).toBe(
          planet,
        );

        expect(
          atmosphere.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          atmosphere.hostPlanetarySystem,
        ).toBe(
          planet.hostPlanetarySystem,
        );

        expect(
          atmosphere.systemLocator,
        ).toBe(
          systemLocator,
        );

        expect(
          atmosphere.planetOrdinal,
        ).toBe(2);

        expect(
          atmosphere.locator,
        ).toBe(
          locator,
        );

        expect(
          atmosphere.seed,
        ).toBe(
          seed,
        );

        expect(
          atmosphere.name,
        ).toBe(
          'Testara c',
        );

        expect(
          atmosphere.planetType,
        ).toBe(
          PlanetType.ROCKY,
        );

        expect(
          atmosphere.sourceMassEarth,
        ).toBe(1.2);

        expect(
          atmosphere.sourceRadiusEarth,
        ).toBe(1.05);

        expect(
          atmosphere.sourceSurfaceGravityEarth,
        ).toBe(1.08);

        expect(
          atmosphere.sourceEnvelopeMassFraction01,
        ).toBe(0.015);

        expect(
          atmosphere.sourceReferenceMeanInsolationEarth,
        ).toBe(0.92);

        expect(
          atmosphere.sourceReferenceBondAlbedo01,
        ).toBe(0.21);

        for (
          const point202Property
          of [
            'surfacePressurePascal',
            'atmosphericDensityKilogramsPerCubicMeter',
            'gasComposition',
          ]
        ) {
          expect(
            point202Property in
              atmosphere,
          ).toBe(false);
        }
      },
    );

    it(
      'should reject a physically incoherent host Planet',
      () => {
        const planet =
          planetFixture({
            isTypePhysicallyCoherent:
              false,
          });

        expect(
          () =>
            new Atmosphere(
              planet,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a host Planet whose BodyLocator does not belong to planetOrdinal',
      () => {
        const planet =
          planetFixture({
            locator:
              new BodyLocator(
                4n,
                -9n,
                12n,
                0n,
              ),
          });

        expect(
          () =>
            new Atmosphere(
              planet,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function planetFixture(
      overrides:
        Partial<Planet> = {},
    ): Planet {

      const system = {
        generationKey,
        locator:
          systemLocator,
        planetCount:
          2,
      } as PlanetarySystem;

      return {
        generationKey,
        hostPlanetarySystem:
          system,
        systemLocator,
        planetOrdinal:
          2,
        locator,
        seed,
        designation: {
          name:
            'Testara c',
        },
        name:
          'Testara c',
        planetType:
          PlanetType.ROCKY,
        massEarth:
          1.2,
        radiusEarth:
          1.05,
        surfaceGravityEarth:
          1.08,
        physicalProperties: {
          envelopeMassFraction01:
            0.015,
        },
        typeClassification: {
          referenceMeanInsolationEarth:
            0.92,
        },
        referenceBondAlbedo01:
          0.21,
        isTypePhysicallyCoherent:
          true,
        ...overrides,
      } as unknown as Planet;
    }
  },
);
