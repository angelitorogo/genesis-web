import {
  type CometIdentity,
} from './comet-identity';

import {
  type CometNucleusProperties,
} from './comet-nucleus-properties';

/**
 * Point-22.5 individually materialized cometary nucleus.
 *
 * `isDiscoverable` only means that the object is relevant enough to become a
 * future observation target. It does not encode player knowledge; point 22.10
 * still owns existing/discovered/catalogued state. Point 22.6 owns orbit family,
 * short/long-period classification and distance-dependent activity.
 */
export class RelevantComet {

  constructor(
    readonly identity:
      CometIdentity,

    readonly nucleusProperties:
      CometNucleusProperties,
  ) {
    if (
      identity.cometOrdinal !==
      nucleusProperties.cometOrdinal
    ) {
      throw new RangeError(
        'RelevantComet identity and nucleus properties must address the same comet ordinal.',
      );
    }
  }

  get cometOrdinal():
    number {

    return this
      .identity
      .cometOrdinal;
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

  get diameterKilometers():
    number {

    return this
      .nucleusProperties
      .diameterKilometers;
  }

  get isDiscoverable():
    boolean {

    return true;
  }
}
