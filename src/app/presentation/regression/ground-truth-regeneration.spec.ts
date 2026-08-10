import {
  type DiscoveryEntity,
} from '../../data/local/entity/discovery.entity';

import {
  rehydrateDiscoveryLocator,
} from '../../data/local/entity/discovery-locator-rehydrator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  BodyLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

describe(
  'Ground Truth regeneration from persisted knowledge',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should reconstruct the locator and regenerate the exact target seed',
      () => {
        const entity:
          DiscoveryEntity =
          {
            universeSeed:
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',

            generatorVersionCode:
              1,

            targetTypeCode:
              5,

            targetSeed:
              '86FE2CB4F2CC4678D23F310333F15EF7',

            galaxyIndex:
              '0',

            sectorKey:
              '123456789',

            galacticObjectIndex:
              '7',

            bodyIndex:
              '3',

            civilizationIndex:
              null,

            discoveryStateCode:
              4,

            firstKnownAtEpochMs:
              1,

            updatedAtEpochMs:
              2,
          };

        const locator =
          rehydrateDiscoveryLocator(
            entity,
          );

        expect(
          locator,
        ).toEqual(
          new BodyLocator(
            0n,
            123456789n,
            7n,
            3n,
          ),
        );

        const regeneratedSeed =
          ProceduralTargetResolver
            .resolveTargetSeed(
              generationKey,
              locator,
            );

        expect(
          regeneratedSeed
            .normalizedValue,
        ).toBe(
          entity.targetSeed,
        );
      },
    );

    it(
      'should persist observed knowledge and procedural identity only',
      () => {
        const entity:
          DiscoveryEntity =
          {
            universeSeed:
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',

            generatorVersionCode:
              1,

            targetTypeCode:
              5,

            targetSeed:
              '86FE2CB4F2CC4678D23F310333F15EF7',

            galaxyIndex:
              '0',

            sectorKey:
              '123456789',

            galacticObjectIndex:
              '7',

            bodyIndex:
              '3',

            civilizationIndex:
              null,

            discoveryStateCode:
              4,

            firstKnownAtEpochMs:
              1,

            updatedAtEpochMs:
              2,
          };

        expect(
          Object
            .keys(
              entity,
            )
            .sort(),
        ).toEqual([
          'bodyIndex',
          'civilizationIndex',
          'discoveryStateCode',
          'firstKnownAtEpochMs',
          'galacticObjectIndex',
          'galaxyIndex',
          'generatorVersionCode',
          'sectorKey',
          'targetSeed',
          'targetTypeCode',
          'universeSeed',
          'updatedAtEpochMs',
        ]);

        expect(
          'mass' in entity,
        ).toBe(false);

        expect(
          'radius' in entity,
        ).toBe(false);

        expect(
          'temperature' in entity,
        ).toBe(false);

        expect(
          'physicalProperties' in entity,
        ).toBe(false);

        expect(
          'groundTruth' in entity,
        ).toBe(false);
      },
    );
  },
);