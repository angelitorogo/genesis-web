import {
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  type SystemSeed,
} from '../seed/hierarchical-seeds';

import {
  AsteroidBeltRegion,
} from './asteroid-belt-region';

const V1_PROCEDURAL_ID_PATTERN =
  /^[0-9A-F]{32}$/;

/**
 * Point-22.3 lightweight stable identity for one individually materialized
 * relevant asteroid.
 *
 * It deliberately does not introduce an AsteroidSeed or a discovery-state
 * record. The canonical parent SystemLocator/SystemSeed plus belt region and
 * asteroidOrdinal are sufficient to reproduce the 128-bit procedural id.
 * Point 22.10 still owns EXISTING vs DISCOVERED/CATALOGUED state.
 */
export class AsteroidIdentity {

  constructor(
    readonly systemLocator:
      SystemLocator,

    readonly systemSeed:
      SystemSeed,

    readonly beltRegion:
      AsteroidBeltRegion,

    readonly asteroidOrdinal:
      number,

    readonly proceduralId:
      string,
  ) {
    if (
      systemSeed.kind !==
      'system'
    ) {
      throw new RangeError(
        'AsteroidIdentity requires the canonical parent SystemSeed.',
      );
    }

    if (
      !Object.values(
        AsteroidBeltRegion,
      ).includes(
        beltRegion,
      )
    ) {
      throw new RangeError(
        'beltRegion must be a known AsteroidBeltRegion.',
      );
    }

    if (
      !Number.isInteger(
        asteroidOrdinal,
      ) ||
      asteroidOrdinal <=
        0
    ) {
      throw new RangeError(
        'asteroidOrdinal must be a positive integer.',
      );
    }

    if (
      !V1_PROCEDURAL_ID_PATTERN
        .test(
          proceduralId,
        )
    ) {
      throw new RangeError(
        'proceduralId must be exactly 128 bits encoded as 32 uppercase hexadecimal characters.',
      );
    }
  }

  get localDesignation():
    string {

    const regionCode =
      this.beltRegion ===
        AsteroidBeltRegion.INNER
        ? 'IN'
        : 'OUT';

    return (
      `AST-${regionCode}-` +
      this.asteroidOrdinal
        .toString(10)
        .padStart(
          3,
          '0',
        )
    );
  }
}
