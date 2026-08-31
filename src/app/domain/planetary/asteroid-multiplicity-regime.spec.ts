import {
  AsteroidMultiplicityRegime,
} from './asteroid-multiplicity-regime';

describe(
  'AsteroidMultiplicityRegime point 22.4',
  () => {
    it(
      'should distinguish single, contact-binary and detached-binary bodies',
      () => {
        expect(
          Object.values(
            AsteroidMultiplicityRegime,
          ),
        ).toEqual([
          'SINGLE',
          'CONTACT_BINARY',
          'BINARY',
        ]);
      },
    );
  },
);
