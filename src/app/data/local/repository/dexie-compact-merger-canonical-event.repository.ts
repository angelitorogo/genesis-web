import { DiscoveryTargetType } from '../../../domain/discovery/discovery-target-type';
import { type SystemLocator } from '../../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../../domain/generation/universe-generation-key';
import { type CompactMergerCanonicalEventRepository } from '../../../domain/repository/compact-merger-canonical-event-repository';
import { StellarSystemComponentLabel } from '../../../domain/stellar/stellar-system-component-label';
import { COMPACT_MERGER_CANONICAL_EVENT_VERSION, CompactMergerCanonicalEvent } from '../../../domain/transient/compact-merger-canonical-event';
import { CompactMergerCounterpartKind, CompactMergerEventProfile, CompactMergerMassBudgetResolution, CompactMergerRemnantKind } from '../../../domain/transient/compact-merger-event-profile';
import { CompactMergerProgenitorProfile } from '../../../domain/transient/compact-merger-progenitor';
import { CompactMergerStellarLineageStage } from '../../../domain/transient/compact-merger-stellar-lineage';
import { CompactMergerType } from '../../../domain/transient/compact-merger-type';
import { type GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import { type ProceduralTargetSeedResolver } from './dexie-discovery.repository';
import { CorruptLocalDataError, ensureUniverseExists, generationKeyStorageParts, normalizeTargetSeed } from './local-repository-support';

export const COMPACT_MERGER_CANONICAL_EVENT_OBSERVATION_KIND_V1 = 'COMPACT_MERGER_CANONICAL_EVENT_V1';
export const COMPACT_MERGER_CANONICAL_EVENT_PAYLOAD_VERSION_V1 = 1;

interface SystemIdentity { readonly universeSeed: string; readonly generatorVersionCode: number; readonly targetSeed: string; }
interface PayloadV1 {
  readonly version: typeof COMPACT_MERGER_CANONICAL_EVENT_VERSION;
  readonly primaryComponentLabelCode: number;
  readonly secondaryComponentLabelCode: number;
  readonly primaryDesignation: string;
  readonly secondaryDesignation: string;
  readonly sourceLineageStage: string;
  readonly currentStellarAgeBillionYears: number;
  readonly mergerDelayYears: number;
  readonly mergerStellarAgeBillionYears: number;
  readonly profile: {
    readonly type: string;
    readonly progenitor: {
      readonly type: string;
      readonly primaryMassSolar: number;
      readonly secondaryMassSolar: number;
      readonly neutronStarReferenceRadiusKm: number | null;
      readonly orbitalSemiMajorAxisAu: number;
      readonly orbitalEccentricity: number;
      readonly referenceInspiralYears: number;
    };
    readonly totalMassSolar: number;
    readonly chirpMassSolar: number;
    readonly massRatio: number;
    readonly symmetricMassRatio: number;
    readonly counterpartKind: string;
    readonly massBudgetResolution: string;
    readonly remnantKind: string;
    readonly remnantMassSolar: number | null;
    readonly resolvedMatterEjectaMassSolar: number | null;
    readonly resolvedRadiatedMassSolar: number | null;
  };
}

export class DexieCompactMergerCanonicalEventRepository implements CompactMergerCanonicalEventRepository {
  constructor(
    private readonly database: GenesisIndexedDb,
    private readonly targetSeedResolver: ProceduralTargetSeedResolver,
    private readonly clock: () => number = Date.now,
  ) {}

  async loadForSystem(generationKey: UniverseGenerationKey, locator: SystemLocator): Promise<readonly CompactMergerCanonicalEvent[]> {
    await ensureUniverseExists(this.database, generationKey);
    const identity = this.identity(generationKey, locator);
    const stored = await this.database.observations.get(observationId(identity));
    if (stored === undefined) return Object.freeze([]);
    if (stored.observationKind !== COMPACT_MERGER_CANONICAL_EVENT_OBSERVATION_KIND_V1 ||
        stored.payloadVersion !== COMPACT_MERGER_CANONICAL_EVENT_PAYLOAD_VERSION_V1) {
      throw new CorruptLocalDataError('Persisted compact-merger canonical-event contract mismatch.');
    }
    let parsed: unknown;
    try { parsed = JSON.parse(stored.payloadJson); }
    catch { throw new CorruptLocalDataError('Invalid compact-merger canonical-event JSON.'); }
    return Object.freeze([rehydrate(parsed)]);
  }

  async replaceForSystem(generationKey: UniverseGenerationKey, locator: SystemLocator, events: readonly CompactMergerCanonicalEvent[]): Promise<void> {
    await ensureUniverseExists(this.database, generationKey);
    if (events.length > 1) throw new RangeError('Only one inner A-B canonical compact merger is supported per system.');
    const identity = this.identity(generationKey, locator);
    const id = observationId(identity);
    await this.database.transaction('rw', this.database.universes, this.database.observations, async () => {
      await this.database.observations.delete(id);
      const event = events[0];
      if (event === undefined) return;
      await this.database.observations.put({
        id,
        universeSeed: identity.universeSeed,
        generatorVersionCode: identity.generatorVersionCode,
        targetTypeCode: DiscoveryTargetType.SYSTEM.code,
        targetSeed: identity.targetSeed,
        observationKind: COMPACT_MERGER_CANONICAL_EVENT_OBSERVATION_KIND_V1,
        payloadVersion: COMPACT_MERGER_CANONICAL_EVENT_PAYLOAD_VERSION_V1,
        payloadJson: JSON.stringify(payload(event)),
        observedAtEpochMs: this.clock(),
      });
    });
  }

  private identity(generationKey: UniverseGenerationKey, locator: SystemLocator): SystemIdentity {
    const { universeSeed, generatorVersionCode } = generationKeyStorageParts(generationKey);
    return Object.freeze({ universeSeed, generatorVersionCode,
      targetSeed: normalizeTargetSeed(this.targetSeedResolver.resolveTargetSeedNormalized(generationKey, locator)) });
  }
}

function observationId(identity: SystemIdentity): string {
  return [COMPACT_MERGER_CANONICAL_EVENT_OBSERVATION_KIND_V1, identity.universeSeed, identity.generatorVersionCode, identity.targetSeed, 'AB'].join(':');
}
function payload(event: CompactMergerCanonicalEvent): PayloadV1 {
  const p = event.profile; const g = p.progenitor;
  return {
    version: COMPACT_MERGER_CANONICAL_EVENT_VERSION,
    primaryComponentLabelCode: event.primaryComponentLabel.code,
    secondaryComponentLabelCode: event.secondaryComponentLabel.code,
    primaryDesignation: event.primaryDesignation,
    secondaryDesignation: event.secondaryDesignation,
    sourceLineageStage: event.sourceLineageStage,
    currentStellarAgeBillionYears: event.currentStellarAgeBillionYears,
    mergerDelayYears: event.mergerDelayYears,
    mergerStellarAgeBillionYears: event.mergerStellarAgeBillionYears,
    profile: {
      type: p.type,
      progenitor: {
        type: g.type,
        primaryMassSolar: g.primaryMassSolar,
        secondaryMassSolar: g.secondaryMassSolar,
        neutronStarReferenceRadiusKm: g.neutronStarReferenceRadiusKm,
        orbitalSemiMajorAxisAu: g.orbitalSemiMajorAxisAu,
        orbitalEccentricity: g.orbitalEccentricity,
        referenceInspiralYears: g.referenceInspiralYears,
      },
      totalMassSolar: p.totalMassSolar,
      chirpMassSolar: p.chirpMassSolar,
      massRatio: p.massRatio,
      symmetricMassRatio: p.symmetricMassRatio,
      counterpartKind: p.counterpartKind,
      massBudgetResolution: p.massBudgetResolution,
      remnantKind: p.remnantKind,
      remnantMassSolar: p.remnantMassSolar,
      resolvedMatterEjectaMassSolar: p.resolvedMatterEjectaMassSolar,
      resolvedRadiatedMassSolar: p.resolvedRadiatedMassSolar,
    },
  };
}
function rehydrate(value: unknown): CompactMergerCanonicalEvent {
  const d = value as Partial<PayloadV1>;
  if (d.version !== COMPACT_MERGER_CANONICAL_EVENT_VERSION || d.profile === undefined ||
      typeof d.primaryDesignation !== 'string' || typeof d.secondaryDesignation !== 'string') {
    throw new CorruptLocalDataError('Invalid compact-merger canonical-event payload.');
  }
  const p = d.profile; const g = p.progenitor;
  const type = Object.values(CompactMergerType).includes(p.type as never) ? p.type as typeof CompactMergerType[keyof typeof CompactMergerType] : null;
  const stage = Object.values(CompactMergerStellarLineageStage).includes(d.sourceLineageStage as never)
    ? d.sourceLineageStage as typeof CompactMergerStellarLineageStage[keyof typeof CompactMergerStellarLineageStage] : null;
  const counterpart = Object.values(CompactMergerCounterpartKind).includes(p.counterpartKind as never)
    ? p.counterpartKind as typeof CompactMergerCounterpartKind[keyof typeof CompactMergerCounterpartKind] : null;
  const resolution = Object.values(CompactMergerMassBudgetResolution).includes(p.massBudgetResolution as never)
    ? p.massBudgetResolution as typeof CompactMergerMassBudgetResolution[keyof typeof CompactMergerMassBudgetResolution] : null;
  const remnant = Object.values(CompactMergerRemnantKind).includes(p.remnantKind as never)
    ? p.remnantKind as typeof CompactMergerRemnantKind[keyof typeof CompactMergerRemnantKind] : null;
  if (type === null || stage === null || counterpart === null || resolution === null || remnant === null) {
    throw new CorruptLocalDataError('Unknown compact-merger enum.');
  }
  const progenitor = new CompactMergerProgenitorProfile(
    type,
    Number(g.primaryMassSolar),
    Number(g.secondaryMassSolar),
    g.neutronStarReferenceRadiusKm === null ? null : Number(g.neutronStarReferenceRadiusKm),
    Number(g.orbitalSemiMajorAxisAu),
    Number(g.orbitalEccentricity),
    Number(g.referenceInspiralYears),
  );
  const profile = new CompactMergerEventProfile(
    type, progenitor, Number(p.totalMassSolar), Number(p.chirpMassSolar), Number(p.massRatio), Number(p.symmetricMassRatio),
    counterpart, resolution, remnant,
    p.remnantMassSolar === null ? null : Number(p.remnantMassSolar),
    p.resolvedMatterEjectaMassSolar === null ? null : Number(p.resolvedMatterEjectaMassSolar),
    p.resolvedRadiatedMassSolar === null ? null : Number(p.resolvedRadiatedMassSolar),
  );
  return new CompactMergerCanonicalEvent(
    StellarSystemComponentLabel.fromCode(Number(d.primaryComponentLabelCode)),
    StellarSystemComponentLabel.fromCode(Number(d.secondaryComponentLabelCode)),
    d.primaryDesignation, d.secondaryDesignation, stage, Number(d.currentStellarAgeBillionYears),
    Number(d.mergerDelayYears), Number(d.mergerStellarAgeBillionYears), profile,
  );
}
