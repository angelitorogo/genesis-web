import {
  GalacticNucleusState,
} from './galactic-nucleus-state';

import {
  type SupermassiveBlackHole,
} from './supermassive-black-hole';

/**
 * Physical galactic nucleus and its canonical activity state.
 *
 * A QUIESCENT nucleus may exist with or without a modeled supermassive
 * black hole.
 *
 * AGN and QUASAR nuclei require a supermassive black hole.
 */
export class GalacticNucleus {

  constructor(
    readonly state:
      GalacticNucleusState,

    readonly supermassiveBlackHole:
      SupermassiveBlackHole | null,
  ) {
    if (
      state !==
        GalacticNucleusState.QUIESCENT &&
      supermassiveBlackHole ===
        null
    ) {
      throw new Error(
        'AGN and QUASAR nuclei require a supermassive black hole.',
      );
    }
  }
}