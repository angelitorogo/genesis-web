import { describe, expect, it, vi, afterEach } from 'vitest';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { StellarMultihostFormation } from '../stellar/stellar-multihost-formation';
import { StellarSystemMultiplicitySelector } from '../stellar/stellar-system-multiplicity-selector';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { ProceduralTargetResolver } from '../regeneration/procedural-target-resolver';
import { ArchiveDiscoveryLocatorKind, type ArchiveDiscoveryDetailModel } from '../../presentation/genesis-archive/archive-discovery-detail.facade';
import { ArchiveV2StellarSystemCardAssembler } from '../../presentation/genesis-archive/archive-v2-stellar-system-card';
import { SystemV2SingleScientificSession } from '../../presentation/system/system-v2-single-scientific-session';
import { PlanetScientificTargetResolver } from '../planetary/planet-scientific-target-resolver';
import { PlanetGenerator } from '../planetary/planet-generator';
import { AtmosphereGenerator } from '../planetary/atmosphere-generator';
import { MoonGenerator } from '../planetary/moon-generator';
import { PlanetaryHistoricalRuntime31Fi1 } from './planetary-historical-runtime-31-f-i-1';
import { PlanetaryV2DatedPhysics31Fi3 } from './planetary-v2-dated-physics-31-f-i-3';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V1,
);
const locator = new BodyLocator(3n, -17n, 8n, 0n);
const fakeSource = (count: 1 | 2 | 3) => {
  const physical = (mass = 1, lum = 1) => ({ initialMassSolar: mass, luminositySolar: lum });
  const lifetime = (mass = 1) => ({ ageBillionYears: 4.6, evolutionAssessment: {
    input: { initialMassSolar: mass }, evolutionState: { name: 'MAIN_SEQUENCE' },
    mainSequenceLifetimeBillionYears: 10,
  } });
  const parts = [{physical: physical(), lifetime: lifetime()},
    {physical: physical(.9,.7), lifetime: lifetime(.9)},
    {physical: physical(.8,.5), lifetime: lifetime(.8)}];
  const base = { galaxyIndex: 0n, sectorKey: 0n, galacticObjectIndex: 0n, bodyIndex: 0n };
  const planet = {
    locator: base, planetOrdinal: 1, orbit: { periastronAu: 6, apoastronAu: 8 },
    hostPlanetarySystem: { architecture: { orbitTopology: count === 1 ? 'CIRCUMSTELLAR' : 'CIRCUMBINARY' },
      formationBlueprint: { formationCompletionAgeMillionYears: 15 },
      hostStellarSystem: {
        multiplicity: { name: (['', 'SINGLE', 'BINARY', 'TRIPLE'] as const)[count] },
        primaryReferenceLuminositySolar: 1,
        primaryStar: { evolutionState: { name: 'MAIN_SEQUENCE' } },
        secondaryCompanion: count > 1 ? {physicalProperties: parts[1].physical,
          lifetimeProfile: parts[1].lifetime} : null,
        tertiaryCompanion: count > 2 ? {physicalProperties: parts[2].physical,
          lifetimeProfile: parts[2].lifetime} : null,
        orbitHierarchy: {innerOrbit: count > 1 ? {apoastronAu: 2} : null,
          outerOrbit: count > 2 ? {periastronAu: 50, apoastronAu: 60} : null},
      },
    },
  };
  const moon = {hostPlanetOrdinal: 1, hostPlanetLocator: base, moonOrdinal: 1,
    orbit: {semiMajorAxisKilometers: 400000, eccentricity: .04}};
  return {planet: planet as never,
    moons: {hostPlanet: planet, relevantMoons: [moon]} as never,
    primary: parts[0] as never,
  };
};

afterEach(() => vi.restoreAllMocks());

describe('31.F.i.3 — evolución físico-histórica modelada y sus límites', () => {
  it('se conecta al resolvedor V1 REAL sin generar un segundo planeta, atmósfera o luna', () => {
    const planets = vi.spyOn(PlanetGenerator, 'generate');
    const atmosphere = vi.spyOn(AtmosphereGenerator, 'generate');
    const moons = vi.spyOn(MoonGenerator, 'generate');
    const target = PlanetScientificTargetResolver.resolveDetailed(key, locator)!;
    expect(target).toBeTruthy();
    expect(planets).toHaveBeenCalledTimes(1);
    expect(atmosphere).toHaveBeenCalledTimes(1);
    expect(moons).toHaveBeenCalledTimes(1);
    const historical = PlanetaryHistoricalRuntime31Fi1.inspectPhysicalHistory(target);
    // If an unsupported current host/phase is encountered it remains UNKNOWN.
    if (historical !== null) {
      expect(historical.playerVisible).toBe(false);
      expect(historical.ageYearsCT0).toBeGreaterThanOrEqual(0);
      expect(historical.planet.historicalHabitability).toBe('UNKNOWN');
      expect(historical.planet.irradiation.forcing).toEqual([]);
      expect(historical.planet.irradiation.environmentalHistoryComplete).toBe(false);
      expect(historical.moons.every(m => m.waterHistory === 'UNKNOWN')).toBe(true);
      expect(JSON.stringify(target.detail)).not.toContain('31.F.i.3');
      const request = { context: historical.planet.source.context, version: {
        universeKey: 'genesis-real', physicsModelRevision: 'v2', sourceRevision: 'physical-episodes-r1',
      }, startYear: 0, endYear: Math.min(100_000_000, historical.ageYearsCT0) };
      const reconstructed = PlanetaryHistoricalRuntime31Fi1.reconstructFromMaterialized(target, request);
      expect(reconstructed.certification.certifiedContinuousIntervals).toBe(0);
      expect(reconstructed.physical.lifePresence).toBe('NOT_EVALUATED');
    }
    const decorated = Object.freeze({ ...target, detail: Object.freeze({ ...target.detail }) });
    PlanetaryHistoricalRuntime31Fi1.forwardPrivateTarget(target, decorated);
    expect(PlanetaryHistoricalRuntime31Fi1.inspectPhysicalHistory(decorated)).toBe(historical);
    expect(() => PlanetaryHistoricalRuntime31Fi1.forwardPrivateTarget(target, {
      ...decorated, identity: { ...target.identity, locator: new BodyLocator(3n, -17n, 8n, 1n) },
    })).toThrow(/foreign/);
    expect(Object.keys(target)).toEqual(['identity', 'detail']);
    expect(planets).toHaveBeenCalledTimes(1);
    expect(atmosphere).toHaveBeenCalledTimes(1);
    expect(moons).toHaveBeenCalledTimes(1);
  }, 60_000);

  it('V2 SINGLE usa el mismo anfitrión y edades ya materializados al proyectar la ficha', () => {
    const v2 = new UniverseGenerationKey(key.universeSeed.copy(), GeneratorVersion.V2);
    let selected: SystemLocator | null = null;
    for (let i = 0n; i < 96n; i++) {
      const candidate = new SystemLocator(0n, 0n, i);
      const physicalSeed = ProceduralTargetResolver.resolveTargetSeed(key, candidate);
      if (StellarSystemMultiplicitySelector.select(key, physicalSeed as Parameters<
        typeof StellarSystemMultiplicitySelector.select>[1]) !== StellarSystemMultiplicity.SINGLE) continue;
      const host = StellarMultihostFormation.generateV2SingleOrNull(v2, candidate);
      if (host && host.planets.length > 0) { selected = candidate; break; }
    }
    expect(selected).not.toBeNull();
    const location = selected!;
    const model = {
      universeSeed: v2.universeSeed.serialize(), generatorVersionCode: 2,
      locatorKind: ArchiveDiscoveryLocatorKind.SYSTEM,
      galaxyIndex: location.galaxyIndex, sectorKey: location.sectorKey,
      galacticObjectIndex: location.galacticObjectIndex,
      proceduralIdentity: `G${location.galaxyIndex}/S${location.sectorKey}/O${location.galacticObjectIndex}`,
      discoveryState: DiscoveryState.CONFIRMED, discoveryStateLabel: DiscoveryState.CONFIRMED.name,
      stellarSystemCard: ArchiveV2StellarSystemCardAssembler.build(v2, location, DiscoveryState.CONFIRMED),
    } as unknown as ArchiveDiscoveryDetailModel;
    const session = SystemV2SingleScientificSession.buildOrNull(model)!;
    const evaluated = vi.spyOn(PlanetaryV2DatedPhysics31Fi3, 'fromMaterialized');
    const fiche = session.planetFiche(0n);
    expect(fiche.kind).toBe('AVAILABLE');
    expect(evaluated).toHaveBeenCalledTimes(1);
    const source = evaluated.mock.calls[0]![0];
    expect(source.planet).toBe(source.moons.hostPlanet);
    expect(source.primary.physical).toBeTruthy();
    expect(source.primary.lifetime).toBeTruthy();
    expect(evaluated.mock.results[0]?.type).toBe('return');
  }, 120_000);

  it.each([1, 2, 3] as const)('%i anfitriones: L/r² por fase, luna independiente y UNKNOWN ambiental', count => {
    const input = fakeSource(count);
    const result = PlanetaryV2DatedPhysics31Fi3.fromMaterialized(input);
    const again = PlanetaryV2DatedPhysics31Fi3.fromMaterialized(input);
    expect(again).toEqual(result);
    expect(result.planet.source.intervals.length).toBeGreaterThan(0);
    expect(result.planet.source.intervals[0].hosts).toHaveLength(count);
    expect(result.planet.irradiation.irradiance[0].wattsPerSquareMeter.min).toBeGreaterThan(0);
    expect(result.planet.irradiation.forcing).toEqual([]);
    expect(result.planet.gaps[0].reason).toBe('PRE_MAIN_SEQUENCE_OR_FORMATION');
    expect(result.moons).toHaveLength(1);
    expect(result.moons[0].bodyKind).toBe('MOON');
    expect(result.moons[0].bodyKey).toBe('G0/S0/O0/B0/M0');
    expect(result.moons[0].irradiation.irradiance[0].wattsPerSquareMeter.min)
      .toBeLessThan(result.planet.irradiation.irradiance[0].wattsPerSquareMeter.min);
    for (const world of [result.planet, ...result.moons]) {
      expect(world.pressureHistory).toBe('UNKNOWN');
      expect(world.waterHistory).toBe('UNKNOWN');
      expect(world.radiationHistory).toBe('UNKNOWN');
      expect(world.historicalHabitability).toBe('UNKNOWN');
      expect(world.playerVisible).toBe(false);
    }
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('excluye cualquier época posterior a un transitorio no resuelto', () => {
    const input = fakeSource(1);
    const result = PlanetaryV2DatedPhysics31Fi3.fromMaterialized({
      ...input, unresolvedEvents: [{startYear: 250_000_000, endYear: 350_000_000,
        sourceRecordKey: 'actual-dated-supernova-1'}],
    });
    expect(result.planet.irradiation.irradiance.every(i => i.endYear < 250_000_000)).toBe(true);
    expect(result.planet.gaps).toContainEqual({startYear: 250_000_000,
      endYear: 4_600_000_000, reason: 'UNRESOLVED_EVENT'});
  });

  it('no confunde enanas compactas, referencias incompletas, órbitas y lunas ajenas con historia válida', () => {
    const source = fakeSource(1);
    const star = source.planet as unknown as {hostPlanetarySystem: {hostStellarSystem: {
      primaryStar: {evolutionState: {name: string}}}}};
    const { primaryStar } = star.hostPlanetarySystem.hostStellarSystem;
    primaryStar.evolutionState.name = 'STELLAR_BLACK_HOLE';
    expect(() => PlanetaryV2DatedPhysics31Fi3.fromMaterialized(source)).toThrow();
    primaryStar.evolutionState.name = 'MAIN_SEQUENCE';
    const invalid = fakeSource(1);
    (invalid.planet as unknown as {orbit: {periastronAu: number}}).orbit.periastronAu = 0;
    expect(PlanetaryV2DatedPhysics31Fi3.fromMaterialized(invalid).planet.irradiation.irradiance).toHaveLength(0);
    const stype = fakeSource(2);
    (stype.planet as unknown as {hostPlanetarySystem: {architecture: {orbitTopology: string}}})
      .hostPlanetarySystem.architecture.orbitTopology = 'CIRCUMSTELLAR';
    expect(PlanetaryV2DatedPhysics31Fi3.fromMaterialized(stype).planet.irradiation.irradiance).toHaveLength(0);
    const foreign = fakeSource(1);
    ((foreign.moons as unknown as {relevantMoons: {hostPlanetOrdinal: number}[]}).relevantMoons[0]).hostPlanetOrdinal = 99;
    expect(() => PlanetaryV2DatedPhysics31Fi3.fromMaterialized(foreign)).toThrow(/foreign lunar/);
  });
});
