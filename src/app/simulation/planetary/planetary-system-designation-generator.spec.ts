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
  PlanetaryArchitectureSlot,
} from '../../domain/planetary/planetary-architecture-slot';

import {
  PlanetarySystemArchitecture,
} from '../../domain/planetary/planetary-system-architecture';

import {
  PlanetarySystemArchitectureRegime,
} from '../../domain/planetary/planetary-system-architecture-regime';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  ProtoplanetCompositionMixture,
} from '../../domain/planetary/protoplanet-composition-mixture';

import {
  StellarDesignation,
} from '../../domain/stellar/stellar-designation';

import {
  type StellarSystem,
} from '../../domain/stellar/stellar-system';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  PlanetarySystemDesignationGenerator,
} from './planetary-system-designation-generator';

describe(
  'PlanetarySystemDesignationGenerator point 18.8 V1',
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
        0n,
        0n,
        0n,
      );

    const systemDesignation =
      new StellarDesignation(
        'Jotheria',
        'GEN-V1-G0-S0-O0-SYS-DC2EACC73FFB3E9388F8BEB9FEBE1F2E',
      );

    const stellarSystem = {
      generationKey,
      locator,
      designation:
        systemDesignation,
    } as unknown as StellarSystem;

    it(
      'should assign b/c/d by frozen radial planetOrdinal and preserve every point-18.2 Body identity',
      () => {
        const architecture =
          threePlanetArchitecture();

        const catalog =
          PlanetarySystemDesignationGenerator
            .generate(
              generationKey,
              stellarSystem,
              architecture,
            );

        expect(
          catalog.systemDesignation,
        ).toBe(
          systemDesignation,
        );

        expect(
          catalog.designations.map(
            designation =>
              designation.name,
          ),
        ).toEqual([
          'Jotheria b',
          'Jotheria c',
          'Jotheria d',
        ]);

        expect(
          catalog.designations.map(
            designation =>
              designation.catalogSuffix,
          ),
        ).toEqual([
          'b',
          'c',
          'd',
        ]);

        for (
          let index = 0;
          index <
            architecture.planetSlots.length;
          index += 1
        ) {
          const slot =
            architecture.planetSlots[index];

          const designation =
            catalog.designations[index];

          expect(
            designation.planetOrdinal,
          ).toBe(
            slot.planetOrdinal,
          );

          expect(
            designation.bodyLocator,
          ).toBe(
            slot.bodyLocator,
          );

          expect(
            designation.bodySeed,
          ).toBe(
            slot.bodySeed,
          );

          expect(
            designation.proceduralCode,
          ).toBe(
            `${systemDesignation.proceduralCode}` +
            `-P${slot.planetOrdinal}` +
            `-${designation.catalogSuffix}` +
            `-BODY-${slot.bodySeed.normalizedValue}`,
          );
        }
      },
    );

    it(
      'should preserve an empty or dynamically excluded architecture without inventing planet names',
      () => {
        for (
          const architecture
          of [
            new PlanetarySystemArchitecture(
              locator,
              PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
              PlanetarySystemArchitectureRegime.EMPTY,
              0,
              0,
              0,
              0,
              [],
            ),
            new PlanetarySystemArchitecture(
              locator,
              PlanetarySystemOrbitTopology.CIRCUMBINARY,
              PlanetarySystemArchitectureRegime.DYNAMICALLY_EXCLUDED,
              2,
              1,
              2,
              1,
              [],
            ),
          ]
        ) {
          const catalog =
            PlanetarySystemDesignationGenerator
              .generate(
                generationKey,
                stellarSystem,
                architecture,
              );

          expect(
            catalog.planetCount,
          ).toBe(0);

          expect(
            catalog.designations,
          ).toEqual([]);
        }
      },
    );

    it(
      'should be exactly deterministic and independent from unrelated designation materialization order',
      () => {
        const architecture =
          threePlanetArchitecture();

        const before =
          PlanetarySystemDesignationGenerator
            .generate(
              generationKey,
              stellarSystem,
              architecture,
            );

        const unrelatedLocator =
          new SystemLocator(
            7n,
            -9n,
            11n,
          );

        PlanetarySystemDesignationGenerator
          .generate(
            generationKey,
            {
              generationKey,
              locator:
                unrelatedLocator,
              designation:
                new StellarDesignation(
                  'Penaoria',
                  'GEN-V1-G7-S-9-O11-SYS-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                ),
            } as unknown as StellarSystem,
            new PlanetarySystemArchitecture(
              unrelatedLocator,
              PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
              PlanetarySystemArchitectureRegime.EMPTY,
              0,
              0,
              0,
              0,
              [],
            ),
          );

        const after =
          PlanetarySystemDesignationGenerator
            .generate(
              generationKey,
              stellarSystem,
              architecture,
            );

        expect(
          after.designations.map(
            designation => ({
              name:
                designation.name,
              code:
                designation.proceduralCode,
              seed:
                designation.bodySeed.normalizedValue,
            }),
          ),
        ).toEqual(
          before.designations.map(
            designation => ({
              name:
                designation.name,
              code:
                designation.proceduralCode,
              seed:
                designation.bodySeed.normalizedValue,
            }),
          ),
        );
      },
    );

    it(
      'should reject a foreign generation key or architecture locator',
      () => {
        const foreignKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '1122-3344-5566-7788-99AA-BBCC-DDEE-FF00',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            PlanetarySystemDesignationGenerator
              .generate(
                foreignKey,
                stellarSystem,
                threePlanetArchitecture(),
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            PlanetarySystemDesignationGenerator
              .generate(
                generationKey,
                stellarSystem,
                new PlanetarySystemArchitecture(
                  new SystemLocator(
                    1n,
                    0n,
                    0n,
                  ),
                  PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
                  PlanetarySystemArchitectureRegime.EMPTY,
                  0,
                  0,
                  0,
                  0,
                  [],
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function threePlanetArchitecture():
      PlanetarySystemArchitecture {

      return new PlanetarySystemArchitecture(
        locator,
        PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
        PlanetarySystemArchitectureRegime.COMPACT_MULTIPLANET,
        3,
        3,
        0,
        0,
        [
          slot(
            1,
            1,
            '11111111111111111111111111111111',
          ),
          slot(
            2,
            1.5,
            '22222222222222222222222222222222',
          ),
          slot(
            3,
            2,
            '33333333333333333333333333333333',
          ),
        ],
      );
    }

    function slot(
      ordinal:
        number,

      radiusAu:
        number,

      seedHex:
        string,
    ): PlanetaryArchitectureSlot {

      return new PlanetaryArchitectureSlot(
        ordinal,
        new BodyLocator(
          locator.galaxyIndex,
          locator.sectorKey,
          locator.galacticObjectIndex,
          BigInt(
            ordinal -
              1,
          ),
        ),
        new BodySeed(
          seedHex,
        ),
        [
          ordinal,
        ],
        [
          ordinal,
        ],
        radiusAu,
        1,
        new ProtoplanetCompositionMixture(
          0,
          1,
          0,
          0,
        ),
        0.8,
        0.2,
        0.4,
        0.1,
        0,
        0,
      );
    }
  },
);
