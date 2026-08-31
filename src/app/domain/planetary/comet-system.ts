import {
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  type SystemSeed,
} from '../seed/hierarchical-seeds';

import {
  type PlanetarySystem,
} from './planetary-system';

import {
  type RelevantComet,
} from './relevant-comet';

const CONSISTENCY_TOLERANCE =
  1e-12;

/**
 * Point-22.5 cometary aggregate for one mature planetary system.
 *
 * V1 materializes only a bounded set of relevant cometary nuclei plus one
 * normalized support index for the unresolved reservoir. It deliberately does
 * not assign short/long-period families or activity; those remain point 22.6.
 */
export class CometSystem {

  readonly relevantComets:
    readonly RelevantComet[];

  constructor(
    readonly hostPlanetarySystem:
      PlanetarySystem,

    readonly sourceResidualDustMassEarth:
      number,

    readonly reservoirSupportIndex01:
      number,

    relevantComets:
      readonly RelevantComet[],
  ) {
    if (
      hostPlanetarySystem
        .seed
        .kind !==
      'system'
    ) {
      throw new RangeError(
        'CometSystem requires the canonical SystemSeed of its host PlanetarySystem.',
      );
    }

    if (
      !Number.isFinite(
        sourceResidualDustMassEarth,
      ) ||
      sourceResidualDustMassEarth <
        0
    ) {
      throw new RangeError(
        'sourceResidualDustMassEarth must be a non-negative finite number.',
      );
    }

    if (
      Math.abs(
        sourceResidualDustMassEarth -
          hostPlanetarySystem
            .formationBlueprint
            .residualDustMassEarth,
      ) >
      CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'CometSystem must preserve the exact point-17.7 residual-dust reservoir.',
      );
    }

    if (
      !Number.isFinite(
        reservoirSupportIndex01,
      ) ||
      reservoirSupportIndex01 <
        0 ||
      reservoirSupportIndex01 >
        1
    ) {
      throw new RangeError(
        'reservoirSupportIndex01 must be inside [0, 1].',
      );
    }

    if (
      sourceResidualDustMassEarth ===
        0 &&
      (
        reservoirSupportIndex01 !==
          0 ||
        relevantComets.length !==
          0
      )
    ) {
      throw new RangeError(
        'A zero residual-dust reservoir cannot support point-22.5 relevant comets.',
      );
    }

    validateRelevantComets(
      hostPlanetarySystem,
      relevantComets,
    );

    this.relevantComets =
      Object.freeze([
        ...relevantComets,
      ]);
  }

  get generationKey():
    UniverseGenerationKey {

    return this
      .hostPlanetarySystem
      .generationKey;
  }

  get systemLocator():
    SystemLocator {

    return this
      .hostPlanetarySystem
      .locator;
  }

  get systemSeed():
    SystemSeed {

    return this
      .hostPlanetarySystem
      .seed;
  }

  get relevantCometCount():
    number {

    return this
      .relevantComets
      .length;
  }

  get hasRelevantComets():
    boolean {

    return (
      this.relevantCometCount >
      0
    );
  }
}

function validateRelevantComets(
  hostPlanetarySystem:
    PlanetarySystem,

  comets:
    readonly RelevantComet[],
): void {

  for (
    let index = 0;
    index <
      comets.length;
    index += 1
  ) {
    const comet =
      comets[index];

    if (
      comet.cometOrdinal !==
        index +
          1 ||
      comet.identity.systemLocator !==
        hostPlanetarySystem.locator ||
      comet.identity.systemSeed !==
        hostPlanetarySystem.seed
    ) {
      throw new RangeError(
        'Point-22.5 relevant comets must preserve the exact host SystemLocator/SystemSeed and contiguous ordinals.',
      );
    }
  }
}
