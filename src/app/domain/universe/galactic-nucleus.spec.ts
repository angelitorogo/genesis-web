import {
  GalacticNucleusState,
} from './galactic-nucleus-state';

import {
  GalacticNucleus,
} from './galactic-nucleus';

import {
  SupermassiveBlackHole,
} from './supermassive-black-hole';

describe(
  'GalacticNucleus',
  () => {
    const blackHole =
      new SupermassiveBlackHole(
        1.5e8,
      );

    it(
      'should preserve its state and supermassive black hole exactly',
      () => {
        const nucleus =
          new GalacticNucleus(
            GalacticNucleusState.QUIESCENT,
            blackHole,
          );

        expect(
          nucleus.state,
        ).toBe(
          GalacticNucleusState.QUIESCENT,
        );

        expect(
          nucleus.supermassiveBlackHole,
        ).toBe(
          blackHole,
        );
      },
    );

    it(
      'should allow a quiescent nucleus without a supermassive black hole',
      () => {
        const nucleus =
          new GalacticNucleus(
            GalacticNucleusState.QUIESCENT,
            null,
          );

        expect(
          nucleus.state,
        ).toBe(
          GalacticNucleusState.QUIESCENT,
        );

        expect(
          nucleus.supermassiveBlackHole,
        ).toBeNull();
      },
    );

    it(
      'should allow an AGN nucleus with a supermassive black hole',
      () => {
        const nucleus =
          new GalacticNucleus(
            GalacticNucleusState.AGN,
            blackHole,
          );

        expect(
          nucleus.state,
        ).toBe(
          GalacticNucleusState.AGN,
        );

        expect(
          nucleus.supermassiveBlackHole,
        ).toBe(
          blackHole,
        );
      },
    );

    it(
      'should allow a QUASAR nucleus with a supermassive black hole',
      () => {
        const nucleus =
          new GalacticNucleus(
            GalacticNucleusState.QUASAR,
            blackHole,
          );

        expect(
          nucleus.state,
        ).toBe(
          GalacticNucleusState.QUASAR,
        );

        expect(
          nucleus.supermassiveBlackHole,
        ).toBe(
          blackHole,
        );
      },
    );

    it(
      'should reject an AGN nucleus without a supermassive black hole',
      () => {
        expect(
          () =>
            new GalacticNucleus(
              GalacticNucleusState.AGN,
              null,
            ),
        ).toThrow(
          'AGN and QUASAR nuclei require a supermassive black hole.',
        );
      },
    );

    it(
      'should reject a QUASAR nucleus without a supermassive black hole',
      () => {
        expect(
          () =>
            new GalacticNucleus(
              GalacticNucleusState.QUASAR,
              null,
            ),
        ).toThrow(
          'AGN and QUASAR nuclei require a supermassive black hole.',
        );
      },
    );
  },
);