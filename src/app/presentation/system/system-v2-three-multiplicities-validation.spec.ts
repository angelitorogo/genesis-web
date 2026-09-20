import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { StellarSystemMultiplicitySelector } from '../../simulation/stellar/stellar-system-multiplicity-selector';
import { ArchiveDiscoveryLocatorKind, type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { ArchiveV2StellarSystemCardAssembler } from '../genesis-archive/archive-v2-stellar-system-card';
import { MoonScientificFicheResolutionKind } from '../moon-detail/moon-scientific-card';
import { PlanetScientificFicheResolutionKind } from '../planet-detail/planet-scientific-card';
import { systemSceneGameplayHostLayout, systemSceneHabitableZoneHostLabel } from './system-scene-gameplay-hosts';
import { laboratoryStarDistances, productionStarFocusRadius } from './system-scene-laboratory-controls';
import { SystemMultihostGameCutover } from './system-multihost-game-cutover';
import { assertSystemSceneProjectionSnapshot } from './system-scene-projection-contract';
import { systemSceneMoonFicheRoute, systemScenePlanetFicheRoute } from './system-scene-scientific-route';
import { SystemV2SingleScientificSession } from './system-v2-single-scientific-session';

/** Read-only validation: the test's physical V1 key never becomes a persisted/public V2 identity. */
const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const physical = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const publicV2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);
type Kind = 'SINGLE' | 'BINARY' | 'TRIPLE';
const located = new Map<Kind, SystemLocator>();

function findSystem(kind: Kind): SystemLocator {
  const cached = located.get(kind);
  if (cached) return cached;
  for (let index = 0n; index < 512n; index++) {
    const locator = new SystemLocator(0n, 0n, index);
    const target = ProceduralTargetResolver.resolveTargetSeed(physical, locator);
    const selected = StellarSystemMultiplicitySelector.select(physical,
      target as Parameters<typeof StellarSystemMultiplicitySelector.select>[1]);
    if (selected.name !== kind) continue;
    // A populated SINGLE exercises the planet/preview flow, not just its stellar shell.
    if (kind === 'SINGLE' && !StellarMultihostFormation.generateV2SingleOrNull(publicV2, locator)?.planets.length) {
      continue;
    }
    located.set(kind, locator);
    return locator;
  }
  throw new Error(`No reproducible V2 ${kind} in the fixture range.`);
}

function model(kind: Kind, state: DiscoveryStateValue): ArchiveDiscoveryDetailModel {
  const locator = findSystem(kind);
  return {
    universeSeed: seed.serialize(), generatorVersionCode: publicV2.generatorVersionCode,
    locatorKind: ArchiveDiscoveryLocatorKind.SYSTEM,
    galaxyIndex: locator.galaxyIndex, sectorKey: locator.sectorKey,
    galacticObjectIndex: locator.galacticObjectIndex,
    proceduralIdentity: `G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}`,
    discoveryState: state, discoveryStateLabel: state.name,
    stellarSystemCard: ArchiveV2StellarSystemCardAssembler.build(publicV2, locator, state),
  } as unknown as ArchiveDiscoveryDetailModel;
}

function resolve(kind: Kind, state: DiscoveryStateValue = DiscoveryState.CONFIRMED) {
  const input = model(kind, state);
  const single = SystemV2SingleScientificSession.buildOrNull(input);
  const multiple = SystemMultihostGameCutover.sessionOrNull(input);
  return { input, session: single ?? multiple, single, multiple };
}

describe('14.2 — comprobación científica de SINGLE/BINARY/TRIPLE V2', () => {
  it.each(['SINGLE', 'BINARY', 'TRIPLE'] as const)(
    '%s: la multiplicidad, estrellas, escena y fichas comparten una fuente física y una identidad V2', kind => {
      const { input, session, single, multiple } = resolve(kind);
      expect(session).not.toBeNull();
      expect(single !== null).toBe(kind === 'SINGLE');
      expect(multiple !== null).toBe(kind !== 'SINGLE');
      if (!session) throw new Error('A confirmed V2 system has no scientific session.');
      const scene = session.scene;
      const stars = kind === 'TRIPLE' ? 3 : kind === 'BINARY' ? 2 : 1;
      expect(scene.generatorVersionCode).toBe(2);
      expect(scene.universeSeed).toBe(seed.serialize());
      expect(scene.proceduralIdentity).toBe(input.proceduralIdentity);
      expect(scene.multiplicityName).toBe(kind);
      expect(scene.stars).toHaveLength(stars);
      expect(input.stellarSystemCard?.componentCount).toBe(stars);
      expect(scene.planets).toHaveLength(session.planetCount);
      expect(new Set(scene.planets.map(planet => planet.id)).size).toBe(scene.planets.length);
      expect(() => assertSystemSceneProjectionSnapshot(scene)).not.toThrow();
      const source = kind === 'SINGLE'
        ? StellarMultihostFormation.generateV2SingleOrNull(publicV2, findSystem(kind))
        : StellarMultihostFormation.generateOrNull(publicV2, findSystem(kind));
      expect(source).not.toBeNull();
      if (!source) throw new Error('Missing authoritative V2 physical source.');
      if ('publicPlanets' in source) {
        expect(scene.planets).toHaveLength(source.publicPlanets.length);
        expect(scene.moons).toHaveLength(source.publicPlanets.reduce((n, planet) =>
          n + planet.moonSystem.relevantMoonCount, 0));
        expect(multiple?.stellarSystemCard.orbits).toHaveLength(kind === 'TRIPLE' ? 2 : 1);
        expect(JSON.stringify(multiple?.stellarSystemCard)).not.toContain(source.parentSystemSeedHex);
        for (const body of source.publicPlanets) {
          const binding = scene.scientificPlanetBindings?.find(candidate =>
            candidate.bodyIndex === body.publicLocator.bodyIndex.toString());
          expect(binding).toBeDefined();
          const projected = scene.planets.find(candidate => candidate.id === binding?.sceneBodyId);
          expect(projected).toBeDefined();
          const motion = scene.motions.find(candidate =>
            candidate.id === projected?.motionContributions.at(-1)?.motionId);
          expect(motion?.semiMajorAxisAu).toBe(body.planet.orbit.semiMajorAxisAu);
          expect(motion?.periodDays).toBe(body.planet.orbitalPeriod.periodDays);
        }
        expect(multiple?.stellarSystemCard.render.components.map(c => c.label)).toEqual(
          kind === 'TRIPLE' ? ['A', 'B', 'C'] : ['A', 'B']);
        for (const [index, component] of source.components.entries()) {
          const rendered = scene.stars[index];
          expect(rendered?.label).toBe(component.label);
          expect(rendered?.colorHex).toBe(component.spectral.color.hex);
          expect(multiple?.stellarSystemCard.components[index]?.spectralType)
            .toBe(component.spectral.spectralType.designation);
        }
      } else {
        expect(scene.planets).toHaveLength(source.planets.length);
        expect(scene.moons).toHaveLength(source.moonSystems.reduce((n, moons) =>
          n + moons.relevantMoonCount, 0));
        expect(scene.stars[0]?.label).toBe('A');
      }
    }, 120_000,
  );

  it.each(['BINARY', 'TRIPLE'] as const)(
    '%s: órbitas jerárquicas, hosts S/P, distancias y HZ corresponden a la formación', kind => {
      const { session } = resolve(kind);
      if (!session) throw new Error('Unresolved confirmed multiple.');
      const scene = session.scene;
      const source = StellarMultihostFormation.generateOrNull(publicV2, findSystem(kind));
      if (!source) throw new Error('Missing multiple formation.');
      expect(source.innerOrbit.semiMajorAxisAu).toBeGreaterThan(0);
      expect(scene.motions.find(motion => motion.id === 'multihost-ab-relative')?.semiMajorAxisAu)
        .toBe(source.innerOrbit.semiMajorAxisAu);
      expect(scene.motions.find(motion => motion.id === 'multihost-ab-relative')?.periodDays)
        .toBe(source.innerOrbit.periodDays);
      if (kind === 'TRIPLE') {
        expect(source.outerOrbit).not.toBeNull();
        expect(source.outerOrbit!.periastronAu).toBeGreaterThan(source.innerOrbit.apoastronAu);
        expect(scene.motions.find(motion => motion.id === 'multihost-abc-relative')?.semiMajorAxisAu)
          .toBe(source.outerOrbit!.semiMajorAxisAu);
      } else {
        expect(source.outerOrbit).toBeNull();
        expect(scene.motions.some(motion => motion.id === 'multihost-abc-relative')).toBe(false);
      }
      const hosts = systemSceneGameplayHostLayout(scene);
      expect(hosts.map(host => [host.label, host.topology])).toEqual(kind === 'TRIPLE'
        ? [['A', 'S'], ['B', 'S'], ['C', 'S'], ['A–B', 'P']]
        : [['A', 'S'], ['B', 'S'], ['A–B', 'P']]);
      expect(hosts.reduce((total, host) => total + host.planetCount, 0))
        .toBe(source.publicPlanets.length);
      expect(hosts.at(-1)?.planetCount).toBe(source.circumbinary.planets.length);
      for (const host of source.components) {
        expect(hosts.find(entry => entry.label === host.label)?.planetCount).toBe(host.planets.length);
      }
      const zones = scene.habitableZones ?? [];
      expect(zones.slice(0, source.components.length).map(zone =>
        systemSceneHabitableZoneHostLabel(scene, zone))).toEqual(
          source.components.map(component => `Estrella ${component.label} · S`));
      const pZones = zones.filter(zone => zone.topology === 'CIRCUMBINARY');
      expect(pZones.length).toBeLessThanOrEqual(1);
      if (pZones[0]) {
        expect(systemSceneHabitableZoneHostLabel(scene, pZones[0])).toBe('Baricentro A–B · P');
      }
      const distances = laboratoryStarDistances(scene, 300 * scene.simulation.playbackDaysPerRealSecond);
      expect(distances).toHaveLength(kind === 'TRIPLE' ? 3 : 1);
      expect(distances.every(item => Number.isFinite(item.au) && item.au > 0)).toBe(true);
      for (const star of scene.stars) {
        expect(productionStarFocusRadius(scene, star.id)).toBeGreaterThan(star.radiusScene);
      }
      // A zero P population / no valid P HZ is an allowed outcome: never forge worlds or habitability.
    }, 120_000,
  );

  it.each(['SINGLE', 'BINARY', 'TRIPLE'] as const)(
    '%s: rutas públicas, previews y lunas no apuntan a otro sistema ni hacen fallback V1', kind => {
      const { session } = resolve(kind);
      if (!session) throw new Error('No confirmed V2 session.');
      const scene = session.scene;
      const planetBindings = scene.scientificPlanetBindings ?? scene.planets.map((planet, index) => ({
        sceneBodyId: planet.id, bodyIndex: index.toString(),
      }));
      expect(planetBindings).toHaveLength(scene.planets.length);
      const seenRoutes = new Set<string>();
      for (const binding of planetBindings) {
        const route = systemScenePlanetFicheRoute(scene, binding.sceneBodyId);
        expect(route?.at(-1)).toBe(binding.bodyIndex);
        expect(route?.slice(1, 4)).toEqual([
          scene.address.galaxyIndex, scene.address.sectorKey, scene.address.galacticObjectIndex,
        ]);
        const routeKey = route?.join('/');
        expect(routeKey).toBeDefined();
        expect(seenRoutes.has(routeKey!)).toBe(false);
        seenRoutes.add(routeKey!);
      }
      // One representative fiche per host, rather than assuming that every seed has P planets.
      const sample = planetBindings.filter(binding => {
        const prefix = kind === 'SINGLE' ? 'planet-' : binding.sceneBodyId.split('-').slice(0, 2).join('-');
        return planetBindings.find(entry => (kind === 'SINGLE' ? 'planet-' :
          entry.sceneBodyId.split('-').slice(0, 2).join('-')) === prefix) === binding;
      });
      for (const binding of sample) {
        const fiche = session.planetFiche(BigInt(binding.bodyIndex));
        expect(fiche.kind).toBe(PlanetScientificFicheResolutionKind.AVAILABLE);
        if (fiche.kind === PlanetScientificFicheResolutionKind.AVAILABLE) {
          expect(fiche.card.preview.kind).toBe('PLANET');
          if (fiche.card.preview.kind === 'PLANET') {
            expect(fiche.card.preview.primary.planetId).toBe(binding.sceneBodyId);
          }
        }
      }
      expect(systemScenePlanetFicheRoute(scene, 'not-a-real-body')).toBeNull();
      const moon = scene.moons[0];
      if (moon) {
        const route = systemSceneMoonFicheRoute(scene, moon.id);
        expect(route?.at(-2)).toBe('moon');
        if (!route) throw new Error('A displayed moon has no public route.');
        const fiche = session.moonFiche(BigInt(route[5]!), BigInt(route[7]!));
        expect(fiche.kind).toBe(MoonScientificFicheResolutionKind.AVAILABLE);
        if (fiche.kind === MoonScientificFicheResolutionKind.AVAILABLE) {
          expect(fiche.card.preview.kind).toBe('MOON');
        }
      }
      expect(systemSceneMoonFicheRoute(scene, 'not-a-real-moon')).toBeNull();
    }, 120_000,
  );

  it.each(['SINGLE', 'BINARY', 'TRIPLE'] as const)(
    '%s: DETECTED/DISCOVERED no liberan escenas detalladas y V1 nunca se activa como V2', kind => {
      for (const state of [DiscoveryState.DETECTED, DiscoveryState.DISCOVERED]) {
        const { input, single, multiple } = resolve(kind, state);
        expect(single).toBeNull();
        expect(multiple).toBeNull();
        expect(input.stellarSystemCard?.systemFacts.some(fact => fact.label === 'SystemSeed')).toBe(false);
      }
      const confirmed = model(kind, DiscoveryState.CONFIRMED);
      const legacyKey = { ...confirmed, generatorVersionCode: 1 };
      expect(SystemV2SingleScientificSession.buildOrNull(legacyKey)).toBeNull();
      expect(SystemMultihostGameCutover.sessionOrNull(legacyKey)).toBeNull();
      expect(confirmed.stellarSystemCard?.systemFacts.some(fact => fact.label === 'SystemSeed')).toBe(false);
    }, 120_000,
  );
});
