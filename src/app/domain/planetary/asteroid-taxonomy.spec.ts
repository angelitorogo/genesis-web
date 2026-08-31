import {
  AsteroidCompositionRegime,
} from './asteroid-composition-regime';

import {
  AsteroidMultiplicityRegime,
} from './asteroid-multiplicity-regime';

import {
  AsteroidStructureRegime,
} from './asteroid-structure-regime';

import {
  AsteroidTaxonomy,
} from './asteroid-taxonomy';

describe(
  'AsteroidTaxonomy point 22.4',
  () => {
    it(
      'should preserve independent composition, structure and multiplicity plus coherent bulk proxies',
      () => {
        const taxonomy =
          new AsteroidTaxonomy(
            AsteroidCompositionRegime.CARBONACEOUS,
            AsteroidStructureRegime.RUBBLE_PILE,
            AsteroidMultiplicityRegime.BINARY,
            0.55,
            0.25,
            0.05,
            0.15,
            0.45,
            1.25,
            0.06,
            0.3,
            4,
          );

        expect(
          taxonomy.isRubblePile,
        ).toBe(true);

        expect(
          taxonomy.isBinaryLike,
        ).toBe(true);

        expect(
          taxonomy.isDetachedBinary,
        ).toBe(true);

        expect(
          taxonomy.isIceBearing,
        ).toBe(true);
      },
    );

    it(
      'should reject non-normalized fractions and detached-companion fields on non-binaries',
      () => {
        expect(
          () =>
            new AsteroidTaxonomy(
              AsteroidCompositionRegime.SILICACEOUS,
              AsteroidStructureRegime.COHERENT,
              AsteroidMultiplicityRegime.SINGLE,
              0.2,
              0.2,
              0.2,
              0.2,
              0.05,
              2.8,
              0.2,
              null,
              null,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new AsteroidTaxonomy(
              AsteroidCompositionRegime.SILICACEOUS,
              AsteroidStructureRegime.COHERENT,
              AsteroidMultiplicityRegime.SINGLE,
              0.05,
              0.7,
              0.2,
              0.05,
              0.05,
              2.8,
              0.2,
              0.2,
              3,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
