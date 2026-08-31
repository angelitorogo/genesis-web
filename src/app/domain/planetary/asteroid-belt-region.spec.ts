import {
  AsteroidBeltRegion,
} from './asteroid-belt-region';

describe(
  'AsteroidBeltRegion point 22.2',
  () => {
    it(
      'should expose exactly the frozen inner/outer belt regions',
      () => {
        expect(
          Object.values(
            AsteroidBeltRegion,
          ),
        ).toEqual([
          'INNER',
          'OUTER',
        ]);
      },
    );
  },
);
