/**
 * PRE-33.03a.2b.3b — revised-physics historical source bridge.
 * Actual 27/31 compact remnant projection + bounded versioned 32.12 history
 * source. This does NOT fabricate 29 explosions, stellar transitions,
 * planet exposures, orbital mass-loss history or observation records.
 * The public V3 release remains blocked until these sources are resolved.
 */
import type { StellarV3PhysicalEpoch } from '../../domain/stellar/stellar-v3-physical-epoch';
import { StellarV3PhysicalEpochEngine } from './stellar-v3-physical-epoch';
import { coevalPlanetFormationEpisodePRE33 } from '../planetary-history/planetary-coeval-formation-history-source-pre33';
import type { SystemLocator } from '../../domain/generation/procedural-locator';
import type { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import type { PlanetaryHistorySourceEpisode32_1 } from '../../domain/planetary-history/planetary-history-32-1';
import type { PlanetaryHistoryIntervalSource32_12, PlanetaryHistoryIntervalResult32_12 } from '../../domain/planetary-history/planetary-history-interval-32-12';
import { PlanetaryHistoryIntervalEngine32_12 } from '../planetary-history/planetary-history-interval-engine-32-12';
import { StellarNeutronStarEngine } from './stellar-neutron-star-engine';
import { StellarBlackHoleEngine } from './stellar-black-hole-engine';
import { StellarMultihostFormation } from './stellar-multihost-formation';
import { frozenMultihostDigestPRE3303A2B3 } from './stellar-multihost-activation-pre33-03a2b3';
import { StellarMultihostFreshCandidatePRE3303A2B3A as Fresh } from './stellar-multihost-fresh-candidate-pre33-03a2b3a';
import { MULTIHOST_FRESH_COEVAL_CANDIDATE_PRE3303A2B3A as FRESH_TOKEN } from
  '../../domain/stellar/stellar-multihost-fresh-candidate-pre33-03a2b3a';
import { MULTIHOST_HISTORICAL_BRIDGE_PRE3303A2B3B as TOKEN,
  type HistoricalBridgeManifestPRE3303A2B3B as Manifest,
  type HistoricalRemnantPRE3303A2B3B as Remnant,
  type HistoricalDependencyPRE3303A2B3B as Dependency,
} from '../../domain/stellar/stellar-multihost-historical-bridge-pre33-03a2b3b';

function reject(msg: string): never { throw new RangeError(`PRE33_03A2B3B_${msg}`); }
function bodyKey(namespace: string, index: number): string { return `${namespace}/B${index}`; }
/** A compact remnant with a physically modelled terminal epoch has a dated
 * stellar state transition. This is NOT a supernova light curve, explosion
 * energy, impulse, planetary exposure, or reconstructed phase-29 event.
 * Ignore transitions occurring before a particular planet formed. */
export function remnantFormationEpisodesPRE3303A2B3B(
  namespace: string, target: string, formationAgeYears: number,
  presentYear: number,
  profiles: readonly Remnant[],
): readonly PlanetaryHistorySourceEpisode32_1[] {
  if (!namespace || !target || !Number.isSafeInteger(formationAgeYears) ||
      formationAgeYears < 0 || !Number.isSafeInteger(presentYear) ||
      !Array.isArray(profiles)) {
    return reject('INVALID_REMNANT_FORMATION_SOURCE_CONTEXT');
  }
  const episodes: PlanetaryHistorySourceEpisode32_1[] = [];
  for (const r of profiles) {
    if (r.remnantType !== 'NEUTRON_STAR' && r.remnantType !== 'STELLAR_BLACK_HOLE') continue;
    if (r.status !== 'PROJECTED_CT0_FROM_REVISED_SOURCE' ||
        !Number.isFinite(r.remnantMassSolar) || r.remnantMassSolar! <= 0 ||
        r.sourceFormationAgeGyr === null) {
      return reject('NON_PHYSICAL_COMPACT_REMNANT_SOURCE');
    }
    const year = Math.round(r.sourceFormationAgeGyr * 1e9);
    if (!Number.isSafeInteger(year) || year > presentYear || year < 0) {
      return reject('COMPACT_REMNANT_DATE_OUTSIDE_COEVAL_CT0');
    }
    if (year < formationAgeYears) continue;
    const phase = r.remnantType === 'NEUTRON_STAR' ? '27.4' : '27.1';
    episodes.push(Object.freeze({
      episodeKey: `${namespace}/${target}/${r.component}/REMANENT_FORMATION/${year}`,
      targetBodyKind: 'PLANET' as const, targetBodyKey: target,
      kind: 'STELLAR_ENVIRONMENT_CHANGE' as const,
      time: Object.freeze({timeScale: 'YEARS_SINCE_SYSTEM_FORMATION' as const,
        startYear: year, endYear: year, resolution: 'MODELLED_INSTANT' as const}),
      source: Object.freeze({sourcePhase: phase, sourceModel: 'REVISED_COEVAL_TERMINAL_STATE',
        sourceRecordKey: `${namespace}/STELLAR/${r.component}/${phase}/${year}`,
        evidenceKind: 'RESOLVED_PHYSICAL_EVENT' as const}),
      causedByEpisodeKeys: Object.freeze([]),
    }));
  }
  return Object.freeze(episodes);
}


type FreshGraph = NonNullable<ReturnType<typeof Fresh.materializeOrNull>>['experimentalGraph'];
export interface HistoricalSourceBridgePRE3303A2B3B {
  readonly manifest: Manifest;
  /** Strict CT-0 current-mass and orbital provenance; never a public V3. */
  readonly physicalEpoch: StellarV3PhysicalEpoch;
  /** Experimental graph, never a public or saved universe. */
  readonly candidate: FreshGraph;
  readonly readHistoryWindow: (publicPlanetOrdinal: number, startYear: number,
    endYear: number) => PlanetaryHistoryIntervalResult32_12;
}

/**
 * Source-backed adapter: these empty catalogs mean "no dated records provided",
 * NOT "no stellar events ever happened". A later phase-29/32 generator must
 * inject real episodes with physical provenance, for this exact revision.
 */
export class StellarMultihostHistoricalBridgePRE3303A2B3B {
  private constructor() {}
  static prepareOrNull(key: UniverseGenerationKey, locator: SystemLocator,
    explicitToken: typeof TOKEN): HistoricalSourceBridgePRE3303A2B3B | null {
    if (explicitToken !== TOKEN || key.generatorVersion !== GeneratorVersion.V2) {
      return reject('REQUIRES_EXPLICIT_ISOLATED_REVISION_AND_FROZEN_V2_REFERENCE');
    }
    const legacy = StellarMultihostFormation.generateOrNull(key, locator);
    if (!legacy) return null;
    const digestBefore = frozenMultihostDigestPRE3303A2B3(legacy);
    const fresh = Fresh.materializeOrNull(key, locator, FRESH_TOKEN);
    if (!fresh) return reject('COEVAL_FRESH_SOURCE_MISSING');
    const candidate = fresh.experimentalGraph;
    const age = candidate.components[0]!.lifetime.ageBillionYears;
    if (!Number.isFinite(age) || age < 0 || age > 13.8 ||
      candidate.components.some(c => Math.abs(c.lifetime.ageBillionYears - age) > 1e-9)) {
      return reject('COEVAL_SOURCE_AGE_INVALID');
    }
    const remnantProfiles: Remnant[] = candidate.components.map(c => {
      const star = c.stellarSystem.primaryStar;
      const state = star.evolutionState.name;
      const neutron = StellarNeutronStarEngine.fromExistingStar(star, c.physical, c.lifetime);
      const hole = StellarBlackHoleEngine.fromExistingStar(star, c.physical, c.lifetime);
      if (neutron && hole) return reject('MUTUALLY_EXCLUSIVE_REMNANTS');
      const kind: Remnant['remnantType'] = neutron ? 'NEUTRON_STAR' : hole ? 'STELLAR_BLACK_HOLE' :
        state === 'WHITE_DWARF' ? 'WHITE_DWARF' : 'NONE';
      return Object.freeze({component: c.label, state,
        sourceFormationAgeGyr: neutron?.formationAgeBillionYears ?? hole?.formationAgeBillionYears ??
          (state === 'WHITE_DWARF' ? c.lifetime.terminalAgeBillionYears : null),
        remnantType: kind, remnantMassSolar: neutron?.massSolar ?? hole?.massSolar ?? null,
        status: (neutron || hole ? 'PROJECTED_CT0_FROM_REVISED_SOURCE' :
          kind === 'WHITE_DWARF' ? 'WHITE_DWARF_MASS_MODEL_NOT_RESOLVED' :
          'NOT_APPLICABLE') as Remnant['status'],
        datedTransientReconstructed: false as const});
    });
    const namespace = `PRE33-V3-CANDIDATE/${key.universeSeed.normalizedValue}/${fresh.manifest.parentSystemKey}`;
    // New 17.7 source episodes require a distinct cache and history revision.
    const revision = `${TOKEN}/FORMATION_17_7_v2/${fresh.manifest.candidateSnapshotDigest}`;
    const presentYear = Math.round(age * 1e9);
    if (!Number.isSafeInteger(presentYear)) return reject('INVALID_SYSTEM_AGE_YEARS');
    const datedByTarget = new Map<string, readonly PlanetaryHistorySourceEpisode32_1[]>();
    let backedFormationEvents = 0;
    let planetsWithUnfinishedFormation = 0;
    for (let i = 0; i < candidate.publicPlanets.length; i++) {
      const entry = candidate.publicPlanets[i]!;
      const name = bodyKey(namespace, i);
      const completion = Math.round(
        entry.planet.hostPlanetarySystem.formationBlueprint.formationCompletionAgeMillionYears * 1e6);
      // Candidate generation 18/19 can retain a mature planet even when its
      // 17.7 formation completion falls after the revised system CT-0. That is
      // a genuine release blocker, not a reason to invent a pre-formation history.
      if (completion > presentYear) planetsWithUnfinishedFormation++;
      // Materialized candidates are mature: never backdate a future planet.
      // A physical 17.7 formation estimate is source-backed but still inferred.
      if (completion > presentYear) return reject('FRESH_CANDIDATE_CONTAINS_FUTURE_MATURE_PLANET');
      const formation = coevalPlanetFormationEpisodePRE33(namespace, name, i,
        entry.planet.hostPlanetarySystem.formationBlueprint, presentYear);
      const terminal = remnantFormationEpisodesPRE3303A2B3B(
        namespace, name, completion, presentYear, remnantProfiles);
      const dated = Object.freeze([formation, ...terminal]);
      datedByTarget.set(name, dated);
      backedFormationEvents += terminal.length;
    }
    const source: PlanetaryHistoryIntervalSource32_12 = {
      revision: () => revision,
      readInterval: (context, start, end, max) => {
        const dated = datedByTarget.get(context.bodyKey);
        if (context.bodyKind !== 'PLANET' || !dated) return reject('FOREIGN_HISTORY_TARGET');
        return dated.filter(event => event.time.startYear <= end && event.time.endYear >= start)
          .slice(0, max);
      },
      readByKey: (context, episodeKey) => {
        const dated = datedByTarget.get(context.bodyKey);
        if (context.bodyKind !== 'PLANET' || !dated) return reject('FOREIGN_HISTORY_TARGET');
        return dated.find(event => event.episodeKey === episodeKey) ?? null;
      },
    };
    const engine = new PlanetaryHistoryIntervalEngine32_12(source, {maxCachedWindows: 0});
    const readHistoryWindow = (index: number, startYear: number, endYear: number) => {
      if (!Number.isSafeInteger(index) || index < 0 || index >= candidate.publicPlanets.length) {
        return reject('FOREIGN_PUBLIC_PLANET_ORDINAL');
      }
      return engine.read({context: {bodyKind: 'PLANET', bodyKey: bodyKey(namespace, index),
        multiplicity: candidate.multiplicity.name as 'BINARY' | 'TRIPLE',
        time: {kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: age}},
        version: {universeKey: namespace, physicsModelRevision: TOKEN, sourceRevision: revision},
        startYear, endYear});
    };
    // Rebuild the 32.12 query path for each new public planet (no legacy source).
    const finalYear = presentYear;
    for (let i = 0; i < candidate.publicPlanets.length; i++) {
      const result = readHistoryWindow(i, 0, finalYear);
      if (result.chronology.bodyKey !== bodyKey(namespace, i) ||
        result.chronology.multiplicity !== candidate.multiplicity.name ||
        result.chronology.episodes.length !== datedByTarget.get(bodyKey(namespace, i))!.length ||
        result.chronology.episodes.filter(e => e.kind === 'FORMATION').length !== 1 ||
        result.chronology.episodes.some(e => !((e.kind === 'FORMATION' &&
          e.source.sourceModel === 'PROTOPLANETARY_MATURATION_BLUEPRINT') ||
          (e.kind === 'STELLAR_ENVIRONMENT_CHANGE' &&
          e.source.sourceModel === 'REVISED_COEVAL_TERMINAL_STATE'))) ||
        result.historicalCompleteness !== 'NOT_ESTABLISHED') {
        return reject('HISTORY_SOURCE_REVISION_OR_IDENTITY_MISMATCH');
      }
    }
    const digestAfter = frozenMultihostDigestPRE3303A2B3(legacy);
    if (digestBefore !== digestAfter) return reject('FROZEN_V2_MUTATED');
    const dependencies: Dependency[] = [
      {key:'REVISED_STAR_AND_LIFETIME_14_15',status:'MATERIALIZED',
        detail:'New A/B/C stars have coeval ages and phase 14.8 lifetime profiles.'},
      {key:'REGENERATED_KEPLER_ORBITS_16',status:'MATERIALIZED',
        detail:'Fresh Kepler reference orbits; not historical mass-loss evolution.'},
      {key:'REBUILT_PLANETS_ATMOSPHERES_MOONS_18_21',
        status: planetsWithUnfinishedFormation > 0 ? 'UNRESOLVED_RELEASE_BLOCKER' : 'MATERIALIZED',
        detail: planetsWithUnfinishedFormation > 0
          ? `${planetsWithUnfinishedFormation} generated mature planets have a formation completion AFTER revised CT-0.`
          : 'Fresh 18–21 objects and 19.5 mass checks from preceding candidate.'},
      {key:'COMPACT_REMNANT_CT0_27_31',status:'VALIDATED_SOURCE_INTERFACE_HISTORY_NOT_COMPLETE',
        detail:'Uses real 27.1/27.4 present remnant projectors. WD mass and historical formation events unresolved.'},
      {key:'EVOLVED_STELLAR_RADIATION_AND_MASS_15',status:'UNRESOLVED_RELEASE_BLOCKER',
        detail:'Present evolved luminosity/spectrum and mass loss cannot be inferred from 15.1 baseline.'},
      {key:'HISTORICAL_ORBIT_MASS_LOSS_16',status:'UNRESOLVED_RELEASE_BLOCKER',
        detail:'No dated wind/collapse mass-loss orbital integration or recoil sources.'},
      {key:'TRANSIENT_EVENTS_EXPOSURES_RESPONSES_29_31_32_9',status:'UNRESOLVED_RELEASE_BLOCKER',
        detail:'CT0 remnant projection is not an actual dated collapse, radiation exposure or planetary effect.'},
      {key:'SOURCE_BACKED_32_7_32_12_EVENTS',status:'VALIDATED_SOURCE_INTERFACE_HISTORY_NOT_COMPLETE',
        detail:'New revision-scoped 32.12 reads include source-backed 17.7 formation intervals and dated 27.1/27.4 terminal states when present. Phase-29 transients, orbital responses and 32.9 consequences remain unresolved.'},
      {key:'PUBLIC_GENERATOR_VERSION_AND_PERSISTENCE',status:'UNRESOLVED_RELEASE_BLOCKER',
        detail:'No V3 public generator, atomic full physics route, new-game DB schema or player migration.'},
    ];
    const manifest: Manifest = Object.freeze({contract: TOKEN, physicalNamespace: namespace,
      originGenerator:'V2_REFERENCE_ONLY' as const, sharedSystemAgeGyr: age,
      revisedComponentAgesGyr: Object.freeze(candidate.components.map(c=>c.lifetime.ageBillionYears)),
      remnantProfiles: Object.freeze(remnantProfiles), planetCount: candidate.publicPlanets.length,
      history32_12WindowsValidated: candidate.publicPlanets.length,
      compactFormationEpisodes32_12: backedFormationEvents,
      planetsWithUnfinishedFormation,
      missingDatedPhysicalEpisodeSources: candidate.publicPlanets.length,
      dependencies: Object.freeze(dependencies.map(d=>Object.freeze(d))),
      legacyDigestBefore:digestBefore, legacyDigestAfter:digestAfter,
      legacyMutated:false as const, gamePublicationAllowed:false as const,
      canonicalMigrationPerformed:false as const, waterCT0Certified:false as const,
      status:'REBUILT_CT0_AND_HISTORY_INTERFACE_PUBLICATION_BLOCKED' as const});
    const preview = Object.freeze({manifest, candidate, readHistoryWindow});
    const physicalEpoch = StellarV3PhysicalEpochEngine.inspect(preview);
    return Object.freeze({...preview, physicalEpoch});
  }
  /**
   * Opt-in handoff for a GENUINE separately rebuilt 29/32 catalog.
   * This function NEVER synthesizes an event or accepts a V2 historical catalog.
   * Every supplied record must belong to the new candidate and have an explicit
   * provenance/date; 32.1/32.12 check identities, chronology and causal closure.
   * A bound catalog still does NOT imply historical completeness or V3 release.
   */
  static readBoundPhysicalHistory(
    bridge: HistoricalSourceBridgePRE3303A2B3B,
    binding: {readonly candidateDigest: string; readonly sourceRevision: string;
      readonly source: PlanetaryHistoryIntervalSource32_12},
    planetOrdinal: number, startYear: number, endYear: number,
  ): PlanetaryHistoryIntervalResult32_12 {
    const {manifest, candidate} = bridge;
    if (!manifest || manifest.contract !== TOKEN ||
        binding?.candidateDigest !== frozenMultihostDigestPRE3303A2B3(candidate) ||
        typeof binding.sourceRevision !== 'string' || !binding.sourceRevision.startsWith(`${TOKEN}/`) ||
        !binding.source || !Number.isSafeInteger(planetOrdinal) ||
        planetOrdinal < 0 || planetOrdinal >= candidate.publicPlanets.length) {
      return reject('FOREIGN_OR_STALE_EVENT_CATALOG_BINDING');
    }
    const context = {bodyKind: 'PLANET' as const,
      bodyKey:bodyKey(manifest.physicalNamespace,planetOrdinal),
      multiplicity: candidate.multiplicity.name as 'BINARY' | 'TRIPLE',
      time: {kind:'CURRENT_SNAPSHOT' as const,systemAgeBillionYears:manifest.sharedSystemAgeGyr}};
    // An empty or partial source can be queried but cannot certify historical
    // completeness, even if all returned episodes are physically valid.
    const engine = new PlanetaryHistoryIntervalEngine32_12(binding.source,{maxCachedWindows:0});
    const window = engine.read({context,version:{universeKey:manifest.physicalNamespace,
      physicsModelRevision:TOKEN,sourceRevision:binding.sourceRevision},startYear,endYear});
    if (window.chronology.bodyKey !== context.bodyKey ||
        window.chronology.multiplicity !== context.multiplicity ||
        window.chronology.historicalCompleteness !== 'NOT_ESTABLISHED') {
      return reject('BOUND_HISTORY_IDENTITY_OR_COMPLETENESS_MISMATCH');
    }
    return window;
  }

  static publishNewUniverse(): never {
    return reject('29_31_32_EVENTS_ORBITAL_EVOLUTION_AND_PUBLIC_GENERATOR_NOT_IMPLEMENTED');
  }
}
