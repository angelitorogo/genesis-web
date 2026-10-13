import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { CompactHostPlanetarySystemGenerator } from '../../simulation/planetary/compact-host-planetary-system-generator';
import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { projectCompactHostScene } from './system-compact-host-scene';
import { assertSystemSceneProjectionSnapshot } from './system-scene-projection-contract';
import { ArchiveV2StellarSystemCardAssembler } from '../genesis-archive/archive-v2-stellar-system-card';
import { systemSceneMoonFicheRoute, systemScenePlanetFicheRoute } from './system-scene-scientific-route';
import { buildGalaxyPlanetMoonCatalogSnapshot } from '../runtime/galaxy-planet-moon-catalog-snapshot.runtime';
import { buildGalaxyMinorBodyCatalogSnapshot } from '../runtime/galaxy-minor-body-catalog-snapshot.runtime';
import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import { GalaxyLocator } from '../../domain/generation/procedural-locator';

const key=new UniverseGenerationKey(UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),GeneratorVersion.V2);
function sample() {
  for(let i=0n;i<5000n;i++) {
    const locator=new SystemLocator(0n,0n,i);
    const system=CompactHostPlanetarySystemGenerator.generateOrNull(key,locator);
    if(system && system.planets.length>0 && system.secondaries.moons.length>0 &&
      system.secondaries.minorBodies.length>0) return {locator,system};
  }
  throw new Error('Need one deterministic compact-host fixture with planet, moon and small body.');
}
let cached:ReturnType<typeof sample>|null=null;
const fixture=()=>cached??=sample();

describe('31.4g compact moons and minor bodies',()=>{
  it('generates deterministic, immutable and bounded Roche/Hill moons without touching planet identity',()=>{
    const {system,locator}=fixture();
    const repeated=CompactHostPlanetarySystemGenerator.generateOrNull(key,locator)!;
    expect(repeated.planets).toEqual(system.planets);
    expect(repeated.secondaries).toEqual(system.secondaries);
    expect(Object.isFrozen(system.secondaries)).toBe(true);
    expect(system.secondaries.moons.length).toBeGreaterThan(0);
    for(const moon of system.secondaries.moons){
      const planet=system.planets[moon.parentPlanetOrdinal-1]!;
      expect(planet).toBeDefined();
      expect(moon.semiMajorAxisAu*(1-moon.eccentricity)).toBeGreaterThan(moon.rocheLimitAu*2);
      expect(moon.semiMajorAxisAu*(1+moon.eccentricity)).toBeLessThan(moon.hillLimitAu*0.4);
      expect(moon.orbitalPeriodDays).toBeGreaterThan(0);
    }
    for(const body of system.secondaries.minorBodies){
      expect(body.proceduralId).toMatch(/^[A-F0-9]{32}$/);
      expect(body.periapsisAu).toBeGreaterThan(Math.max(...system.planets.map(p=>p.apoastronAu))*1.2);
      expect(body.orbitalPeriodDays).toBeGreaterThan(0);
      expect([MinorBodyKind.ASTEROID,MinorBodyKind.COMET,
        MinorBodyKind.TRANS_NEPTUNIAN_OBJECT,MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT]).toContain(body.kind);
    }
  });

  it('passes deep-freeze contract, binds moon and minor routes to the same public scene',()=>{
    const {system,locator}=fixture();
    const card=ArchiveV2StellarSystemCardAssembler.build(key,locator,DiscoveryState.CONFIRMED);
    const source={universeSeed:key.universeSeed.serialize(),generatorVersionCode:2,
      galaxyIndex:locator.galaxyIndex,sectorKey:locator.sectorKey,
      galacticObjectIndex:locator.galacticObjectIndex,proceduralIdentity:'compact-31-4g',
      discoveryStateLabel:DiscoveryState.CONFIRMED.name};
    const scene=projectCompactHostScene(source,card,DiscoveryState.CONFIRMED,system);
    expect(()=>assertSystemSceneProjectionSnapshot(scene)).not.toThrow();
    expect(scene.moons).toHaveLength(system.secondaries.moons.length);
    expect(scene.minorBodies).toHaveLength(system.secondaries.minorBodies.length);
    expect(scene.scientificMoonBindings).toHaveLength(system.secondaries.moons.length);
    for(const moon of system.secondaries.moons){
      const id=`compact-moon-${moon.parentPlanetOrdinal}-${moon.ordinal}`;
      expect(systemSceneMoonFicheRoute(scene,id)?.slice(-3)).toEqual([
        String(moon.parentPlanetOrdinal-1),'moon',String(moon.ordinal-1)]);
    }
    for(const p of scene.planets)expect(systemScenePlanetFicheRoute(scene,p.id)).not.toBeNull();
    const hidden=projectCompactHostScene(source,ArchiveV2StellarSystemCardAssembler.build(key,locator,DiscoveryState.CATALOGUED),
      DiscoveryState.CATALOGUED,system);
    expect(hidden.planets).toHaveLength(0);
    expect(hidden.moons).toHaveLength(0);
    expect(hidden.minorBodies).toHaveLength(0);
  });

  it('includes secondary population in confirmed galaxy catalogues once, without claiming water evidence',()=>{
    const {system,locator}=fixture();
    const known=[new KnownDiscovery(key,new GalaxyLocator(0n),DiscoveryState.CONFIRMED),
      new KnownDiscovery(key,locator,DiscoveryState.CONFIRMED)];
    const moonCatalog=buildGalaxyPlanetMoonCatalogSnapshot(key,0n,known);
    const minorCatalog=buildGalaxyMinorBodyCatalogSnapshot(key,0n,known);
    expect(moonCatalog.moons).toHaveLength(system.secondaries.moons.length);
    expect(moonCatalog.moons.every(m=>m.orbitClass==='COMPACT_HOST')).toBe(true);
    expect(moonCatalog.moons.every(m=>m.surfaceLiquidWaterPotentialIndex01===0)).toBe(true);
    const actualMinorCount=minorCatalog.asteroids.length+minorCatalog.comets.length+
      minorCatalog.transNeptunianObjects.length+minorCatalog.capturedObjects.length;
    expect(actualMinorCount).toBe(system.secondaries.minorBodies.length);
    expect(new Set([...minorCatalog.asteroids,...minorCatalog.comets,...minorCatalog.transNeptunianObjects,
      ...minorCatalog.capturedObjects].map(b=>b.proceduralId)).size).toBe(actualMinorCount);
  });
});
