import {
  type CometIdentity,
} from './comet-identity';

import {
  type CometNucleusProperties,
} from './comet-nucleus-properties';

import {
  type CometOrbitalElements,
} from './comet-orbital-elements';

import {
  type CometPeriodRegime,
} from './comet-period-regime';

/**
 * Point-22.6 individually materialized relevant comet.
 *
 * Point 22.5 froze identity and nucleus properties. Point 22.6 now adds one
 * bound deterministic orbit and its short/long-period family while preserving
 * every point-22.5 value exactly. Activity remains distance-dependent and is
 * therefore evaluated on demand by CometActivityEngine rather than stored here.
 * Player discovery/catalogue state remains point 22.10.
 */
export class RelevantComet {

  constructor(
    readonly identity:
      CometIdentity,

    readonly nucleusProperties:
      CometNucleusProperties,

    readonly orbit:
      CometOrbitalElements,
  ) {
    if (
      identity.cometOrdinal !==
        nucleusProperties.cometOrdinal ||
      identity.cometOrdinal !==
        orbit.cometOrdinal
    ) {
      throw new RangeError(
        'RelevantComet identity, nucleus properties and orbit must address the same comet ordinal.',
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

  get periodRegime():
    CometPeriodRegime {

    return this
      .orbit
      .periodRegime;
  }

  get orbitalPeriodYears():
    number {

    return this
      .orbit
      .orbitalPeriodYears;
  }

  get periapsisAu():
    number {

    return this
      .orbit
      .periapsisAu;
  }

  get apoapsisAu():
    number {

    return this
      .orbit
      .apoapsisAu;
  }

  get isDiscoverable():
    boolean {

    return true;
  }
}
