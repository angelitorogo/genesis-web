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
  CometOrbitalElements,
} from './comet-orbital-elements';

import {
  CometPeriodRegime,
} from './comet-period-regime';

import {
  RelevantComet,
} from './relevant-comet';

describe(
  'RelevantComet point 22.6 V1',
  () => {
    const locator =
      new SystemLocator(
        1n,
        2n,
        3n,
      );

    const seed =
      new SystemSeed(
        '11111111111111111111111111111111',
      );

    const identity =
      new CometIdentity(
        locator,
        seed,
        1,
        '0123456789ABCDEFFEDCBA9876543210',
      );

    const nucleus =
      new CometNucleusProperties(
        1,
        10,
        0.7,
        0.3,
        0.6,
        0.6,
        0.04,
        0.8,
      );

    const orbit =
      new CometOrbitalElements(
        1,
        1,
        4,
        0.75,
        15,
        20,
        30,
        40,
        8,
        CometPeriodRegime
          .SHORT_PERIOD,
      );

    it(
      'should preserve point-22.5 identity/nucleus while exposing the point-22.6 orbit family',
      () => {
        const comet =
          new RelevantComet(
            identity,
            nucleus,
            orbit,
          );

        expect(
          comet.proceduralId,
        ).toBe(
          identity.proceduralId,
        );

        expect(
          comet.nucleusProperties,
        ).toBe(
          nucleus,
        );

        expect(
          comet.periodRegime,
        ).toBe(
          CometPeriodRegime
            .SHORT_PERIOD,
        );

        expect(
          comet.periapsisAu,
        ).toBe(1);

        expect(
          'activityState' in comet,
        ).toBe(false);

        expect(
          'discoveryState' in comet,
        ).toBe(false);
      },
    );

    it(
      'should reject a mismatched orbit ordinal',
      () => {
        expect(
          () =>
            new RelevantComet(
              identity,
              nucleus,
              new CometOrbitalElements(
                2,
                1,
                4,
                0.75,
                15,
                20,
                30,
                40,
                8,
                CometPeriodRegime
                  .SHORT_PERIOD,
              ),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
