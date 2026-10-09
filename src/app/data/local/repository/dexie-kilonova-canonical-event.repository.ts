import { DiscoveryTargetType } from '../../../domain/discovery/discovery-target-type';
import { type SystemLocator } from '../../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../../domain/generation/universe-generation-key';
import { type KilonovaCanonicalEventRepository } from '../../../domain/repository/kilonova-canonical-event-repository';
import { StellarSystemComponentLabel } from '../../../domain/stellar/stellar-system-component-label';
import { KILONOVA_CANONICAL_EVENT_VERSION, KilonovaCanonicalEvent } from '../../../domain/transient/kilonova-canonical-event';
import { KilonovaEventProfile, KilonovaRemnantKind } from '../../../domain/transient/kilonova-event-profile';
import { KilonovaProgenitorProfile } from '../../../domain/transient/kilonova-progenitor';
import { KilonovaStellarLineageStage } from '../../../domain/transient/kilonova-stellar-lineage';
import { KilonovaType } from '../../../domain/transient/kilonova-type';
import { type GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import { type ProceduralTargetSeedResolver } from './dexie-discovery.repository';
import { CorruptLocalDataError, ensureUniverseExists, generationKeyStorageParts, normalizeTargetSeed } from './local-repository-support';

export const KILONOVA_CANONICAL_EVENT_OBSERVATION_KIND_V1 = 'KILONOVA_CANONICAL_EVENT_V1';
export const KILONOVA_CANONICAL_EVENT_PAYLOAD_VERSION_V1 = 1;

interface SystemIdentity { readonly universeSeed: string; readonly generatorVersionCode: number; readonly targetSeed: string; }
interface PayloadV1 {
  readonly version: typeof KILONOVA_CANONICAL_EVENT_VERSION;
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
      readonly type: string; readonly primaryMassSolar: number; readonly secondaryMassSolar: number;
      readonly neutronStarRadiusKm: number; readonly orbitalSemiMajorAxisAu: number; readonly orbitalEccentricity: number;
      readonly referenceInspiralYears: number; readonly blackHoleSpinDimensionless: number | null; readonly tidalDisruptionRatio: number | null;
    };
    readonly totalEjectaMassSolar: number; readonly blueEjectaMassSolar: number; readonly redEjectaMassSolar: number;
    readonly rProcessMassSolar: number; readonly characteristicBlueVelocityFractionC: number; readonly characteristicRedVelocityFractionC: number;
    readonly kineticEnergyJoules: number; readonly bluePeakTimeDays: number; readonly redPeakTimeDays: number;
    readonly bluePeakLuminosityWatts: number; readonly redPeakLuminosityWatts: number;
    readonly remnantKind: string; readonly remnantMassSolar: number;
  };
}

export class DexieKilonovaCanonicalEventRepository implements KilonovaCanonicalEventRepository {
  constructor(
    private readonly database: GenesisIndexedDb,
    private readonly targetSeedResolver: ProceduralTargetSeedResolver,
    private readonly clock: () => number = Date.now,
  ) {}

  async loadForSystem(generationKey: UniverseGenerationKey, locator: SystemLocator): Promise<readonly KilonovaCanonicalEvent[]> {
    await ensureUniverseExists(this.database, generationKey);
    const identity = this.identity(generationKey, locator);
    const stored = await this.database.observations.get(observationId(identity));
    if (stored === undefined) return Object.freeze([]);
    if (stored.observationKind !== KILONOVA_CANONICAL_EVENT_OBSERVATION_KIND_V1 ||
        stored.payloadVersion !== KILONOVA_CANONICAL_EVENT_PAYLOAD_VERSION_V1) {
      throw new CorruptLocalDataError('Persisted kilonova canonical-event contract mismatch.');
    }
    let parsed: unknown;
    try { parsed = JSON.parse(stored.payloadJson); }
    catch { throw new CorruptLocalDataError('Invalid kilonova canonical-event JSON.'); }
    return Object.freeze([rehydrate(parsed)]);
  }

  async replaceForSystem(generationKey: UniverseGenerationKey, locator: SystemLocator, events: readonly KilonovaCanonicalEvent[]): Promise<void> {
    await ensureUniverseExists(this.database, generationKey);
    if (events.length > 1) throw new RangeError('Only one inner A-B canonical kilonova is supported per system.');
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
        observationKind: KILONOVA_CANONICAL_EVENT_OBSERVATION_KIND_V1,
        payloadVersion: KILONOVA_CANONICAL_EVENT_PAYLOAD_VERSION_V1,
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
  return [KILONOVA_CANONICAL_EVENT_OBSERVATION_KIND_V1, identity.universeSeed, identity.generatorVersionCode, identity.targetSeed, 'AB'].join(':');
}
function payload(event: KilonovaCanonicalEvent): PayloadV1 {
  const p = event.profile; const g = p.progenitor;
  return {
    version: KILONOVA_CANONICAL_EVENT_VERSION,
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
      progenitor: { type: g.type, primaryMassSolar: g.primaryMassSolar, secondaryMassSolar: g.secondaryMassSolar,
        neutronStarRadiusKm: g.neutronStarRadiusKm, orbitalSemiMajorAxisAu: g.orbitalSemiMajorAxisAu,
        orbitalEccentricity: g.orbitalEccentricity, referenceInspiralYears: g.referenceInspiralYears,
        blackHoleSpinDimensionless: g.blackHoleSpinDimensionless, tidalDisruptionRatio: g.tidalDisruptionRatio },
      totalEjectaMassSolar: p.totalEjectaMassSolar, blueEjectaMassSolar: p.blueEjectaMassSolar, redEjectaMassSolar: p.redEjectaMassSolar,
      rProcessMassSolar: p.rProcessMassSolar, characteristicBlueVelocityFractionC: p.characteristicBlueVelocityFractionC,
      characteristicRedVelocityFractionC: p.characteristicRedVelocityFractionC, kineticEnergyJoules: p.kineticEnergyJoules,
      bluePeakTimeDays: p.bluePeakTimeDays, redPeakTimeDays: p.redPeakTimeDays,
      bluePeakLuminosityWatts: p.bluePeakLuminosityWatts, redPeakLuminosityWatts: p.redPeakLuminosityWatts,
      remnantKind: p.remnantKind, remnantMassSolar: p.remnantMassSolar,
    },
  };
}
function rehydrate(value: unknown): KilonovaCanonicalEvent {
  const d = value as Partial<PayloadV1>;
  if (d.version !== KILONOVA_CANONICAL_EVENT_VERSION || d.profile === undefined ||
      typeof d.primaryDesignation !== 'string' || typeof d.secondaryDesignation !== 'string') {
    throw new CorruptLocalDataError('Invalid kilonova canonical-event payload.');
  }
  const p = d.profile; const g = p.progenitor;
  const type = p.type === KilonovaType.BINARY_NEUTRON_STAR ? KilonovaType.BINARY_NEUTRON_STAR :
    p.type === KilonovaType.NEUTRON_STAR_BLACK_HOLE ? KilonovaType.NEUTRON_STAR_BLACK_HOLE : null;
  const stage = Object.values(KilonovaStellarLineageStage).includes(d.sourceLineageStage as never)
    ? d.sourceLineageStage as typeof KilonovaStellarLineageStage[keyof typeof KilonovaStellarLineageStage] : null;
  const remnant = Object.values(KilonovaRemnantKind).includes(p.remnantKind as never)
    ? p.remnantKind as typeof KilonovaRemnantKind[keyof typeof KilonovaRemnantKind] : null;
  if (type === null || stage === null || remnant === null) throw new CorruptLocalDataError('Unknown kilonova enum.');
  const progenitor = new KilonovaProgenitorProfile(type, Number(g.primaryMassSolar), Number(g.secondaryMassSolar),
    Number(g.neutronStarRadiusKm), Number(g.orbitalSemiMajorAxisAu), Number(g.orbitalEccentricity),
    Number(g.referenceInspiralYears), g.blackHoleSpinDimensionless === null ? null : Number(g.blackHoleSpinDimensionless),
    g.tidalDisruptionRatio === null ? null : Number(g.tidalDisruptionRatio));
  const profile = new KilonovaEventProfile(type, progenitor, Number(p.totalEjectaMassSolar), Number(p.blueEjectaMassSolar),
    Number(p.redEjectaMassSolar), Number(p.rProcessMassSolar), Number(p.characteristicBlueVelocityFractionC),
    Number(p.characteristicRedVelocityFractionC), Number(p.kineticEnergyJoules), Number(p.bluePeakTimeDays),
    Number(p.redPeakTimeDays), Number(p.bluePeakLuminosityWatts), Number(p.redPeakLuminosityWatts), remnant, Number(p.remnantMassSolar));
  return new KilonovaCanonicalEvent(
    StellarSystemComponentLabel.fromCode(Number(d.primaryComponentLabelCode)),
    StellarSystemComponentLabel.fromCode(Number(d.secondaryComponentLabelCode)),
    d.primaryDesignation, d.secondaryDesignation, stage, Number(d.currentStellarAgeBillionYears),
    Number(d.mergerDelayYears), Number(d.mergerStellarAgeBillionYears), profile,
  );
}
