export interface GalaxyExplorationInventoryCounts {
  readonly sectors: bigint;
  readonly systems: bigint;
  readonly starClusters: bigint;
  readonly nebulae: bigint;
  readonly extremeObjects: bigint;
  readonly planets: bigint;
  readonly moons: bigint;
  readonly asteroids: bigint;
  readonly comets: bigint;
  readonly transNeptunianObjects: bigint;
  readonly capturedObjects: bigint;
  readonly civilizations: bigint;
}

export interface GalaxySystemKnowledgeCounts {
  readonly single: bigint;
  readonly binary: bigint;
  readonly triple: bigint;
  readonly unclassified: bigint;
}

export interface GalaxyStarClusterKnowledgeCounts {
  readonly open: bigint;
  readonly globular: bigint;
  readonly unclassified: bigint;
}

export interface GalaxyNebulaKnowledgeCounts {
  readonly emission: bigint;
  readonly reflection: bigint;
  readonly dark: bigint;
  readonly planetary: bigint;
  readonly hiiRegions: bigint;
  readonly unclassified: bigint;
}

export interface GalaxyExtremeObjectKnowledgeCounts {
  readonly supernovaRemnants: bigint;
  readonly intermediateMassBlackHoles: bigint;
  readonly activeGalacticNuclei: bigint;
  readonly quasars: bigint;
  readonly unclassified: bigint;
}

export interface GalaxyPlanetKnowledgeCounts {
  readonly rocky: bigint;
  readonly superEarth: bigint;
  readonly desert: bigint;
  readonly ocean: bigint;
  readonly ice: bigint;
  readonly volcanic: bigint;
  readonly miniNeptune: bigint;
  readonly gasGiant: bigint;
  readonly iceGiant: bigint;
  readonly postCollapseModel: bigint;
  readonly unclassified: bigint;
  readonly liquidSurfaceAtLeast40Percent: bigint;
}

export interface GalaxyMoonKnowledgeCounts {
  readonly rocky: bigint;
  readonly mixedRockIce: bigint;
  readonly icy: bigint;
  readonly uncharacterized: bigint;
  readonly surfaceLiquidPotentialAtLeast40Percent: bigint;
  readonly subsurfaceOceanEvidence: bigint;
}

export interface GalaxyExplorationKnowledgeBreakdown {
  readonly systems: GalaxySystemKnowledgeCounts;
  readonly starClusters: GalaxyStarClusterKnowledgeCounts;
  readonly nebulae: GalaxyNebulaKnowledgeCounts;
  readonly extremeObjects: GalaxyExtremeObjectKnowledgeCounts;
  readonly planets: GalaxyPlanetKnowledgeCounts;
  readonly moons: GalaxyMoonKnowledgeCounts;

  /**
   * Number of persisted CONFIRMED systems whose deterministic physical
   * inventory has been projected into planets/moons/minor bodies.
   */
  readonly confirmedSystemsWithInventory: bigint;
}

/**
 * Point-26.1/26.1b read-only exploration telemetry for one known galaxy.
 *
 * `totalSectors` is the size of the already-addressable phase-5 galactic grid,
 * not a count of hidden systems or objects. `exploredPercentageBasisPoints`
 * therefore measures persisted SectorLocator coverage only: 10_000 = 100.00%.
 *
 * Every inventory counter is a player-knowledge counter. Point 26.1b may
 * deterministically regenerate only already-known targets whose persisted
 * DiscoveryState explicitly permits the corresponding disclosure.
 */
export class GalaxyExplorationTelemetry {

  readonly inventory: GalaxyExplorationInventoryCounts;
  readonly breakdown: GalaxyExplorationKnowledgeBreakdown;

  constructor(
    readonly totalSectors: bigint | null,
    readonly exploredPercentageBasisPoints: bigint | null,
    inventory: GalaxyExplorationInventoryCounts,
    breakdown: GalaxyExplorationKnowledgeBreakdown,
  ) {
    assertNonNegativeBigIntRecord(
      inventory as unknown as Readonly<Record<string, unknown>>,
      'inventory',
    );
    assertNonNegativeBigIntRecord(
      breakdown as unknown as Readonly<Record<string, unknown>>,
      'breakdown',
    );

    if (
      breakdown.systems.single +
        breakdown.systems.binary +
        breakdown.systems.triple +
        breakdown.systems.unclassified !==
      inventory.systems
    ) {
      throw new RangeError(
        'System knowledge breakdown must partition the known-system inventory.',
      );
    }

    if (
      breakdown.starClusters.open +
        breakdown.starClusters.globular +
        breakdown.starClusters.unclassified !==
      inventory.starClusters
    ) {
      throw new RangeError(
        'Star-cluster knowledge breakdown must partition the known-cluster inventory.',
      );
    }

    if (
      breakdown.nebulae.emission +
        breakdown.nebulae.reflection +
        breakdown.nebulae.dark +
        breakdown.nebulae.planetary +
        breakdown.nebulae.hiiRegions +
        breakdown.nebulae.unclassified !==
      inventory.nebulae
    ) {
      throw new RangeError(
        'Nebula knowledge breakdown must partition the known-nebula inventory.',
      );
    }

    if (
      breakdown.extremeObjects.supernovaRemnants +
        breakdown.extremeObjects.intermediateMassBlackHoles +
        breakdown.extremeObjects.activeGalacticNuclei +
        breakdown.extremeObjects.quasars +
        breakdown.extremeObjects.unclassified !==
      inventory.extremeObjects
    ) {
      throw new RangeError(
        'Extreme-object knowledge breakdown must partition the known-extreme inventory.',
      );
    }

    const typedPlanets =
      breakdown.planets.rocky +
      breakdown.planets.superEarth +
      breakdown.planets.desert +
      breakdown.planets.ocean +
      breakdown.planets.ice +
      breakdown.planets.volcanic +
      breakdown.planets.miniNeptune +
      breakdown.planets.gasGiant +
      breakdown.planets.iceGiant +
      breakdown.planets.postCollapseModel +
      breakdown.planets.unclassified;

    if (typedPlanets !== inventory.planets) {
      throw new RangeError(
        'Planet knowledge breakdown must partition the known-planet inventory.',
      );
    }

    const typedMoons =
      breakdown.moons.rocky +
      breakdown.moons.mixedRockIce +
      breakdown.moons.icy +
      breakdown.moons.uncharacterized;

    if (typedMoons !== inventory.moons) {
      throw new RangeError(
        'Moon knowledge breakdown must partition the known-moon inventory.',
      );
    }

    if (
      breakdown.planets.liquidSurfaceAtLeast40Percent > inventory.planets ||
      breakdown.moons.surfaceLiquidPotentialAtLeast40Percent > inventory.moons ||
      breakdown.moons.subsurfaceOceanEvidence > inventory.moons ||
      breakdown.confirmedSystemsWithInventory > inventory.systems
    ) {
      throw new RangeError(
        'Scientific subset counters cannot exceed their known parent inventory.',
      );
    }

    if (totalSectors === null) {
      if (exploredPercentageBasisPoints !== null) {
        throw new RangeError(
          'A hidden total sector count cannot expose an exploration percentage.',
        );
      }
    } else {
      if (
        totalSectors <= 0n ||
        inventory.sectors > totalSectors
      ) {
        throw new RangeError(
          'Known sector coverage must fit inside the positive addressable galaxy grid.',
        );
      }

      if (
        exploredPercentageBasisPoints === null ||
        exploredPercentageBasisPoints < 0n ||
        exploredPercentageBasisPoints > 10_000n
      ) {
        throw new RangeError(
          'exploredPercentageBasisPoints must belong to [0, 10000] when totalSectors is known.',
        );
      }
    }

    this.inventory = Object.freeze({ ...inventory });
    this.breakdown = deepFreezeBreakdown(breakdown);

    Object.freeze(this);
  }
}

function assertNonNegativeBigIntRecord(
  record: Readonly<Record<string, unknown>>,
  path: string,
): void {
  for (const [label, value] of Object.entries(record)) {
    const qualified = `${path}.${label}`;

    if (typeof value === 'bigint') {
      if (value < 0n) {
        throw new RangeError(`${qualified} must be a non-negative bigint.`);
      }
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      assertNonNegativeBigIntRecord(
        value as Readonly<Record<string, unknown>>,
        qualified,
      );
      continue;
    }

    throw new TypeError(`${qualified} must contain only bigint counters.`);
  }
}

function deepFreezeBreakdown(
  breakdown: GalaxyExplorationKnowledgeBreakdown,
): GalaxyExplorationKnowledgeBreakdown {
  return Object.freeze({
    systems: Object.freeze({ ...breakdown.systems }),
    starClusters: Object.freeze({ ...breakdown.starClusters }),
    nebulae: Object.freeze({ ...breakdown.nebulae }),
    extremeObjects: Object.freeze({ ...breakdown.extremeObjects }),
    planets: Object.freeze({ ...breakdown.planets }),
    moons: Object.freeze({ ...breakdown.moons }),
    confirmedSystemsWithInventory: breakdown.confirmedSystemsWithInventory,
  });
}
