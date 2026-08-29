import {
  PlanetType,
} from './planet-type';

describe(
  'PlanetType point 19.4',
  () => {
    it(
      'should expose exactly the nine roadmap planet families',
      () => {
        expect(
          Object.values(
            PlanetType,
          ),
        ).toEqual([
          'ROCKY',
          'SUPER_EARTH',
          'DESERT',
          'OCEAN',
          'ICE',
          'VOLCANIC',
          'MINI_NEPTUNE',
          'GAS_GIANT',
          'ICE_GIANT',
        ]);
      },
    );
  },
);
