import {
  AsteroidStructureRegime,
} from './asteroid-structure-regime';

describe(
  'AsteroidStructureRegime point 22.4',
  () => {
    it(
      'should keep coherent, fractured and rubble-pile internal structures distinct',
      () => {
        expect(
          Object.values(
            AsteroidStructureRegime,
          ),
        ).toEqual([
          'COHERENT',
          'FRACTURED',
          'RUBBLE_PILE',
        ]);
      },
    );
  },
);
