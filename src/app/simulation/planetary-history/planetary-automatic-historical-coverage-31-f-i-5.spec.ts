import { afterEach, describe, expect, it, vi } from 'vitest';
import { CompactHostPlanetarySystemGenerator } from '../planetary/compact-host-planetary-system-generator';
import { SystemCompactHostScientificSession } from '../../presentation/system/system-compact-host-scientific-session';
import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarSystemMultiplicitySelector } from '../stellar/stellar-system-multiplicity-selector';
import { ProceduralTargetResolver } from '../regeneration/procedural-target-resolver';
import { StellarMultihostFormation } from '../stellar/stellar-multihost-formation';
import { PlanetGenerator } from '../planetary/planet-generator';
import { AtmosphereGenerator } from '../planetary/atmosphere-generator';
import { MoonGenerator } from '../planetary/moon-generator';
import { ArchiveDiscoveryLocatorKind, type ArchiveDiscoveryDetailModel } from '../../presentation/genesis-archive/archive-discovery-detail.facade';
import { ArchiveV2StellarSystemCardAssembler } from '../../presentation/genesis-archive/archive-v2-stellar-system-card';
import { SystemV2SingleScientificSession } from '../../presentation/system/system-v2-single-scientific-session';
import { SystemMultihostGameCutover } from '../../presentation/system/system-multihost-game-cutover';
import { PlanetaryHistoricalRuntime31Fi1 } from './planetary-historical-runtime-31-f-i-1';
import { PlanetaryAutomaticHistoricalCoverage31Fi5 } from './planetary-automatic-historical-coverage-31-f-i-5';
import { PlanetaryV2DatedPhysics31Fi3 } from './planetary-v2-dated-physics-31-f-i-3';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const v2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);
type Kind = 'SINGLE' | 'BINARY' | 'TRIPLE';
const locations = new Map<Kind, SystemLocator>();
function locate(kind: Kind): SystemLocator {
  const cached = locations.get(kind);
  if (cached) return cached;
  for (let i = 0n; i < 512n; i++) {
    const at = new SystemLocator(0n, 0n, i);
    const source = ProceduralTargetResolver.resolveTargetSeed(v1, at);
    if (StellarSystemMultiplicitySelector.select(v1, source as Parameters<
      typeof StellarSystemMultiplicitySelector.select>[1]).name !== kind) continue;
    const formation = kind === 'SINGLE'
      ? StellarMultihostFormation.generateV2SingleOrNull(v2, at)
      : StellarMultihostFormation.generateOrNull(v2, at);
    if (!formation) continue;
    const count = 'publicPlanets' in formation ? formation.publicPlanets.length : formation.planets.length;
    if (!count) continue;
    locations.set(kind, at); return at;
  }
  throw new Error(`31.F.i.5: no populated real V2 ${kind} in reproducible fixture range.`);
}
function fixture(kind: Kind, state: DiscoveryStateValue = DiscoveryState.CONFIRMED): ArchiveDiscoveryDetailModel {
  const at = locate(kind);
  return {
    universeSeed: seed.serialize(), generatorVersionCode: 2,
    locatorKind: ArchiveDiscoveryLocatorKind.SYSTEM,
    galaxyIndex: at.galaxyIndex, sectorKey: at.sectorKey, galacticObjectIndex: at.galacticObjectIndex,
    proceduralIdentity: `G${at.galaxyIndex}/S${at.sectorKey}/O${at.galacticObjectIndex}`,
    discoveryState: state, discoveryStateLabel: state.name,
    stellarSystemCard: ArchiveV2StellarSystemCardAssembler.build(v2, at, state),
  } as unknown as ArchiveDiscoveryDetailModel;
}
/** Find an eligible REAL V2 body using its independently materialized phase-15
 * and 18 facts. No fixture is declared eligible because its output is positive,
 * and no seed/body receives special treatment in the production model. */
function physicalEligible(kind: Kind): { locator: SystemLocator; bodyIndex: bigint } {
  for (let i = 0n; i < 768n; i++) {
    const at = new SystemLocator(0n, 0n, i);
    const source = ProceduralTargetResolver.resolveTargetSeed(v1, at);
    if (StellarSystemMultiplicitySelector.select(v1, source as Parameters<
      typeof StellarSystemMultiplicitySelector.select>[1]).name !== kind) continue;
    const formed = kind === 'SINGLE'
      ? StellarMultihostFormation.generateV2SingleOrNull(v2, at)
      : StellarMultihostFormation.generateOrNull(v2, at);
    if (!formed) continue;
    const sources = 'publicPlanets' in formed
      ? formed.publicPlanets.map((e, index) => ({
          bodyIndex: BigInt(index), planet: e.planet,
          host: formed.components.find(c => c.label === e.host),
        }))
      : formed.planets.map((planet, index) => ({
          bodyIndex: BigInt(index), planet, host: formed,
        }));
    for (const item of sources) {
      const host = item.host;
      if (!host) continue; // AB total flux cannot use a private single-star proxy.
      const evolution = host.lifetime.evolutionAssessment;
      const ageYears = Math.round(host.lifetime.ageBillionYears * 1e9);
      const formationYears = Math.ceil(item.planet.hostPlanetarySystem.formationBlueprint
        .formationCompletionAgeMillionYears * 1e6);
      if (host.physical.initialMassSolar < 0.8 || host.physical.initialMassSolar > 1.2 ||
          evolution.evolutionState.name !== 'MAIN_SEQUENCE' ||
          evolution.mainSequenceLifetimeBillionYears === null ||
          evolution.mainSequenceLifetimeBillionYears * 1e9 <= ageYears ||
          ageYears <= Math.max(100_000_000, formationYears) ||
          item.planet.orbit.periastronAu <= 0 ||
          item.planet.hostPlanetarySystem.architecture.orbitTopology !== 'CIRCUMSTELLAR') continue;
      return { locator: at, bodyIndex: item.bodyIndex };
    }
  }
  throw new Error(`31.F.i.5b: no physically eligible real V2 ${kind} source within the bounded fixture search.`);
}
function fixtureAt(kind: Kind, at: SystemLocator): ArchiveDiscoveryDetailModel {
  return {
    universeSeed: seed.serialize(), generatorVersionCode: 2,
    locatorKind: ArchiveDiscoveryLocatorKind.SYSTEM,
    galaxyIndex: at.galaxyIndex, sectorKey: at.sectorKey,
    galacticObjectIndex: at.galacticObjectIndex,
    proceduralIdentity: `G${at.galaxyIndex}/S${at.sectorKey}/O${at.galacticObjectIndex}`,
    discoveryState: DiscoveryState.CONFIRMED,
    discoveryStateLabel: DiscoveryState.CONFIRMED.name,
    stellarSystemCard: ArchiveV2StellarSystemCardAssembler.build(v2, at, DiscoveryState.CONFIRMED),
  } as unknown as ArchiveDiscoveryDetailModel;
}

afterEach(() => vi.restoreAllMocks());

describe('31.F.i.5 — alimentación automática de historia física realmente materializada V2', () => {
  it.each(['SINGLE', 'BINARY', 'TRIPLE'] as const)(
    '%s: fixture V2 científicamente elegible debe producir años positivos reales, sin inventar multi-host completo', kind => {
      const { locator, bodyIndex } = physicalEligible(kind);
      const model = fixtureAt(kind, locator);
      const attached = vi.spyOn(PlanetaryHistoricalRuntime31Fi1, 'attach');
      const session = kind === 'SINGLE'
        ? SystemV2SingleScientificSession.buildOrNull(model)
        : SystemMultihostGameCutover.sessionOrNull(model);
      expect(session).not.toBeNull();
      if (!session) return;
      const fiche = session.planetFiche(bodyIndex);
      expect(fiche.kind).toBe('AVAILABLE');
      const target = attached.mock.calls.at(-1)![0];
      const physical = PlanetaryHistoricalRuntime31Fi1.inspectPhysicalHistory(target);
      const report = PlanetaryHistoricalRuntime31Fi1.inspectAutomaticHistoricalCoverage(target);
      expect(physical).not.toBeNull();
      expect(report).not.toBeNull();
      if (!physical || !report) return;
      expect(physical.planet.source.intervals.length).toBeGreaterThan(0);
      expect(report.worlds[0].irradiance.yearsCovered).toBeGreaterThan(0);
      expect(report.worlds[0].irradiance.classification).toBe('CONDITIONAL_MODEL');
      expect(report.worlds[0].irradiance.intervals).toBe(physical.planet.irradiation.irradiance.length);
      expect(report.publicMultiplicity).toBe(kind);
      expect(report.radiativeScope).toBe(kind === 'SINGLE'
        ? 'HOST_STELLAR_SYSTEM_CONDITIONAL'
        : 'ONE_COMPONENT_ONLY_NOT_MULTIPLE_TOTAL');
      expect(report.worlds.every(w => w.pressure === 'UNKNOWN' && w.waterMass === 'UNKNOWN' &&
        w.radiation === 'UNKNOWN' && w.habitability === 'UNKNOWN')).toBe(true);
      expect(report.fullEnvironmentalCoverage).toBe('NOT_CERTIFIED');
      expect(PlanetaryAutomaticHistoricalCoverage31Fi5.fromMaterialized(physical).worlds[0].irradiance
        .yearsCovered).toBe(report.worlds[0].irradiance.yearsCovered);
      const world = report.worlds[0];
      const unknownYears = world.irradiance.unknown.reduce((n,p) => n+p.endYear-p.startYear+1,0);
      expect(world.irradiance.yearsCovered + unknownYears).toBe(report.ageYearsCT0 + 1);
      const request = { context: physical.planet.source.context,
        version: { universeKey: 'real-v2-31-final', physicsModelRevision:'31Fi3',
          sourceRevision:'materialized-episode-31-final' },
        // Query a genuinely covered physical irradiation period, not merely
        // the pre-main-sequence UNKNOWN span at CT-0 origin.
        startYear:physical.planet.source.intervals[0]!.startYear,
        endYear:Math.min(physical.planet.source.intervals[0]!.endYear,
          physical.planet.source.intervals[0]!.startYear+50_000_000) };
      const first = PlanetaryHistoricalRuntime31Fi1.reconstructFromMaterialized(target,request);
      const second = PlanetaryHistoricalRuntime31Fi1.reconstructFromMaterialized(target,request);
      expect(second).toEqual(first);
      expect(first.physical.windows).toBeDefined();
      expect(first.physical.continuity).toBeDefined();
      expect(first.physical.evolutionaryStability).toBeDefined();
      expect(first.certification.certifiedContinuousIntervals).toBe(0);
      expect(first.physical.lifePresence).toBe('NOT_EVALUATED');
      expect(first.physical.windows.routes.every(route=>route.compatibleWindows.length===0)).toBe(true);
      expect(PlanetaryHistoricalRuntime31Fi1.inspectAutomaticHistoricalCoverage({...target})).toBeNull();
      const publicText = JSON.stringify(fiche,(_key,value:unknown)=>
        typeof value === 'bigint' ? value.toString() : value);
      expect(publicText).not.toMatch(/31\.F\.i\.5|sourceRecordKey|intervalsCovered|historicalCompleteness/);
      console.info('GENESIS_31_FINAL_EVIDENCE',JSON.stringify({
        scenario:kind,ageYearsCT0:report.ageYearsCT0,
        irradianceYears:world.irradiance.yearsCovered,unknownYears,
        radiativeScope:report.radiativeScope,environment:'UNKNOWN_BY_DESIGN',
        life:'NOT_EVALUATED',certification:report.fullEnvironmentalCoverage,
        private:true,integrated31_7_8_9:true,deterministic:true,
      }));
      console.info('GENESIS_31FI5B_POSITIVE_COVERAGE', JSON.stringify({
        publicHost: kind, locator: `${locator.galacticObjectIndex}`, bodyIndex: `${bodyIndex}`,
        sourceMultiplicity: report.multiplicity, radiativeScope: report.radiativeScope,
        irradianceYears: report.worlds[0].irradiance.yearsCovered,
        unknownYears: report.worlds[0].irradiance.unknown.reduce(
          (n, p) => n + p.endYear - p.startYear + 1, 0),
        certification: report.fullEnvironmentalCoverage,
      }));
    }, 120_000,
  );


  it.each(['SINGLE','BINARY','TRIPLE'] as const)(
    '%s: usa la fuente V2 sin regenerar cuerpos al consultar historia CT-0 privada', kind => {
      const model = fixture(kind);
      const attached = vi.spyOn(PlanetaryHistoricalRuntime31Fi1, 'attach');
      const newPlanets = vi.spyOn(PlanetGenerator, 'generate');
      const newAtmos = vi.spyOn(AtmosphereGenerator, 'generate');
      const newMoons = vi.spyOn(MoonGenerator, 'generate');
      const session = kind === 'SINGLE'
        ? SystemV2SingleScientificSession.buildOrNull(model)
        : SystemMultihostGameCutover.sessionOrNull(model);
      expect(session).not.toBeNull();
      if (!session) return;
      const fiche = session.planetFiche(0n);
      expect(fiche.kind).toBe('AVAILABLE');
      expect(attached).toHaveBeenCalled();
      const target = attached.mock.calls.at(-1)![0];
      const physical = PlanetaryHistoricalRuntime31Fi1.inspectPhysicalHistory(target);
      const report = PlanetaryHistoricalRuntime31Fi1.inspectAutomaticHistoricalCoverage(target);
      if (kind === 'SINGLE') expect(physical).not.toBeNull();
      if (physical) {
        expect(report).not.toBeNull();
        expect(report!.ageYearsCT0).toBe(physical.ageYearsCT0);
        expect(report!.worlds).toHaveLength(1 + physical.moons.length);
        expect(report!.worlds[0].bodyKey).toBe(physical.planet.bodyKey);
        for (const world of report!.worlds) {
          const spans = world.irradiance.intervalsCovered.length;
          expect(world.irradiance.intervals).toBe(spans);
          expect(world.irradiance.yearsCovered).toBeGreaterThanOrEqual(0);
          expect(world.habitability).toBe('UNKNOWN');
          expect(world.lifePresence).toBe('NOT_EVALUATED');
          expect(world.pressure).toBe('UNKNOWN');
          expect(world.waterMass).toBe('UNKNOWN');
          expect(world.radiation).toBe('UNKNOWN');
          expect(world.thermal).toBe('UNKNOWN_NO_DATED_THERMAL_BOUNDARY');
          expect(world.playerVisible).toBe(false);
        }
        expect(PlanetaryAutomaticHistoricalCoverage31Fi5.fromMaterialized(
          physical, undefined, attached.mock.calls.at(-1)?.[5],
        )).toEqual(report);
        // Run real chain 32.12 -> 31.7 -> 31.8 -> 31.9; without dated
        // independent thermal forcing 31.F.h cannot invent windows.
        const request = { context: physical.planet.source.context,
          version: { universeKey:'actual-v2-physical-fi5', physicsModelRevision:'31Fi5',
            sourceRevision:'materialized-episode-catalog-fi5' },
          startYear: 0, endYear: Math.min(50_000_000, physical.ageYearsCT0) };
        const joined = PlanetaryHistoricalRuntime31Fi1.reconstructFromMaterialized(target, request);
        expect(joined.certification.certifiedContinuousIntervals).toBe(0);
        expect(joined.physical.lifePresence).toBe('NOT_EVALUATED');
        expect(joined.physical.windows.routes.every(route => route.compatibleWindows.length === 0)).toBe(true);
        expect(PlanetaryHistoricalRuntime31Fi1.reconstructFromMaterialized(target, request)).toEqual(joined);
      } else {
        expect(report).toBeNull(); // unsupported hosts stay UNKNOWN
      }
      // Report compiled from *actual* V2 materialized sources. A conditional
      // irradiance record is not certified paleo-climate. This compact JSON
      // summary can be captured from the Vitest run for the phase-31 closure.
      console.info('GENESIS_31FI5_V2_COVERAGE', JSON.stringify({
        host: kind, historicalSource: report ? 'MATERIALIZED' : 'UNKNOWN',
        sourceScope: report?.radiativeScope ?? 'UNKNOWN',
        sourceMultiplicity: report?.multiplicity ?? 'UNKNOWN',
        gapReasons: physical?.planet.gaps.map(g => g.reason) ?? [],
        sourceMassSolar: attached.mock.calls.at(-1)?.[4]?.physical.initialMassSolar ?? null,
        bodies: report?.worlds.map(w => ({kind:w.bodyKind,key:w.bodyKey,
          irradianceYears:w.irradiance.yearsCovered,
          irradiationUnknownYears:w.irradiance.unknown.reduce((n,i)=>n+i.endYear-i.startYear+1,0),
          atmosphere:w.pressure,water:w.waterMass,radiation:w.radiation,
          thermal:w.thermal,habitability:w.habitability})) ?? [],
        certification:'NOT_CERTIFIED',
      }));
      // The public fiche legitimately contains bigint orbital identifiers. The
      // JSON representation is used only by this test to inspect leaks; do not
      // change the production DTO or strip bigint-valued fields.
      const ficheForLeakCheck = JSON.stringify(
        fiche,
        (_key, value: unknown) => typeof value === 'bigint' ? value.toString() : value,
      );
      expect(ficheForLeakCheck).not.toMatch(
        /31\.F\.i\.5|irradiance\.intervalsCovered|historicalCompleteness|sourceRecordKey/,
      );
      const before = [newPlanets.mock.calls.length, newAtmos.mock.calls.length, newMoons.mock.calls.length];
      // Reading a private materialized report must never regenerate 19/20/21.
      PlanetaryHistoricalRuntime31Fi1.inspectAutomaticHistoricalCoverage(target);
      expect([newPlanets.mock.calls.length, newAtmos.mock.calls.length, newMoons.mock.calls.length]).toEqual(before);
    }, 120_000,
  );

  it('el informe es privado, determinista y no se puede consultar mediante un DTO clonado', () => {
    const model = fixture('SINGLE');
    const attached = vi.spyOn(PlanetaryHistoricalRuntime31Fi1, 'attach');
    const session = SystemV2SingleScientificSession.buildOrNull(model)!;
    session.planetFiche(0n);
    const target = attached.mock.calls.at(-1)![0];
    const report = PlanetaryHistoricalRuntime31Fi1.inspectAutomaticHistoricalCoverage(target);
    expect(PlanetaryHistoricalRuntime31Fi1.inspectAutomaticHistoricalCoverage({ ...target })).toBeNull();
    if (!report) return;
    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.worlds)).toBe(true);
    expect(JSON.stringify(report)).not.toContain('lifeProbability');
    expect(report.fullEnvironmentalCoverage).toBe('NOT_CERTIFIED');
    expect(report.climateHistoricalCompleteness).toBe('UNKNOWN');
    expect(report.worlds.every(w => w.bodyKey === report.worlds[0].bodyKey ||
      w.bodyKey.startsWith(report.worlds[0].bodyKey + '/M'))).toBe(true);
  }, 120_000);

  it('un sistema V2 sin confirmar no crea fichas ni revela la cobertura histórica', () => {
    const model = fixture('SINGLE', DiscoveryState.CATALOGUED);
    const attached = vi.spyOn(PlanetaryHistoricalRuntime31Fi1, 'attach');
    const session = SystemV2SingleScientificSession.buildOrNull(model);
    // CATALOGUED may allow a scientific session shell, never a planet fiche.
    if (session) expect(session.planetFiche(0n).kind).not.toBe('AVAILABLE');
    expect(attached).not.toHaveBeenCalled();
  }, 120_000);

  it('V2 compacto: su iluminación de presentación NO alimenta irradiación histórica ficticia', () => {
    let at: SystemLocator | null = null;
    for (let i = 0n; i < 5000n; i++) {
      const test = new SystemLocator(0n, 0n, i);
      const candidate = CompactHostPlanetarySystemGenerator.generateOrNull(v2, test);
      if (candidate && candidate.planets.length) { at = test; break; }
    }
    expect(at).not.toBeNull();
    const card = ArchiveV2StellarSystemCardAssembler.build(v2, at!, DiscoveryState.CONFIRMED);
    const model = {
      universeSeed: seed.serialize(), generatorVersionCode: 2,
      locatorKind: ArchiveDiscoveryLocatorKind.SYSTEM,
      galaxyIndex: at!.galaxyIndex, sectorKey: at!.sectorKey,
      galacticObjectIndex: at!.galacticObjectIndex,
      proceduralIdentity: 'compact-fi5-materialized',
      discoveryState: DiscoveryState.CONFIRMED,
      discoveryStateLabel: DiscoveryState.CONFIRMED.name,
      stellarSystemCard: card,
    } as unknown as ArchiveDiscoveryDetailModel;
    const attached = vi.spyOn(PlanetaryHistoricalRuntime31Fi1, 'attach');
    const session = SystemCompactHostScientificSession.buildOrNull(model)!;
    expect(session).not.toBeNull();
    expect(session.planetFiche(0n).kind).toBe('AVAILABLE');
    expect(session.scene.stars[0]!.sourceLuminositySolar).toBeNull();
    expect(attached).not.toHaveBeenCalled();
    console.info('GENESIS_31_FINAL_EVIDENCE',JSON.stringify({
      scenario:'COMPACT_V2',illustrationNotPhysical:true,
      datedHistory:'UNKNOWN_BY_DESIGN',certification:'NOT_CERTIFIED',
    }));
    // Compact environments are not canonical 31.F.i.3 main-sequence hosts.
    // NO historical coverage is fabricated from illustration light.
  }, 120_000);

  it('Evento real fechado: 31.F.i.3 deja de propagar la irradiación después de la interrupción',()=>{
    const sample=physicalEligible('SINGLE');
    const attached=vi.spyOn(PlanetaryHistoricalRuntime31Fi1,'attach');
    const session=SystemV2SingleScientificSession.buildOrNull(fixtureAt('SINGLE',sample.locator))!;
    expect(session.planetFiche(sample.bodyIndex).kind).toBe('AVAILABLE');
    const target=attached.mock.calls.at(-1)![0];
    const retained=PlanetaryHistoricalRuntime31Fi1.inspectPhysicalHistory(target)!;
    const materialized=attached.mock.calls.at(-1)!;
    const original=retained.planet.source.intervals[0]!;
    expect(original).toBeDefined();
    const eventYear=original.startYear+Math.min(100_000_000,original.endYear-original.startYear);
    const interrupted=PlanetaryV2DatedPhysics31Fi3.fromMaterialized({
      planet:materialized[1],moons:materialized[3]!,primary:materialized[4]!,
      unresolvedEvents:[{startYear:eventYear,endYear:eventYear,
        sourceRecordKey:'dated-real-V2-unresolved-event'}],
    });
    const report=PlanetaryAutomaticHistoricalCoverage31Fi5.fromMaterialized(interrupted);
    const world=report.worlds[0];
    expect(world.irradiance.intervalsCovered.every(i=>i.endYear<eventYear)).toBe(true);
    expect(world.interruptions.some(i=>i.startYear===eventYear &&
      i.endYear===report.ageYearsCT0 && i.reason==='UNRESOLVED_EVENT')).toBe(true);
    const unknownYears=world.irradiance.unknown.reduce((n,i)=>n+i.endYear-i.startYear+1,0);
    expect(world.irradiance.yearsCovered+unknownYears).toBe(report.ageYearsCT0+1);
    expect(world.habitability).toBe('UNKNOWN');
    expect(PlanetaryAutomaticHistoricalCoverage31Fi5.fromMaterialized(interrupted)).toEqual(report);
    console.info('GENESIS_31_FINAL_EVIDENCE',JSON.stringify({
      scenario:'EVENT_DISRUPTION',eventYear,ageYearsCT0:report.ageYearsCT0,
      irradiationStopsAt:eventYear-1,unknownFromEvent:true,deterministic:true,
      life:'NOT_EVALUATED',certification:'NOT_CERTIFIED',
    }));
  },120_000);

  it('LUNA V2 real: intervalos irradiados del satélite conservan identidad, CT-0 y límites independientes', () => {
    let selected: {at:SystemLocator; bodyIndex:bigint} | null = null;
    for (let i=0n;i<768n && !selected;i++) {
      const at=new SystemLocator(0n,0n,i);
      const source=ProceduralTargetResolver.resolveTargetSeed(v1,at);
      if (StellarSystemMultiplicitySelector.select(v1, source as Parameters<
        typeof StellarSystemMultiplicitySelector.select>[1]).name !== 'SINGLE') continue;
      const host=StellarMultihostFormation.generateV2SingleOrNull(v2,at);
      if (!host) continue;
      const evolution=host.lifetime.evolutionAssessment;
      if (host.physical.initialMassSolar<0.8 || host.physical.initialMassSolar>1.2 ||
          evolution.evolutionState.name!=='MAIN_SEQUENCE' ||
          evolution.mainSequenceLifetimeBillionYears===null ||
          evolution.mainSequenceLifetimeBillionYears*1e9<=host.lifetime.ageBillionYears*1e9) continue;
      for (let index=0;index<host.planets.length;index++) {
        const planet=host.planets[index]!;
        if (!host.moonSystems[index]?.relevantMoonCount ||
            planet.orbit.periastronAu<=0 ||
            host.lifetime.ageBillionYears*1e9<=Math.max(100_000_000,
              planet.hostPlanetarySystem.formationBlueprint.formationCompletionAgeMillionYears*1e6)) continue;
        selected={at,bodyIndex:BigInt(index)};break;
      }
    }
    expect(selected).not.toBeNull();
    if (!selected) return;
    const chosen=selected as {at:SystemLocator;bodyIndex:bigint};
    const model=fixtureAt('SINGLE',chosen.at);
    const attached=vi.spyOn(PlanetaryHistoricalRuntime31Fi1,'attach');
    const session=SystemV2SingleScientificSession.buildOrNull(model)!;
    expect(session.planetFiche(chosen.bodyIndex).kind).toBe('AVAILABLE');
    const target=attached.mock.calls.at(-1)![0];
    const report=PlanetaryHistoricalRuntime31Fi1.inspectAutomaticHistoricalCoverage(target);
    const physical=PlanetaryHistoricalRuntime31Fi1.inspectPhysicalHistory(target);
    expect(report).not.toBeNull();
    expect(physical).not.toBeNull();
    if (!report || !physical) return;
    const moon=report.worlds.find(w=>w.bodyKind==='MOON' && w.irradiance.yearsCovered>0);
    expect(moon).toBeDefined();
    if (!moon) return;
    const unknownYears=moon.irradiance.unknown.reduce((n,p)=>n+p.endYear-p.startYear+1,0);
    expect(moon.irradiance.yearsCovered+unknownYears).toBe(report.ageYearsCT0+1);
    expect(physical.moons.some(m=>m.bodyKey===moon.bodyKey)).toBe(true);
    expect(moon.bodyKey.startsWith(report.worlds[0].bodyKey+'/M')).toBe(true);
    expect(moon.pressure).toBe('UNKNOWN');
    expect(moon.waterMass).toBe('UNKNOWN');
    expect(moon.radiation).toBe('UNKNOWN');
    expect(moon.habitability).toBe('UNKNOWN');
    expect(PlanetaryHistoricalRuntime31Fi1.inspectAutomaticHistoricalCoverage({...target})).toBeNull();
    console.info('GENESIS_31_FINAL_EVIDENCE',JSON.stringify({
      scenario:'LUNAR_V2',parentKey:report.worlds[0].bodyKey,moonKey:moon.bodyKey,
      ageYearsCT0:report.ageYearsCT0,irradianceYears:moon.irradiance.yearsCovered,
      unknownYears,radiativeScope:report.radiativeScope,environment:'UNKNOWN_BY_DESIGN',
      life:'NOT_EVALUATED',certification:report.fullEnvironmentalCoverage,private:true,
    }));
  },120_000);

  it('Permisos V2: CATALOGUED bloquea fichas y las copias no heredan el informe privado',()=>{
    const candidate=fixture('SINGLE',DiscoveryState.CATALOGUED);
    const attachLocked=vi.spyOn(PlanetaryHistoricalRuntime31Fi1,'attach');
    const locked=SystemV2SingleScientificSession.buildOrNull(candidate);
    if (locked) expect(locked.planetFiche(0n).kind).not.toBe('AVAILABLE');
    expect(attachLocked).not.toHaveBeenCalled();
    vi.restoreAllMocks();
    const attached=vi.spyOn(PlanetaryHistoricalRuntime31Fi1,'attach');
    const confirmed=SystemV2SingleScientificSession.buildOrNull(fixture('SINGLE'))!;
    const fiche=confirmed.planetFiche(0n);
    expect(fiche.kind).toBe('AVAILABLE');
    const target=attached.mock.calls.at(-1)![0];
    const report=PlanetaryHistoricalRuntime31Fi1.inspectAutomaticHistoricalCoverage(target);
    expect(PlanetaryHistoricalRuntime31Fi1.inspectAutomaticHistoricalCoverage({...target})).toBeNull();
    const serialized=JSON.stringify(fiche,(_key,value:unknown)=>typeof value==='bigint'?value.toString():value);
    expect(serialized).not.toMatch(/sourceRecordKey|intervalsCovered|historicalCompleteness|31\.F\.i\.5/);
    console.info('GENESIS_31_FINAL_EVIDENCE',JSON.stringify({
      scenario:'PERMISSIONS_V2',lockedDenied:true,privateNotSerialized:true,
      copiedTargetCannotAccess:true,coverageStatus:report?'MATERIALIZED':'UNKNOWN_BY_DESIGN',
    }));
  },120_000);

});
