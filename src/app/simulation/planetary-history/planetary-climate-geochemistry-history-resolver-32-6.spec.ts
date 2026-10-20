import { describe, it, expect } from 'vitest';
import { PlanetaryHistoryEngine } from './planetary-history-engine';
import type { PlanetaryClimateGeochemistryHistoryInput32_6 } from '../../domain/planetary-history/planetary-climate-geochemistry-history-32-6';
import { PlanetaryClimateGeochemistryHistoryResolver32_6 as Resolver } from './planetary-climate-geochemistry-history-resolver-32-6';

type Input = PlanetaryClimateGeochemistryHistoryInput32_6;
const loc = { galaxyIndex: 0n, sectorKey: -26n, galacticObjectIndex: 5n, bodyIndex: 0n };
const bodyKey = 'G0/S-26/O5/B0';
const seed = { kind: 'body', normalizedValue: 'A'.repeat(32) };
const time = { kind: 'CURRENT_SNAPSHOT' as const, systemAgeBillionYears: 4.6 };
const sid = { planetOrdinal: 1, bodyLocator: loc, bodySeed: seed };
function fixture(multiplicity: 'SINGLE'|'BINARY'|'TRIPLE' = 'SINGLE', deep = false): Input {
  const planet = {
    planetOrdinal: 1, locator: loc, seed,
    hostPlanetarySystem: { hostStellarSystem: { multiplicity: { name: multiplicity } } },
  };
  const greenhouse = { ...sid, sourceReferenceMeanInsolationEarth: 1.02,
    regime: deep ? 'DEEP_ENVELOPE' : 'STRONG', sourceRetainedSurfacePressurePascal: deep ? null : 100000,
    infraredOpticalDepthProxy: 2.5, temperatureAmplificationFactor: deep ? null : 1.1,
    longwaveTrappingFraction01: 0.4, condensableEquilibriumState: null, waterVaporEquilibriumState: null };
  const variability = { ...sid, sourceEquilibriumTemperatureKelvin: 270,
    sourceMeanSurfaceTemperatureKelvin: deep ? null : 300,
    minimumSurfaceTemperatureKelvin: deep ? null : 280,
    maximumSurfaceTemperatureKelvin: deep ? null : 330,
    seasonalTemperatureAmplitudeKelvin: deep ? null : 8,
    diurnalTemperatureRangeKelvin: deep ? null : 32,
    stabilityIndex01: deep ? null : 0.8 };
  const climate = { ...sid, sourceReferenceMeanInsolationEarth: 1.02,
    equilibriumTemperatureKelvin: 270, sourceInfraredOpticalDepthProxy: 2.5,
    sourceGreenhouseRegime: greenhouse.regime,
    sourceGreenhouseTemperatureAmplificationFactor: greenhouse.temperatureAmplificationFactor,
    meanSurfaceTemperatureKelvin: deep ? null : 300 };
  const water = { ...sid, sourceMeanSurfaceTemperatureKelvin: deep ? null : 300,
    sourceMinimumSurfaceTemperatureKelvin: deep ? null : 280,
    sourceMaximumSurfaceTemperatureKelvin: deep ? null : 330,
    sourceClimateStabilityIndex01: deep ? null : 0.8,
    sourceRetainedSurfacePressurePascal: deep ? null : 100000,
    waterInventoryIndex01: 0.4,
    surfaceLiquidWaterCoverageFraction01: deep ? null : 0.23,
    surfaceIceCoverageFraction01: deep ? null : 0.05 };
  const geology = { ...sid, sourceWaterInventoryIndex01: 0.4,
    sourceSurfaceLiquidWaterCoverageFraction01: deep ? null : 0.23,
    volcanismIndex01: deep ? null : 0.7,
    volatileOutgassingPotential01: deep ? null : 0.5,
    tectonicMobilityIndex01: deep ? null : 0.35,
    geologicalActivityIndex01: deep ? null : 0.6,
    surfaceRenewalPotential01: deep ? null : 0.4 };
  const retention = { ...sid, sourceReferenceMeanInsolationEarth: 1.02,
    retainedSurfacePressurePascal: deep ? null : 100000,
    retainedMoleInventoryFraction01: 0.7,
    retainedGasComponents: [ {gas:'NITROGEN',moleFraction01:0.7},
      {gas:'CARBON_DIOXIDE',moleFraction01:0.3} ] };
  return { time, atmosphere: {hostPlanet: planet, retentionState: retention,
    greenhouseEffect: greenhouse, climateState: climate,
    climateVariabilityState: variability, waterInventory: water,
    geologyState: geology} } as unknown as Input;
}
function patch(f: Input, field: keyof Input['atmosphere'], update: Record<string,unknown>): Input {
  return { ...f, atmosphere: { ...f.atmosphere,
    [field]: { ...f.atmosphere[field], ...update } } } as Input;
}
function run(f: Input = fixture()) { return Resolver.resolve(f); }
function prior(f: Input, impacts: string[] = []) {
  const episodes = [{ episodeKey: 'assembly', targetBodyKind: 'PLANET' as const,
    targetBodyKey: bodyKey, kind: 'FORMATION' as const,
    time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION' as const,
      startYear: 0, endYear: 6000000, resolution: 'INFERRED_INTERVAL' as const },
    source: { sourcePhase: '17.7', sourceModel: 'formation-blueprint',
      sourceRecordKey: 'precursors', evidenceKind: 'INFERRED_PHYSICAL_EPISODE' as const },
    causedByEpisodeKeys: [] }];
  const host = f.atmosphere.hostPlanet.hostPlanetarySystem.hostStellarSystem.multiplicity.name;
  if (host !== 'SINGLE' && host !== 'BINARY' && host !== 'TRIPLE') throw Error('bad fixture');
  const g = f.atmosphere.geologyState;
  const result = { bodyKey, chronology: PlanetaryHistoryEngine.build({
    bodyKind: 'PLANET', bodyKey, multiplicity:host, time:f.time, episodes }),
    sourceEpisodes:episodes, impactCoverage: 'SUPPLIED_EVENTS_ONLY' as const,
    volcanism: { sourceModel: 'GEOLOGY_20_8' as const, volcanismIndex01: g.volcanismIndex01,
      outgassingPotential01: g.volatileOutgassingPotential01,
      geologicalActivityIndex01: g.geologicalActivityIndex01,
      surfaceRenewalPotential01: g.surfaceRenewalPotential01 },
    realizedImpactEffects: impacts.map(sourceEventId => ({
      sourceModel: 'REALIZED_IMPACT_23_13_EFFECTS_23_10' as const,
      sourceEventId, targetBodyKey: bodyKey, radiativeEffect: 'NOT_QUANTIFIED' as const,
      radiativeForcingWattsPerSquareMeter: null, temperatureChangeKelvin: null,
      historicalDating: 'DEFERRED_TO_32_8' as const,
    })),
  };
  return result as unknown as NonNullable<Input['precedingCatastrophe']>;
}
const history = (f: Input) => ({ ...f, precedingCatastrophe: prior(f) });
const bad = (field: keyof Input['atmosphere'], updates: Record<string,unknown>) =>
  () => run(patch(fixture(),field,updates));

describe('GENESIS 32.6 — climate/geochemical causes, duration, uncertainty', () => {
  it('describes present climate without fabricating a dated climate episode', () => {
    const r=run();
    expect(r.contractVersion).toBe('32.6-CT0');
    expect(r.snapshot.meanSurfaceTemperatureKelvin).toBe(300);
    expect(r.snapshot.equilibriumTemperatureKelvin).toBe(270);
    expect(r.snapshot.greenhouseTrappingFraction01).toBe(.4);
    expect(r.snapshot.interpretation).toBe('CURRENT_PHYSICAL_STATE_NOT_HISTORICAL_TREND');
    expect(r.chronology.episodes).toHaveLength(0);
    expect(r.resolvedClimateGeochemistryChanges).toHaveLength(0);
  });
  it('keeps geographic current surface coverages distinct from historical reservoir masses', () => {
    const s=run().snapshot;
    expect(s.surfaceWaterCoverageFraction01).toBe(.23);
    expect(s.surfaceIceCoverageFraction01).toBe(.05);
    expect(s.waterInventoryIndex01).toBe(.4);
  });
  it('reports current geochemistry proxies but no historical volcanic flux', () => {
    const s=run().snapshot;
    expect(s.volcanismPotential01).toBe(.7);
    expect(s.volatileOutgassingPotential01).toBe(.5);
    expect(s.tectonicMobilityIndex01).toBe(.35);
    expect(run().drivers[3].gasMassDeltaKilograms).toBeNull();
  });
  it('keeps cause, epoch, duration, direction, size and uncertainty explicit', () => {
    const r=run();
    expect(r.drivers).toHaveLength(4);
    for (const d of r.drivers) {
      expect(d.causeEvidence).toBe('PRESENT_MODEL_PROXY');
      expect(d.status).toBe('CURRENT_CONDITION_ONLY');
      expect(d.startYear).toBeNull();
      expect(d.endYear).toBeNull();
      expect(d.durationYears).toBeNull();
      expect(d.direction).toBe('NOT_RESOLVED');
      expect(d.temperatureDeltaKelvin).toBeNull();
      expect(d.radiativeForcingWattsPerSquareMeter).toBeNull();
      expect(d.uncertainty).toBe('NO_HISTORICAL_STATES');
    }
  });
  it('sorts gas-phase chemistry deterministically and does not call it an earlier atmosphere', () => {
    const s=run().snapshot;
    expect(s.gasPhaseSource).toBe('RETAINED_GASES_20_3');
    expect(s.gasPhaseMoleFractions.map(x=>x.gas)).toEqual(['CARBON_DIOXIDE','NITROGEN']);
  });
  it('uses the FINAL multigas condensation equilibrium rather than the precondensed composition', () => {
    const f=fixture();
    const eq={effectiveSurfacePressurePascal:85000,
      effectiveGasComponents:[{gas:'NITROGEN',moleFraction01:.8},{gas:'CARBON_DIOXIDE',moleFraction01:.2}]};
    const x=patch(patch(f,'greenhouseEffect',{condensableEquilibriumState:eq}), 'waterInventory',
      {sourceRetainedSurfacePressurePascal:85000});
    expect(run(x).snapshot.gasPhaseSource).toBe('CONDENSATION_EQUILIBRIUM_20_4');
    expect(run(x).snapshot.currentEffectiveSurfacePressurePascal).toBe(85000);
    expect(run(x).snapshot.gasPhaseMoleFractions[0].fraction01).toBe(.2);
  });
  it('also uses final water-vapor-only condensation composition',()=>{
    const f=fixture();
    const eq={effectiveSurfacePressurePascal:92000,
      effectiveGasComponents:[{gas:'NITROGEN',moleFraction01:.9},{gas:'WATER_VAPOR',moleFraction01:.1}]};
    const x=patch(patch(f,'greenhouseEffect',{waterVaporEquilibriumState:eq}),'waterInventory',
      {sourceRetainedSurfacePressurePascal:92000});
    expect(run(x).snapshot.gasPhaseSource).toBe('WATER_VAPOR_EQUILIBRIUM_20_4');
  });
  it('permits a fully condensed gas inventory without inventing atmospheric gas',()=>{
    const f=fixture();
    const eq={effectiveSurfacePressurePascal:0,effectiveGasComponents:[]};
    const x=patch(patch(f,'greenhouseEffect',{condensableEquilibriumState:eq}),
      'waterInventory',{sourceRetainedSurfacePressurePascal:0});
    const r=run(x);
    expect(r.snapshot.currentEffectiveSurfacePressurePascal).toBe(0);
    expect(r.snapshot.gasPhaseMoleFractions).toHaveLength(0);
    expect(r.chronology.episodes).toHaveLength(0);
  });
  it('rejects pressure passing precondensation retention instead of final 20.4 value',()=>{
    const x=patch(fixture(),'greenhouseEffect',{condensableEquilibriumState:{
      effectiveSurfacePressurePascal:75000, effectiveGasComponents:[{gas:'NITROGEN',moleFraction01:1}]}});
    expect(()=>run(x)).toThrow();
  });
  it('rejects inconsistent greenhouse optical depth and current climate handoff',()=>{
    expect(bad('climateState',{sourceInfraredOpticalDepthProxy:8})).toThrow();
    expect(bad('climateState',{sourceGreenhouseRegime:'NONE'})).toThrow();
    expect(bad('climateState',{sourceGreenhouseTemperatureAmplificationFactor:9})).toThrow();
    expect(bad('climateState',{sourceReferenceMeanInsolationEarth:4})).toThrow();
  });
  it('rejects mixing another planet/seed/ordinal into any 20.x state',()=>{
    for (const k of ['retentionState','greenhouseEffect','climateState','climateVariabilityState',
      'waterInventory','geologyState'] as const) {
      expect(bad(k,{bodySeed:{...seed,normalizedValue:'B'.repeat(32)}})).toThrow();
      expect(bad(k,{planetOrdinal:2})).toThrow();
      expect(bad(k,{bodyLocator:{...loc,sectorKey:-27n}})).toThrow();
    }
  });
  it('rejects inconsistent water and geology',()=>{
    expect(bad('waterInventory',{waterInventoryIndex01:.9})).toThrow();
    expect(bad('geologyState',{sourceSurfaceLiquidWaterCoverageFraction01:.99})).toThrow();
    expect(bad('geologyState',{tectonicMobilityIndex01:5})).toThrow();
  });
  it('rejects non-finite surface temperatures and impossible thermal envelope',()=>{
    expect(bad('climateState',{meanSurfaceTemperatureKelvin:NaN})).toThrow();
    expect(bad('climateVariabilityState',{maximumSurfaceTemperatureKelvin:250})).toThrow();
    expect(bad('climateVariabilityState',{seasonalTemperatureAmplitudeKelvin:-1})).toThrow();
  });
  it('rejects invalid gas chemistry fractions or duplicated species',()=>{
    expect(bad('retentionState',{retainedGasComponents:[{gas:'NITROGEN',moleFraction01:.8}]})).toThrow();
    expect(bad('retentionState',{retainedGasComponents:[
      {gas:'NITROGEN',moleFraction01:.5},{gas:'NITROGEN',moleFraction01:.5}]})).toThrow();
    expect(bad('retentionState',{retainedGasComponents:[{gas:'NOT_REAL',moleFraction01:1}]})).toThrow();
    expect(bad('retentionState',{retainedGasComponents:[]})).toThrow();
  });
  it('accepts a valid deep-envelope world without fabricating solid terrain',()=>{
    const r=run(fixture('SINGLE',true));
    expect(r.snapshot.meanSurfaceTemperatureKelvin).toBeNull();
    expect(r.snapshot.volcanismPotential01).toBeNull();
    expect(r.drivers).toHaveLength(2);
    expect(r.chronology.episodes).toHaveLength(0);
  });
  it('rejects a false solid-surface value in a deep envelope',()=>{
    const x=patch(fixture('SINGLE',true),'geologyState',{volcanismIndex01:.2});
    expect(()=>run(x)).toThrow();
  });
  it.each(['SINGLE','BINARY','TRIPLE'] as const)('has identical physical rules in %s', multiplicity=>{
    const r=run(fixture(multiplicity));
    expect(r.chronology.multiplicity).toBe(multiplicity);
    expect(r.drivers.map(x=>x.kind)).toEqual(run().drivers.map(x=>x.kind));
  });
  it('rejects missing host multiplicity instead of extrapolating another host',()=>{
    const x=patch(fixture(),'hostPlanet',{hostPlanetarySystem:{hostStellarSystem:{multiplicity:{name:'UNKNOWN'}}}});
    expect(()=>run(x)).toThrow();
  });
  it('inherits actual source-backed formation intervals unchanged',()=>{
    const f=fixture(); const r=run(history(f));
    expect(r.chronology.episodes).toHaveLength(1);
    expect(r.chronology.episodes[0].kind).toBe('FORMATION');
    expect(r.sourceEpisodes).toHaveLength(1);
    expect(r.resolvedClimateGeochemistryChanges).toHaveLength(0);
  });
  it('distinguishes absent impact catalogue from supplied realized events',()=>{
    const f=fixture();
    expect(run(f).drivers).toHaveLength(4);
    const r=run({...f,precedingCatastrophe:prior(f,['impact-A'])});
    expect(r.drivers).toHaveLength(5);
    const d=r.drivers[4];
    expect(d.sourceRecordKey).toBe('impact-A');
    expect(d.causeEvidence).toBe('RESOLVED_PHYSICAL_EVENT');
    expect(d.climateResponse).toBe('NOT_QUANTIFIED');
    expect(d.durationYears).toBeNull();
    expect(r.chronology.episodes).toHaveLength(1);
  });
  it('sorts realized impact driver IDs independently of supplied order',()=>{
    const f=fixture();
    const x=run({...f,precedingCatastrophe:prior(f,['z','a','m'])});
    const y=run({...f,precedingCatastrophe:prior(f,['m','z','a'])});
    expect(JSON.stringify(x)).toBe(JSON.stringify(y));
  });
  it('rejects foreign or duplicated impact events in 32.5 handoff',()=>{
    const f=fixture();
    const other=prior(f,['id']);
    expect(()=>run({...f,precedingCatastrophe:{...other,realizedImpactEffects:
      [{...other.realizedImpactEffects[0],targetBodyKey:'G0/S0/O0/B0'}]}})).toThrow();
    expect(()=>run({...f,precedingCatastrophe:prior(f,['id','id'])})).toThrow();
  });
  it('rejects a fabricated historical temperature change smuggled through impact consequences',()=>{
    const f=fixture(); const x=prior(f,['event']);
    expect(()=>run({...f,precedingCatastrophe:{...x,realizedImpactEffects:
      [{...x.realizedImpactEffects[0],temperatureChangeKelvin:-10} as unknown as typeof x.realizedImpactEffects[number]]}})).toThrow();
  });
  it('rejects a prior result from a different body, epoch or geological model',()=>{
    const f=fixture(); const x=prior(f);
    expect(()=>run({...f,precedingCatastrophe:{...x,bodyKey:'other'}})).toThrow();
    expect(()=>run({...f,precedingCatastrophe:{...x,volcanism:{...x.volcanism,volcanismIndex01:.1}}})).toThrow();
    expect(()=>run({...f,precedingCatastrophe:{...x,chronology:{...x.chronology,episodes:[]}}})).toThrow();
  });
  it('does not leak risk estimates or invent eruptions/extinctions or atmospheric historical masses',()=>{
    const r=run();
    expect(r.drivers.some(x=>x.kind==='REALIZED_IMPACT_POSSIBLE_CLIMATE_EFFECT')).toBe(false);
    expect(r.drivers.some(x=>x.status==='RESOLVED_IMPACT_UNQUANTIFIED_EFFECT')).toBe(false);
    expect(r.lifePresence).toBe('NOT_EVALUATED');
    expect(r.historicalCompleteness).toBe('NOT_ESTABLISHED');
  });
  it('is pure and immutable, no dependency on RNG or input order',()=>{
    const f=fixture(); const before=f.atmosphere.climateState.meanSurfaceTemperatureKelvin;
    const x=run(f),y=run(f);
    expect(JSON.stringify(x)).toBe(JSON.stringify(y));
    expect(Object.isFrozen(x.snapshot)).toBe(true);
    expect(Object.isFrozen(x.drivers)).toBe(true);
    expect(f.atmosphere.climateState.meanSurfaceTemperatureKelvin).toBe(before);
  });
  it('does not turn present climate variability into a historical time duration',()=>{
    const r=run(patch(fixture(),'climateVariabilityState',{
      seasonalTemperatureAmplitudeKelvin:100}));
    expect(r.snapshot.seasonalTemperatureAmplitudeKelvin).toBe(100);
    expect(r.drivers.every(x=>x.durationYears===null)).toBe(true);
  });
  it('keeps CT-0 unknown age unknown and never dates an unsupported climate transition',()=>{
    const f={...fixture(),time:{kind:'CURRENT_SNAPSHOT' as const,systemAgeBillionYears:null}};
    const r=run(f);
    expect(r.chronology.presentYearAfterFormation).toBeNull();
    expect(r.resolvedClimateGeochemistryChanges).toHaveLength(0);
  });
});
