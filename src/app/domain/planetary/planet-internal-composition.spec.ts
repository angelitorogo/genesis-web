import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetInternalComposition,
} from './planet-internal-composition';

describe(
  'PlanetInternalComposition point 19.5',
  () => {
    const locator =
      new BodyLocator(
        2n,
        -7n,
        5n,
        0n,
      );

    const seed =
      new BodySeed(
        '11111111111111111111111111111111',
      );

    it(
      'should conserve solid and envelope mass across the five coarse internal material buckets',
      () => {
        const composition =
          new PlanetInternalComposition(
            1,
            locator,
            seed,
            10,
            2,
            0.2,
            0.3,
            0.3,
            0.2,
            2.5,
            4,
            2,
            1.5,
            2,
          );

        expect(
          composition.totalMassEarth,
        ).toBe(12);

        expect(
          composition.solidInteriorMassEarth,
        ).toBe(10);

        expect(
          composition.iceBearingInteriorMassEarth,
        ).toBe(3.5);

        expect(
          composition.iceBearingFractionOfSolids01,
        ).toBeCloseTo(
          0.35,
          12,
        );

        expect(
          composition.sourceIceBearingFraction01,
        ).toBeCloseTo(
          0.5,
          12,
        );

        const fractions = [
          composition.metallicCoreMassFraction01,
          composition.silicateInteriorMassFraction01,
          composition.condensedIceMassFraction01,
          composition.volatileRichInteriorMassFraction01,
          composition.gaseousEnvelopeMassFraction01,
        ];

        expect(
          fractions.reduce(
            (
              total,
              value,
            ) =>
              total +
              value,
            0,
          ),
        ).toBeCloseTo(
          1,
          12,
        );

        expect(
          composition.solidMassFraction01,
        ).toBeCloseTo(
          10 /
            12,
          12,
        );
      },
    );

    it(
      'should support a purely solid planet with zero gaseous envelope',
      () => {
        const composition =
          new PlanetInternalComposition(
            1,
            locator,
            seed,
            1,
            0,
            0,
            1,
            0,
            0,
            0.3,
            0.64,
            0.04,
            0.02,
            0,
          );

        expect(
          composition.gaseousEnvelopeMassEarth,
        ).toBe(0);

        expect(
          composition.gaseousEnvelopeMassFraction01,
        ).toBe(0);

        expect(
          composition.totalMassEarth,
        ).toBe(1);
      },
    );

    it(
      'should reject invalid identity, source fractions or non-conserved internal masses',
      () => {
        expect(
          () =>
            new PlanetInternalComposition(
              2,
              locator,
              seed,
              1,
              0,
              0,
              1,
              0,
              0,
              0.3,
              0.64,
              0.04,
              0.02,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetInternalComposition(
              1,
              locator,
              seed,
              1,
              0,
              0.4,
              0.4,
              0.4,
              0,
              0.3,
              0.64,
              0.04,
              0.02,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetInternalComposition(
              1,
              locator,
              seed,
              1,
              0,
              0,
              1,
              0,
              0,
              0.3,
              0.60,
              0.04,
              0.02,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetInternalComposition(
              1,
              locator,
              seed,
              1,
              0.2,
              0,
              1,
              0,
              0,
              0.3,
              0.64,
              0.04,
              0.02,
              0.1,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
