import {
  AsteroidBeltRegion,
} from './asteroid-belt-region';

import {
  AsteroidOrbitalElements,
} from './asteroid-orbital-elements';

describe(
  'AsteroidOrbitalElements point 22.3',
  () => {
    it(
      'should expose one complete orbit whose apsides remain inside the source belt',
      () => {
        const orbit =
          new AsteroidOrbitalElements(
            AsteroidBeltRegion.INNER,
            1,
            2,
            4,
            3,
            3,
            0.2,
            7,
            20,
            40,
            60,
          );

        expect(
          orbit.periapsisAu,
        ).toBeCloseTo(
          2.4,
          12,
        );

        expect(
          orbit.apoapsisAu,
        ).toBeCloseTo(
          3.6,
          12,
        );
      },
    );

    it(
      'should reject an orbit whose apsides escape the frozen belt geometry',
      () => {
        expect(
          () =>
            new AsteroidOrbitalElements(
              AsteroidBeltRegion.OUTER,
              1,
              5,
              10,
              7,
              6,
              0.4,
              2,
              0,
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
