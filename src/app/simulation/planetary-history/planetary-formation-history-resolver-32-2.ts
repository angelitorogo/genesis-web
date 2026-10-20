import type {
  PlanetaryFormationHistoryInput32_2,
  PlanetaryFormationHistoryResult32_2,
  PlanetaryFormationStage32_2,
} from '../../domain/planetary-history/planetary-formation-history-32-2';
import type { PlanetaryHistorySourceEpisode32_1 } from '../../domain/planetary-history/planetary-history-32-1';
import { PlanetaryHistoryEngine } from './planetary-history-engine';

const YEARS_PER_MILLION = 1_000_000;
const YEARS_PER_BILLION = 1_000_000_000;
const PRECURSOR_ACCRETION = 'precursor-accretion-17.7';
const PRECURSOR_ASSEMBLY = 'precursor-assembly-17.7';

/**
 * GENESIS 32.2 — read-only interpretation of a mature planet's *frozen* lineage.
 *
 * 17.7 dates the completion of protoplanetary *precursors*, NOT the final
 * 18.2 consolidation, 19.5 differentiation or the cooling of a mantle.
 * 0..formationCompletion is therefore only a broad inferred envelope for
 * early precursor accretion / assembly, not a resolved individual event date.
 * No cooling or differentiation episode is fabricated from today's mass budget.
 */
export class PlanetaryFormationHistoryResolver32_2 {
  private constructor() {}

  static resolve(input: PlanetaryFormationHistoryInput32_2): PlanetaryFormationHistoryResult32_2 {
    const planet = input.planet;
    if (!planet || !planet.hostPlanetarySystem || !planet.architectureSlot ||
        !planet.internalComposition) {
      throw new TypeError('32.2 requires a frozen 17.7/18.2/19.5 planetary lineage.');
    }
    const system = planet.hostPlanetarySystem;
    const blueprint = system.formationBlueprint;
    const slot = planet.architectureSlot;
    const interior = planet.internalComposition;
    if (!blueprint || !system.architecture ||
        !Number.isSafeInteger(planet.planetOrdinal) || planet.planetOrdinal < 1 ||
        system.architecture.planetSlots[planet.planetOrdinal - 1] !== slot ||
        slot.planetOrdinal !== planet.planetOrdinal ||
        interior.planetOrdinal !== planet.planetOrdinal ||
        !sameBody(slot.bodyLocator, interior.bodyLocator)) {
      throw new RangeError('32.2 source bodies do not refer to the same mature planet.');
    }
    if (!Array.isArray(slot.sourceAnchorOrdinals) ||
        slot.sourceAnchorOrdinals.length === 0 ||
        !Array.isArray(slot.sourceFormationOrdinals) ||
        slot.sourceFormationOrdinals.length === 0 ||
        !Array.isArray(blueprint.formationAnchors)) {
      throw new RangeError('32.2 requires a nonempty formation precursor lineage.');
    }
    const anchors = new Map(blueprint.formationAnchors.map(a => [a.anchorOrdinal, a]));
    const sourceOrdinals = new Set<number>();
    for (const ordinal of slot.sourceAnchorOrdinals) {
      const anchor = anchors.get(ordinal);
      if (!anchor) throw new RangeError('A precursor anchor is missing from blueprint 17.7.');
      for (const source of anchor.sourceFormationOrdinals) {
        if (sourceOrdinals.has(source)) {
          throw new RangeError('Duplicate precursor formation source in 32.2 lineage.');
        }
        sourceOrdinals.add(source);
      }
    }
    const actualSources = [...sourceOrdinals].sort((a, b) => a - b);
    if (JSON.stringify(actualSources) !== JSON.stringify(slot.sourceFormationOrdinals)) {
      throw new RangeError('17.7 anchor lineage and 18.2 planet source ordinals differ.');
    }
    const completionMyr = blueprint.formationCompletionAgeMillionYears;
    const dispersalMyr = blueprint.sourceDiskDispersalAgeMillionYears;
    if (!Number.isFinite(completionMyr) || completionMyr <= 0 ||
        !Number.isFinite(dispersalMyr) || dispersalMyr <= 0 ||
        dispersalMyr > completionMyr) {
      throw new RangeError('Invalid 17.7 precursor formation timing.');
    }
    const locator = slot.bodyLocator;
    const bodyKey = `G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}/B${locator.bodyIndex}`;
    const hostMultiplicity = system.hostStellarSystem?.multiplicity?.name;
    if (hostMultiplicity !== 'SINGLE' && hostMultiplicity !== 'BINARY' &&
        hostMultiplicity !== 'TRIPLE') {
      throw new RangeError('32.2 requires the original SINGLE/BINARY/TRIPLE host identity.');
    }
    if (!input.time || input.time.kind !== 'CURRENT_SNAPSHOT' ||
        (input.time.systemAgeBillionYears !== null &&
         (!Number.isFinite(input.time.systemAgeBillionYears) || input.time.systemAgeBillionYears < 0))) {
      throw new RangeError('32.2 requires a valid CT-0 age or explicit null.');
    }
    const presentYear = input.time.systemAgeBillionYears === null ? null :
      Math.round(input.time.systemAgeBillionYears * YEARS_PER_BILLION);
    if (presentYear !== null && !Number.isSafeInteger(presentYear)) {
      throw new RangeError('CT-0 present-year conversion loses integer precision.');
    }
    const completionYear = Math.round(completionMyr * YEARS_PER_MILLION);
    const dated = presentYear !== null && Number.isSafeInteger(completionYear) &&
      completionYear > 0 && completionYear <= presentYear;
    // If the source is younger than the claimed precursor completion, no
    // "completed planet" is asserted. No future episode is clamped to today.
    const lineageKey = JSON.stringify([
      locator.galaxyIndex.toString(), locator.sectorKey.toString(),
      locator.galacticObjectIndex.toString(), locator.bodyIndex.toString(),
      slot.sourceAnchorOrdinals, slot.sourceFormationOrdinals,
    ]);
    const stages: PlanetaryFormationStage32_2[] = [
      Object.freeze({
        process: 'PRECURSOR_ACCRETION',
        resolution: dated ? 'INFERRED_EARLY_INTERVAL' : 'TIME_NOT_RESOLVED',
        startYear: dated ? 0 : null, endYear: dated ? completionYear : null,
        sourceModel: 'PlanetarySystemFormationBlueprint + PlanetaryArchitectureSlot',
        note: 'Bounded envelope of 17.7 precursor accretion; no planet-specific start or accretion-rate history.',
      }),
      Object.freeze({
        process: 'PRECURSOR_ASSEMBLY',
        resolution: dated ? 'INFERRED_EARLY_INTERVAL' : 'TIME_NOT_RESOLVED',
        startYear: dated ? 0 : null, endYear: dated ? completionYear : null,
        sourceModel: 'PlanetarySystemFormationBlueprint + PlanetaryFormationAnchor',
        note: 'Early precursor assembled within the 17.7 endpoint; does not date subsequent 18.2 planet consolidation.',
      }),
      Object.freeze({
        process: 'INTERIOR_COOLING', resolution: 'TIME_NOT_RESOLVED',
        startYear: null, endYear: null,
        sourceModel: 'PlanetInternalComposition',
        note: 'A present-day interior mass budget does not determine a cooling curve or cooling epoch.',
      }),
      Object.freeze({
        process: 'INTERIOR_DIFFERENTIATION',
        resolution: interior.metallicCoreMassEarth > 0 && interior.silicateInteriorMassEarth > 0
          ? 'CURRENT_INTERIOR_BUDGET_ONLY' : 'TIME_NOT_RESOLVED',
        startYear: null, endYear: null,
        sourceModel: 'PlanetInternalComposition',
        note: '19.5 partitions present material masses; it does not date core separation or establish a differentiation episode.',
      }),
    ];
    const episodes: PlanetaryHistorySourceEpisode32_1[] = dated ? [
      makeEpisode(PRECURSOR_ACCRETION, 'ACCRETION', completionYear, bodyKey,
        'PlanetarySystemFormationBlueprint + PlanetaryArchitectureSlot',
        `17.7:early-accretion:${lineageKey}`, []),
      makeEpisode(PRECURSOR_ASSEMBLY, 'FORMATION', completionYear, bodyKey,
        'PlanetarySystemFormationBlueprint + PlanetaryFormationAnchor',
        `17.7:early-precursor-assembly:${lineageKey}`, [PRECURSOR_ACCRETION]),
    ] : [];
    const chronology = PlanetaryHistoryEngine.build({
      bodyKind: 'PLANET', bodyKey, multiplicity: hostMultiplicity,
      time: input.time, episodes,
    });
    return Object.freeze({
      contractVersion: '32.2-CT0', layer: 'SIMULATED_REALITY', bodyKey,
      stages: Object.freeze(stages), sourceEpisodes: Object.freeze(episodes), chronology,
      historicalCompleteness: 'NOT_ESTABLISHED', lifePresence: 'NOT_EVALUATED',
    });
  }
}

function makeEpisode(
  key: string, kind: 'ACCRETION' | 'FORMATION', endYear: number,
  bodyKey: string, model: string, recordKey: string, causes: readonly string[],
): PlanetaryHistorySourceEpisode32_1 {
  return Object.freeze({
    episodeKey: key, targetBodyKind: 'PLANET', targetBodyKey: bodyKey,
    kind, time: Object.freeze({ timeScale: 'YEARS_SINCE_SYSTEM_FORMATION',
      startYear: 0, endYear, resolution: 'INFERRED_INTERVAL' }),
    source: Object.freeze({ sourcePhase: '17.7/18.2 -> 32.2',
      sourceModel: model, sourceRecordKey: recordKey,
      evidenceKind: 'INFERRED_PHYSICAL_EPISODE' }),
    causedByEpisodeKeys: Object.freeze([...causes]),
  });
}

function sameBody(a: { readonly galaxyIndex: bigint; readonly sectorKey: bigint;
  readonly galacticObjectIndex: bigint; readonly bodyIndex: bigint },
  b: { readonly galaxyIndex: bigint; readonly sectorKey: bigint;
  readonly galacticObjectIndex: bigint; readonly bodyIndex: bigint }): boolean {
  return a.galaxyIndex === b.galaxyIndex && a.sectorKey === b.sectorKey &&
    a.galacticObjectIndex === b.galacticObjectIndex && a.bodyIndex === b.bodyIndex;
}
