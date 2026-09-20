import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { StellarSystemMultiplicitySelector } from '../../simulation/stellar/stellar-system-multiplicity-selector';
import { ArchiveV2StellarSystemCardAssembler } from '../genesis-archive/archive-v2-stellar-system-card';
import { type SystemSceneSnapshotSource, SystemSceneSnapshotBuilder } from './system-scene-snapshot';
import { SystemSceneMultihostMaterializedSources } from './system-scene-multihost-materialized-sources';
import { SystemSceneMultihostComposition } from './system-scene-multihost-composition';
import { v2HostMinorBodyOrbitalCatalog } from './system-scene-v2-minor-body-source';
import { v2PlanetOrbitSeconds, v2PlanetTimeScale } from './system-scene-v2-planet-cadence';
import { v2CometStellarIrradianceAtDay } from './system-scene-v2-comet-stellar-flux';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const keyV1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const keyV2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);
function locate(multiplicity: StellarSystemMultiplicity): SystemLocator {
  for (let index = 0n; index < 256n; index++) {
    const locator = new SystemLocator(0n, 0n, index);
    const target = ProceduralTargetResolver.resolveTargetSeed(keyV1, locator);
    if (StellarSystemMultiplicitySelector.select(keyV1, target as Parameters<
        typeof StellarSystemMultiplicitySelector.select>[1]) === multiplicity) return locator;
  }
  throw new Error('No physical system found for this deterministic fixture.');
}
function metadata(locator: SystemLocator, state: DiscoveryStateValue = DiscoveryState.CONFIRMED): SystemSceneSnapshotSource {
  return Object.freeze({
    universeSeed: seed.serialize(), generatorVersionCode: 2, locator,
    proceduralIdentity: `G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}`,
    discoveryState: state, discoveryStateLabel: state.name,
    stellarSystemCard: ArchiveV2StellarSystemCardAssembler.build(keyV2, locator, state),
  });
}
function visibleCount(catalog: ReturnType<typeof v2HostMinorBodyOrbitalCatalog>): number {
  return catalog?.entries.filter(entry => entry.orbitalElements.isBound &&
    entry.orbitalElements.orbitalPeriodYears !== null &&
    entry.orbitalElements.meanAnomalyDegrees !== null).length ?? 0;
}
// Recovering visual seconds from a floating-point time scale can differ from
// the exact 200/400-second boundary by a few ulps; reject actual deviations.
const CADENCE_EPSILON_SECONDS = 1e-9;

function assertCadence(scene: ReturnType<typeof SystemSceneSnapshotBuilder.buildFromGeneratedSingle>) {
  const motionIndex = new Map(scene.motions.map(motion => [motion.id, motion]));
  for (const planet of scene.planets) {
    const contribution = planet.motionContributions.at(-1)!;
    const motion = motionIndex.get(contribution.motionId)!;
    expect(motion).toBeDefined();
    const realSeconds = motion.periodDays /
      (scene.simulation.playbackDaysPerRealSecond * (contribution.presentationTimeScale ?? 1));
    expect(realSeconds).toBeGreaterThanOrEqual(200 - CADENCE_EPSILON_SECONDS);
    expect(realSeconds).toBeLessThanOrEqual(400 + CADENCE_EPSILON_SECONDS);
    for (const moon of scene.moons.filter(moon => moon.hostPlanetId === planet.id)) {
      expect(moon.motionContributions.find(part => part.motionId === motion.id)?.presentationTimeScale)
        .toBe(contribution.presentationTimeScale);
    }
    // Physical science is still untouched: the source period in motion remains.
    expect(motion.periodDays).toBeGreaterThan(0);
  }
  const byHost = new Map<string, { radius: number; seconds: number }[]>();
  for (const planet of scene.planets) {
    const motion = motionIndex.get(planet.motionContributions.at(-1)!.motionId)!;
    const host = /^mh-([abcp])-/.exec(planet.id)?.[1] ?? 'single';
    const group = byHost.get(host) ?? [];
    group.push({ radius: motion.semiMajorAxisAu, seconds: motion.periodDays /
      (scene.simulation.playbackDaysPerRealSecond *
        (planet.motionContributions.at(-1)!.presentationTimeScale ?? 1)) });
    byHost.set(host, group);
  }
  for (const group of byHost.values()) {
    group.sort((a, b) => a.radius - b.radius);
    expect(group[0]!.seconds).toBeCloseTo(group.length === 1 ? 300 : 200, 8);
    expect(group.at(-1)!.seconds).toBeCloseTo(group.length === 1 ? 300 : 400, 8);
    for (let index = 1; index < group.length; index++) {
      expect(group[index]!.seconds).toBeGreaterThan(group[index - 1]!.seconds);
    }
  }
}

function assertMinorCadence(scene: ReturnType<typeof SystemSceneSnapshotBuilder.buildFromGeneratedSingle>): void {
  // Actual generated stellar photospheres, not their enlarged scene radii.
  for (const star of scene.stars) {
    expect(star.sourceRadiusSolar).toBeGreaterThan(0);
    expect(star.sourceEffectiveTemperatureKelvin).toBeGreaterThan(0);
  }
  // MinorBodyKind includes code 4 (unbound interstellar), which has no
  // revolution interval. Accept the full domain code union in the lookup;
  // the existing expectation below rejects any unhandled rendered body.
  const ranges = new Map<number, readonly [number, number]>([
    [MinorBodyKind.ASTEROID.code, [240, 420]],
    [MinorBodyKind.COMET.code, [300, 540]],
    [MinorBodyKind.TRANS_NEPTUNIAN_OBJECT.code, [480, 720]],
    [MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT.code, [300, 600]],
  ]);
  const motionIndex = new Map(scene.motions.map(motion => [motion.id, motion]));
  for (const body of scene.minorBodies) {
    const contribution = body.motionContributions.at(-1)!;
    const motion = motionIndex.get(contribution.motionId)!;
    const range = ranges.get(body.minorBodyKind.code)!;
    expect(motion).toBeDefined();
    expect(range).toBeDefined();
    const seconds = motion.periodDays / (scene.simulation.playbackDaysPerRealSecond *
      (contribution.presentationTimeScale ?? 1));
    expect(seconds).toBeGreaterThanOrEqual(range[0]! - CADENCE_EPSILON_SECONDS);
    expect(seconds).toBeLessThanOrEqual(range[1]! + CADENCE_EPSILON_SECONDS);
    expect(motion.periodDays).toBeGreaterThan(0);
    if (body.minorBodyKind === MinorBodyKind.COMET) {
      expect(contribution.presentationCometPhaseWarp).toBe(0.5);
      expect(body.cometPresentation?.presentationCometPhaseWarp).toBe(0.5);
      expect(body.cometPresentation?.presentationTimeScale).toBe(contribution.presentationTimeScale);
      const sources = v2CometStellarIrradianceAtDay(scene, body, 120);
      expect(sources).toHaveLength(scene.stars.length);
      expect(sources.every(source => source.physicalDistanceAu > 0 &&
        Number.isFinite(source.fluxEarth) && source.fluxEarth >= 0)).toBe(true);
    } else {
      expect(contribution.presentationCometPhaseWarp).toBeUndefined();
    }
  }
}

describe('15.3 — V2 frozen minor-body population and readable planetary orbits', () => {
  it('uses 200 s for innermost, 400 s for outermost, and interpolates by radial order', () => {
    const inner = v2PlanetTimeScale(60, 30, 0.3, 1, 7);
    const outer = v2PlanetTimeScale(60_000, 30, 90, 7, 7);
    expect(inner).toBeLessThan(1);
    expect(outer).toBeGreaterThan(1);
    expect(60 / (30 * inner)).toBeCloseTo(200, 10);
    expect(60_000 / (30 * outer)).toBeCloseTo(400, 10);
    expect(v2PlanetOrbitSeconds(1, 4, 7)).toBeCloseTo(300, 10);
    expect(v2PlanetOrbitSeconds(1, 1, 1)).toBe(300);
    expect(v2PlanetOrbitSeconds(1, 1, 2)).toBe(200);
    expect(v2PlanetOrbitSeconds(2, 2, 2)).toBe(400);
    expect(() => v2PlanetOrbitSeconds(1, 3, 2)).toThrow(RangeError);
  });

  it('SINGLE V2 uses its own physical belt, comets and minor-body orbital catalog only after CONFIRMED', () => {
    const locator = locate(StellarSystemMultiplicity.SINGLE);
    const host = StellarMultihostFormation.generateV2SingleOrNull(keyV2, locator)!;
    expect(host).not.toBeNull();
    const confirmed = SystemSceneSnapshotBuilder.buildFromGeneratedSingle(metadata(locator), host);
    const catalog = v2HostMinorBodyOrbitalCatalog(host);
    expect(confirmed.minorBodies).toHaveLength(visibleCount(catalog));
    expect(confirmed.asteroidBelts?.length ?? 0).toBe(host.asteroidBelts?.populationProfiles
      .filter(belt => belt.exists).length ?? 0);
    expect(new Set(confirmed.minorBodies.map(body => body.id)).size).toBe(confirmed.minorBodies.length);
    expect(confirmed.minorBodies.filter(body => body.minorBodyKind === MinorBodyKind.COMET).length)
      .toBe(catalog?.entries.filter(entry => entry.orbitalElements.kind === MinorBodyKind.COMET &&
        entry.orbitalElements.isBound && entry.orbitalElements.orbitalPeriodYears !== null &&
        entry.orbitalElements.meanAnomalyDegrees !== null).length ?? 0);
    assertCadence(confirmed);
    assertMinorCadence(confirmed);
    const catalogued = SystemSceneSnapshotBuilder.buildFromGeneratedSingle(
      metadata(locator, DiscoveryState.CATALOGUED), host);
    expect(catalogued.minorBodies).toHaveLength(0);
    expect(catalogued.asteroidBelts ?? []).toHaveLength(0);
  }, 120_000);

  it.each([StellarSystemMultiplicity.BINARY, StellarSystemMultiplicity.TRIPLE])(
    '%s has all actual A/B/C bound minor bodies with namespaced orbits, and all S/P planets follow the 200–400 s orbital cadence',
    multiplicity => {
      const locator = locate(multiplicity);
      const formation = StellarMultihostFormation.generateOrNull(keyV2, locator)!;
      const materialized = SystemSceneMultihostMaterializedSources.build(formation, metadata(locator));
      const scene = SystemSceneMultihostComposition.build(formation, materialized).snapshot;
      const expected = formation.components.reduce((total, host) => total +
        visibleCount(v2HostMinorBodyOrbitalCatalog(host)), 0);
      expect(scene.minorBodies).toHaveLength(expected);
      expect(scene.layers.minorBodyCount).toBe(expected);
      expect(new Set(scene.minorBodies.map(body => body.id)).size).toBe(scene.minorBodies.length);
      expect(scene.minorBodies.every(body => scene.orbits.some(orbit => orbit.id === body.orbitId)))
        .toBe(true);
      for (const host of formation.components) {
        expect(scene.minorBodies.filter(body => body.id.startsWith(`mh-${host.label.toLowerCase()}-`)))
          .toHaveLength(visibleCount(v2HostMinorBodyOrbitalCatalog(host)));
      }
      assertCadence(scene);
      assertMinorCadence(scene);
      for (const planet of scene.planets) {
        const part = planet.motionContributions.at(-1)!;
        const motion = scene.motions.find(item => item.id === part.motionId)!;
        const duration = motion.periodDays /
          (scene.simulation.playbackDaysPerRealSecond * (part.presentationTimeScale ?? 1));
        expect(duration).toBeGreaterThanOrEqual(200 - CADENCE_EPSILON_SECONDS);
        expect(duration).toBeLessThanOrEqual(400 + CADENCE_EPSILON_SECONDS);
      }
    }, 120_000,
  );
});
