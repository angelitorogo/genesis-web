import {
  GalacticNucleusState,
} from '../universe/galactic-nucleus-state';

import {
  GalacticNuclearActivityEventKind,
  GalacticNuclearActivityProfile,
  GalacticNuclearActivityRarity,
} from './galactic-nuclear-activity-profile';

describe(
  'GalacticNuclearActivityProfile',
  () => {

    it(
      'should expose the derived convenience flags for a valid active profile',
      () => {
        const profile =
          new GalacticNuclearActivityProfile(
            GalacticNucleusState.AGN,
            GalacticNuclearActivityEventKind.AGN_EPISODE,
            GalacticNuclearActivityRarity.RARE,
            1.0e8,
          );

        expect(
          profile.hasNucleus,
        ).toBe(
          true,
        );

        expect(
          profile.hasSupermassiveBlackHole,
        ).toBe(
          true,
        );

        expect(
          profile.isActiveEpisode,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should reject invalid supermassive black hole masses',
      () => {
        for (
          const mass of
          [
            Number.NaN,
            Number.POSITIVE_INFINITY,
            0.0,
            -1.0,
          ]
        ) {
          expect(
            () =>
              new GalacticNuclearActivityProfile(
                GalacticNucleusState.QUIESCENT,
                GalacticNuclearActivityEventKind.NONE,
                GalacticNuclearActivityRarity.BASELINE,
                mass,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should enforce baseline invariants for absent and quiescent nuclei',
      () => {
        expect(
          () =>
            new GalacticNuclearActivityProfile(
              null,
              GalacticNuclearActivityEventKind.AGN_EPISODE,
              GalacticNuclearActivityRarity.RARE,
              null,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalacticNuclearActivityProfile(
              GalacticNucleusState.QUIESCENT,
              GalacticNuclearActivityEventKind.AGN_EPISODE,
              GalacticNuclearActivityRarity.BASELINE,
              null,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should enforce AGN and QUASAR event rarity invariants',
      () => {
        expect(
          () =>
            new GalacticNuclearActivityProfile(
              GalacticNucleusState.AGN,
              GalacticNuclearActivityEventKind.NONE,
              GalacticNuclearActivityRarity.BASELINE,
              1.0e8,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalacticNuclearActivityProfile(
              GalacticNucleusState.QUASAR,
              GalacticNuclearActivityEventKind.QUASAR_EPISODE,
              GalacticNuclearActivityRarity.RARE,
              1.0e9,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalacticNuclearActivityProfile(
              GalacticNucleusState.AGN,
              GalacticNuclearActivityEventKind.AGN_EPISODE,
              GalacticNuclearActivityRarity.RARE,
              null,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
