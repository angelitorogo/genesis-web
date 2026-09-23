import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  type KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  GalaxyExplorationTelemetry,
  type GalaxyExplorationInventoryCounts,
  type GalaxyExplorationKnowledgeBreakdown,
} from '../../domain/exploration/galaxy-exploration-telemetry';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  GalacticObjectScientificSubject,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

import {
  NebulaType,
} from '../../domain/galactic-object/nebula-type';

import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  SectorLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  frozenPhysicalSourceKey,
} from '../../domain/generation/frozen-physical-source-key';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  MoonWaterRegime,
} from '../../domain/planetary/moon-water-regime';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  type SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

import {
  NebulaGenerator,
} from '../galactic-object/nebula-generator';

import {
  CapturedExtrasolarObjectGenerator,
} from '../planetary/captured-extrasolar-object-generator';

import {
  CometGenerator,
} from '../planetary/comet-generator';

import {
  TransNeptunianObjectGenerator,
} from '../planetary/trans-neptunian-object-generator';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  GalaxySectorGridGenerator,
} from '../sector/galaxy-sector-grid-generator';

import {
  GalacticCenterNucleusResolver,
} from '../nuclear/galactic-center-nucleus-resolver';

import {
  type GeneratedSingleHost,
  StellarMultihostFormation,
} from '../stellar/stellar-multihost-formation';

import {
  multihostPhysicalSourceKey,
} from '../stellar/stellar-multihost-physical-source-key';

import {
  StellarSystemMultiplicitySelector,
} from '../stellar/stellar-system-multiplicity-selector';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  ExplorationSectorResultEngine,
} from './exploration-sector-result-engine';

import {
  GalacticObjectScientificSubjectResolver,
} from '../galactic-object/galactic-object-scientific-subject-resolver';

const SIGNED_LONG_MAX =
  (1n << 63n) -
  1n;

const PERCENT_BASIS_POINTS =
  10_000n;

const LIQUID_WATER_THRESHOLD_01 =
  0.05;

const ROCKY_MOON_MAX_ICE_01 =
  0.35;

const ICY_MOON_MIN_ICE_01 =
  0.65;

/**
 * Point-26.1b knowledge-safe inventory/coverage projection.
 *
 * The only denominator exposed is the already-addressable phase-5 sector grid.
 * Object-family totals still inspect persisted discovery rows only.
 *
 * The 26.1b detail projection is deliberately stricter:
 * - system multiplicity is resolved only from DISCOVERED onward, matching 26.2;
 * - nebular physical subtype is resolved only from CATALOGUED onward;
 * - IMBH identity is counted only from CATALOGUED onward, matching its archive card;
 * - planetary/moon/minor-body populations are materialized only for persisted
 *   CONFIRMED systems, where those scientific body routes/layers are already open.
 *
 * No unknown sector, system or galactic-object address is ever enumerated.
 */
export class GalaxyExplorationTelemetryEngine {

  private constructor() {}

  static build(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,

    galaxyState:
      DiscoveryStateValue,

    knownDiscoveries:
      readonly KnownDiscovery[],
  ): GalaxyExplorationTelemetry {

    if (
      galaxyIndex < 0n ||
      galaxyIndex > SIGNED_LONG_MAX
    ) {
      throw new RangeError(
        `galaxyIndex must be a non-negative signed Long: ${galaxyIndex}.`,
      );
    }

    const canonicalState =
      DiscoveryState.fromCode(
        galaxyState.code,
      );

    if (
      !DiscoveryState.isKnown(
        canonicalState,
      )
    ) {
      throw new RangeError(
        'GalaxyExplorationTelemetryEngine requires a known galaxy.',
      );
    }

    const mutable =
      emptyInventoryCounts();

    const breakdown =
      emptyBreakdownCounts();

    if (
      canonicalState.code <
      DiscoveryState.DISCOVERED.code
    ) {
      return new GalaxyExplorationTelemetry(
        null,
        null,
        mutable,
        breakdown,
      );
    }

    const confirmedProjectedPlanetCounts =
      new Map<string, bigint>();

    /*
     * Pre-project CONFIRMED systems before consuming historical child rows.
     * This makes BodyLocator de-duplication independent from repository row
     * ordering and preserves stale-but-valid legacy child rows that fall
     * outside the regenerated public planet catalog.
     */
    for (
      const discovery
      of knownDiscoveries
    ) {
      if (
        !DiscoveryState.isKnown(discovery.state) ||
        !(discovery.locator instanceof SystemLocator) ||
        discovery.locator.galaxyIndex !== galaxyIndex ||
        discovery.state.code < DiscoveryState.CONFIRMED.code
      ) {
        continue;
      }

      const key =
        systemKey(discovery.locator);

      if (
        confirmedProjectedPlanetCounts.has(key)
      ) {
        continue;
      }

      confirmedProjectedPlanetCounts.set(
        key,
        projectConfirmedSystemInventory(
          generationKey,
          discovery.locator,
          mutable,
          breakdown,
        ),
      );

      breakdown.confirmedSystemsWithInventory += 1n;
    }

    for (
      const discovery
      of knownDiscoveries
    ) {
      if (
        !DiscoveryState.isKnown(
          discovery.state,
        ) ||
        discovery.locator.galaxyIndex !== galaxyIndex
      ) {
        continue;
      }

      const locator =
        discovery.locator;

      if (
        locator instanceof GalaxyLocator
      ) {
        continue;
      }

      if (
        locator instanceof SectorLocator
      ) {
        mutable.sectors += 1n;
        continue;
      }

      if (
        locator instanceof SystemLocator
      ) {
        mutable.systems += 1n;
        classifyKnownSystem(
          generationKey,
          locator,
          discovery.state,
          breakdown,
        );

        continue;
      }

      if (
        locator instanceof GalacticObjectLocator
      ) {
        classifyKnownGalacticObject(
          generationKey,
          locator,
          discovery.state,
          mutable,
          breakdown,
        );
        continue;
      }

      if (
        locator instanceof BodyLocator
      ) {
        /*
         * A CONFIRMED parent system is authoritative for the complete public
         * planetary inventory. Historical BodyLocator rows under that system
         * are therefore deduplicated. A body known outside a confirmed parent
         * remains a legitimate persisted planet, but its physical subtype is
         * intentionally left unclassified here.
         */
        const regeneratedPlanetCount =
          confirmedProjectedPlanetCounts.get(
            bodyParentSystemKey(locator),
          );

        if (
          regeneratedPlanetCount === undefined ||
          locator.bodyIndex >= regeneratedPlanetCount
        ) {
          mutable.planets += 1n;
          breakdown.planets.unclassified += 1n;
        }

        continue;
      }

      if (
        locator instanceof CivilizationLocator
      ) {
        mutable.civilizations += 1n;
      }
    }

    const galaxy =
      GalaxyGenerator.generate(
        generationKey,
        galaxyIndex,
      );

    const grid =
      GalaxySectorGridGenerator.generate(
        galaxy,
      );

    const totalSectors =
      grid.sideLengthInSectors *
      grid.sideLengthInSectors;

    const exploredPercentageBasisPoints =
      roundedBasisPoints(
        mutable.sectors,
        totalSectors,
      );

    return new GalaxyExplorationTelemetry(
      totalSectors,
      exploredPercentageBasisPoints,
      Object.freeze({ ...mutable }),
      freezeBreakdown(breakdown),
    );
  }
}

function classifyKnownSystem(
  generationKey:
    UniverseGenerationKey,

  locator:
    SystemLocator,

  state:
    DiscoveryStateValue,

  breakdown:
    MutableBreakdown,
): void {

  if (
    state.code <
    DiscoveryState.DISCOVERED.code
  ) {
    breakdown.systems.unclassified += 1n;
    return;
  }

  const physicalKey =
    multihostPhysicalSourceKey(
      generationKey,
    );

  const systemSeed =
    ProceduralTargetResolver.resolveTargetSeed(
      physicalKey,
      locator,
    ) as SystemSeed;

  const multiplicity =
    StellarSystemMultiplicitySelector.select(
      physicalKey,
      systemSeed,
    );

  if (
    multiplicity === StellarSystemMultiplicity.SINGLE
  ) {
    breakdown.systems.single += 1n;
    return;
  }

  if (
    multiplicity === StellarSystemMultiplicity.BINARY
  ) {
    breakdown.systems.binary += 1n;
    return;
  }

  if (
    multiplicity === StellarSystemMultiplicity.TRIPLE
  ) {
    breakdown.systems.triple += 1n;
    return;
  }

  throw new RangeError(
    `Unsupported stellar-system multiplicity: ${multiplicity.name}.`,
  );
}

function classifyKnownGalacticObject(
  generationKey:
    UniverseGenerationKey,

  locator:
    GalacticObjectLocator,

  state:
    DiscoveryStateValue,

  inventory:
    MutableInventory,

  breakdown:
    MutableBreakdown,
): void {

  const kind =
    ExplorationSectorResultEngine.resolveGalacticObjectKind(
      generationKey,
      locator,
    );

  if (
    kind === ExplorationResultKind.STAR_CLUSTER
  ) {
    inventory.starClusters += 1n;
    classifyKnownStarCluster(
      generationKey,
      locator,
      state,
      breakdown,
    );
    return;
  }

  if (
    kind === ExplorationResultKind.NEBULA
  ) {
    inventory.nebulae += 1n;
    classifyKnownNebula(
      generationKey,
      locator,
      state,
      breakdown,
    );
    return;
  }

  if (
    kind === ExplorationResultKind.EXTREME_OBJECT
  ) {
    inventory.extremeObjects += 1n;
    classifyKnownExtremeObject(
      generationKey,
      locator,
      state,
      breakdown,
    );
    return;
  }

  throw new RangeError(
    `Unexpected persistent GalacticObjectLocator family: ${kind}.`,
  );
}

function classifyKnownStarCluster(
  generationKey:
    UniverseGenerationKey,

  locator:
    GalacticObjectLocator,

  state:
    DiscoveryStateValue,

  breakdown:
    MutableBreakdown,
): void {

  if (
    state.code <
    DiscoveryState.DISCOVERED.code
  ) {
    breakdown.starClusters.unclassified += 1n;
    return;
  }

  const subject =
    GalacticObjectScientificSubjectResolver.resolve(
      generationKey,
      locator,
      state,
    );

  if (
    subject === GalacticObjectScientificSubject.OPEN_CLUSTER
  ) {
    breakdown.starClusters.open += 1n;
    return;
  }

  if (
    subject === GalacticObjectScientificSubject.GLOBULAR_CLUSTER
  ) {
    breakdown.starClusters.globular += 1n;
    return;
  }

  breakdown.starClusters.unclassified += 1n;
}

function classifyKnownNebula(
  generationKey:
    UniverseGenerationKey,

  locator:
    GalacticObjectLocator,

  state:
    DiscoveryStateValue,

  breakdown:
    MutableBreakdown,
): void {

  if (
    state.code <
    DiscoveryState.DISCOVERED.code
  ) {
    breakdown.nebulae.unclassified += 1n;
    return;
  }

  const subject =
    GalacticObjectScientificSubjectResolver.resolve(
      generationKey,
      locator,
      state,
    );

  if (
    subject === GalacticObjectScientificSubject.HII_REGION
  ) {
    breakdown.nebulae.hiiRegions += 1n;
    return;
  }

  if (
    subject !== GalacticObjectScientificSubject.NEBULA ||
    state.code < DiscoveryState.CATALOGUED.code
  ) {
    breakdown.nebulae.unclassified += 1n;
    return;
  }

  const nebula =
    NebulaGenerator.generate(
      frozenPhysicalSourceKey(
        generationKey,
      ),
      locator,
    );

  switch (
    nebula.nebulaType
  ) {
    case NebulaType.EMISSION:
      breakdown.nebulae.emission += 1n;
      return;

    case NebulaType.REFLECTION:
      breakdown.nebulae.reflection += 1n;
      return;

    case NebulaType.DARK:
      breakdown.nebulae.dark += 1n;
      return;

    case NebulaType.PLANETARY:
      breakdown.nebulae.planetary += 1n;
      return;
  }
}

function classifyKnownExtremeObject(
  generationKey:
    UniverseGenerationKey,

  locator:
    GalacticObjectLocator,

  state:
    DiscoveryStateValue,

  breakdown:
    MutableBreakdown,
): void {

  if (
    state.code <
    DiscoveryState.DISCOVERED.code
  ) {
    breakdown.extremeObjects.unclassified += 1n;
    return;
  }

  const subject =
    GalacticObjectScientificSubjectResolver.resolve(
      generationKey,
      locator,
      state,
    );

  if (
    subject === GalacticObjectScientificSubject.SUPERNOVA_REMNANT
  ) {
    breakdown.extremeObjects.supernovaRemnants += 1n;
    return;
  }

  if (
    subject === GalacticObjectScientificSubject.INTERMEDIATE_MASS_BLACK_HOLE
  ) {
    if (
      state.code >=
      DiscoveryState.CATALOGUED.code
    ) {
      breakdown.extremeObjects.intermediateMassBlackHoles += 1n;
    } else {
      breakdown.extremeObjects.unclassified += 1n;
    }
    return;
  }

  if (
    subject === GalacticObjectScientificSubject.ACTIVE_GALACTIC_NUCLEUS
  ) {
    const nucleusState =
      GalacticCenterNucleusResolver.resolveState(
        GalaxyGenerator.generate(
          generationKey,
          locator.galaxyIndex,
        ),
      );

    if (
      nucleusState === GalacticNucleusState.QUASAR
    ) {
      breakdown.extremeObjects.quasars += 1n;
    } else {
      breakdown.extremeObjects.activeGalacticNuclei += 1n;
    }
    return;
  }

  breakdown.extremeObjects.unclassified += 1n;
}

function projectConfirmedSystemInventory(
  generationKey:
    UniverseGenerationKey,

  locator:
    SystemLocator,

  inventory:
    MutableInventory,

  breakdown:
    MutableBreakdown,
): bigint {

  const multiple =
    StellarMultihostFormation.generateOrNull(
      generationKey,
      locator,
    );

  if (
    multiple !== null
  ) {
    for (
      const publicPlanet
      of multiple.publicPlanets
    ) {
      projectPlanet(
        publicPlanet.planet,
        publicPlanet.atmosphere.surfaceLiquidWaterCoverageFraction01,
        inventory,
        breakdown,
      );

      projectMoonSystem(
        publicPlanet.moonSystem,
        inventory,
        breakdown,
      );
    }

    for (
      const host
      of multiple.components
    ) {
      projectMinorBodies(
        host,
        inventory,
      );
    }

    return BigInt(
      multiple.publicPlanets.length,
    );
  }

  const single =
    StellarMultihostFormation.generateSingleOrNull(
      generationKey,
      locator,
    );

  if (
    single === null
  ) {
    throw new Error(
      'CONFIRMED stellar-system inventory could not resolve its physical host.',
    );
  }

  for (
    let index = 0;
    index < single.planets.length;
    index += 1
  ) {
    const planet =
      single.planets[index];

    const atmosphere =
      single.atmospheres[index];

    const moonSystem =
      single.moonSystems[index];

    if (
      planet === undefined ||
      atmosphere === undefined ||
      moonSystem === undefined ||
      atmosphere.hostPlanet !== planet ||
      moonSystem.hostPlanet !== planet
    ) {
      throw new Error(
        'CONFIRMED SINGLE inventory has inconsistent planet/atmosphere/moon ordering.',
      );
    }

    projectPlanet(
      planet,
      atmosphere.surfaceLiquidWaterCoverageFraction01,
      inventory,
      breakdown,
    );

    projectMoonSystem(
      moonSystem,
      inventory,
      breakdown,
    );
  }

  if (
    single.pulsarPlanetPopulation !== undefined &&
    single.pulsarPlanetPopulation !== null
  ) {
    const count =
      BigInt(
        single.pulsarPlanetPopulation.planets.length,
      );

    inventory.planets += count;
    breakdown.planets.postCollapseModel += count;
  }

  projectMinorBodies(
    single,
    inventory,
  );

  return BigInt(
    single.planets.length,
  );
}

function projectPlanet(
  planet:
    GeneratedSingleHost['planets'][number],

  surfaceLiquidWaterCoverageFraction01:
    number | null,

  inventory:
    MutableInventory,

  breakdown:
    MutableBreakdown,
): void {

  inventory.planets += 1n;

  switch (
    planet.planetType
  ) {
    case PlanetType.ROCKY:
      breakdown.planets.rocky += 1n;
      break;

    case PlanetType.SUPER_EARTH:
      breakdown.planets.superEarth += 1n;
      break;

    case PlanetType.DESERT:
      breakdown.planets.desert += 1n;
      break;

    case PlanetType.OCEAN:
      breakdown.planets.ocean += 1n;
      break;

    case PlanetType.ICE:
      breakdown.planets.ice += 1n;
      break;

    case PlanetType.VOLCANIC:
      breakdown.planets.volcanic += 1n;
      break;

    case PlanetType.MINI_NEPTUNE:
      breakdown.planets.miniNeptune += 1n;
      break;

    case PlanetType.GAS_GIANT:
      breakdown.planets.gasGiant += 1n;
      break;

    case PlanetType.ICE_GIANT:
      breakdown.planets.iceGiant += 1n;
      break;
  }

  if (
    surfaceLiquidWaterCoverageFraction01 !== null &&
    surfaceLiquidWaterCoverageFraction01 >= LIQUID_WATER_THRESHOLD_01
  ) {
    breakdown.planets.liquidSurfaceAtLeast40Percent += 1n;
  }
}

function projectMoonSystem(
  moonSystem:
    GeneratedSingleHost['moonSystems'][number],

  inventory:
    MutableInventory,

  breakdown:
    MutableBreakdown,
): void {

  const moonCount =
    BigInt(
      moonSystem.moonCount,
    );

  inventory.moons += moonCount;

  const relevantCount =
    BigInt(
      moonSystem.relevantMoons.length,
    );

  breakdown.moons.uncharacterized +=
    moonCount -
    relevantCount;

  for (
    const moon
    of moonSystem.relevantMoons
  ) {
    const ice =
      moon.environmentState.inferredIceRichnessIndex01;

    if (
      ice < ROCKY_MOON_MAX_ICE_01
    ) {
      breakdown.moons.rocky += 1n;
    } else if (
      ice >= ICY_MOON_MIN_ICE_01
    ) {
      breakdown.moons.icy += 1n;
    } else {
      breakdown.moons.mixedRockIce += 1n;
    }

    if (
      moon.environmentState.surfaceLiquidWaterPotentialIndex01 >=
      LIQUID_WATER_THRESHOLD_01
    ) {
      breakdown.moons.surfaceLiquidPotentialAtLeast40Percent += 1n;
    }

    if (
      moon.environmentState.waterRegime === MoonWaterRegime.SUBSURFACE_OCEAN ||
      moon.environmentState.waterRegime === MoonWaterRegime.ICE_AND_SUBSURFACE_OCEAN ||
      moon.environmentState.waterRegime === MoonWaterRegime.MIXED
    ) {
      breakdown.moons.subsurfaceOceanEvidence += 1n;
    }
  }
}

function projectMinorBodies(
  host:
    GeneratedSingleHost,

  inventory:
    MutableInventory,
): void {

  const planetarySystem =
    host.planetarySystem;

  const asteroidBelts =
    host.asteroidBelts;

  if (
    planetarySystem === null
  ) {
    return;
  }

  const key =
    host.internalGenerationKey;

  if (
    asteroidBelts !== null
  ) {
    inventory.asteroids +=
      BigInt(
        asteroidBelts.relevantAsteroidCount,
      );
  }

  inventory.comets +=
    BigInt(
      CometGenerator.generate(
        key,
        planetarySystem,
      ).relevantCometCount,
    );

  inventory.transNeptunianObjects +=
    BigInt(
      TransNeptunianObjectGenerator.generate(
        key,
        planetarySystem,
      ).relevantObjectCount,
    );

  inventory.capturedObjects +=
    BigInt(
      CapturedExtrasolarObjectGenerator.generate(
        key,
        planetarySystem,
      ).relevantObjectCount,
    );
}

type MutableInventory = {
  -readonly [
    Key in keyof GalaxyExplorationInventoryCounts
  ]: GalaxyExplorationInventoryCounts[Key];
};

type MutableBreakdown = {
  systems: {
    single: bigint;
    binary: bigint;
    triple: bigint;
    unclassified: bigint;
  };
  starClusters: {
    open: bigint;
    globular: bigint;
    unclassified: bigint;
  };
  nebulae: {
    emission: bigint;
    reflection: bigint;
    dark: bigint;
    planetary: bigint;
    hiiRegions: bigint;
    unclassified: bigint;
  };
  extremeObjects: {
    supernovaRemnants: bigint;
    intermediateMassBlackHoles: bigint;
    activeGalacticNuclei: bigint;
    quasars: bigint;
    unclassified: bigint;
  };
  planets: {
    rocky: bigint;
    superEarth: bigint;
    desert: bigint;
    ocean: bigint;
    ice: bigint;
    volcanic: bigint;
    miniNeptune: bigint;
    gasGiant: bigint;
    iceGiant: bigint;
    postCollapseModel: bigint;
    unclassified: bigint;
    liquidSurfaceAtLeast40Percent: bigint;
  };
  moons: {
    rocky: bigint;
    mixedRockIce: bigint;
    icy: bigint;
    uncharacterized: bigint;
    surfaceLiquidPotentialAtLeast40Percent: bigint;
    subsurfaceOceanEvidence: bigint;
  };
  confirmedSystemsWithInventory: bigint;
};

function emptyInventoryCounts():
  MutableInventory {

  return {
    sectors: 0n,
    systems: 0n,
    starClusters: 0n,
    nebulae: 0n,
    extremeObjects: 0n,
    planets: 0n,
    moons: 0n,
    asteroids: 0n,
    comets: 0n,
    transNeptunianObjects: 0n,
    capturedObjects: 0n,
    civilizations: 0n,
  };
}

function emptyBreakdownCounts():
  MutableBreakdown {

  return {
    systems: {
      single: 0n,
      binary: 0n,
      triple: 0n,
      unclassified: 0n,
    },
    starClusters: {
      open: 0n,
      globular: 0n,
      unclassified: 0n,
    },
    nebulae: {
      emission: 0n,
      reflection: 0n,
      dark: 0n,
      planetary: 0n,
      hiiRegions: 0n,
      unclassified: 0n,
    },
    extremeObjects: {
      supernovaRemnants: 0n,
      intermediateMassBlackHoles: 0n,
      activeGalacticNuclei: 0n,
      quasars: 0n,
      unclassified: 0n,
    },
    planets: {
      rocky: 0n,
      superEarth: 0n,
      desert: 0n,
      ocean: 0n,
      ice: 0n,
      volcanic: 0n,
      miniNeptune: 0n,
      gasGiant: 0n,
      iceGiant: 0n,
      postCollapseModel: 0n,
      unclassified: 0n,
      liquidSurfaceAtLeast40Percent: 0n,
    },
    moons: {
      rocky: 0n,
      mixedRockIce: 0n,
      icy: 0n,
      uncharacterized: 0n,
      surfaceLiquidPotentialAtLeast40Percent: 0n,
      subsurfaceOceanEvidence: 0n,
    },
    confirmedSystemsWithInventory: 0n,
  };
}

function freezeBreakdown(
  breakdown:
    MutableBreakdown,
): GalaxyExplorationKnowledgeBreakdown {

  return Object.freeze({
    systems: Object.freeze({ ...breakdown.systems }),
    starClusters: Object.freeze({ ...breakdown.starClusters }),
    nebulae: Object.freeze({ ...breakdown.nebulae }),
    extremeObjects: Object.freeze({ ...breakdown.extremeObjects }),
    planets: Object.freeze({ ...breakdown.planets }),
    moons: Object.freeze({ ...breakdown.moons }),
    confirmedSystemsWithInventory:
      breakdown.confirmedSystemsWithInventory,
  });
}

function systemKey(
  locator:
    SystemLocator,
): string {

  return `${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}`;
}

function bodyParentSystemKey(
  locator:
    BodyLocator,
): string {

  return `${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}`;
}

function roundedBasisPoints(
  exploredSectors:
    bigint,

  totalSectors:
    bigint,
): bigint {

  if (
    totalSectors <= 0n
  ) {
    throw new RangeError(
      'totalSectors must be positive.',
    );
  }

  const rounded =
    (
      exploredSectors *
        PERCENT_BASIS_POINTS +
      totalSectors /
        2n
    ) /
    totalSectors;

  return rounded >
    PERCENT_BASIS_POINTS
    ? PERCENT_BASIS_POINTS
    : rounded;
}
