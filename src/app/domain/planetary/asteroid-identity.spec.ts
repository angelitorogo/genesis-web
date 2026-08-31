import {
  SystemLocator,
} from '../generation/procedural-locator';

import {
  SystemSeed,
} from '../seed/hierarchical-seeds';

import {
  AsteroidBeltRegion,
} from './asteroid-belt-region';

import {
  AsteroidIdentity,
} from './asteroid-identity';

describe(
  'AsteroidIdentity point 22.3',
  () => {
    const locator =
      new SystemLocator(
        2n,
        -5n,
        8n,
      );

    const seed =
      new SystemSeed(
        '11111111111111111111111111111111',
      );

    it(
      'should expose a stable local designation over one canonical procedural id',
      () => {
        const identity =
          new AsteroidIdentity(
            locator,
            seed,
            AsteroidBeltRegion.INNER,
            7,
            '0123456789ABCDEFFEDCBA9876543210',
          );

        expect(
          identity.localDesignation,
        ).toBe(
          'AST-IN-007',
        );
      },
    );

    it(
      'should reject malformed ordinals, ids or non-SystemSeed parents',
      () => {
        expect(
          () =>
            new AsteroidIdentity(
              locator,
              seed,
              AsteroidBeltRegion.OUTER,
              0,
              '0123456789ABCDEFFEDCBA9876543210',
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new AsteroidIdentity(
              locator,
              seed,
              AsteroidBeltRegion.OUTER,
              1,
              'not-a-procedural-id',
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new AsteroidIdentity(
              locator,
              {
                kind:
                  'body',
              } as unknown as SystemSeed,
              AsteroidBeltRegion.OUTER,
              1,
              '0123456789ABCDEFFEDCBA9876543210',
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
