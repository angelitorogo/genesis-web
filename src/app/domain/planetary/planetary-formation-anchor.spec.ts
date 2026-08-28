import {
  PlanetaryFormationAnchor,
} from './planetary-formation-anchor';

import {
  ProtoplanetCompositionMixture,
} from './protoplanet-composition-mixture';

describe(
  'PlanetaryFormationAnchor point 17.7',
  () => {
    it(
      'should preserve lineage and expose only a formation anchor rather than final orbital/planet state',
      () => {
        const sourceOrdinals = [
          1,
          3,
        ];

        const anchor =
          new PlanetaryFormationAnchor(
            1,
            sourceOrdinals,
            4.2,
            3.5,
            new ProtoplanetCompositionMixture(
              0,
              0.4,
              0.6,
              0,
            ),
            0.8,
            0.7,
            0.75,
            0.4,
            1,
          );

        sourceOrdinals.length =
          0;

        expect(
          anchor.sourceFormationOrdinals,
        ).toEqual([
          1,
          3,
        ]);

        expect(
          anchor.hasCollisionHistory,
        ).toBe(true);

        expect(
          anchor.isIceBearing,
        ).toBe(true);

        expect(
          'eccentricity' in anchor,
        ).toBe(false);

        expect(
          'orbitalPeriodDays' in anchor,
        ).toBe(false);

        expect(
          'planetType' in anchor,
        ).toBe(false);
      },
    );

    it(
      'should reject invalid normalized values and collision lineage mismatch',
      () => {
        const mixture =
          new ProtoplanetCompositionMixture(
            0,
            1,
            0,
            0,
          );

        expect(
          () =>
            new PlanetaryFormationAnchor(
              1,
              [
                1,
                2,
              ],
              1,
              1,
              mixture,
              1.1,
              0.5,
              0.5,
              0.5,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetaryFormationAnchor(
              1,
              [
                1,
                2,
              ],
              1,
              1,
              mixture,
              0.5,
              0.5,
              0.5,
              0.5,
              0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
