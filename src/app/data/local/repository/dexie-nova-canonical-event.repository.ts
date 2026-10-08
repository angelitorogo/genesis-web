import { DiscoveryTargetType } from '../../../domain/discovery/discovery-target-type';
import { type SystemLocator } from '../../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../../domain/generation/universe-generation-key';
import { type NovaCanonicalEventRepository } from '../../../domain/repository/nova-canonical-event-repository';
import { StellarSystemComponentLabel } from '../../../domain/stellar/stellar-system-component-label';
import {
  NOVA_CANONICAL_EVENT_VERSION,
  NovaCanonicalEvent,
} from '../../../domain/transient/nova-canonical-event';
import { NovaEventProfile } from '../../../domain/transient/nova-event-profile';
import {
  NovaProgenitorProfile,
  NovaWhiteDwarfComposition,
} from '../../../domain/transient/nova-progenitor';
import { NovaStellarLineageStage } from '../../../domain/transient/nova-stellar-lineage';
import { NovaType } from '../../../domain/transient/nova-type';
import { type GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import { type ProceduralTargetSeedResolver } from './dexie-discovery.repository';
import {
  CorruptLocalDataError,
  ensureUniverseExists,
  generationKeyStorageParts,
  normalizeTargetSeed,
} from './local-repository-support';

export const NOVA_CANONICAL_EVENT_OBSERVATION_KIND_V1 = 'NOVA_CANONICAL_EVENT_V1';
export const NOVA_CANONICAL_EVENT_PAYLOAD_VERSION_V1 = 1;

interface SystemIdentity {
  readonly universeSeed: string;
  readonly generatorVersionCode: number;
  readonly targetSeed: string;
}

interface NovaPayloadV1 {
  readonly version: typeof NOVA_CANONICAL_EVENT_VERSION;
  readonly componentLabelCode: number;
  readonly donorComponentLabelCode: number;
  readonly stellarDesignation: string;
  readonly sourceLineageStage: string;
  readonly currentStellarAgeBillionYears: number;
  readonly recurrenceIntervalYears: number;
  readonly previousEruptionStellarAgeBillionYears: number;
  readonly nextEruptionStellarAgeBillionYears: number;
  readonly profile: {
    readonly type: string;
    readonly progenitor: {
      readonly whiteDwarfMassSolar: number;
      readonly donorMassSolar: number;
      readonly metallicitySolarRatio: number;
      readonly orbitalPeriastronAu: number;
      readonly effectiveAccretionRateSolarPerYear: number;
      readonly ignitionEnvelopeMassSolar: number;
      readonly whiteDwarfComposition: string;
    };
    readonly ejectaMassSolar: number;
    readonly retainedEnvelopeMassSolar: number;
    readonly kineticEnergyJoules: number;
    readonly characteristicEjectaVelocityKmS: number;
    readonly peakBolometricLuminosityWatts: number;
    readonly peakAbsoluteBolometricMagnitude: number;
    readonly peakPhotosphericTemperatureKelvin: number;
    readonly riseTimeDays: number;
    readonly declineTwoMagnitudeDays: number;
    readonly nebularTransitionDays: number;
    readonly returnToQuiescenceDays: number;
    readonly recurrenceIntervalYears: number;
  };
}

/** 29.2 stores deterministic nova cycles in the existing observation table. */
export class DexieNovaCanonicalEventRepository implements NovaCanonicalEventRepository {
  constructor(
    private readonly database: GenesisIndexedDb,
    private readonly targetSeedResolver: ProceduralTargetSeedResolver,
    private readonly clock: () => number = Date.now,
  ) {}

  async loadForSystem(
    generationKey: UniverseGenerationKey,
    locator: SystemLocator,
  ): Promise<readonly NovaCanonicalEvent[]> {
    await ensureUniverseExists(this.database, generationKey);
    const identity = this.identity(generationKey, locator);
    const ids = StellarSystemComponentLabel.values.map(label => observationId(identity, label.code));
    const stored = await this.database.observations.bulkGet(ids);
    const result: NovaCanonicalEvent[] = [];

    for (let index = 0; index < stored.length; index += 1) {
      const observation = stored[index];
      if (observation === undefined) continue;
      if (observation.observationKind !== NOVA_CANONICAL_EVENT_OBSERVATION_KIND_V1) {
        throw new CorruptLocalDataError('Persisted nova canonical-event kind mismatch.');
      }
      if (observation.payloadVersion !== NOVA_CANONICAL_EVENT_PAYLOAD_VERSION_V1) {
        throw new CorruptLocalDataError('Unsupported nova canonical-event payload version.');
      }
      let parsed: unknown;
      try { parsed = JSON.parse(observation.payloadJson); }
      catch { throw new CorruptLocalDataError('Invalid nova canonical-event JSON.'); }
      const event = rehydrate(parsed);
      const expected = StellarSystemComponentLabel.values[index];
      if (event.componentLabel.code !== expected.code) {
        throw new CorruptLocalDataError('Persisted nova component identity mismatch.');
      }
      result.push(event);
    }

    return Object.freeze(result);
  }

  async replaceForSystem(
    generationKey: UniverseGenerationKey,
    locator: SystemLocator,
    events: readonly NovaCanonicalEvent[],
  ): Promise<void> {
    await ensureUniverseExists(this.database, generationKey);
    validateSet(events);
    const identity = this.identity(generationKey, locator);
    const allIds = StellarSystemComponentLabel.values.map(label => observationId(identity, label.code));
    const now = this.clock();

    await this.database.transaction('rw', this.database.universes, this.database.observations, async () => {
      await this.database.observations.bulkDelete(allIds);
      if (events.length === 0) return;
      await this.database.observations.bulkPut(events.map(event => ({
        id: observationId(identity, event.componentLabel.code),
        universeSeed: identity.universeSeed,
        generatorVersionCode: identity.generatorVersionCode,
        targetTypeCode: DiscoveryTargetType.SYSTEM.code,
        targetSeed: identity.targetSeed,
        observationKind: NOVA_CANONICAL_EVENT_OBSERVATION_KIND_V1,
        payloadVersion: NOVA_CANONICAL_EVENT_PAYLOAD_VERSION_V1,
        payloadJson: JSON.stringify(payload(event)),
        observedAtEpochMs: now,
      })));
    });
  }

  private identity(generationKey: UniverseGenerationKey, locator: SystemLocator): SystemIdentity {
    const { universeSeed, generatorVersionCode } = generationKeyStorageParts(generationKey);
    return Object.freeze({
      universeSeed,
      generatorVersionCode,
      targetSeed: normalizeTargetSeed(
        this.targetSeedResolver.resolveTargetSeedNormalized(generationKey, locator),
      ),
    });
  }
}

function observationId(identity: SystemIdentity, componentCode: number): string {
  return [
    NOVA_CANONICAL_EVENT_OBSERVATION_KIND_V1,
    identity.universeSeed,
    identity.generatorVersionCode,
    identity.targetSeed,
    componentCode,
  ].join(':');
}

function payload(event: NovaCanonicalEvent): NovaPayloadV1 {
  const p = event.profile;
  return {
    version: NOVA_CANONICAL_EVENT_VERSION,
    componentLabelCode: event.componentLabel.code,
    donorComponentLabelCode: event.donorComponentLabel.code,
    stellarDesignation: event.stellarDesignation,
    sourceLineageStage: event.sourceLineageStage,
    currentStellarAgeBillionYears: event.currentStellarAgeBillionYears,
    recurrenceIntervalYears: event.recurrenceIntervalYears,
    previousEruptionStellarAgeBillionYears: event.previousEruptionStellarAgeBillionYears,
    nextEruptionStellarAgeBillionYears: event.nextEruptionStellarAgeBillionYears,
    profile: {
      type: p.type,
      progenitor: {
        whiteDwarfMassSolar: p.progenitor.whiteDwarfMassSolar,
        donorMassSolar: p.progenitor.donorMassSolar,
        metallicitySolarRatio: p.progenitor.metallicitySolarRatio,
        orbitalPeriastronAu: p.progenitor.orbitalPeriastronAu,
        effectiveAccretionRateSolarPerYear: p.progenitor.effectiveAccretionRateSolarPerYear,
        ignitionEnvelopeMassSolar: p.progenitor.ignitionEnvelopeMassSolar,
        whiteDwarfComposition: p.progenitor.whiteDwarfComposition,
      },
      ejectaMassSolar: p.ejectaMassSolar,
      retainedEnvelopeMassSolar: p.retainedEnvelopeMassSolar,
      kineticEnergyJoules: p.kineticEnergyJoules,
      characteristicEjectaVelocityKmS: p.characteristicEjectaVelocityKmS,
      peakBolometricLuminosityWatts: p.peakBolometricLuminosityWatts,
      peakAbsoluteBolometricMagnitude: p.peakAbsoluteBolometricMagnitude,
      peakPhotosphericTemperatureKelvin: p.peakPhotosphericTemperatureKelvin,
      riseTimeDays: p.riseTimeDays,
      declineTwoMagnitudeDays: p.declineTwoMagnitudeDays,
      nebularTransitionDays: p.nebularTransitionDays,
      returnToQuiescenceDays: p.returnToQuiescenceDays,
      recurrenceIntervalYears: p.recurrenceIntervalYears,
    },
  };
}

function rehydrate(value: unknown): NovaCanonicalEvent {
  const data = value as Partial<NovaPayloadV1>;
  if (data.version !== NOVA_CANONICAL_EVENT_VERSION || data.profile === undefined) {
    throw new CorruptLocalDataError('Invalid nova canonical-event payload.');
  }
  const component = StellarSystemComponentLabel.fromCode(Number(data.componentLabelCode));
  const donor = StellarSystemComponentLabel.fromCode(Number(data.donorComponentLabelCode));
  const p = data.profile;
  const pp = p.progenitor;
  const type = p.type === NovaType.RECURRENT ? NovaType.RECURRENT : p.type === NovaType.CLASSICAL ? NovaType.CLASSICAL : null;
  const composition = pp.whiteDwarfComposition === NovaWhiteDwarfComposition.OXYGEN_NEON
    ? NovaWhiteDwarfComposition.OXYGEN_NEON
    : pp.whiteDwarfComposition === NovaWhiteDwarfComposition.CARBON_OXYGEN
      ? NovaWhiteDwarfComposition.CARBON_OXYGEN
      : null;
  const stage = Object.values(NovaStellarLineageStage).includes(data.sourceLineageStage as never)
    ? data.sourceLineageStage as typeof NovaStellarLineageStage[keyof typeof NovaStellarLineageStage]
    : null;
  if (type === null || composition === null || stage === null || typeof data.stellarDesignation !== 'string') {
    throw new CorruptLocalDataError('Unknown enum in nova canonical-event payload.');
  }
  const progenitor = new NovaProgenitorProfile(
    Number(pp.whiteDwarfMassSolar),
    Number(pp.donorMassSolar),
    Number(pp.metallicitySolarRatio),
    Number(pp.orbitalPeriastronAu),
    Number(pp.effectiveAccretionRateSolarPerYear),
    Number(pp.ignitionEnvelopeMassSolar),
    composition,
  );
  const profile = new NovaEventProfile(
    type,
    progenitor,
    Number(p.ejectaMassSolar),
    Number(p.retainedEnvelopeMassSolar),
    Number(p.kineticEnergyJoules),
    Number(p.characteristicEjectaVelocityKmS),
    Number(p.peakBolometricLuminosityWatts),
    Number(p.peakAbsoluteBolometricMagnitude),
    Number(p.peakPhotosphericTemperatureKelvin),
    Number(p.riseTimeDays),
    Number(p.declineTwoMagnitudeDays),
    Number(p.nebularTransitionDays),
    Number(p.returnToQuiescenceDays),
    Number(p.recurrenceIntervalYears),
  );
  return new NovaCanonicalEvent(
    component,
    donor,
    data.stellarDesignation,
    stage,
    Number(data.currentStellarAgeBillionYears),
    Number(data.recurrenceIntervalYears),
    Number(data.previousEruptionStellarAgeBillionYears),
    Number(data.nextEruptionStellarAgeBillionYears),
    profile,
  );
}

function validateSet(events: readonly NovaCanonicalEvent[]): void {
  const seen = new Set<number>();
  for (const event of events) {
    if (seen.has(event.componentLabel.code)) throw new RangeError('Duplicate canonical nova component.');
    seen.add(event.componentLabel.code);
  }
}
