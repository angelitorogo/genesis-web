import {
  GalaxyExplorationTelemetry,
  type GalaxyExplorationInventoryCounts,
  type GalaxyExplorationKnowledgeBreakdown,
} from './galaxy-exploration-telemetry';
import { EMPTY_GALAXY_COMPACT_HOST_KNOWLEDGE } from './galaxy-compact-host-knowledge';

const inventory: GalaxyExplorationInventoryCounts = {
  sectors: 0n, systems: 2n, starClusters: 0n, nebulae: 0n,
  extremeObjects: 0n, planets: 0n, moons: 0n, asteroids: 0n,
  comets: 0n, transNeptunianObjects: 0n, capturedObjects: 0n,
  civilizations: 0n,
};
const breakdown: GalaxyExplorationKnowledgeBreakdown = {
  systems: { single: 2n, binary: 0n, triple: 0n, unclassified: 0n },
  starClusters: { open: 0n, globular: 0n, unclassified: 0n },
  nebulae: { emission: 0n, reflection: 0n, dark: 0n, planetary: 0n, hiiRegions: 0n, unclassified: 0n },
  extremeObjects: {
    neutronStars: 0n, pulsars: 0n, millisecondPulsars: 0n, magnetars: 0n,
    stellarMassBlackHoles: 0n, intermediateMassBlackHoles: 0n,
    supernovaRemnants: 0n, pulsarWindNebulae: 0n,
    xRayBinariesNeutronStar: 0n, xRayBinariesBlackHole: 0n,
    microquasars: 0n, ultraluminousXRaySources: 0n,
    activeGalacticNuclei: 0n, quasars: 0n,
    reservedUnspecialized: 0n, unclassified: 0n,
  },
  planets: {
    rocky: 0n, superEarth: 0n, desert: 0n, ocean: 0n,
    ice: 0n, volcanic: 0n, miniNeptune: 0n, gasGiant: 0n,
    iceGiant: 0n, postCollapseModel: 0n, unclassified: 0n,
    liquidSurfaceAtLeast20Percent: 0n,
  },
  moons: {
    rocky: 0n, mixedRockIce: 0n, icy: 0n,
    unmaterializedMinor: 0n, unmaterializedMinorRegular: 0n,
    unmaterializedMinorIrregular: 0n, unmaterializedMinorOther: 0n,
    unclassified: 0n, surfaceLiquidPotentialAtLeast40Percent: 0n,
    subsurfaceOceanEvidence: 0n,
  },
  confirmedSystemsWithInventory: 0n,
};

describe('31.1 galaxy telemetry compatibility and subset invariants', () => {
  it('rehydrates old snapshot data without the optional compact subset', () => {
    const restored = new GalaxyExplorationTelemetry(null, null, inventory, breakdown);
    expect(restored.compactHostSystems).toEqual(EMPTY_GALAXY_COMPACT_HOST_KNOWLEDGE);
    expect(restored.inventory.systems).toBe(2n);
  });
  it('never adds overlapping compact classes to the existing system total', () => {
    const telemetry = new GalaxyExplorationTelemetry(null, null, inventory, breakdown, {
      ...EMPTY_GALAXY_COMPACT_HOST_KNOWLEDGE, total: 2n, pulsars: 1n, magnetars: 1n,
    });
    expect(telemetry.inventory.systems).toBe(2n);
    expect(telemetry.breakdown.systems.single).toBe(2n);
    expect(telemetry.compactHostSystems.total).toBe(2n);
    expect(Object.isFrozen(telemetry.compactHostSystems)).toBe(true);
  });
  it('rejects impossible duplicate or oversized overlapping tallies', () => {
    expect(() => new GalaxyExplorationTelemetry(null, null, inventory, breakdown, {
      ...EMPTY_GALAXY_COMPACT_HOST_KNOWLEDGE, total: 3n, pulsars: 3n,
    })).toThrow();
    expect(() => new GalaxyExplorationTelemetry(null, null, inventory, breakdown, {
      ...EMPTY_GALAXY_COMPACT_HOST_KNOWLEDGE, total: 1n, pulsars: 2n,
    })).toThrow();
  });
});
