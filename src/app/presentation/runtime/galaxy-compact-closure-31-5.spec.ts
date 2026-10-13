import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import { type GalaxyKnowledgeSnapshotEntity } from '../../data/local/entity/galaxy-knowledge-snapshot.entity';
import { type GalaxyKnowledgeSnapshotRepository } from '../../data/local/repository/dexie-galaxy-knowledge-snapshot.repository';
import { canonicalGalaxyKnownDiscoveries } from '../../domain/exploration/galaxy-known-discoveries-canonical';
import { BodyLocator, GalaxyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { CompactHostPlanetarySystemGenerator } from '../../simulation/planetary/compact-host-planetary-system-generator';
import { GalaxyExplorationTelemetryEngine } from '../../simulation/exploration/galaxy-exploration-telemetry-engine';
import { generateKnownCompactHostCatalog } from '../../simulation/exploration/galaxy-known-compact-host-catalog-generator';
import { GalaxyKnowledgeStatisticsEngine } from '../../simulation/exploration/galaxy-knowledge-statistics-engine';
import { buildGalaxyMinorBodyCatalogSnapshot } from './galaxy-minor-body-catalog-snapshot.runtime';
import { buildGalaxyPlanetMoonCatalogSnapshot } from './galaxy-planet-moon-catalog-snapshot.runtime';
import { DexieGalaxyKnowledgeSnapshotRuntime, GALAXY_SCIENTIFIC_MODEL_VERSION } from './galaxy-knowledge-snapshot.runtime';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V2,
);
const galaxy = new GalaxyLocator(0n);

function compactFixture() {
  for (let i = 0n; i < 5000n; i += 1n) {
    const locator = new SystemLocator(0n, 0n, i);
    const system = CompactHostPlanetarySystemGenerator.generateOrNull(key, locator);
    if (system !== null && system.planets.length > 0 &&
        system.secondaries.moons.length > 0 && system.secondaries.minorBodies.length > 0) {
      return { locator, system };
    }
  }
  throw new Error('Missing compact regression fixture with planets, moons and minor bodies');
}
const fixture = compactFixture();
const makeKnown = (locator: SystemLocator, state: DiscoveryStateValue) => [
  new KnownDiscovery(key, galaxy, DiscoveryState.DISCOVERED),
  new KnownDiscovery(key, locator, state),
];
const minors = (snapshot: ReturnType<typeof buildGalaxyMinorBodyCatalogSnapshot>) => [
  ...snapshot.asteroids, ...snapshot.comets,
  ...snapshot.transNeptunianObjects, ...snapshot.capturedObjects,
];

/** 31.5 close: compare independently generated telemetry, catalogue and stored knowledge. */
describe('31.5 compact inventory closure: counts, identities and disclosure', () => {
  it('matches every known object family across telemetry, catalogue and the procedural snapshot', () => {
    const { locator, system } = fixture;
    const known = makeKnown(locator, DiscoveryState.CONFIRMED);
    const telemetry = GalaxyExplorationTelemetryEngine.build(key, 0n, DiscoveryState.DISCOVERED, known);
    const planetMoon = buildGalaxyPlanetMoonCatalogSnapshot(key, 0n, known);
    const minor = buildGalaxyMinorBodyCatalogSnapshot(key, 0n, known);
    const minorRows = minors(minor);

    expect(planetMoon.planets).toHaveLength(system.planets.length);
    expect(planetMoon.moons).toHaveLength(system.secondaries.moons.length);
    expect(minorRows).toHaveLength(system.secondaries.minorBodies.length);
    expect(telemetry.inventory.planets).toBe(BigInt(planetMoon.planets.length));
    expect(telemetry.inventory.moons).toBe(BigInt(planetMoon.moons.length));
    expect(telemetry.inventory.asteroids).toBe(BigInt(minor.asteroids.length));
    expect(telemetry.inventory.comets).toBe(BigInt(minor.comets.length));
    expect(telemetry.inventory.transNeptunianObjects).toBe(BigInt(minor.transNeptunianObjects.length));
    expect(telemetry.inventory.capturedObjects).toBe(BigInt(minor.capturedObjects.length));
    expect(telemetry.compactHostPlanets).toBe(BigInt(system.planets.length));
    expect(telemetry.breakdown.confirmedSystemsWithInventory).toBe(1n);
    expect(telemetry.breakdown.moons.surfaceLiquidPotentialAtLeast40Percent).toBe(0n);
    expect(telemetry.breakdown.moons.subsurfaceOceanEvidence).toBe(0n);
    expect(telemetry.breakdown.planets.liquidSurfaceAtLeast20Percent).toBe(0n);

    expect(new Set(planetMoon.planets.map(p => p.id)).size).toBe(planetMoon.planets.length);
    expect(new Set(planetMoon.moons.map(m => m.id)).size).toBe(planetMoon.moons.length);
    expect(new Set(minorRows.map(m => m.id)).size).toBe(minorRows.length);
    expect(new Set(minorRows.map(m => m.proceduralId)).size).toBe(minorRows.length);
    expect(planetMoon.planets.every(p => p.orbitClass === 'COMPACT_HOST' &&
      p.surfaceLiquidWaterCoverageFraction01 === null)).toBe(true);
    expect(planetMoon.moons.every(m => m.orbitClass === 'COMPACT_HOST' &&
      m.surfaceLiquidWaterPotentialIndex01 === 0)).toBe(true);
  });

  it('does not materialize planets, moons or minor bodies before the system is CONFIRMED', () => {
    for (const stage of [DiscoveryState.DETECTED, DiscoveryState.DISCOVERED,
      DiscoveryState.VISITED, DiscoveryState.CATALOGUED]) {
      const known = makeKnown(fixture.locator, stage);
      const telemetry = GalaxyExplorationTelemetryEngine.build(key, 0n, DiscoveryState.DISCOVERED, known);
      const planetMoon = buildGalaxyPlanetMoonCatalogSnapshot(key, 0n, known);
      const minor = buildGalaxyMinorBodyCatalogSnapshot(key, 0n, known);
      expect(telemetry.inventory.planets).toBe(0n);
      expect(telemetry.inventory.moons).toBe(0n);
      expect(telemetry.inventory.asteroids + telemetry.inventory.comets +
        telemetry.inventory.transNeptunianObjects + telemetry.inventory.capturedObjects).toBe(0n);
      expect(telemetry.compactHostPlanets).toBe(0n);
      expect(planetMoon.planets).toHaveLength(0);
      expect(planetMoon.moons).toHaveLength(0);
      expect(minors(minor)).toHaveLength(0);
    }
  });

  it('reveals compact host taxonomy at CATALOGUED without revealing its planetary population', () => {
    const { locator, system } = fixture;
    expect(generateKnownCompactHostCatalog(key, 0n,
      makeKnown(locator, DiscoveryState.DISCOVERED))).toHaveLength(0);
    const catalogued = generateKnownCompactHostCatalog(key, 0n,
      makeKnown(locator, DiscoveryState.CATALOGUED));
    expect(catalogued).toHaveLength(1);
    expect(catalogued[0]?.host.type).toBe(system.host.type);
    expect(catalogued[0]?.planets).toBeNull();
    const confirmed = generateKnownCompactHostCatalog(key, 0n,
      makeKnown(locator, DiscoveryState.CONFIRMED));
    expect(confirmed).toHaveLength(1);
    expect(confirmed[0]?.planets).toHaveLength(system.planets.length);
  });

  it('deduplicates repeated persisted rows in both orders, retaining the most advanced known state', () => {
    const { locator, system } = fixture;
    const confirmed = new KnownDiscovery(key, locator, DiscoveryState.CONFIRMED);
    const catalogued = new KnownDiscovery(key, locator, DiscoveryState.CATALOGUED);
    const galaxyKnown = new KnownDiscovery(key, galaxy, DiscoveryState.DISCOVERED);
    // An explicitly persisted body must not duplicate a body from its confirmed parent.
    const child = new KnownDiscovery(key,
      new BodyLocator(locator.galaxyIndex, locator.sectorKey, locator.galacticObjectIndex, 0n),
      DiscoveryState.DISCOVERED);
    const scenarios = [
      [galaxyKnown, catalogued, confirmed, confirmed, child, child],
      [child, confirmed, catalogued, galaxyKnown, confirmed, child],
    ];
    for (const scenario of scenarios) {
      const canonical = canonicalGalaxyKnownDiscoveries(key, 0n, scenario);
      expect(canonical).toHaveLength(3);
      expect(canonical.find(d => d.locator instanceof SystemLocator)?.state).toBe(DiscoveryState.CONFIRMED);
      const statistics = GalaxyKnowledgeStatisticsEngine.build(key, 0n, canonical);
      expect(statistics).toBeDefined();
      const telemetry = GalaxyExplorationTelemetryEngine.build(key, 0n, DiscoveryState.DISCOVERED, scenario);
      const planetMoon = buildGalaxyPlanetMoonCatalogSnapshot(key, 0n, scenario);
      const minor = buildGalaxyMinorBodyCatalogSnapshot(key, 0n, scenario);
      expect(telemetry.inventory.systems).toBe(1n);
      expect(telemetry.inventory.planets).toBe(BigInt(system.planets.length));
      expect(telemetry.inventory.moons).toBe(BigInt(system.secondaries.moons.length));
      expect(telemetry.breakdown.confirmedSystemsWithInventory).toBe(1n);
      expect(planetMoon.planets).toHaveLength(system.planets.length);
      expect(planetMoon.moons).toHaveLength(system.secondaries.moons.length);
      expect(minors(minor)).toHaveLength(system.secondaries.minorBodies.length);
    }
  });

  it('normalizes the actual persisted knowledge snapshot, invalidates old caches and counts each object once', async () => {
    const { locator, system } = fixture;
    const discover = makeKnown(locator, DiscoveryState.CONFIRMED);
    const duplicated = [discover[0]!, discover[1]!,
      new KnownDiscovery(key, locator, DiscoveryState.CATALOGUED), discover[1]!];
    let stored: GalaxyKnowledgeSnapshotEntity | undefined;
    const repository: GalaxyKnowledgeSnapshotRepository = {
      async get() { return stored; },
      async put(entity) { stored = entity; },
    };
    const runtime = new DexieGalaxyKnowledgeSnapshotRuntime(repository, () => 31_500);
    const first = await runtime.resolve(key, 0n, DiscoveryState.DISCOVERED, duplicated);
    const second = await runtime.resolve(key, 0n, DiscoveryState.DISCOVERED, discover);
    expect(first.statistics.knownRecords).toBe(2n);
    expect(first.statistics.targetCounts.systems).toBe(1n);
    expect(first.explorationTelemetry.inventory.planets).toBe(BigInt(system.planets.length));
    expect(first.explorationTelemetry.inventory.moons).toBe(BigInt(system.secondaries.moons.length));
    expect(first.knowledgeRevision).toBe(second.knowledgeRevision);
    expect(stored?.scientificModelVersion).toBe(GALAXY_SCIENTIFIC_MODEL_VERSION);
    expect(second.explorationTelemetry.inventory).toEqual(first.explorationTelemetry.inventory);
  });

  it('never reveals a detailed planet merely because an independent legacy BodyLocator is known', () => {
    const { locator } = fixture;
    const child = new KnownDiscovery(key,
      new BodyLocator(locator.galaxyIndex, locator.sectorKey, locator.galacticObjectIndex, 0n),
      DiscoveryState.DISCOVERED);
    const known = [...makeKnown(locator, DiscoveryState.CATALOGUED), child];
    const planetMoon = buildGalaxyPlanetMoonCatalogSnapshot(key, 0n, known);
    expect(planetMoon.planets).toHaveLength(1);
    expect(planetMoon.planets[0]?.subtype).toBe('UNCLASSIFIED');
    expect(planetMoon.planets[0]?.massEarth).toBeNull();
    expect(planetMoon.planets[0]?.orbitClass).toBeNull();
    expect(planetMoon.moons).toHaveLength(0);
    expect(minors(buildGalaxyMinorBodyCatalogSnapshot(key, 0n, known))).toHaveLength(0);
  });
});
