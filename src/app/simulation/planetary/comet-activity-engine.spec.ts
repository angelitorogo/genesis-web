import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  CometActivityRegime,
} from '../../domain/planetary/comet-activity-regime';

import {
  CometIdentity,
} from '../../domain/planetary/comet-identity';

import {
  CometNucleusProperties,
} from '../../domain/planetary/comet-nucleus-properties';

import {
  CometOrbitalElements,
} from '../../domain/planetary/comet-orbital-elements';

import {
  CometPeriodRegime,
} from '../../domain/planetary/comet-period-regime';

import {
  RelevantComet,
} from '../../domain/planetary/relevant-comet';

import {
  SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  CometActivityEngine,
} from './comet-activity-engine';

describe(
  'CometActivityEngine point 22.6 V1',
  () => {
    const comet =
      new RelevantComet(
        new CometIdentity(
          new SystemLocator(
            1n,
            2n,
            3n,
          ),
          new SystemSeed(
            '11111111111111111111111111111111',
          ),
          1,
          '0123456789ABCDEFFEDCBA9876543210',
        ),
        new CometNucleusProperties(
          1,
          12,
          0.7,
          0.3,
          0.6,
          0.6,
          0.04,
          0.8,
        ),
        new CometOrbitalElements(
          1,
          1,
          20,
          0.95,
          20,
          30,
          40,
          50,
          Math.sqrt(
            8_000,
          ),
          CometPeriodRegime
            .SHORT_PERIOD,
        ),
      );

    it(
      'should turn the same comet from strong/visible activity near periapsis to dormant near apoapsis',
      () => {
        const near =
          CometActivityEngine
            .evaluate(
              comet,
              1,
              comet.orbit.periapsisAu,
            );

        const far =
          CometActivityEngine
            .evaluate(
              comet,
              1,
              comet.orbit.apoapsisAu,
            );

        expect(
          near.activityIndex01,
        ).toBeGreaterThan(
          far.activityIndex01,
        );

        expect(
          near.activityRegime,
        ).toBe(
          CometActivityRegime
            .EXTREME,
        );

        expect(
          near.hasComa,
        ).toBe(true);

        expect(
          near.hasDustTail,
        ).toBe(true);

        expect(
          near.hasIonTail,
        ).toBe(true);

        expect(
          far.activityRegime,
        ).toBe(
          CometActivityRegime
            .DORMANT,
        );

        expect(
          far.hasComa,
        ).toBe(false);
      },
    );

    it(
      'should scale activity distance with host reference luminosity and reject unreachable distances',
      () => {
        const solar =
          CometActivityEngine
            .evaluate(
              comet,
              1,
              4,
            );

        const luminous =
          CometActivityEngine
            .evaluate(
              comet,
              4,
              4,
            );

        expect(
          luminous
            .solarEquivalentDistanceAu,
        ).toBe(2);

        expect(
          solar
            .solarEquivalentDistanceAu,
        ).toBe(4);

        expect(
          luminous.activityIndex01,
        ).toBeGreaterThan(
          solar.activityIndex01,
        );

        expect(
          () =>
            CometActivityEngine
              .evaluate(
                comet,
                1,
                comet.orbit.apoapsisAu +
                  1,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
