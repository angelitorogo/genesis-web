import { afterEach, describe, expect, it, vi } from 'vitest';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { ArchiveDiscoveryLocatorKind, type ArchiveDiscoveryDetailModel } from '../../presentation/genesis-archive/archive-discovery-detail.facade';
import { PlanetScientificCardAssembler, PlanetScientificFicheResolutionKind } from '../../presentation/planet-detail/planet-scientific-card';
import { MoonScientificCardAssembler, MoonScientificFicheResolutionKind } from '../../presentation/moon-detail/moon-scientific-card';
import { ObservedHabitabilityFiche31Fe } from '../../presentation/scientific/observed-habitability-fiche-31-f-e';
import { BodyLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { PlanetGenerator } from './planet-generator';
import { AtmosphereGenerator } from './atmosphere-generator';
import { MoonGenerator } from './moon-generator';
import { HabitabilityPhysicalIntegration31Fb } from './habitability-physical-integration-31-f-b';
import { PlanetScientificTargetResolver } from './planet-scientific-target-resolver';
import { MoonScientificTargetResolver } from './moon-scientific-target-resolver';

// Real, deterministic V1 generation path. This is NOT a certification of V2
// multihost/compact hosts or of a physical historical trajectory catalog.
const seed = '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';
const generation = new UniverseGenerationKey(UniverseSeed.parse(seed), GeneratorVersion.V1);
const locator = (index: bigint) => new BodyLocator(3n, -17n, 8n, index);
const bodyKey = (index: bigint) => `G3/S-17/O8/B${index}`;

afterEach(() => vi.restoreAllMocks());

describe('31.F.f — integración real actual 19/20/21, 31.2–31.5 y frontera pública 31.12', () => {
  it('reutiliza los mismos objetos físicos, no regenera después de materializar, y mantiene Ground Truth fuera de la ficha observada', () => {
    const planets = vi.spyOn(PlanetGenerator, 'generate');
    const atmospheres = vi.spyOn(AtmosphereGenerator, 'generate');
    const moons = vi.spyOn(MoonGenerator, 'generate');
    const internal = vi.spyOn(HabitabilityPhysicalIntegration31Fb, 'assessMaterialized');
    const resolved = PlanetScientificTargetResolver.resolveDetailed(generation, locator(0n));
    expect(resolved).not.toBeNull();
    expect(planets).toHaveBeenCalledTimes(1);
    expect(atmospheres).toHaveBeenCalledTimes(1);
    expect(moons).toHaveBeenCalledTimes(1);
    expect(internal).toHaveBeenCalledTimes(1);
    expect(internal.mock.calls[0][0]).toBe(planets.mock.results[0].value);
    expect(internal.mock.calls[0][1]).toBe(atmospheres.mock.results[0].value);
    expect(internal.mock.calls[0][2]).toBe(moons.mock.results[0].value);
    const physical = internal.mock.results[0].value;
    expect(physical.provenance).toBe('MATERIALIZED_19_20_21_CURRENT_CT0');
    expect(physical.planet.perspective).toBe('SIMULATED_REALITY');
    expect(physical.historicalContinuity).toBe('NOT_EVALUATED');
    const projection = ObservedHabitabilityFiche31Fe.planet(
      resolved!, DiscoveryState.CONFIRMED, true, bodyKey(0n), 'UNKNOWN',
    );
    expect(projection?.routes).toHaveLength(3);
    expect(projection?.note).toMatch(/no de continuidad histórica/i);
    expect(projection?.routes[2].status).toBe('Sin evidencia específica autorizada');
    const publicJson = JSON.stringify({ detail: resolved!.detail, observedHabitability: projection });
    for (const internalToken of [
      'MATERIALIZED_19_20_21_CURRENT_CT0', 'SIMULATED_REALITY',
      'historicalContinuity', 'physicalPotential', 'lifeProbability', 'sourceRecordKey',
      'accessibleToObserver', 'stellarRotationCoverage',
    ]) {
      expect(publicJson).not.toContain(internalToken);
    }
    // Projection works on an already-resolved target; it cannot rematerialize.
    expect(planets).toHaveBeenCalledTimes(1);
    expect(atmospheres).toHaveBeenCalledTimes(1);
    expect(moons).toHaveBeenCalledTimes(1);
  }, 60_000);

  it('proyecta una luna REAL materializada sin convertir índices de agua potencial en océanos confirmados', () => {
    const relevantPlanet = PlanetScientificTargetResolver.resolveDetailed(generation, locator(6n));
    expect(relevantPlanet).not.toBeNull();
    expect(relevantPlanet!.detail.moons.relevantMoonCount).toBeGreaterThan(0);
    const lunar = MoonScientificTargetResolver.resolveDetailed(generation, locator(6n), 0n);
    expect(lunar).not.toBeNull();
    const publicModel = ObservedHabitabilityFiche31Fe.moon(
      lunar!, DiscoveryState.CONFIRMED, true, `${bodyKey(6n)}/M0`, 'UNKNOWN',
    );
    expect(publicModel?.routes).toHaveLength(3);
    expect(publicModel?.routes[1].status).not.toBe('Océano confirmado');
    expect(publicModel?.routes[2].status).toBe('Sin evidencia específica autorizada');
    const json = JSON.stringify(publicModel);
    expect(json).not.toContain('SIMULATED_REALITY');
    expect(json).not.toContain('sourceKey');
    expect(json).not.toContain('lifeProbability');
  }, 60_000);

  it('bloquea fichas planetaria y lunar ANTES de resolver el cuerpo, incluso con un resolver espía', () => {
    // Only authorization-related metadata is needed. The seed cannot be read
    // on the locked path; test deliberately does not provide a valid one.
    const catalogued = {
      locatorKind: ArchiveDiscoveryLocatorKind.SYSTEM,
      discoveryState: DiscoveryState.CATALOGUED,
      stellarSystemCard: { title: 'Una estrella catalogada' },
      universeSeed: 'MUST_NOT_BE_PARSED', generatorVersionCode: -1,
    } as unknown as ArchiveDiscoveryDetailModel;
    const spyPlanet = vi.fn(() => { throw new Error('private planetary materialization'); });
    const spyMoon = vi.fn(() => { throw new Error('private lunar materialization'); });
    const p = PlanetScientificCardAssembler.build(catalogued, 0n, { resolveDetailed: spyPlanet });
    const m = MoonScientificCardAssembler.build(catalogued, 0n, 0n, { resolveDetailed: spyMoon });
    expect(p.kind).toBe(PlanetScientificFicheResolutionKind.LOCKED);
    expect(m.kind).toBe(MoonScientificFicheResolutionKind.LOCKED);
    expect(spyPlanet).not.toHaveBeenCalled();
    expect(spyMoon).not.toHaveBeenCalled();
  });

  it('CONFIRMED sin permiso de ficha no inspecciona fuentes privadas planetarias o lunares', () => {
    const secret = new Proxy({}, { get: () => { throw new Error('Ground Truth accessed'); } });
    expect(ObservedHabitabilityFiche31Fe.planet(
      secret as never, DiscoveryState.CONFIRMED, false, bodyKey(0n), 'BINARY',
    )).toBeNull();
    expect(ObservedHabitabilityFiche31Fe.moon(
      secret as never, DiscoveryState.CONFIRMED, false, `${bodyKey(0n)}/M0`, 'TRIPLE',
    )).toBeNull();
  });
});
