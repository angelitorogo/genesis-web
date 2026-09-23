import {
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type Galaxy,
} from '../../domain/universe/galaxy';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

/**
 * Canonical interpretation of the object exposed at galactic coordinates
 * (0, 0), with version-specific nuclear invariants.
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

    /*
     * V1 keeps its frozen morphology restriction. V2 deliberately replaces
     * that policy and permits the explicitly requested rare QUASAR outcomes
     * in large IRREGULAR and DWARF galaxies.
     */
    if (
      galaxy.generationKey.generatorVersion ===
        GeneratorVersion.V1 &&
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
