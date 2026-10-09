import { type NovaEventProfile } from '../../domain/transient/nova-event-profile';
import { type KilonovaEventProfile } from '../../domain/transient/kilonova-event-profile';
import { type CompactMergerCanonicalEvent } from '../../domain/transient/compact-merger-canonical-event';
import { type GammaRayBurstEventProfile, GammaRayBurstOutcome } from '../../domain/transient/gamma-ray-burst-event-profile';
import { type FastRadioBurstEventProfile } from '../../domain/transient/fast-radio-burst-event-profile';
import { FastRadioBurstEngineState } from '../../domain/transient/fast-radio-burst-source-profile';
import { type GreatStellarFlareEventProfile, GreatStellarFlareOutcome } from '../../domain/transient/great-stellar-flare-event-profile';
import { type TidalDisruptionEventProfile, TidalDisruptionOutcome } from '../../domain/transient/tidal-disruption-event-profile';
import { TransientFollowUpFamily as Family, TransientFollowUpOrigin as Origin, TransientTemporalPhase as Phase, type TransientFollowUpFamily, type TransientFollowUpInput, type TransientFollowUpOrigin, type TransientModelMilestone } from '../../domain/transient/transient-follow-up-profile';

const day = 86400;
function input(id: string, family: TransientFollowUpFamily, origin: TransientFollowUpOrigin, modelMilestones: readonly TransientModelMilestone[] = [], forecastDelayYears: number | null = null): TransientFollowUpInput {
  return { id, family, origin, modelMilestones, observations: [], forecastDelayYears };
}
function milestone(id: string, seconds: number, label: string, phase: TransientModelMilestone['phase']): TransientModelMilestone {
  return { id, timeAfterOnsetSeconds: seconds, label, phase };
}

/** Thin projections of already resolved 29.x profiles: never call event generators. */
export class TransientFollowUpAdapters {
  private constructor() {}

  static nova(id: string, p: NovaEventProfile): TransientFollowUpInput {
    return input(id, Family.NOVA, Origin.INTRINSIC_EXPLICIT, [
      milestone('ignition', 0, 'Ignición superficial · referencia 29.2', Phase.ONSET),
      milestone('nova-peak', p.riseTimeDays * day, 'Máximo bolométrico del modelo', Phase.PEAK),
      milestone('decline-2', (p.riseTimeDays + p.declineTwoMagnitudeDays) * day, 'Declive 2 mag · modelo', Phase.DECLINE),
      milestone('nebular', p.nebularTransitionDays * day, 'Transición nebular · modelo', Phase.TRANSITION),
      milestone('quiescence', p.returnToQuiescenceDays * day, 'Retorno a quiescencia · modelo', Phase.END),
    ]);
  }

  static kilonova(id: string, p: KilonovaEventProfile): TransientFollowUpInput {
    return input(id, Family.KILONOVA, Origin.INTRINSIC_EXPLICIT, [
      milestone('merger', 0, 'Coalescencia de referencia · 29.3', Phase.ONSET),
      milestone('blue-peak', p.bluePeakTimeDays * day, 'Pico azul intrínseco', Phase.PEAK),
      milestone('red-peak', p.redPeakTimeDays * day, 'Pico rojo intrínseco', Phase.PEAK),
    ]);
  }

  /** Genuine 29.4 canonical future: NEVER manufacture a detected merger. */
  static futureCompactMerger(event: CompactMergerCanonicalEvent): TransientFollowUpInput {
    return input(event.eventKey, Family.COMPACT_MERGER, Origin.CANONICAL_FUTURE, [], event.mergerDelayYears);
  }

  static gammaRayBurst(id: string, p: GammaRayBurstEventProfile): TransientFollowUpInput {
    const source = p.source;
    if (p.outcome === GammaRayBurstOutcome.JET_LAUNCH_UNRESOLVED) {
      return input(id, Family.GAMMA_RAY_BURST, Origin.PROGENITOR_ONLY);
    }
    if (p.outcome === GammaRayBurstOutcome.CHOKED_COLLAPSAR_NO_CLASSICAL_GRB) {
      return input(id, Family.GAMMA_RAY_BURST, Origin.NOT_APPLICABLE);
    }
    const stages = [milestone('engine', 0, 'Encendido del motor central', Phase.ONSET)];
    if (p.stellarBreakoutTimeSeconds !== null) {
      stages.push(milestone('breakout', p.stellarBreakoutTimeSeconds, 'Breakout estelar del modelo', Phase.TRANSITION));
    }
    if (source.engineActivityDurationSeconds !== null) {
      stages.push(milestone('motor-off', source.engineActivityDurationSeconds, 'Fin actividad intrínseca del motor · no T90', Phase.END));
    }
    return input(id, Family.GAMMA_RAY_BURST, Origin.INTRINSIC_EXPLICIT, stages);
  }

  static fastRadioBurst(id: string, p: FastRadioBurstEventProfile): TransientFollowUpInput {
    if (p.source.engineState !== FastRadioBurstEngineState.COHERENT_RADIO_BURST_CONFIRMED) {
      return input(id, Family.FAST_RADIO_BURST, Origin.PROGENITOR_ONLY);
    }
    const duration = p.source.sourceFrameDurationSeconds;
    if (duration === null) throw new RangeError('Resolved 29.8 FRB requires a duration.');
    return input(id, Family.FAST_RADIO_BURST, Origin.INTRINSIC_EXPLICIT, [
      milestone('burst', 0, 'Inicio del burst coherente intrínseco', Phase.ONSET),
      milestone('burst-end', duration, 'Fin del burst intrínseco · no anchura observada', Phase.END),
    ]);
  }

  static greatStellarFlare(id: string, p: GreatStellarFlareEventProfile): TransientFollowUpInput {
    if (p.outcome === GreatStellarFlareOutcome.STATISTICAL_ACTIVITY_WITHOUT_EVENT) {
      return input(id, Family.STELLAR_FLARE, Origin.STATISTICAL_ONLY);
    }
    if (p.outcome === GreatStellarFlareOutcome.ORDINARY_STELLAR_FLARE_MODEL_NOT_APPLICABLE) {
      return input(id, Family.STELLAR_FLARE, Origin.NOT_APPLICABLE);
    }
    const duration = p.source.sourceFrameDurationSeconds;
    if (duration === null) throw new RangeError('Resolved 29.9 flare requires a source duration.');
    return input(id, Family.STELLAR_FLARE, Origin.INTRINSIC_EXPLICIT, [
      milestone('flare', 0, 'Inicio de la llamarada explícita', Phase.ONSET),
      milestone('flare-end', duration, 'Fin de duración intrínseca · sin curva de luz', Phase.END),
    ]);
  }

  static tidalDisruption(id: string, p: TidalDisruptionEventProfile): TransientFollowUpInput {
    if (p.outcome !== TidalDisruptionOutcome.EXTERNAL_DISRUPTION_EXPECTED) {
      return input(id, Family.TIDAL_DISRUPTION, Origin.PROGENITOR_ONLY);
    }
    const tMin = p.mostBoundFallbackTimeSeconds;
    if (tMin === null) throw new RangeError('Resolved 29.6 fallback requires a t_min.');
    return input(id, Family.TIDAL_DISRUPTION, Origin.INTRINSIC_EXPLICIT, [
      milestone('disruption', 0, 'Disrupción externa de referencia 29.6', Phase.ONSET),
      milestone('fallback', tMin, 'Primer retorno ligado · frozen-in reference', Phase.REFERENCE),
    ]);
  }

  /** Type-safe boundary for an explicitly resolved 29.1 temporal profile. */
  static supernova(id: string, resolved: {
    readonly riseTimeDays: number;
    readonly peakTimeDays: number;
    readonly nebularTransitionDays: number;
  }): TransientFollowUpInput {
    const { riseTimeDays, peakTimeDays, nebularTransitionDays } = resolved;
    if (![riseTimeDays, peakTimeDays, nebularTransitionDays].every(value => Number.isFinite(value) && value > 0) ||
        riseTimeDays > peakTimeDays || peakTimeDays >= nebularTransitionDays) {
      throw new RangeError('29.1 temporal anchors must come from a coherent resolved physical profile.');
    }
    return input(id, Family.SUPERNOVA, Origin.INTRINSIC_EXPLICIT, [
      milestone('explosion', 0, 'Explosión · referencia 29.1', Phase.ONSET),
      milestone('rise', riseTimeDays * day, 'Fin de ascenso del modelo', Phase.RISE),
      milestone('peak', peakTimeDays * day, 'Máximo bolométrico del modelo', Phase.PEAK),
      milestone('nebular', nebularTransitionDays * day, 'Inicio de fase nebular', Phase.TRANSITION),
    ]);
  }
}
