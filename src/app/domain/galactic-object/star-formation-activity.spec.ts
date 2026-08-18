import {
  StarFormationActivity,
} from './star-formation-activity';

describe(
  'StarFormationActivity',
  () => {
    it(
      'should expose exactly the four frozen point-12.3 activity levels',
      () => {
        expect(
          Object.values(
            StarFormationActivity,
          ),
        ).toEqual([
          'LOW',
          'MODERATE',
          'HIGH',
          'INTENSE',
        ]);
      },
    );

    it(
      'should keep the activity catalogue immutable at runtime',
      () => {
        expect(
          Object.isFrozen(
            StarFormationActivity,
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);
