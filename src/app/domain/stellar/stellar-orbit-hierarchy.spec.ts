import {
  StellarOrbitHierarchy,
  STELLAR_TRIPLE_V1_MIN_HIERARCHY_SEPARATION_RATIO,
} from './stellar-orbit-hierarchy';

import {
  StellarRelativeOrbit,
} from './stellar-relative-orbit';

import {
  StellarSystemMultiplicity,
} from './stellar-system-multiplicity';

describe(
  'StellarOrbitHierarchy point 16.4',
  () => {
    const inner =
      () =>
        new StellarRelativeOrbit(
          1,
          0.2,
          1,
        );

    it(
      'should represent SINGLE without stellar orbits and BINARY with only the A-B inner orbit',
      () => {
        const single =
          new StellarOrbitHierarchy(
            StellarSystemMultiplicity.SINGLE,
            null,
            null,
          );

        expect(single.hasInnerOrbit).toBe(false);
        expect(single.hasOuterOrbit).toBe(false);
        expect(single.hierarchySeparationRatio).toBeNull();

        const binary =
          new StellarOrbitHierarchy(
            StellarSystemMultiplicity.BINARY,
            inner(),
            null,
          );

        expect(binary.hasInnerOrbit).toBe(true);
        expect(binary.hasOuterOrbit).toBe(false);
        expect(binary.hierarchySeparationRatio).toBeNull();
      },
    );

    it(
      'should accept a TRIPLE only when the C outer periastron is at least five A-B apoastra away',
      () => {
        const innerOrbit =
          inner();

        const outerPeriastron =
          innerOrbit.apoastronAu *
          STELLAR_TRIPLE_V1_MIN_HIERARCHY_SEPARATION_RATIO;

        const outerEccentricity =
          0.4;

        const outer =
          new StellarRelativeOrbit(
            outerPeriastron /
              (
                1 -
                outerEccentricity
              ),
            outerEccentricity,
            20,
          );

        const hierarchy =
          new StellarOrbitHierarchy(
            StellarSystemMultiplicity.TRIPLE,
            innerOrbit,
            outer,
          );

        expect(
          hierarchy.hierarchySeparationRatio,
        ).toBeCloseTo(
          STELLAR_TRIPLE_V1_MIN_HIERARCHY_SEPARATION_RATIO,
          12,
        );
      },
    );

    it(
      'should reject orbit/multiplicity mismatches and non-hierarchical triples',
      () => {
        expect(
          () =>
            new StellarOrbitHierarchy(
              StellarSystemMultiplicity.SINGLE,
              inner(),
              null,
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new StellarOrbitHierarchy(
              StellarSystemMultiplicity.BINARY,
              null,
              null,
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new StellarOrbitHierarchy(
              StellarSystemMultiplicity.BINARY,
              inner(),
              new StellarRelativeOrbit(
                10,
                0,
                20,
              ),
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new StellarOrbitHierarchy(
              StellarSystemMultiplicity.TRIPLE,
              inner(),
              new StellarRelativeOrbit(
                3,
                0,
                10,
              ),
            ),
        ).toThrow(RangeError);
      },
    );
  },
);
