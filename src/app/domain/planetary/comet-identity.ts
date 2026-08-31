import {
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  type SystemSeed,
} from '../seed/hierarchical-seeds';

const PROCEDURAL_ID_PATTERN =
  /^[0-9A-F]{32}$/;

/**
 * Point-22.5 stable identity for one individually materialized cometary nucleus.
 *
 * Comet identity remains anchored to the parent SystemLocator/SystemSeed. Point
 * 22.5 deliberately does not introduce a new hierarchical CometSeed level; the
 * 128-bit proceduralId is enough to regenerate the bounded relevant sample.
 */
export class CometIdentity {

  constructor(
    readonly systemLocator:
      SystemLocator,

    readonly systemSeed:
      SystemSeed,

    readonly cometOrdinal:
      number,

    readonly proceduralId:
      string,
  ) {
    if (
      systemSeed.kind !==
      'system'
    ) {
      throw new RangeError(
        'CometIdentity requires the canonical parent SystemSeed.',
      );
    }

    if (
      !Number.isInteger(
        cometOrdinal,
      ) ||
      cometOrdinal <=
        0
    ) {
      throw new RangeError(
        'cometOrdinal must be a positive integer.',
      );
    }

    if (
      !PROCEDURAL_ID_PATTERN
        .test(
          proceduralId,
        )
    ) {
      throw new RangeError(
        'Comet proceduralId must be an uppercase 128-bit hexadecimal value.',
      );
    }
  }

  get localDesignation():
    string {

    return `COM-${String(
      this.cometOrdinal,
    ).padStart(
      3,
      '0',
    )}`;
  }
}
