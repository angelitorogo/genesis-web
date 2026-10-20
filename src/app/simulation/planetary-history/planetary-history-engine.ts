import type {
  PlanetaryHistoryChronology32_1,
  PlanetaryHistoryEpisode32_1,
  PlanetaryHistoryInput32_1,
  PlanetaryHistorySourceEpisode32_1,
} from '../../domain/planetary-history/planetary-history-32-1';

const KINDS = new Set<string>([
  'FORMATION', 'ACCRETION', 'INTERIOR_COOLING', 'DIFFERENTIATION',
  'ATMOSPHERE_TRANSITION', 'WATER_RESERVOIR_TRANSITION', 'GLACIATION_TRANSITION',
  'VOLCANIC_EPISODE', 'CLIMATE_GEOCHEMISTRY_TRANSITION',
  'STELLAR_ENVIRONMENT_CHANGE', 'REALIZED_IMPACT', 'RESOLVED_TRANSIENT_EFFECT',
]);
const MULTIPLICITIES = new Set<string>(['SINGLE', 'BINARY', 'TRIPLE', 'UNKNOWN']);
const BODIES = new Set<string>(['PLANET', 'MOON']);
const RESOLUTIONS = new Set<string>([
  'MODELLED_INSTANT', 'MODELLED_INTERVAL', 'INFERRED_INTERVAL',
]);
const EVIDENCE_KINDS = new Set<string>([
  'RESOLVED_PHYSICAL_EVENT', 'INFERRED_PHYSICAL_EPISODE',
]);
const MODELED_YEARS_PER_GYR = 1_000_000_000;

/**
 * GENESIS 32.1 — Pure causal chronology assembler.
 *
 * It never makes up events, event epochs, durations, impact outcomes, life,
 * stochastic draws or environmental states. All inputs must come from a
 * future/previous physical source resolver and be anchored to CT-0.
 * 32.12 will later reconstruct bounded intervals lazily.
 */
export class PlanetaryHistoryEngine {
  private constructor() {}

  static build(input: PlanetaryHistoryInput32_1): PlanetaryHistoryChronology32_1 {
    validateContext(input);
    const presentYear = input.time.systemAgeBillionYears === null
      ? null : Math.round(input.time.systemAgeBillionYears * MODELED_YEARS_PER_GYR);
    if (presentYear !== null && !Number.isSafeInteger(presentYear)) {
      throw new RangeError('CT-0 age cannot be represented safely in integer model-years.');
    }
    if (presentYear === null && input.episodes.length > 0) {
      throw new RangeError('Historical episode dates require a resolved CT-0 system age.');
    }

    const byKey = new Map<string, PlanetaryHistorySourceEpisode32_1>();
    for (const episode of input.episodes) {
      validateEpisode(episode, input, presentYear);
      if (byKey.has(episode.episodeKey)) {
        throw new RangeError(`Duplicate historical episodeKey: ${episode.episodeKey}.`);
      }
      byKey.set(episode.episodeKey, episode);
    }

    // All edges refer to this body's supplied causal graph: no missing, future,
    // cross-body or cyclic causes are silently inferred or discarded.
    const children = new Map<string, string[]>();
    const indegree = new Map<string, number>();
    for (const key of byKey.keys()) {
      indegree.set(key, 0);
      children.set(key, []);
    }
    for (const [key, episode] of byKey) {
      const parentKeys = new Set<string>();
      for (const parentKey of episode.causedByEpisodeKeys) {
        assertKey(parentKey, 'causedByEpisodeKeys entry');
        if (parentKeys.has(parentKey)) {
          throw new RangeError(`Duplicate physical cause ${parentKey} for ${key}.`);
        }
        parentKeys.add(parentKey);
        const parent = byKey.get(parentKey);
        if (!parent) throw new RangeError(`Unknown physical cause ${parentKey} for ${key}.`);
        if (parentKey === key) throw new RangeError(`Episode ${key} cannot cause itself.`);
        if (parent.time.startYear > episode.time.startYear) {
          throw new RangeError(`Cause ${parentKey} cannot begin after its effect ${key}.`);
        }
        children.get(parentKey)!.push(key);
        indegree.set(key, indegree.get(key)! + 1);
      }
    }

    // Kahn with a min-heap: O((N + E) log N), reproducible even for large
    // slices and equal-time events. Never depend on caller insertion order.
    const compare = (a: string, b: string): number => {
      const left = byKey.get(a)!;
      const right = byKey.get(b)!;
      return left.time.startYear - right.time.startYear ||
        left.time.endYear - right.time.endYear ||
        compareText(episodeId(input.bodyKind, input.bodyKey, left),
          episodeId(input.bodyKind, input.bodyKey, right));
    };
    const ready = new MinHeap(compare);
    for (const [key, count] of indegree) if (count === 0) ready.push(key);
    const ordered: PlanetaryHistoryEpisode32_1[] = [];
    while (ready.size > 0) {
      const key = ready.pop()!;
      const item = byKey.get(key)!;
      ordered.push(Object.freeze({
        episodeId: episodeId(input.bodyKind, input.bodyKey, item),
        episodeKey: key,
        targetBodyKind: input.bodyKind,
        targetBodyKey: input.bodyKey,
        kind: item.kind,
        time: Object.freeze({ ...item.time }),
        source: Object.freeze({ ...item.source }),
        causedByEpisodeIds: Object.freeze(item.causedByEpisodeKeys
          .map((parentKey) => episodeId(input.bodyKind, input.bodyKey, byKey.get(parentKey)!))
          .sort(compareText)),
      }));
      for (const childKey of children.get(key)!) {
        const next = indegree.get(childKey)! - 1;
        indegree.set(childKey, next);
        if (next === 0) ready.push(childKey);
      }
    }
    if (ordered.length !== byKey.size) {
      throw new RangeError('Physical episode graph contains a causal cycle.');
    }

    return Object.freeze({
      contractVersion: '32.1-CT0',
      layer: 'SIMULATED_REALITY',
      bodyKind: input.bodyKind,
      bodyKey: input.bodyKey,
      multiplicity: input.multiplicity,
      time: Object.freeze({ ...input.time }),
      presentYearAfterFormation: presentYear,
      timeScale: 'YEARS_SINCE_SYSTEM_FORMATION',
      episodes: Object.freeze(ordered),
      coverage: 'SUPPLIED_EPISODES_ONLY',
      historicalCompleteness: 'NOT_ESTABLISHED',
      lifePresence: 'NOT_EVALUATED',
    });
  }
}

function validateContext(input: PlanetaryHistoryInput32_1): void {
  if (!input || typeof input !== 'object') throw new TypeError('A historical input is required.');
  if (!BODIES.has(input.bodyKind)) throw new RangeError('Unsupported target bodyKind.');
  assertKey(input.bodyKey, 'bodyKey');
  if (!MULTIPLICITIES.has(input.multiplicity)) throw new RangeError('Unsupported multiplicity.');
  if (!input.time || input.time.kind !== 'CURRENT_SNAPSHOT' ||
    (input.time.systemAgeBillionYears !== null &&
      (!Number.isFinite(input.time.systemAgeBillionYears) || input.time.systemAgeBillionYears < 0))) {
    throw new RangeError('32.1 requires CT-0 CURRENT_SNAPSHOT with nonnegative age or null.');
  }
  if (!Array.isArray(input.episodes)) throw new TypeError('episodes must be an array.');
}

function validateEpisode(
  episode: PlanetaryHistorySourceEpisode32_1,
  input: PlanetaryHistoryInput32_1,
  presentYear: number | null,
): void {
  if (!episode || typeof episode !== 'object') throw new TypeError('Invalid history episode.');
  assertKey(episode.episodeKey, 'episodeKey');
  if (episode.targetBodyKind !== input.bodyKind || episode.targetBodyKey !== input.bodyKey) {
    throw new RangeError(`Historical episode ${episode.episodeKey} belongs to another body.`);
  }
  if (!KINDS.has(episode.kind)) throw new RangeError('Unknown physical episode kind.');
  if (!episode.time || episode.time.timeScale !== 'YEARS_SINCE_SYSTEM_FORMATION' ||
    !Number.isSafeInteger(episode.time.startYear) || !Number.isSafeInteger(episode.time.endYear) ||
    episode.time.startYear < 0 || episode.time.endYear < episode.time.startYear ||
    presentYear === null || episode.time.endYear > presentYear ||
    !RESOLUTIONS.has(episode.time.resolution)) {
    throw new RangeError(`Episode ${episode.episodeKey} has an invalid or future time on the CT-0 axis.`);
  }
  if ((episode.time.startYear === episode.time.endYear) !==
    (episode.time.resolution === 'MODELLED_INSTANT')) {
    throw new RangeError('Instant/interval resolution must match the episode endpoints.');
  }
  if (!episode.source || !EVIDENCE_KINDS.has(episode.source.evidenceKind)) {
    throw new RangeError('History episodes require declared scientific evidence provenance.');
  }
  assertKey(episode.source.sourcePhase, 'sourcePhase');
  assertKey(episode.source.sourceModel, 'sourceModel');
  assertKey(episode.source.sourceRecordKey, 'sourceRecordKey');
  if ((episode.kind === 'REALIZED_IMPACT' || episode.kind === 'RESOLVED_TRANSIENT_EFFECT') &&
    episode.source.evidenceKind !== 'RESOLVED_PHYSICAL_EVENT') {
    throw new RangeError('Impacts and transient effects require a realized, physically resolved source event.');
  }
  if (episode.time.resolution === 'INFERRED_INTERVAL' &&
    episode.source.evidenceKind !== 'INFERRED_PHYSICAL_EPISODE') {
    throw new RangeError('An inferred time interval must retain inferred physical provenance.');
  }
  if (!Array.isArray(episode.causedByEpisodeKeys)) {
    throw new TypeError('causedByEpisodeKeys must be an explicit array.');
  }
}

function assertKey(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value ||
    value.includes('\u0000')) {
    throw new RangeError(`${label} must be a nonempty, normalized stable key.`);
  }
}

function episodeId(
  bodyKind: string,
  bodyKey: string,
  episode: PlanetaryHistorySourceEpisode32_1,
): string {
  // Tuple serialization is collision-free for arbitrary user/domain identifiers.
  // No random state, hash collision or locale-sensitive string comparison.
  return `32.1:${JSON.stringify([
    bodyKind, bodyKey, episode.source.sourcePhase, episode.source.sourceModel,
    episode.source.sourceRecordKey, episode.episodeKey,
  ])}`;
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

class MinHeap {
  private readonly values: string[] = [];
  constructor(private readonly compare: (a: string, b: string) => number) {}
  get size(): number { return this.values.length; }
  push(value: string): void {
    const a = this.values;
    a.push(value);
    let index = a.length - 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.compare(a[parent], a[index]) <= 0) break;
      [a[parent], a[index]] = [a[index], a[parent]];
      index = parent;
    }
  }
  pop(): string | undefined {
    const a = this.values;
    if (a.length === 0) return undefined;
    const root = a[0];
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      while (true) {
        const left = 2 * i + 1;
        const right = left + 1;
        let best = i;
        if (left < a.length && this.compare(a[left], a[best]) < 0) best = left;
        if (right < a.length && this.compare(a[right], a[best]) < 0) best = right;
        if (best === i) break;
        [a[i], a[best]] = [a[best], a[i]];
        i = best;
      }
    }
    return root;
  }
}
