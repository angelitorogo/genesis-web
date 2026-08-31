import {
  SystemLocator,
} from '../generation/procedural-locator';

import {
  SystemSeed,
} from '../seed/hierarchical-seeds';

import {
  CometIdentity,
} from './comet-identity';

import {
  CometNucleusProperties,
} from './comet-nucleus-properties';

import {
  RelevantComet,
} from './relevant-comet';

describe(
  'RelevantComet point 22.5 V1',
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
      'should expose stable identity/nucleus getters while keeping point-22.6 and point-22.10 fields absent',
      () => {
        const comet =
          new RelevantComet(
            new CometIdentity(
              locator,
              seed,
              1,
              '0123456789ABCDEFFEDCBA9876543210',
            ),
            new CometNucleusProperties(
              1,
              18,
              0.62,
              0.38,
              0.6,
              0.5,
              0.04,
              0.8,
            ),
          );

        expect(
          comet.localDesignation,
        ).toBe(
          'COM-001',
        );

        expect(
          comet.diameterKilometers,
        ).toBe(
          18,
        );

        expect(
          comet.isDiscoverable,
        ).toBe(true);

        expect(
          'orbit' in comet,
        ).toBe(false);

        expect(
          'periodRegime' in comet,
        ).toBe(false);

        expect(
          'activityState' in comet,
        ).toBe(false);

        expect(
          'discoveryState' in comet,
        ).toBe(false);
      },
    );

    it(
      'should reject identity/nucleus ordinal mismatches',
      () => {
        expect(
          () =>
            new RelevantComet(
              new CometIdentity(
                locator,
                seed,
                1,
                '0123456789ABCDEFFEDCBA9876543210',
              ),
              new CometNucleusProperties(
                2,
                18,
                0.62,
                0.38,
                0.6,
                0.5,
                0.04,
                0.8,
              ),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
