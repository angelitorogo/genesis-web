import {
  DiscoveryTargetType,
} from '../../../domain/discovery/discovery-target-type';
import {
  type SystemLocator,
} from '../../../domain/generation/procedural-locator';
import {
  type UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';
import {
  type SupernovaCanonicalEventRepository,
} from '../../../domain/repository/supernova-canonical-event-repository';
import {
  StellarSystemComponentLabel,
  type StellarSystemComponentLabel as StellarSystemComponentLabelValue,
} from '../../../domain/stellar/stellar-system-component-label';
import {
  SupernovaCompactRemnantKind,
  SupernovaEventProfile,
} from '../../../domain/transient/supernova-event-profile';
import {
  SupernovaCanonicalEvent,
  SupernovaCanonicalEventTemporalStatus,
  SUPERNOVA_CANONICAL_EVENT_VERSION,
  type SupernovaCanonicalEventTemporalStatus as SupernovaCanonicalEventTemporalStatusValue,
} from '../../../domain/transient/supernova-canonical-event';
import {
  SupernovaProgenitorChannel,
  SupernovaProgenitorCompactRemnantHint,
  SupernovaProgenitorProfile,
} from '../../../domain/transient/supernova-progenitor';
import {
  SupernovaStellarLineageStage,
  type SupernovaStellarLineageStage as SupernovaStellarLineageStageValue,
} from '../../../domain/transient/supernova-stellar-lineage';
import {
  SupernovaType,
} from '../../../domain/transient/supernova-type';
import {
  type GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';
import {
  type ProceduralTargetSeedResolver,
} from './dexie-discovery.repository';
import {
  CorruptLocalDataError,
  ensureUniverseExists,
  generationKeyStorageParts,
  normalizeTargetSeed,
} from './local-repository-support';

export const SUPERNOVA_CANONICAL_EVENT_OBSERVATION_KIND_V1 =
  'SUPERNOVA_CANONICAL_EVENT_V1';
export const SUPERNOVA_CANONICAL_EVENT_PAYLOAD_VERSION_V1 = 1;

interface SystemIdentity {
  readonly universeSeed: string;
  readonly generatorVersionCode: number;
  readonly targetSeed: string;
}

interface CanonicalEventPayloadV1 {
  readonly version: typeof SUPERNOVA_CANONICAL_EVENT_VERSION;
  readonly componentLabelCode: number;
  readonly stellarDesignation: string;
  readonly sourceLineageStage: string;
  readonly temporalStatus: string;
  readonly currentStellarAgeBillionYears: number;
  readonly eventStellarAgeBillionYears: number | null;
  readonly requiresBinaryInteraction: boolean;
  readonly profile: {
    readonly type: string;
    readonly progenitor: {
      readonly channel: string;
      readonly initialMassSolar: number;
      readonly preExplosionMassSolar: number;
      readonly metallicitySolarRatio: number;
      readonly hydrogenEnvelopeFraction: number;
      readonly heliumEnvelopeFraction: number;
      readonly whiteDwarfMassSolar: number | null;
      readonly compactRemnantHint: string | null;
    };
    readonly ejectaMassSolar: number;
    readonly nickel56MassSolar: number;
    readonly explosionEnergyJoules: number;
    readonly characteristicEjectaVelocityKmS: number;
    readonly peakBolometricLuminosityWatts: number;
    readonly peakAbsoluteBolometricMagnitude: number;
    readonly peakPhotosphericTemperatureKelvin: number;
    readonly riseTimeDays: number;
    readonly plateauDurationDays: number | null;
    readonly earlyRemnantTransitionDays: number;
    readonly transientCompletionDays: number;
    readonly compactRemnantKind: string;
    readonly compactRemnantMassSolar: number | null;
  };
}

/**
 * Stores canonical supernova Ground Truth in the existing observation table so
 * 29.1C requires no IndexedDB schema migration. These rows are technical
 * persistence records, not player observations/discovery state.
 */
export class DexieSupernovaCanonicalEventRepository
  implements SupernovaCanonicalEventRepository {
  constructor(
    private readonly database: GenesisIndexedDb,
    private readonly targetSeedResolver: ProceduralTargetSeedResolver,
    private readonly clock: () => number = Date.now,
  ) {}

  async loadForSystem(
    generationKey: UniverseGenerationKey,
    locator: SystemLocator,
  ): Promise<readonly SupernovaCanonicalEvent[]> {
    await ensureUniverseExists(this.database, generationKey);
    const identity = this.identity(generationKey, locator);

    const ids = StellarSystemComponentLabel.values.map(
      (componentLabel) => observationId(identity, componentLabel),
    );
    const stored = await this.database.observations.bulkGet(ids);
    const events: SupernovaCanonicalEvent[] = [];

    for (let index = 0; index < stored.length; index++) {
      const observation = stored[index];
      if (observation === undefined) {
        continue;
      }

      const expectedLabel = StellarSystemComponentLabel.values[index];
      this.assertStoredIdentity(observation, identity, expectedLabel);

      if (
        observation.payloadVersion !==
        SUPERNOVA_CANONICAL_EVENT_PAYLOAD_VERSION_V1
      ) {
        throw new CorruptLocalDataError(
          `Unsupported supernova canonical-event payload version: ${observation.payloadVersion}.`,
        );
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(observation.payloadJson);
      } catch {
        throw new CorruptLocalDataError(
          'Invalid supernova canonical-event JSON.',
        );
      }

      const event = rehydrateCanonicalEvent(parsed);
      if (event.componentLabel !== expectedLabel) {
        throw new CorruptLocalDataError(
          'Persisted supernova component identity does not match its storage id.',
        );
      }

      events.push(event);
    }

    return Object.freeze(events);
  }

  async replaceForSystem(
    generationKey: UniverseGenerationKey,
    locator: SystemLocator,
    events: readonly SupernovaCanonicalEvent[],
  ): Promise<void> {
    await ensureUniverseExists(this.database, generationKey);
    const identity = this.identity(generationKey, locator);
    validateCanonicalSet(events);

    const allIds = StellarSystemComponentLabel.values.map(
      (componentLabel) => observationId(identity, componentLabel),
    );
    const now = this.clock();

    await this.database.transaction(
      'rw',
      this.database.universes,
      this.database.observations,
      async () => {
        const existingUniverse = await this.database.universes.get([
          identity.universeSeed,
          identity.generatorVersionCode,
        ]);

        if (existingUniverse === undefined) {
          throw new RangeError(
            'Cannot persist canonical supernova events for a missing universe.',
          );
        }

        await this.database.observations.bulkDelete(allIds);

        if (events.length === 0) {
          return;
        }

        await this.database.observations.bulkPut(
          events.map((event) => ({
            id: observationId(identity, event.componentLabel),
            universeSeed: identity.universeSeed,
            generatorVersionCode: identity.generatorVersionCode,
            targetTypeCode: DiscoveryTargetType.SYSTEM.code,
            targetSeed: identity.targetSeed,
            observationKind: SUPERNOVA_CANONICAL_EVENT_OBSERVATION_KIND_V1,
            payloadVersion: SUPERNOVA_CANONICAL_EVENT_PAYLOAD_VERSION_V1,
            payloadJson: JSON.stringify(payloadFromEvent(event)),
            observedAtEpochMs: now,
          })),
        );
      },
    );
  }

  private identity(
    generationKey: UniverseGenerationKey,
    locator: SystemLocator,
  ): SystemIdentity {
    const { universeSeed, generatorVersionCode } =
      generationKeyStorageParts(generationKey);
    const targetSeed = normalizeTargetSeed(
      this.targetSeedResolver.resolveTargetSeedNormalized(
        generationKey,
        locator,
      ),
    );

    return Object.freeze({
      universeSeed,
      generatorVersionCode,
      targetSeed,
    });
  }

  private assertStoredIdentity(
    observation: Readonly<{
      id: string;
      universeSeed: string;
      generatorVersionCode: number;
      targetTypeCode: number;
      targetSeed: string;
      observationKind: string;
    }>,
    identity: SystemIdentity,
    componentLabel: StellarSystemComponentLabelValue,
  ): void {
    if (
      observation.id !== observationId(identity, componentLabel) ||
      observation.universeSeed !== identity.universeSeed ||
      observation.generatorVersionCode !== identity.generatorVersionCode ||
      observation.targetTypeCode !== DiscoveryTargetType.SYSTEM.code ||
      normalizeTargetSeed(observation.targetSeed) !== identity.targetSeed ||
      observation.observationKind !==
        SUPERNOVA_CANONICAL_EVENT_OBSERVATION_KIND_V1
    ) {
      throw new CorruptLocalDataError(
        'Persisted supernova canonical-event identity mismatch.',
      );
    }
  }
}

function observationId(
  identity: SystemIdentity,
  componentLabel: StellarSystemComponentLabelValue,
): string {
  return [
    'supernova-canonical-v1',
    identity.universeSeed,
    identity.generatorVersionCode.toString(10),
    DiscoveryTargetType.SYSTEM.code.toString(10),
    identity.targetSeed,
    componentLabel.code.toString(10),
  ].join(':');
}

function validateCanonicalSet(
  events: readonly SupernovaCanonicalEvent[],
): void {
  const seen = new Set<number>();

  for (const event of events) {
    if (seen.has(event.componentLabel.code)) {
      throw new RangeError(
        `Duplicate canonical supernova event for component ${event.componentLabel.name}.`,
      );
    }

    seen.add(event.componentLabel.code);
  }
}

function payloadFromEvent(
  event: SupernovaCanonicalEvent,
): CanonicalEventPayloadV1 {
  const profile = event.profile;
  const progenitor = profile.progenitor;

  return {
    version: SUPERNOVA_CANONICAL_EVENT_VERSION,
    componentLabelCode: event.componentLabel.code,
    stellarDesignation: event.stellarDesignation,
    sourceLineageStage: event.sourceLineageStage,
    temporalStatus: event.temporalStatus,
    currentStellarAgeBillionYears: event.currentStellarAgeBillionYears,
    eventStellarAgeBillionYears: event.eventStellarAgeBillionYears,
    requiresBinaryInteraction: event.requiresBinaryInteraction,
    profile: {
      type: profile.type,
      progenitor: {
        channel: progenitor.channel,
        initialMassSolar: progenitor.initialMassSolar,
        preExplosionMassSolar: progenitor.preExplosionMassSolar,
        metallicitySolarRatio: progenitor.metallicitySolarRatio,
        hydrogenEnvelopeFraction: progenitor.hydrogenEnvelopeFraction,
        heliumEnvelopeFraction: progenitor.heliumEnvelopeFraction,
        whiteDwarfMassSolar: progenitor.whiteDwarfMassSolar,
        compactRemnantHint: progenitor.compactRemnantHint,
      },
      ejectaMassSolar: profile.ejectaMassSolar,
      nickel56MassSolar: profile.nickel56MassSolar,
      explosionEnergyJoules: profile.explosionEnergyJoules,
      characteristicEjectaVelocityKmS:
        profile.characteristicEjectaVelocityKmS,
      peakBolometricLuminosityWatts:
        profile.peakBolometricLuminosityWatts,
      peakAbsoluteBolometricMagnitude:
        profile.peakAbsoluteBolometricMagnitude,
      peakPhotosphericTemperatureKelvin:
        profile.peakPhotosphericTemperatureKelvin,
      riseTimeDays: profile.riseTimeDays,
      plateauDurationDays: profile.plateauDurationDays,
      earlyRemnantTransitionDays: profile.earlyRemnantTransitionDays,
      transientCompletionDays: profile.transientCompletionDays,
      compactRemnantKind: profile.compactRemnantKind,
      compactRemnantMassSolar: profile.compactRemnantMassSolar,
    },
  };
}

function rehydrateCanonicalEvent(value: unknown): SupernovaCanonicalEvent {
  const payload = requirePayload(value);
  const componentLabel =
    StellarSystemComponentLabel.fromCode(payload.componentLabelCode);
  const lineageStage = requireLineageStage(payload.sourceLineageStage);
  const temporalStatus = requireTemporalStatus(payload.temporalStatus);
  const type = requireSupernovaType(payload.profile.type);
  const progenitorRaw = payload.profile.progenitor;
  const progenitorChannel = requireProgenitorChannel(progenitorRaw.channel);
  const remnantHint = requireRemnantHint(progenitorRaw.compactRemnantHint);
  const compactRemnantKind =
    requireCompactRemnantKind(payload.profile.compactRemnantKind);

  try {
    const progenitor = new SupernovaProgenitorProfile(
      progenitorChannel,
      progenitorRaw.initialMassSolar,
      progenitorRaw.preExplosionMassSolar,
      progenitorRaw.metallicitySolarRatio,
      progenitorRaw.hydrogenEnvelopeFraction,
      progenitorRaw.heliumEnvelopeFraction,
      progenitorRaw.whiteDwarfMassSolar,
      remnantHint,
    );

    const profile = new SupernovaEventProfile(
      type,
      progenitor,
      payload.profile.ejectaMassSolar,
      payload.profile.nickel56MassSolar,
      payload.profile.explosionEnergyJoules,
      payload.profile.characteristicEjectaVelocityKmS,
      payload.profile.peakBolometricLuminosityWatts,
      payload.profile.peakAbsoluteBolometricMagnitude,
      payload.profile.peakPhotosphericTemperatureKelvin,
      payload.profile.riseTimeDays,
      payload.profile.plateauDurationDays,
      payload.profile.earlyRemnantTransitionDays,
      payload.profile.transientCompletionDays,
      compactRemnantKind,
      payload.profile.compactRemnantMassSolar,
    );

    return new SupernovaCanonicalEvent(
      componentLabel,
      payload.stellarDesignation,
      lineageStage,
      temporalStatus,
      payload.currentStellarAgeBillionYears,
      payload.eventStellarAgeBillionYears,
      payload.requiresBinaryInteraction,
      profile,
    );
  } catch {
    throw new CorruptLocalDataError(
      'Persisted supernova canonical-event payload is invalid.',
    );
  }
}

function requirePayload(value: unknown): CanonicalEventPayloadV1 {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new CorruptLocalDataError(
      'Invalid supernova canonical-event payload.',
    );
  }

  const payload = value as Partial<CanonicalEventPayloadV1>;
  if (
    payload.version !== SUPERNOVA_CANONICAL_EVENT_VERSION ||
    !Number.isInteger(payload.componentLabelCode) ||
    typeof payload.stellarDesignation !== 'string' ||
    typeof payload.sourceLineageStage !== 'string' ||
    typeof payload.temporalStatus !== 'string' ||
    typeof payload.currentStellarAgeBillionYears !== 'number' ||
    !(
      payload.eventStellarAgeBillionYears === null ||
      typeof payload.eventStellarAgeBillionYears === 'number'
    ) ||
    typeof payload.requiresBinaryInteraction !== 'boolean' ||
    payload.profile === null ||
    typeof payload.profile !== 'object' ||
    payload.profile.progenitor === null ||
    typeof payload.profile.progenitor !== 'object'
  ) {
    throw new CorruptLocalDataError(
      'Invalid supernova canonical-event payload header.',
    );
  }

  return payload as CanonicalEventPayloadV1;
}

function requireLineageStage(value: string): SupernovaStellarLineageStageValue {
  const candidate = Object.values(SupernovaStellarLineageStage)
    .find((entry) => entry === value);
  if (candidate === undefined) {
    throw new CorruptLocalDataError('Unknown persisted supernova lineage stage.');
  }
  return candidate;
}

function requireTemporalStatus(
  value: string,
): SupernovaCanonicalEventTemporalStatusValue {
  const candidate = Object.values(SupernovaCanonicalEventTemporalStatus)
    .find((entry) => entry === value);
  if (candidate === undefined) {
    throw new CorruptLocalDataError('Unknown persisted supernova temporal status.');
  }
  return candidate;
}

function requireSupernovaType(value: string) {
  const candidate = Object.values(SupernovaType).find((entry) => entry === value);
  if (candidate === undefined) {
    throw new CorruptLocalDataError('Unknown persisted supernova type.');
  }
  return candidate;
}

function requireProgenitorChannel(value: string) {
  const candidate = Object.values(SupernovaProgenitorChannel)
    .find((entry) => entry === value);
  if (candidate === undefined) {
    throw new CorruptLocalDataError('Unknown persisted supernova progenitor channel.');
  }
  return candidate;
}

function requireRemnantHint(value: string | null) {
  if (value === null) {
    return null;
  }
  const candidate = Object.values(SupernovaProgenitorCompactRemnantHint)
    .find((entry) => entry === value);
  if (candidate === undefined) {
    throw new CorruptLocalDataError('Unknown persisted supernova remnant hint.');
  }
  return candidate;
}

function requireCompactRemnantKind(value: string) {
  const candidate = Object.values(SupernovaCompactRemnantKind)
    .find((entry) => entry === value);
  if (candidate === undefined) {
    throw new CorruptLocalDataError('Unknown persisted compact-remnant kind.');
  }
  return candidate;
}
