import {
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

import {
  type Galaxy,
} from '../../domain/universe/galaxy';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

/**
 * Canonical V1 interpretation of the object exposed at galactic coordinates
 * (0, 0).
 *
 * Older V1 galaxies may still carry `nucleus === null` because the original
 * morphology contract allowed a non-differentiated centre. For exploration,
 * that state is represented as QUIESCENT: a central globular-cluster-like
 * stellar concentration. This keeps old deterministic galaxy identities while
 * guaranteeing that (0, 0) is never empty.
 */
export class GalacticCenterNucleusResolver {

  private constructor() {}

  static resolveState(
    galaxy:
      Galaxy,
  ): GalacticNucleusState {

    const state =
      galaxy.nucleus
        ?.state ??
      GalacticNucleusState.QUIESCENT;

    if (
      (
        galaxy.type ===
          GalaxyType.DWARF ||
        galaxy.type ===
          GalaxyType.IRREGULAR
      ) &&
      state ===
        GalacticNucleusState.QUASAR
    ) {
      throw new RangeError(
        `${galaxy.type.name} galaxies cannot host a QUASAR nucleus in V1.`,
      );
    }

    return state;
  }
}
