import type {
  PlanetaryHistoryIntervalOptions32_12,
  PlanetaryHistoryIntervalRequest32_12,
  PlanetaryHistoryIntervalResult32_12,
  PlanetaryHistoryIntervalSource32_12,
} from '../../domain/planetary-history/planetary-history-interval-32-12';
import type { HistoricalHabitabilityReport31_7 } from '../../domain/habitability/habitability-historical-windows-31-7';
import type { HabitabilityContinuityReport31_8 } from '../../domain/habitability/habitability-continuity-31-8';
import type { HabitabilityEvolutionaryStabilityReport31_9 } from '../../domain/habitability/habitability-evolutionary-stability-31-9';
import {
  HabitabilityDatedPhysicalSource31Fc,
  type DatedPhysicalEnvironmentalCatalog31Fc,
} from '../habitability/habitability-dated-physical-source-31-f-c';
import { HabitabilityHistoricalWindowsResolver31_7 } from '../habitability/habitability-historical-windows-resolver-31-7';
import { HabitabilityContinuityResolver31_8 } from '../habitability/habitability-continuity-resolver-31-8';
import { HabitabilityEvolutionaryStabilityResolver31_9 } from '../habitability/habitability-evolutionary-stability-resolver-31-9';
import { PlanetaryHistoryIntervalEngine32_12 } from './planetary-history-interval-engine-32-12';

/**
 * 31.F.d — INTERNAL ONLY. This carries private Ground Truth and MUST NOT be
 * serialized to the UI, the player archive, or the observation store. The
 * observation boundary and authorized 31.12 projection belong to 31.F.e.
 */
export interface PhysicalHabitabilityReconstruction31Fd {
  readonly history: PlanetaryHistoryIntervalResult32_12;
  readonly windows: HistoricalHabitabilityReport31_7;
  readonly continuity: HabitabilityContinuityReport31_8;
  readonly evolutionaryStability: HabitabilityEvolutionaryStabilityReport31_9;
  /** This is coverage of the query, NOT completeness of the world's history. */
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
  readonly lifePresence: 'NOT_EVALUATED';
}

/**
 * Explicit query-time orchestration of TWO INDEPENDENT versioned physical
 * catalogs: dated episodes (32.12) and complete environmental intervals (31.F.c).
 *
 * This class creates no history, physical model, persisted record or snapshot.
 * Events are never promoted to environmental trajectories. When the physical
 * catalog has no continuous coverage, 31.7 returns unknown spans and 31.8/31.9
 * retain that uncertainty. A temporal coincidence is never certified causality.
 *
 * The call is deliberately opt-in, so normal chronology views keep their
 * original cost and cannot unintentionally expose internal habitability.
 */
export class PlanetaryHistoryHabitabilityReconstruction31Fd {
  private readonly timeline: PlanetaryHistoryIntervalEngine32_12;
  private readonly environment: HabitabilityDatedPhysicalSource31Fc;

  constructor(
    private readonly eventSource: PlanetaryHistoryIntervalSource32_12,
    environmentalCatalog: DatedPhysicalEnvironmentalCatalog31Fc,
    options: PlanetaryHistoryIntervalOptions32_12 = {},
  ) {
    this.timeline = new PlanetaryHistoryIntervalEngine32_12(eventSource, options);
    this.environment = new HabitabilityDatedPhysicalSource31Fc(environmentalCatalog);
  }

  reconstruct(
    request: PlanetaryHistoryIntervalRequest32_12,
  ): PhysicalHabitabilityReconstruction31Fd {
    // This is not a shortcut for 31.F.e; no observer-mode parameter is accepted.
    // 32.12 checks identity, CT-0 bounds, physical model manifest, causal closure
    // and episode-source revision even when its bounded cache supplies the slice.
    const history = this.timeline.read(request);
    const environmentalRevision = this.environment.revision(request.context);
    const windows = HabitabilityHistoricalWindowsResolver31_7.reconstruct({
      history,
      environmentSourceRevision: environmentalRevision,
      perspective: 'SIMULATED_REALITY',
    }, this.environment);
    const continuity = HabitabilityContinuityResolver31_8.summarize({
      historicalWindows: windows,
    });
    // Deliberately do not invent source-certified causal responses from an
    // event/time overlap. 31.9 will return timing-only context where relevant.
    const evolutionaryStability = HabitabilityEvolutionaryStabilityResolver31_9.assess({
      history, windows, continuity, certifiedResponses: [],
    });
    // A revision can change between reading the two physical catalogs even if
    // each catalog was internally stable during its own bounded read.
    if (this.eventSource.revision(request.context) !== request.version.sourceRevision ||
        this.environment.revision(request.context) !== environmentalRevision) {
      throw new RangeError('31.F.d physical catalogs changed during the joined historical query.');
    }
    return Object.freeze({
      history, windows, continuity, evolutionaryStability,
      historicalCompleteness: 'NOT_ESTABLISHED',
      lifePresence: 'NOT_EVALUATED',
    });
  }

  clearHistoryCache(): void { this.timeline.clear(); }
}
