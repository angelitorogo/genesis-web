import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  SectorLocator,
  SystemLocator,
} from '../../../domain/generation/procedural-locator';

import {
  type DiscoveryEntity,
} from './discovery.entity';

import {
  CorruptDiscoveryLineageError,
  rehydrateDiscoveryLocator,
} from './discovery-locator-rehydrator';

describe(
  'rehydrateDiscoveryLocator',
  () => {
    const base =
      {
        universeSeed:
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',

        generatorVersionCode:
          1,

        targetSeed:
          'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',

        galaxyIndex:
          '0',

        discoveryStateCode:
          1 as const,

        firstKnownAtEpochMs:
          1,

        updatedAtEpochMs:
          1,
      };

    it(
      'should reconstruct GalaxyLocator',
      () => {
        const entity:
          DiscoveryEntity =
          {
            ...base,

            targetTypeCode:
              1,

            sectorKey:
              null,

            galacticObjectIndex:
              null,

            bodyIndex:
              null,

            civilizationIndex:
              null,
          };

        const locator =
          rehydrateDiscoveryLocator(
            entity,
          );

        expect(
          locator,
        ).toEqual(
          new GalaxyLocator(
            0n,
          ),
        );
      },
    );

    it(
      'should reconstruct SectorLocator',
      () => {
        const entity:
          DiscoveryEntity =
          {
            ...base,

            targetTypeCode:
              2,

            sectorKey:
              '123456789',

            galacticObjectIndex:
              null,

            bodyIndex:
              null,

            civilizationIndex:
              null,
          };

        expect(
          rehydrateDiscoveryLocator(
            entity,
          ),
        ).toEqual(
          new SectorLocator(
            0n,
            123456789n,
          ),
        );
      },
    );

    it(
      'should reconstruct GalacticObjectLocator',
      () => {
        const entity:
          DiscoveryEntity =
          {
            ...base,

            targetTypeCode:
              3,

            sectorKey:
              '123456789',

            galacticObjectIndex:
              '7',

            bodyIndex:
              null,

            civilizationIndex:
              null,
          };

        expect(
          rehydrateDiscoveryLocator(
            entity,
          ),
        ).toEqual(
          new GalacticObjectLocator(
            0n,
            123456789n,
            7n,
          ),
        );
      },
    );

    it(
      'should reconstruct SystemLocator',
      () => {
        const entity:
          DiscoveryEntity =
          {
            ...base,

            targetTypeCode:
              4,

            sectorKey:
              '123456789',

            galacticObjectIndex:
              '7',

            bodyIndex:
              null,

            civilizationIndex:
              null,
          };

        expect(
          rehydrateDiscoveryLocator(
            entity,
          ),
        ).toEqual(
          new SystemLocator(
            0n,
            123456789n,
            7n,
          ),
        );
      },
    );

    it(
      'should reconstruct BodyLocator',
      () => {
        const entity:
          DiscoveryEntity =
          {
            ...base,

            targetTypeCode:
              5,

            sectorKey:
              '123456789',

            galacticObjectIndex:
              '7',

            bodyIndex:
              '3',

            civilizationIndex:
              null,
          };

        expect(
          rehydrateDiscoveryLocator(
            entity,
          ),
        ).toEqual(
          new BodyLocator(
            0n,
            123456789n,
            7n,
            3n,
          ),
        );
      },
    );

    it(
      'should reconstruct CivilizationLocator',
      () => {
        const entity:
          DiscoveryEntity =
          {
            ...base,

            targetTypeCode:
              6,

            sectorKey:
              '123456789',

            galacticObjectIndex:
              '7',

            bodyIndex:
              '3',

            civilizationIndex:
              '1',
          };

        expect(
          rehydrateDiscoveryLocator(
            entity,
          ),
        ).toEqual(
          new CivilizationLocator(
            0n,
            123456789n,
            7n,
            3n,
            1n,
          ),
        );
      },
    );

    it(
      'should reject an unknown target type',
      () => {
        const entity =
          {
            ...base,

            targetTypeCode:
              99,

            sectorKey:
              null,

            galacticObjectIndex:
              null,

            bodyIndex:
              null,

            civilizationIndex:
              null,
          } as DiscoveryEntity;

        expect(
          () =>
            rehydrateDiscoveryLocator(
              entity,
            ),
        ).toThrow(
          CorruptDiscoveryLineageError,
        );
      },
    );

    it(
      'should reject an invalid lineage nullability matrix',
      () => {
        const entity:
          DiscoveryEntity =
          {
            ...base,

            targetTypeCode:
              1,

            sectorKey:
              '1',

            galacticObjectIndex:
              null,

            bodyIndex:
              null,

            civilizationIndex:
              null,
          };

        expect(
          () =>
            rehydrateDiscoveryLocator(
              entity,
            ),
        ).toThrow(
          CorruptDiscoveryLineageError,
        );
      },
    );

    it(
      'should reject negative procedural indices',
      () => {
        const entity:
          DiscoveryEntity =
          {
            ...base,

            targetTypeCode:
              5,

            sectorKey:
              '0',

            galacticObjectIndex:
              '7',

            bodyIndex:
              '-1',

            civilizationIndex:
              null,
          };

        expect(
          () =>
            rehydrateDiscoveryLocator(
              entity,
            ),
        ).toThrow(
          CorruptDiscoveryLineageError,
        );
      },
    );

    it(
      'should preserve signed Long sectorKey values',
      () => {
        const longMin =
          '-9223372036854775808';

        const entity:
          DiscoveryEntity =
          {
            ...base,

            targetTypeCode:
              2,

            sectorKey:
              longMin,

            galacticObjectIndex:
              null,

            bodyIndex:
              null,

            civilizationIndex:
              null,
          };

        expect(
          rehydrateDiscoveryLocator(
            entity,
          ),
        ).toEqual(
          new SectorLocator(
            0n,
            -(1n << 63n),
          ),
        );
      },
    );

    it(
      'should reject values outside signed Long range',
      () => {
        const entity:
          DiscoveryEntity =
          {
            ...base,

            targetTypeCode:
              2,

            sectorKey:
              '9223372036854775808',

            galacticObjectIndex:
              null,

            bodyIndex:
              null,

            civilizationIndex:
              null,
          };

        expect(
          () =>
            rehydrateDiscoveryLocator(
              entity,
            ),
        ).toThrow(
          CorruptDiscoveryLineageError,
        );
      },
    );

    it(
      'should reject non-canonical decimal values',
      () => {
        const entity:
          DiscoveryEntity =
          {
            ...base,

            targetTypeCode:
              2,

            sectorKey:
              '0001',

            galacticObjectIndex:
              null,

            bodyIndex:
              null,

            civilizationIndex:
              null,
          };

        expect(
          () =>
            rehydrateDiscoveryLocator(
              entity,
            ),
        ).toThrow(
          CorruptDiscoveryLineageError,
        );
      },
    );

    it(
      'should reject a missing required lineage value',
      () => {
        const entity:
          DiscoveryEntity =
          {
            ...base,

            targetTypeCode:
              2,

            sectorKey:
              null,

            galacticObjectIndex:
              null,

            bodyIndex:
              null,

            civilizationIndex:
              null,
          };

        expect(
          () =>
            rehydrateDiscoveryLocator(
              entity,
            ),
        ).toThrow(
          CorruptDiscoveryLineageError,
        );
      },
    );

    it(
      'should reject a non-decimal Long value',
      () => {
        const entity:
          DiscoveryEntity =
          {
            ...base,

            targetTypeCode:
              2,

            sectorKey:
              'NOT-A-LONG',

            galacticObjectIndex:
              null,

            bodyIndex:
              null,

            civilizationIndex:
              null,
          };

        expect(
          () =>
            rehydrateDiscoveryLocator(
              entity,
            ),
        ).toThrow(
          CorruptDiscoveryLineageError,
        );
      },
    );

  },
);