import {
  type AsteroidBeltPopulationProfile,
} from './asteroid-belt-population-profile';

import {
  type AsteroidIdentity,
} from './asteroid-identity';

import {
  type AsteroidOrbitalElements,
} from './asteroid-orbital-elements';

import {
  type AsteroidTaxonomy,
} from './asteroid-taxonomy';

/**
 * Point-22.3 individually materialized minor body selected from a statistical
 * point-22.2 belt because it is large/relevant enough to become a gameplay
 * discovery target.
 *
 * `isDiscoverable` means the object is eligible for observation/discovery. It
 * does NOT mean the player has discovered it; point 22.10 owns that state.
 * Point 22.4 adds compositional, structural and multiplicity taxonomy without
 * changing the frozen point-22.3 identity, size or orbit.
 */
export class RelevantAsteroid {

  constructor(
    readonly identity:
      AsteroidIdentity,

    readonly sourceBeltProfile:
      AsteroidBeltPopulationProfile,

    readonly diameterKilometers:
      number,

    readonly orbit:
      AsteroidOrbitalElements,

    readonly taxonomy:
      AsteroidTaxonomy,
  ) {
    if (
      !sourceBeltProfile.exists
    ) {
      throw new RangeError(
        'RelevantAsteroid requires an existing point-22.2 belt population.',
      );
    }

    if (
      identity.beltRegion !==
        sourceBeltProfile.region ||
      orbit.beltRegion !==
        identity.beltRegion ||
      orbit.asteroidOrdinal !==
        identity.asteroidOrdinal
    ) {
      throw new RangeError(
        'RelevantAsteroid identity, source belt and orbit must share one exact region/ordinal.',
      );
    }

    if (
      sourceBeltProfile.innerEdgeAu ===
        null ||
      sourceBeltProfile.outerEdgeAu ===
        null ||
      sourceBeltProfile.peakAu ===
        null ||
      orbit.sourceInnerEdgeAu !==
        sourceBeltProfile.innerEdgeAu ||
      orbit.sourceOuterEdgeAu !==
        sourceBeltProfile.outerEdgeAu ||
      orbit.sourcePeakAu !==
        sourceBeltProfile.peakAu
    ) {
      throw new RangeError(
        'RelevantAsteroid orbit must preserve the exact point-22.2 belt geometry.',
      );
    }

    if (
      !Number.isFinite(
        diameterKilometers,
      ) ||
      diameterKilometers <=
        0
    ) {
      throw new RangeError(
        'diameterKilometers must be positive and finite.',
      );
    }
  }

  get asteroidOrdinal():
    number {

    return this
      .identity
      .asteroidOrdinal;
  }

  get beltRegion() {
    return this
      .identity
      .beltRegion;
  }

  get proceduralId():
    string {

    return this
      .identity
      .proceduralId;
  }

  get localDesignation():
    string {

    return this
      .identity
      .localDesignation;
  }

  get compositionRegime() {
    return this
      .taxonomy
      .compositionRegime;
  }

  get structureRegime() {
    return this
      .taxonomy
      .structureRegime;
  }

  get multiplicityRegime() {
    return this
      .taxonomy
      .multiplicityRegime;
  }

  get isDiscoverable():
    boolean {

    return true;
  }
}
