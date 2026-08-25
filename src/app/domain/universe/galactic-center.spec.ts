import {
  GalacticObjectLocator,
} from '../generation/procedural-locator';

import {
  GalaxySectorCoordinates,
} from '../sector/galaxy-sector-coordinates';

import {
  GALACTIC_NUCLEUS_OBJECT_INDEX,
  isGalacticCenterCoordinates,
  isGalacticNucleusLocator,
} from './galactic-center';

describe(
  'GalacticCenter',
  () => {
    it(
      'should reserve coordinates 0,0 as the unique galactic centre',
      () => {
        expect(
          isGalacticCenterCoordinates(
            new GalaxySectorCoordinates(
              0,
              0,
            ),
          ),
        ).toBe(
          true,
        );

        expect(
          isGalacticCenterCoordinates(
            new GalaxySectorCoordinates(
              1,
              0,
            ),
          ),
        ).toBe(
          false,
        );

        expect(
          isGalacticCenterCoordinates(
            new GalaxySectorCoordinates(
              0,
              -1,
            ),
          ),
        ).toBe(
          false,
        );
      },
    );

    it(
      'should reserve GalacticObject index zero in sector key zero for the nucleus identity',
      () => {
        expect(
          GALACTIC_NUCLEUS_OBJECT_INDEX,
        ).toBe(
          0n,
        );

        expect(
          isGalacticNucleusLocator(
            new GalacticObjectLocator(
              73n,
              0n,
              0n,
            ),
          ),
        ).toBe(
          true,
        );

        expect(
          isGalacticNucleusLocator(
            new GalacticObjectLocator(
              73n,
              1n,
              0n,
            ),
          ),
        ).toBe(
          false,
        );

        expect(
          isGalacticNucleusLocator(
            new GalacticObjectLocator(
              73n,
              0n,
              1n,
            ),
          ),
        ).toBe(
          false,
        );
      },
    );
  },
);
