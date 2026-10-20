import type {
  PlanetaryHistorySourceEpisode32_1,
} from '../../domain/planetary-history/planetary-history-32-1';
import type {
  PlanetaryHistoryIntervalRequest32_12,
  PlanetaryHistoryIntervalSource32_12,
} from '../../domain/planetary-history/planetary-history-interval-32-12';
import type { PlanetaryClimateGeochemistryHistoryResult32_6 } from
  '../../domain/planetary-history/planetary-climate-geochemistry-history-32-6';
import type { PlanetaryTransientEffectsHistoryResult32_9 } from
  '../../domain/planetary-history/planetary-transient-effects-history-32-9';
import type { HistoricalHabContext31_7 } from
  '../../domain/habitability/habitability-historical-windows-31-7';
import type { DatedPhysicalEnvironmentalCatalog31Fc } from
  '../habitability/habitability-dated-physical-source-31-f-c';
import { PlanetaryHistoryEngine } from './planetary-history-engine';
import { PlanetaryEnvironmentalEvolution31Fh } from './planetary-environmental-evolution-31-f-h';
import {
  PlanetaryHistoryHabitabilityReconstruction31Fd,
  type PhysicalHabitabilityReconstruction31Fd,
} from './planetary-history-habitability-reconstruction-31-f-d';

/**
 * 31.F.g — Production-materialized-history bridge AND a fail-closed audit.
 *
 * Current 32.6 physically resolves a PRESENT snapshot, NOT its historical
 * evolution. 32.9 resolves individual physical event/target responses, with
 * NULL climate temperature / atmospheric mass deltas, NOT their time history.
 * Consequently, neither can certify even one positive-duration environmental
 * interval for 31.7. This adapter deliberately returns NO such intervals.
 *
 * It connects the actual already-resolved episode catalog to 32.12 and the
 * real absence of continuous environmental physics to 31.F.c -> 31.7/8/9.
 * There is no random generation, extrapolation, persistence, observation
 * permission, player output, or fabricated certificate.
 *
 * 31.F.h may optionally supply conservative thermal intervals from independently
 * dated physical forcing. Without this explicit producer the catalog stays empty:
 * never promote 32.6 current climate or 32.9 event effects to past climate.
 */
export type MaterializedPhysicalHistory31Fg =
  | PlanetaryClimateGeochemistryHistoryResult32_6
  | PlanetaryTransientEffectsHistoryResult32_9;

export interface PhysicalHistoryCertification31Fg {
  readonly verdict: 'NO_CERTIFIED_ENVIRONMENTAL_TRAJECTORIES' | 'CONDITIONAL_DATED_THERMAL_ENVELOPES';
  readonly reason: 'CURRENT_SNAPSHOT_ONLY' | 'EVENT_EFFECTS_NOT_ENVIRONMENTAL_TRAJECTORY' |
    'SOURCE_BACKED_BOUNDED_ENERGY_BALANCE';
  readonly datedSourceEpisodeCount: number;
  readonly certifiedContinuousIntervals: 0;
  readonly historicalCoverage: 'UNKNOWN' | 'PARTIAL';
  /** Present only if an independently dated 31.F.h producer supplied records. */
  readonly boundedThermalIntervals?: number;
  readonly lifePresence: 'NOT_EVALUATED';
  readonly playerVisible: false;
}

export interface EnvironmentalHistoryReconstruction31Fg {
  readonly physical: PhysicalHabitabilityReconstruction31Fd;
  readonly certification: PhysicalHistoryCertification31Fg;
}

export class PlanetaryEnvironmentalHistoryCertification31Fg {
  private readonly reconstruction: PlanetaryHistoryHabitabilityReconstruction31Fd;
  private readonly context: HistoricalHabContext31_7;
  private readonly revision: string;
  readonly certification: PhysicalHistoryCertification31Fg;

  constructor(
    materialized: MaterializedPhysicalHistory31Fg, sourceRevision: string,
    evolution: PlanetaryEnvironmentalEvolution31Fh | null = null,
  ) {
    if (!normalized(sourceRevision) || !materialized ||
        materialized.layer !== 'SIMULATED_REALITY' ||
        !['32.6-CT0', '32.9-CT0'].includes(materialized.contractVersion) ||
        materialized.historicalCompleteness !== 'NOT_ESTABLISHED' ||
        !materialized.chronology || !Array.isArray(materialized.sourceEpisodes)) {
      throw new RangeError('31.F.g needs materialized, versioned phase-32 physical history.');
    }
    const h = materialized.chronology;
    if (h.contractVersion !== '32.1-CT0' || h.layer !== 'SIMULATED_REALITY' ||
        h.historicalCompleteness !== 'NOT_ESTABLISHED' ||
        h.coverage !== 'SUPPLIED_EPISODES_ONLY' ||
        h.bodyKey !== materialized.bodyKey ||
        (materialized.contractVersion === '32.6-CT0' && h.bodyKind !== 'PLANET') ||
        (materialized.contractVersion === '32.9-CT0' && h.bodyKind !== materialized.bodyKind)) {
      throw new RangeError('31.F.g rejects a foreign or invalid materialized chronology.');
    }
    if (materialized.contractVersion === '32.6-CT0') {
      if (materialized.snapshot?.interpretation !== 'CURRENT_PHYSICAL_STATE_NOT_HISTORICAL_TREND' ||
          !Array.isArray(materialized.resolvedClimateGeochemistryChanges) ||
          materialized.resolvedClimateGeochemistryChanges.length !== 0 ||
          materialized.drivers.some(d => d.startYear !== null || d.endYear !== null ||
            d.climateResponse !== 'NOT_QUANTIFIED')) {
        throw new RangeError('31.F.g cannot treat an undated 32.6 climate driver as a trajectory.');
      }
    } else {
      if (!Array.isArray(materialized.responses) ||
          materialized.responses.some(r =>
            r.climateTemperatureChangeKelvin !== null ||
            r.atmosphericMassChangeKilograms !== null)) {
        throw new RangeError('31.F.g cannot extrapolate transient responses to a climate history.');
      }
    }
    // Confirm source episodes REALLY produce the stated source chronology,
    // including causal closure, body identity, time scale and stable ordering.
    // Snapshot everything we retain: later provider mutations cannot poison
    // cached 32.12 queries. No model is re-run or procedurally regenerated.
    const episodes = materialized.sourceEpisodes.map(snapshotEpisode);
    const rebuilt = PlanetaryHistoryEngine.build({
      bodyKind: h.bodyKind, bodyKey: h.bodyKey, multiplicity: h.multiplicity,
      time: h.time, episodes,
    });
    if (JSON.stringify(rebuilt) !== JSON.stringify(h)) {
      throw new RangeError('31.F.g source episodes and actual 32.1 chronology disagree.');
    }
    this.context = Object.freeze({
      bodyKind: h.bodyKind, bodyKey: h.bodyKey,
      multiplicity: h.multiplicity, time: Object.freeze({ ...h.time }),
    });
    this.revision = sourceRevision;
    const episodeByKey = new Map(episodes.map(e => [e.episodeKey, e]));
    const matching = (ctx: HistoricalHabContext31_7): boolean =>
      ctx?.bodyKind === this.context.bodyKind && ctx.bodyKey === this.context.bodyKey &&
      ctx.multiplicity === this.context.multiplicity &&
      ctx.time?.kind === this.context.time.kind &&
      ctx.time.systemAgeBillionYears === this.context.time.systemAgeBillionYears;
    const requireMatching = (ctx: HistoricalHabContext31_7): void => {
      if (!matching(ctx)) throw new RangeError('31.F.g cannot cross body, host or CT-0 age.');
    };
    const events: PlanetaryHistoryIntervalSource32_12 = {
      revision: ctx => { requireMatching(ctx); return this.revision; },
      readInterval: (ctx, from, to, max) => {
        requireMatching(ctx);
        // 32.12 enforces its own source-episode bounds and causal closure.
        // The one-extra sentinel makes truncation fail rather than hide events.
        return Object.freeze(episodes.filter(e =>
          e.time.startYear <= to && e.time.endYear >= from).slice(0, max));
      },
      readByKey: (ctx, key) => {
        requireMatching(ctx);
        return episodeByKey.get(key) ?? null;
      },
    };
    if (evolution) {
      // A dated transient with unresolved environmental response is a break in
      // environmental certification, unless a future model explicitly closes
      // the causal forcing across that event. 31.F.h currently does not claim
      // such closures: block intersecting windows rather than smooth over it.
      if (materialized.contractVersion === '32.9-CT0' &&
          materialized.sourceEpisodes.some(e => e.kind !== 'FORMATION' &&
            evolution.result.intervals.some(i => e.time.startYear <= i.endYear &&
              e.time.endYear >= i.startYear))) {
        throw new RangeError('31.F.g rejects unresolved transient crossing a dated thermal interval.');
      }
      const revision = evolution.revision(this.context); // Enforces same moon/planet and CT-0 age.
      if (!revision.startsWith('31.F.h:')) throw new RangeError('31.F.g requires 31.F.h source provenance.');
      // When a dated model actually reaches the present snapshot, it must not
      // contradict the independently materialized phase-20 current climate.
      if (materialized.contractVersion === '32.6-CT0') {
        const now = Math.round(h.time.systemAgeBillionYears! * 1e9);
        const present = evolution.result.thermalEnvelopes.find(e => e.endYear === now);
        const observed = materialized.snapshot.meanSurfaceTemperatureKelvin;
        if (present && observed !== null &&
            (observed < present.minKelvin - 1e-6 || observed > present.maxKelvin + 1e-6)) {
          throw new RangeError('31.F.g dated thermal history disagrees with current 32.6 climate.');
        }
      }
    }
    const emptyPhysical: DatedPhysicalEnvironmentalCatalog31Fc = {
      revision: ctx => {
        requireMatching(ctx);
        return `materialized-${materialized.contractVersion}:${sourceRevision}`;
      },
      readInterval: (ctx, _from, _to, _max) => {
        requireMatching(ctx);
        // NO materialized phase-32 model has supplied a continuously resolved
        // pressure/temperature/volatile/radiation trajectory for this body.
        // Importantly, zero records means UNKNOWN, not no changes or no life.
        return Object.freeze([]);
      },
    };
    const hasIntervals = !!evolution && evolution.result.intervals.length > 0;
    this.certification = Object.freeze({
      verdict: hasIntervals ? 'CONDITIONAL_DATED_THERMAL_ENVELOPES'
        : 'NO_CERTIFIED_ENVIRONMENTAL_TRAJECTORIES',
      reason: hasIntervals ? 'SOURCE_BACKED_BOUNDED_ENERGY_BALANCE'
        : materialized.contractVersion === '32.6-CT0'
        ? 'CURRENT_SNAPSHOT_ONLY' : 'EVENT_EFFECTS_NOT_ENVIRONMENTAL_TRAJECTORY',
      datedSourceEpisodeCount: episodes.length,
      certifiedContinuousIntervals: 0,
      historicalCoverage: hasIntervals ? 'PARTIAL' : 'UNKNOWN',
      ...(hasIntervals ? { boundedThermalIntervals: evolution!.result.intervals.length } : {}),
      lifePresence: 'NOT_EVALUATED', playerVisible: false,
    });
    this.reconstruction = new PlanetaryHistoryHabitabilityReconstruction31Fd(
      events, hasIntervals ? evolution! : emptyPhysical,
    );
  }

  reconstruct(request: PlanetaryHistoryIntervalRequest32_12): EnvironmentalHistoryReconstruction31Fg {
    if (request?.version?.sourceRevision !== this.revision ||
        request.context?.bodyKind !== this.context.bodyKind ||
        request.context.bodyKey !== this.context.bodyKey) {
      throw new RangeError('31.F.g rejects a foreign body or stale source revision.');
    }
    return Object.freeze({
      physical: this.reconstruction.reconstruct(request),
      certification: this.certification,
    });
  }
}

function snapshotEpisode(e: PlanetaryHistorySourceEpisode32_1): PlanetaryHistorySourceEpisode32_1 {
  if (!e || !e.time || !e.source || !Array.isArray(e.causedByEpisodeKeys)) {
    throw new RangeError('31.F.g rejects an unmaterialized source episode.');
  }
  return Object.freeze({ ...e, time: Object.freeze({ ...e.time }),
    source: Object.freeze({ ...e.source }),
    causedByEpisodeKeys: Object.freeze([...e.causedByEpisodeKeys]),
  });
}
function normalized(s: unknown): s is string {
  return typeof s === 'string' && s.length > 0 && s.trim() === s && !s.includes('\0');
}
