import {
  MinorBodyOrbitProximityRegime,
} from './minor-body-orbit-proximity-regime';

describe(
  'MinorBodyOrbitProximityRegime point 23.3',
  () => {
    it(
      'should order disjoint, radial-crossing and approach-corridor regimes with stable codes',
      () => {
        expect(
          MinorBodyOrbitProximityRegime
            .values
            .map(
              value =>
                value.name,
            ),
        ).toEqual([
          'DISJOINT',
          'RADIAL_CROSSING',
          'APPROACH_CORRIDOR',
        ]);

        expect(
          MinorBodyOrbitProximityRegime
            .fromCode(3),
        ).toBe(
          MinorBodyOrbitProximityRegime
            .APPROACH_CORRIDOR,
        );
      },
    );
  },
);
