import type { PlanetaryHistorySourceEpisode32_1 } from '../../domain/planetary-history/planetary-history-32-1';
import type { PlanetarySystemFormationBlueprint } from '../../domain/planetary/planetary-system-formation-blueprint';

/**
 * Modelled formation from the actual 17.7 blueprint of a newly materialized
 * planet, never an event imported from V2's public planet index. The interval
 * is the model's disk-reference age through mature-formation completion; it
 * does NOT assert that the individual planet began accreting at disk birth.
 * No event is returned for a planet whose formation is still in the future.
 */
export function coevalPlanetFormationEpisodePRE33(
  namespace: string,
  targetBodyKey: string,
  publicOrdinal: number,
  blueprint: PlanetarySystemFormationBlueprint,
  presentYear: number,
): PlanetaryHistorySourceEpisode32_1 {
  if (typeof namespace !== 'string' || namespace.length === 0 ||
      typeof targetBodyKey !== 'string' || targetBodyKey.length === 0 ||
      !Number.isSafeInteger(publicOrdinal) || publicOrdinal < 0 ||
      !Number.isSafeInteger(presentYear) || presentYear < 0) {
    throw new RangeError('PRE33_FORMATION_INVALID_PHYSICAL_IDENTITY');
  }
  const start = Math.round(blueprint.sourceDiskAgeMillionYears * 1_000_000);
  const end = Math.round(blueprint.formationCompletionAgeMillionYears * 1_000_000);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
      start < 0 || end < start || end > presentYear) {
    throw new RangeError('PRE33_FORMATION_NOT_MATURE_AT_SHARED_CT0');
  }
  return Object.freeze({
    episodeKey: `17.7/FORMATION/${namespace}/B${publicOrdinal}`,
    targetBodyKind: 'PLANET' as const,
    targetBodyKey,
    kind: 'FORMATION' as const,
    time: Object.freeze({
      timeScale: 'YEARS_SINCE_SYSTEM_FORMATION' as const,
      startYear: start,
      endYear: end,
      resolution: start === end ? 'MODELLED_INSTANT' as const : 'INFERRED_INTERVAL' as const,
    }),
    source: Object.freeze({
      sourcePhase: '17.7',
      sourceModel: 'PROTOPLANETARY_MATURATION_BLUEPRINT',
      sourceRecordKey: `${namespace}/17.7/B${publicOrdinal}/MATURATION`,
      evidenceKind: 'INFERRED_PHYSICAL_EPISODE' as const,
    }),
    causedByEpisodeKeys: Object.freeze([]),
  });
}
