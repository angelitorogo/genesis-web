import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import type { GeneratedMultipleHost } from './stellar-multihost-formation';
import { StellarMultihostCoEvalRevisionPRE3303A2B2 } from './stellar-multihost-coeval-revision-pre33-03a2b2';
import { MULTIHOST_COEVAL_REVISION_PRE3303A2B2 } from '../../domain/stellar/stellar-multihost-coeval-revision-pre33-03a2b2';
import {
  MULTIHOST_ACTIVATION_CONTRACT_PRE3303A2B3 as CONTRACT,
  MULTIHOST_LEGACY_BRANCH_PRE3303A2B3 as LEGACY,
  MULTIHOST_REVIEW_BRANCH_PRE3303A2B3 as PREVIEW,
  type MultihostActivationPlanPRE3303A2B3 as Plan,
  type MultihostDependencyGatePRE3303A2B3 as Gate,
  type MultihostPhysicsBranchPRE3303A2B3 as Branch,
  type MultihostScientificSelectionPRE3303A2B3 as Selection,
} from '../../domain/stellar/stellar-multihost-activation-pre33-03a2b3';

const labelsFor = (n: number): string => n === 2 ? 'AB' : n === 3 ? 'ABC' : '';
const keyFor = (mult: GeneratedMultipleHost): string =>
  `G${mult.parentLocator.galaxyIndex}/S${mult.parentLocator.sectorKey}/O${mult.parentLocator.galacticObjectIndex}`;
const keyForBody = (mult: GeneratedMultipleHost, i: number): string => `${keyFor(mult)}/B${i}`;
const fingerprint = (value: unknown): string => bytesToHex(sha256(utf8ToBytes(JSON.stringify(value))));

/** Fingerprint is tied to public identities AND their original physical dependents.
 * It cannot be used as a migration signature for a new physics branch. */
export function frozenMultihostDigestPRE3303A2B3(mult: GeneratedMultipleHost): string {
  if (mult.parentGenerationKey.generatorVersion !== GeneratorVersion.V2 ||
      !labelsFor(mult.components.length) ||
      mult.components.map(c => c.label).join('') !== labelsFor(mult.components.length)) {
    throw new RangeError('PRE33A2B3_REQUIRES_CANONICAL_V2_MULTIPLE');
  }
  const bodyKeys = new Set<string>();
  for (let i = 0; i < mult.publicPlanets.length; i++) {
    const entry = mult.publicPlanets[i]!;
    const loc = entry.publicLocator;
    const pk = keyForBody(mult, i);
    if (String(loc.galaxyIndex) !== String(mult.parentLocator.galaxyIndex) ||
        String(loc.sectorKey) !== String(mult.parentLocator.sectorKey) ||
        String(loc.galacticObjectIndex) !== String(mult.parentLocator.galacticObjectIndex) ||
        loc.bodyIndex !== BigInt(i) || bodyKeys.has(pk) ||
        !['A','B','C','AB'].includes(entry.host) ||
        (entry.host === 'C' && mult.components.length !== 3) ||
        entry.atmosphere.hostPlanet !== entry.planet ||
        entry.moonSystem.hostPlanet !== entry.planet) {
      throw new RangeError('PRE33A2B3_FOREIGN_OR_MIXED_LEGACY_DEPENDENCIES');
    }
    bodyKeys.add(pk);
  }
  if (mult.components.length === 2 && mult.outerOrbit !== null ||
      mult.components.length === 3 && mult.outerOrbit === null) {
    throw new RangeError('PRE33A2B3_INVALID_MULTIPLE_ORBIT_HIERARCHY');
  }
  return fingerprint({
    contract: CONTRACT, seed: mult.parentGenerationKey.universeSeed.normalizedValue,
    sourceSeed: mult.parentSystemSeedHex, system: keyFor(mult),
    stars: mult.components.map(c => [c.label, c.internalGenerationKey.universeSeed.normalizedValue,
      c.physical.initialMassSolar, c.physical.luminositySolar,
      c.lifetime.ageBillionYears, c.lifetime.evolutionAssessment.evolutionState.name]),
    inner: [mult.innerOrbit.semiMajorAxisAu, mult.innerOrbit.eccentricity],
    outer: mult.outerOrbit && [mult.outerOrbit.semiMajorAxisAu, mult.outerOrbit.eccentricity],
    bodies: mult.publicPlanets.map((e, i) => [keyForBody(mult, i), e.host,
      e.sourcePlanetOrdinal, e.planet.planetOrdinal, e.planet.orbit.semiMajorAxisAu,
      e.planet.orbit.eccentricity, e.planet.physicalProperties.massEarth,
      e.planet.internalComposition?.silicateInteriorMassEarth ?? null,
      e.planet.internalComposition?.condensedIceMassEarth ?? null,
      e.atmosphere.bulkProperties?.surfacePressurePascal ?? null,
      e.atmosphere.bulkProperties?.gasComponents ?? null,
      e.moonSystem.moonIdentities?.map(m => m.moonOrdinal) ?? null,
      e.moonSystem.relevantMoons?.map(m => [m.moonOrdinal, m.physicalProperties.massEarth]) ?? null]),
  });
}

/** A pure versioned plan. No side effect on GeneratorVersion, V2, Dexie or 32.12. */
export class StellarMultihostActivationPlannerPRE3303A2B3 {
  private constructor() {}
  static plan(mult: GeneratedMultipleHost): Plan {
    const digest = frozenMultihostDigestPRE3303A2B3(mult);
    const revision = StellarMultihostCoEvalRevisionPRE3303A2B2.fromFrozenSource(
      mult, MULTIHOST_COEVAL_REVISION_PRE3303A2B2);
    if (revision.systemKey !== keyFor(mult) || revision.parentGenerationVersion !== 'V2') {
      throw new RangeError('PRE33A2B3_REVISED_STELLAR_LINEAGE_MISMATCH');
    }
    const deps: Gate[] = [
      {dependency: 'STELLAR_14_8_15_3', status: revision.coevalPhysicsRecomputed ?
        'RECOMPUTED_PREVIEW' : 'NOT_REBUILT_FOR_NEW_BRANCH',
        explanation: '14.8 and revised lifetimes recomputed; NOT a new Star/15.1/15.2 gameplay aggregate.'},
      {dependency: 'REMNANTS_29_31', status: 'NOT_REBUILT_FOR_NEW_BRANCH',
        explanation: 'Compact progenitor events, remnants and accretion must be regenerated at the common age.'},
      {dependency: 'MULTIHOST_ORBITS_16', status: 'NOT_REBUILT_FOR_NEW_BRANCH',
        explanation: '16.x Kepler elements are old references; no evolution from revised mass-loss history.'},
      {dependency: 'PLANETS_18_19', status: 'NOT_REBUILT_FOR_NEW_BRANCH',
        explanation: 'Private formation scopes and planet bulk states belong to frozen V2 physical sources.'},
      {dependency: 'ATMOSPHERES_20', status: 'NOT_REBUILT_FOR_NEW_BRANCH',
        explanation: '20.x atmosphere/climate and H2O must be rebuilt consistently with new stellar history.'},
      {dependency: 'MOONS_21', status: 'NOT_REBUILT_FOR_NEW_BRANCH',
        explanation: '21.x satellite environments and source planet identities must be rebuilt together.'},
      {dependency: 'HISTORICAL_EVENTS_32_12', status: 'NOT_REBUILT_FOR_NEW_BRANCH',
        explanation: '32.7/32.12 histories must be recreated from source events, never retroactively redated.'},
      {dependency: 'OBSERVED_AND_PERSISTED_IDENTITIES', status: 'NOT_REBUILT_FOR_NEW_BRANCH',
        explanation: 'A new public GeneratorVersion plus separate keyspace/explicit migration is required.'},
    ];
    return Object.freeze({contractVersion: CONTRACT, systemKey: keyFor(mult),
      parentUniverseSeed: mult.parentGenerationKey.universeSeed.normalizedValue,
      legacyGeneratorVersion: 'V2' as const,
      parentSystemSeedHex: mult.parentSystemSeedHex,
      originalSnapshotDigest: digest,
      revision, dependencies: Object.freeze(deps.map(x => Object.freeze(x))),
      legacyBodyKeys: Object.freeze(mult.publicPlanets.map((_, i) => keyForBody(mult, i))),
      originalPlanetCount: mult.publicPlanets.length,
      originalAtmosphereCount: mult.publicPlanets.length,
      originalMoonSystemCount: mult.publicPlanets.length,
      revisedStellarComponentCount: revision.components.length,
      phaseChanges: Object.freeze(revision.components.filter(c => c.phaseChanged).map(c => c.label)),
      status: revision.coevalPhysicsRecomputed ? 'SCIENTIFIC_PREVIEW_AVAILABLE' as const :
        'STELLAR_REVISION_INVALID' as const,
      canonicalCutover: 'BLOCKED_UNTIL_ATOMIC_DEPENDENCY_REGENERATION_AND_PUBLIC_VERSION' as const,
      readOnlyScientificPreview: true as const,
      legacyGeneratorUntouched: true as const,
      savedPlayerKnowledgeUntouched: true as const,
      certifiedCT0Oceans: false as const,
    });
  }
}

/** Ephemeral explicit activation of SCIENTIFIC STELLAR PREVIEW only.
 * Selects revised lifetimes without routing planets/atmospheres/history from
 * the frozen branch into them. Does NOT write IndexedDB or a saved-game flag.
 * Restoring legacy is immediate and exact. No implicit global default change.
 */
export class StellarMultihostActivationSessionPRE3303A2B3 {
  private readonly selected = new Map<string, {digest: string; plan: Plan}>();

  activateScientificPreview(mult: GeneratedMultipleHost, plan: Plan,
    requested: typeof PREVIEW): Selection {
    if (requested !== PREVIEW || plan.contractVersion !== CONTRACT ||
        plan.status !== 'SCIENTIFIC_PREVIEW_AVAILABLE' ||
        plan.systemKey !== keyFor(mult) ||
        plan.parentUniverseSeed !== mult.parentGenerationKey.universeSeed.normalizedValue ||
        plan.parentSystemSeedHex !== mult.parentSystemSeedHex ||
        plan.originalSnapshotDigest !== frozenMultihostDigestPRE3303A2B3(mult) ||
        plan.revision.contractVersion !== MULTIHOST_COEVAL_REVISION_PRE3303A2B2 ||
        plan.revision.gameCutoverActivated ||
        plan.revision.components.some(c => c.revisedAgeBillionYears !== plan.revision.sharedFormationAgeBillionYears) ||
        plan.dependencies.some(d => d.dependency !== 'STELLAR_14_8_15_3' &&
          d.status === 'RECOMPUTED_PREVIEW')) {
      throw new RangeError('PRE33A2B3_INVALID_OR_STALE_PREVIEW_ACTIVATION');
    }
    // Defensive re-evaluation: a forged plan cannot bypass the canonical source.
    const rerun = StellarMultihostActivationPlannerPRE3303A2B3.plan(mult);
    if (fingerprint(rerun) !== fingerprint(plan)) {
      throw new RangeError('PRE33A2B3_PLAN_PROVENANCE_NOT_REPRODUCIBLE');
    }
    this.selected.set(plan.systemKey, {digest: plan.originalSnapshotDigest, plan});
    return this.resolve(mult, PREVIEW);
  }

  resolve(mult: GeneratedMultipleHost, requested: Branch = LEGACY): Selection {
    const branch = requested === PREVIEW ? PREVIEW : requested === LEGACY ? LEGACY : null;
    if (!branch) throw new RangeError('PRE33A2B3_UNKNOWN_PHYSICAL_BRANCH');
    const systemKey = keyFor(mult);
    const selection = branch === PREVIEW ? this.selected.get(systemKey) : undefined;
    if (branch === PREVIEW && (!selection ||
        selection.digest !== frozenMultihostDigestPRE3303A2B3(mult))) {
      throw new RangeError('PRE33A2B3_PREVIEW_NOT_ACTIVE_FOR_THIS_SOURCE');
    }
    return Object.freeze({contractVersion: CONTRACT, branch,
      systemKey, revisedStellarComponents: branch === PREVIEW ? selection!.plan.revision.components : null,
      planetSnapshots: branch === PREVIEW ? 'UNAVAILABLE_IN_PREVIEW' as const : 'FROZEN_V2_ONLY' as const,
      phase32History: branch === PREVIEW ? 'UNAVAILABLE_IN_PREVIEW' as const : 'FROZEN_V2_ONLY' as const,
      persistentWrite: false as const, ct0OceansCertified: false as const});
  }

  deactivate(mult: GeneratedMultipleHost): Selection {
    this.selected.delete(keyFor(mult));
    return this.resolve(mult, LEGACY);
  }

  /** No new public generator, dependent reconstruction, or persistence schema
   * is shipped here. Misusing a star-only preview as a saved-game migration is
   * a hard error, even if 14.8 happens not to change any coarse phase. */
  commitCanonicalMigration(_mult: GeneratedMultipleHost, _plan: Plan): never {
    throw new RangeError('PRE33A2B3_CANONICAL_ATOMIC_MIGRATION_NOT_RELEASED');
  }
}
