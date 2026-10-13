import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { GalaxyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { CompactHostPlanetarySystemGenerator } from '../../simulation/planetary/compact-host-planetary-system-generator';
import { GalaxyExplorationTelemetryEngine } from '../../simulation/exploration/galaxy-exploration-telemetry-engine';
import { ArchiveDiscoveryLocatorKind, type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { ArchiveV2StellarSystemCardAssembler } from '../genesis-archive/archive-v2-stellar-system-card';
import { PlanetScientificFicheResolutionKind } from '../planet-detail/planet-scientific-card';
import { PLANET_FICHE_FIELD_LAYOUT } from '../planet-detail/planet-scientific-fiche-layout';
import { SystemV2SingleScientificSession } from './system-v2-single-scientific-session';
import { assertSystemSceneProjectionSnapshot } from './system-scene-projection-contract';
import { SystemCompactHostScientificSession } from './system-compact-host-scientific-session';
import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { compactHostVisualRadiusScene, COMPACT_BLACK_HOLE_INSPECTION_LIGHT_FLUX,
  COMPACT_BLACK_HOLE_INSPECTION_PLANET_FILL01, projectCompactHostScene } from './system-compact-host-scene';
import { type CompactHostPlanetarySystem } from '../../domain/planetary/compact-host-planetary-system';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const key = new UniverseGenerationKey(seed, GeneratorVersion.V2);

function compactWithPlanet(): SystemLocator {
  // Fixture discovery is a test-only scan, never a production special-case or seed override.
  for (let i=0n;i<5000n;i++) {
    const locator=new SystemLocator(0n,0n,i);
    const compact=CompactHostPlanetarySystemGenerator.generateOrNull(key,locator);
    if(compact!==null && compact.planets.length>0) return locator;
  }
  throw new Error('31.4 needs a compact V2 SINGLE fixture with at least one planet.');
}
let sample: SystemLocator | null=null;
function fixture(state: typeof DiscoveryState.CATALOGUED | typeof DiscoveryState.CONFIRMED):ArchiveDiscoveryDetailModel {
  const locator=sample??=compactWithPlanet();
  const card=ArchiveV2StellarSystemCardAssembler.build(key,locator,state);
  return Object.freeze({
    universeSeed:seed.serialize(),generatorVersionCode:GeneratorVersion.V2.code,
    locatorKind:ArchiveDiscoveryLocatorKind.SYSTEM,galaxyIndex:locator.galaxyIndex,
    sectorKey:locator.sectorKey,galacticObjectIndex:locator.galacticObjectIndex,
    proceduralIdentity:'31.4-fixture',discoveryState:state,
    discoveryStateLabel:state.name,stellarSystemCard:card,
  }) as unknown as ArchiveDiscoveryDetailModel;
}

describe('31.4: atomic public compact-host system and planet cutover',()=>{
  it('projects confirmed compact worlds exactly once into planet and system knowledge, not extreme objects',()=>{
    const locator=sample??=compactWithPlanet();
    const compact=CompactHostPlanetarySystemGenerator.generateOrNull(key,locator)!;
    const known=[new KnownDiscovery(key,new GalaxyLocator(0n),DiscoveryState.CONFIRMED),
      new KnownDiscovery(key,locator,DiscoveryState.CONFIRMED)];
    const telemetry=GalaxyExplorationTelemetryEngine.build(key,0n,DiscoveryState.CONFIRMED,known,[compact.host]);
    expect(telemetry.inventory.systems).toBe(1n);
    expect(telemetry.compactHostSystems.total).toBe(1n);
    expect(telemetry.inventory.extremeObjects).toBe(0n);
    expect(telemetry.compactHostPlanets).toBe(BigInt(compact.planets.length));
    expect(telemetry.inventory.planets).toBe(BigInt(compact.planets.length));
    expect(telemetry.breakdown.planets.rocky+telemetry.breakdown.planets.superEarth).toBe(telemetry.inventory.planets);
    expect(telemetry.breakdown.planets.liquidSurfaceAtLeast20Percent).toBe(0n);
  });
  it('does not invent a conventional photosphere, HZ or accretion disk',()=>{
    const model=fixture(DiscoveryState.CONFIRMED);
    const session=SystemCompactHostScientificSession.buildOrNull(model)!;
    expect(session).not.toBeNull();
    expect(session.scene.stars).toHaveLength(1);
    expect(session.scene.stars[0]?.compactHostKind).toBe(session.system.host.type);
    expect(session.scene.stars[0]?.lightIntensity).toBe(0);
    expect(session.scene.stars[0]?.sourceLuminositySolar).toBeNull();
    expect(session.scene.habitableZone).toBeNull();
    expect(model.stellarSystemCard!.render.hasStableHabitableZone).toBe(false);
    expect(model.stellarSystemCard!.components[0]?.compactVisual?.hasAccretionDisk).toBe(false);
    expect(SystemV2SingleScientificSession.buildOrNull(model)).toBeNull();
  });

  it('31.4c projects only conditional presentation light and never fakes black-hole emission',()=>{
    const model=fixture(DiscoveryState.CONFIRMED);
    const session=SystemCompactHostScientificSession.buildOrNull(model)!;
    const host=session.scene.stars[0]!;
    expect(host.compactHostKind).toBe(session.system.host.type);
    expect(host.sourceLuminositySolar).toBeNull();
    expect(host.lightIntensity).toBe(0);
    expect(host.compactHostPresentationFlux).toBeGreaterThanOrEqual(0);
    expect(host.compactHostAccretionLuminositySolar).toBe(session.system.host.scientificState.accretionLuminositySolar);
    expect(session.scene.habitableZone).toBeNull();
  });

  it('31.4e quarters all four neutron-family visual sizes but preserves canonical black-hole size',()=>{
    for (const type of [ExtremeType.NEUTRON_STAR, ExtremeType.PULSAR,
      ExtremeType.MILLISECOND_PULSAR, ExtremeType.MAGNETAR]) {
      expect(compactHostVisualRadiusScene(type)).toBeCloseTo(0.32 / 4, 12);
    }
    expect(compactHostVisualRadiusScene(ExtremeType.STELLAR_MASS_BLACK_HOLE)).toBe(0.38);
  });

  it('31.4e illuminates planets around a quiescent black-hole depiction without inventing accretion',()=>{
    const model=fixture(DiscoveryState.CONFIRMED);
    const original=SystemCompactHostScientificSession.buildOrNull(model)!;
    // Presentation projection fixture: replace only the host classification,
    // without changing the planet generation or making a production seed exception.
    const host = Object.freeze({ ...original.system.host,
      type:ExtremeType.STELLAR_MASS_BLACK_HOLE,
      scientificState:Object.freeze({
        ...original.system.host.scientificState,
        thermalLuminositySolar:null,highEnergyLuminositySolar:null,
        accretionLuminositySolar:null,
      }),
    });
    const system = Object.freeze({ ...original.system, host,
      environments:Object.freeze(original.system.environments.map(env => Object.freeze({
        ...env,modeledIncludedFluxWm2:null,
      }))),
    }) as unknown as CompactHostPlanetarySystem;
    const snapshot=projectCompactHostScene(model,model.stellarSystemCard!,DiscoveryState.CONFIRMED,system);
    const star=snapshot.stars[0]!;
    expect(star.radiusScene).toBe(0.38);
    expect(star.compactHostPresentationFlux).toBe(0);
    expect(star.compactHostInspectionLightFlux).toBe(COMPACT_BLACK_HOLE_INSPECTION_LIGHT_FLUX);
    expect(star.sourceLuminositySolar).toBeNull();
    expect(star.compactHostAccretionLuminositySolar).toBeNull();
    expect(snapshot.planets.length).toBeGreaterThan(0);
    expect(snapshot.planets.every(p => p.compactPlanetPresentationFill01 ===
      COMPACT_BLACK_HOLE_INSPECTION_PLANET_FILL01)).toBe(true);
    expect(snapshot.accessibleLabel).toContain('sin luminosidad de acreción acreditada');
    expect(() => assertSystemSceneProjectionSnapshot(snapshot)).not.toThrow();
  });

  it('31.4d uses stronger per-planet diagnostic illumination without making it a physical luminosity',()=>{
    const model=fixture(DiscoveryState.CONFIRMED);
    const session=SystemCompactHostScientificSession.buildOrNull(model)!;
    const host=session.scene.stars[0]!;
    expect(host.sourceLuminositySolar).toBeNull();
    expect(host.lightIntensity).toBe(0);
    for(const planet of session.scene.planets){
      expect(planet.compactPlanetPresentationFill01).toBeGreaterThan(0);
      expect(planet.compactPlanetPresentationFill01).toBeLessThanOrEqual(1);
      expect(planet.sourceLuminositySolar).toBeNull();
    }
    if(host.compactHostKind==='STELLAR_MASS_BLACK_HOLE'){
      expect(host.compactHostPresentationFlux).toBe(0);
      expect(session.scene.accessibleLabel).toContain('ilustración');
    } else {
      expect(host.compactHostPresentationFlux).toBeGreaterThanOrEqual(1.8);
    }
  });

  it('keeps planet identities and scientific routes locked until CONFIRMED',()=>{
    const model=fixture(DiscoveryState.CATALOGUED);
    const session=SystemCompactHostScientificSession.buildOrNull(model)!;
    expect(session).not.toBeNull();
    expect(session.scene.planets).toHaveLength(0);
    expect(session.scene.scientificPlanetBindings).toHaveLength(0);
    expect(session.planetFiche(0n).kind).toBe(PlanetScientificFicheResolutionKind.LOCKED);
    expect(model.stellarSystemCard!.systemFacts.some(f=>f.label==='Planetas'&&f.value.includes('no revelado'))).toBe(true);
  });

  it('projects confirmed compact systems with planets as a valid frozen SystemScene snapshot',()=>{
    const model=fixture(DiscoveryState.CONFIRMED);
    const session=SystemCompactHostScientificSession.buildOrNull(model)!;
    expect(session.scene.planets.length).toBeGreaterThan(0);
    expect(() => assertSystemSceneProjectionSnapshot(session.scene)).not.toThrow();
    for (const planet of session.scene.planets) {
      expect(Object.isFrozen(planet.motionContributions)).toBe(true);
      expect(planet.motionContributions.every(part => Object.isFrozen(part))).toBe(true);
    }
  });

  it('31.4h: distinguishes a partial escape proxy from physical survival and discloses radiative couplings',()=>{
    const model=fixture(DiscoveryState.CONFIRMED);
    const session=SystemCompactHostScientificSession.buildOrNull(model)!;
    const result=session.planetFiche(0n);
    expect(result.kind).toBe(PlanetScientificFicheResolutionKind.AVAILABLE);
    if(result.kind!==PlanetScientificFicheResolutionKind.AVAILABLE) throw new Error('Expected compact scientific fiche.');
    const atmosphere=result.card.sections.sections.find(s=>s.id==='atmosphere')!;
    const climate=result.card.sections.sections.find(s=>s.id==='climate')!;
    const surface=result.card.sections.sections.find(s=>s.id==='surface')!;
    expect(atmosphere.fields.find(f=>f.label==='Estado atmosférico')?.note)
      .toContain('no confirmado');
    expect(climate.fields.find(f=>f.label==='Temperatura superficial media')?.note)
      .toContain('escenario radiativo condicionado');
    expect(atmosphere.fields.some(f=>f.label==='Condensación criogénica / límites')).toBe(false);
    expect(surface.fields.find(f=>f.label==='Distribución hielo / líquido / vapor')?.value)
      .toBe('No cuantificables sin masa del reservorio');
  });

  it('31.4k consolidation: never drops calculated orbital periods in compact fiches', () => {
    const session = SystemCompactHostScientificSession.buildOrNull(fixture(DiscoveryState.CONFIRMED))!;
    for (const planet of session.system.planets) {
      const result = session.planetFiche(planet.locator.bodyIndex);
      expect(result.kind).toBe(PlanetScientificFicheResolutionKind.AVAILABLE);
      if (result.kind !== PlanetScientificFicheResolutionKind.AVAILABLE) throw new Error('Planet fiche unavailable');
      const orbit = result.card.sections.sections.find(section => section.id === 'orbit')!;
      const period = orbit.fields.find(item => item.label === 'Periodo orbital')!;
      const format = (value:number) => value.toLocaleString('es-ES', { maximumSignificantDigits:5 });
      expect(period.value).toBe(`${format(planet.orbitalPeriodDays)} días · ${format(planet.orbitalPeriodDays/365.25)} años`);
      expect(period.value).not.toContain('No determinado');
      expect(planet.orbitalPeriodDays).toBeGreaterThan(0);
    }
  });

  it('31.4k consolidation: lunar counts and Earth comparison use conventional field names without fictitious habitability', () => {
    const session = SystemCompactHostScientificSession.buildOrNull(fixture(DiscoveryState.CONFIRMED))!;
    const lunarLabels = ['Satélites naturales','Lunas con caracterización individual','Lunas menores',
      'Candidatas potencialmente habitables','Candidatas de superficie','Candidatas subsuperficiales'];
    const comparisonLabels = ['Radio relativo','Masa relativa','Área superficial relativa',
      'Volumen relativo','Densidad relativa','Gravedad superficial relativa'];
    for (const planet of session.system.planets) {
      const result = session.planetFiche(planet.locator.bodyIndex);
      if (result.kind !== PlanetScientificFicheResolutionKind.AVAILABLE) throw new Error('Planet fiche unavailable');
      const moons = result.card.sections.sections.find(section => section.id === 'moons')!;
      const comparison = result.card.sections.sections.find(section => section.id === 'comparison')!;
      const count = session.system.secondaries.moons.filter(moon => moon.parentPlanetOrdinal === planet.ordinal).length;
      expect(moons.fields.map(item => item.label)).toEqual(lunarLabels);
      expect(moons.fields[0]?.value).toBe(String(count));
      expect(moons.fields[1]?.value).toBe(String(count));
      expect(moons.fields[2]?.value).toBe('0');
      expect(moons.fields.slice(3).every(item => item.value === 'No evaluadas')).toBe(true);
      expect(comparison.fields.map(item => item.label)).toEqual(comparisonLabels);
      expect(comparison.fields.every(item => item.value !== 'No determinado')).toBe(true);
    }
  });

  it('uses the same planet ordinal, orbit and body locator in 3D and the scientific fiche',()=>{
    const model=fixture(DiscoveryState.CONFIRMED);
    const session=SystemCompactHostScientificSession.buildOrNull(model)!;
    expect(session.scene.planets).toHaveLength(session.system.planets.length);
    expect(session.scene.scientificPlanetBindings).toHaveLength(session.system.planets.length);
    for(const planet of session.system.planets){
      const result=session.planetFiche(planet.locator.bodyIndex);
      expect(result.kind).toBe(PlanetScientificFicheResolutionKind.AVAILABLE);
      if(result.kind!==PlanetScientificFicheResolutionKind.AVAILABLE) throw new Error('Missing 31.4 fiche.');
      expect(result.card.bodyIndex).toBe(planet.locator.bodyIndex);
      expect(result.card.sections.sections.find(s=>s.id==='orbit')?.fields.some(f=>f.label==='Semieje mayor')).toBe(true);
      expect(result.card.preview.kind).toBe('PLANET');
      expect(session.scene.scientificPlanetBindings?.some(b=>b.sceneBodyId===`planet-${planet.ordinal}`&&b.bodyIndex===planet.locator.bodyIndex.toString())).toBe(true);
      for(const section of result.card.sections.sections){
        if(Object.prototype.hasOwnProperty.call(PLANET_FICHE_FIELD_LAYOUT,section.id)){
          const expected=PLANET_FICHE_FIELD_LAYOUT[section.id as keyof typeof PLANET_FICHE_FIELD_LAYOUT];
          expect(section.fields.map(field=>field.label)).toEqual(expected);
        }
      }
      const atmosphere=result.card.sections.sections.find(s=>s.id==='atmosphere')!;
      const climate=result.card.sections.sections.find(s=>s.id==='climate')!;
      expect(atmosphere.fields.find(f=>f.label==='Presión superficial gaseosa')).toBeDefined();
      expect(atmosphere.fields.some(f=>f.label==='Composición dominante')).toBe(true);
      expect(climate.fields.find(f=>f.label==='Temperatura superficial media')).toBeDefined();
      // The preview contract is a discriminated union. Vitest's .toBe('PLANET')
      // does not narrow its TypeScript type; guard the discriminant explicitly.
      if (result.card.preview.kind !== 'PLANET') throw new Error('Expected a compact planet preview.');
      expect(result.card.preview.primary.surface).toBe(session.scene.planets[planet.ordinal-1]!.surfaceEnvironment);
      expect(session.scene.planets[planet.ordinal-1]!.spin.source).toBe('COMPACT_31_4F');
    }
  });
});
