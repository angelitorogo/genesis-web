import {
  AsteroidCompositionRegime,
} from './asteroid-composition-regime';

describe(
  'AsteroidCompositionRegime point 22.4',
  () => {
    it(
      'should freeze the five first-order V1 composition families',
      () => {
        expect(
          Object.values(
            AsteroidCompositionRegime,
          ),
        ).toEqual([
          'CARBONACEOUS',
          'SILICACEOUS',
          'METALLIC',
          'ICE_RICH',
          'MIXED_ROCK_ICE',
        ]);
      },
    );
  },
);
