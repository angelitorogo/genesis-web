import {
  SystemLocator,
} from '../generation/procedural-locator';

import {
  SystemSeed,
} from '../seed/hierarchical-seeds';

import {
  CometIdentity,
} from './comet-identity';

describe(
  'CometIdentity point 22.5 V1',
  () => {
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
      'should preserve canonical system identity and derive a stable local designation',
      () => {
        const identity =
          new CometIdentity(
            locator,
            seed,
            4,
            '0123456789ABCDEFFEDCBA9876543210',
          );

        expect(
          identity.systemLocator,
        ).toBe(
          locator,
        );

        expect(
          identity.systemSeed,
        ).toBe(
          seed,
        );

        expect(
          identity.localDesignation,
        ).toBe(
          'COM-004',
        );
      },
    );

    it(
      'should reject invalid ordinals and malformed 128-bit procedural ids',
      () => {
        expect(
          () =>
            new CometIdentity(
              locator,
              seed,
              0,
              '0123456789ABCDEFFEDCBA9876543210',
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new CometIdentity(
              locator,
              seed,
              1,
              'not-a-comet-id',
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
