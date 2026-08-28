import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetaryArchitectureSlot,
} from './planetary-architecture-slot';

import {
  ProtoplanetCompositionMixture,
} from './protoplanet-composition-mixture';

describe(
  'PlanetaryArchitectureSlot point 18.2',
  () => {
    it(
      'should freeze inherited anchor/formation lineage without exposing orbital or phase-19 planet properties',
      () => {
        const anchors = [
          2,
          3,
        ];

        const lineage = [
          2,
          3,
          5,
        ];

        const slot =
          new PlanetaryArchitectureSlot(
            1,
            new BodyLocator(
              4n,
              -12n,
              7n,
              0n,
            ),
            new BodySeed(
              '0123456789ABCDEFFEDCBA9876543210',
            ),
            anchors,
            lineage,
            1.2,
            2.5,
            new ProtoplanetCompositionMixture(
              0,
              0.4,
              0.5,
              0.1,
            ),
            0.8,
            0.3,
            0.7,
            0.2,
            1,
            1,
          );

        anchors.length =
          0;

        lineage.length =
          0;

        expect(
          slot.sourceAnchorOrdinals,
        ).toEqual([
          2,
          3,
        ]);

        expect(
          slot.sourceFormationOrdinals,
        ).toEqual([
          2,
          3,
          5,
        ]);

        expect(
          Object.isFrozen(
            slot.sourceAnchorOrdinals,
          ),
        ).toBe(true);

        expect(
          slot.isPhase18Consolidated,
        ).toBe(true);

        expect(
          'semiMajorAxisAu' in slot,
        ).toBe(false);

        expect(
          'eccentricity' in slot,
        ).toBe(false);

        expect(
          'orbitalPeriodDays' in slot,
        ).toBe(false);

        expect(
          'planetType' in slot,
        ).toBe(false);

        expect(
          'radiusEarth' in slot,
        ).toBe(false);
      },
    );

    it(
      'should enforce contiguous planet/body identity and architecture consolidation accounting',
      () => {
        const mixture =
          new ProtoplanetCompositionMixture(
            0,
            1,
            0,
            0,
          );

        expect(
          () =>
            new PlanetaryArchitectureSlot(
              2,
              new BodyLocator(
                0n,
                0n,
                0n,
                0n,
              ),
              new BodySeed(
                '0123456789ABCDEFFEDCBA9876543210',
              ),
              [
                1,
              ],
              [
                1,
              ],
              1,
              1,
              mixture,
              0.5,
              0.5,
              0.5,
              0.5,
              0,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetaryArchitectureSlot(
              1,
              new BodyLocator(
                0n,
                0n,
                0n,
                0n,
              ),
              new BodySeed(
                '0123456789ABCDEFFEDCBA9876543210',
              ),
              [
                1,
                2,
              ],
              [
                1,
                2,
              ],
              1,
              1,
              mixture,
              0.5,
              0.5,
              0.5,
              0.5,
              0,
              0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
