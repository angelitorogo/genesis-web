import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  SectorLocator,
  SystemLocator,
  type ProceduralLocator,
} from '../generation/procedural-locator';

import {
  DiscoveryTargetType,
} from './discovery-target-type';

describe(
  'DiscoveryTargetType',
  () => {
    it(
      'should preserve the exact Android target type codes',
      () => {
        expect(
          DiscoveryTargetType
            .values
            .map(
              (targetType) => ({
                name:
                  targetType.name,

                code:
                  targetType.code,
              }),
            ),
        ).toEqual([
          {
            name:
              'GALAXY',

            code:
              1,
          },
          {
            name:
              'SECTOR',

            code:
              2,
          },
          {
            name:
              'GALACTIC_OBJECT',

            code:
              3,
          },
          {
            name:
              'SYSTEM',

            code:
              4,
          },
          {
            name:
              'BODY',

            code:
              5,
          },
          {
            name:
              'CIVILIZATION',

            code:
              6,
          },
        ]);
      },
    );

    it(
      'should resolve every valid code',
      () => {
        for (
          const targetType
          of DiscoveryTargetType.values
        ) {
          expect(
            DiscoveryTargetType
              .fromCode(
                targetType.code,
              ),
          ).toBe(
            targetType,
          );
        }
      },
    );

    it(
      'should reject invalid target type codes',
      () => {
        expect(
          DiscoveryTargetType
            .fromCodeOrNull(
              0,
            ),
        ).toBeNull();

        expect(
          DiscoveryTargetType
            .fromCodeOrNull(
              7,
            ),
        ).toBeNull();

        expect(
          () =>
            DiscoveryTargetType
              .fromCode(
                7,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should map every locator to its exact target type',
      () => {
        expect(
          DiscoveryTargetType
            .fromLocator(
              new GalaxyLocator(
                0n,
              ),
            ),
        ).toBe(
          DiscoveryTargetType
            .GALAXY,
        );

        expect(
          DiscoveryTargetType
            .fromLocator(
              new SectorLocator(
                0n,
                1n,
              ),
            ),
        ).toBe(
          DiscoveryTargetType
            .SECTOR,
        );

        expect(
          DiscoveryTargetType
            .fromLocator(
              new GalacticObjectLocator(
                0n,
                1n,
                2n,
              ),
            ),
        ).toBe(
          DiscoveryTargetType
            .GALACTIC_OBJECT,
        );

        expect(
          DiscoveryTargetType
            .fromLocator(
              new SystemLocator(
                0n,
                1n,
                2n,
              ),
            ),
        ).toBe(
          DiscoveryTargetType
            .SYSTEM,
        );

        expect(
          DiscoveryTargetType
            .fromLocator(
              new BodyLocator(
                0n,
                1n,
                2n,
                3n,
              ),
            ),
        ).toBe(
          DiscoveryTargetType
            .BODY,
        );

        expect(
          DiscoveryTargetType
            .fromLocator(
              new CivilizationLocator(
                0n,
                1n,
                2n,
                3n,
                4n,
              ),
            ),
        ).toBe(
          DiscoveryTargetType
            .CIVILIZATION,
        );
      },
    );

    it(
      'should reject an unsupported runtime locator',
      () => {
        const unsupported =
          {} as ProceduralLocator;

        expect(
          () =>
            DiscoveryTargetType
              .fromLocator(
                unsupported,
              ),
        ).toThrow(
          TypeError,
        );
      },
    );

  },
);