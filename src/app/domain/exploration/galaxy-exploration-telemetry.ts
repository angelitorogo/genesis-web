export interface GalaxyExplorationInventoryCounts {
  readonly sectors:
    bigint;

  readonly systems:
    bigint;

  readonly starClusters:
    bigint;

  readonly nebulae:
    bigint;

  readonly extremeObjects:
    bigint;

  readonly planets:
    bigint;

  readonly moons:
    bigint;

  readonly asteroids:
    bigint;

  readonly comets:
    bigint;

  readonly transNeptunianObjects:
    bigint;

  readonly capturedObjects:
    bigint;

  readonly civilizations:
    bigint;
}

/**
 * Point-26.1 read-only exploration telemetry for one known galaxy.
 *
 * `totalSectors` is the size of the already-addressable phase-5 galactic grid,
 * not a count of hidden systems or objects. `exploredPercentageBasisPoints`
 * therefore measures persisted SectorLocator coverage only: 10_000 = 100.00%.
 *
 * Every inventory counter is a player-knowledge counter. The model must never
 * materialize unknown procedural contents merely to populate a dashboard.
 */
export class GalaxyExplorationTelemetry {

  readonly inventory:
    GalaxyExplorationInventoryCounts;

  constructor(
    readonly totalSectors:
      bigint | null,

    readonly exploredPercentageBasisPoints:
      bigint | null,

    inventory:
      GalaxyExplorationInventoryCounts,
  ) {

    for (
      const [
        label,
        value,
      ]
      of Object.entries(
        inventory,
      )
    ) {
      if (
        typeof value !==
          'bigint' ||
        value <
          0n
      ) {
        throw new RangeError(
          `${label} must be a non-negative bigint.`,
        );
      }
    }

    if (
      totalSectors ===
      null
    ) {
      if (
        exploredPercentageBasisPoints !==
        null
      ) {
        throw new RangeError(
          'A hidden total sector count cannot expose an exploration percentage.',
        );
      }
    } else {
      if (
        totalSectors <=
          0n ||
        inventory.sectors >
          totalSectors
      ) {
        throw new RangeError(
          'Known sector coverage must fit inside the positive addressable galaxy grid.',
        );
      }

      if (
        exploredPercentageBasisPoints ===
          null ||
        exploredPercentageBasisPoints <
          0n ||
        exploredPercentageBasisPoints >
          10_000n
      ) {
        throw new RangeError(
          'exploredPercentageBasisPoints must belong to [0, 10000] when totalSectors is known.',
        );
      }
    }

    this.inventory =
      Object.freeze({
        ...inventory,
      });

    Object.freeze(
      this,
    );
  }
}
