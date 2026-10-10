import {
  type HistoricalEffectsReport, type HistoricalEventExposure,
  type HistoricalPhotonBand, type HistoricalTargetBody,
  type HistoricalTransientEvent,
} from '../../domain/transient/transient-historical-effects-profile';

export const ASTRONOMICAL_UNIT_METERS_29_11 = 149_597_870_700;
const BANDS: readonly HistoricalPhotonBand[] = ['BOLOMETRIC', 'OPTICAL', 'UV', 'X_RAY', 'GAMMA'];
const STATES = ['PAST_INTRINSIC_EXPLICIT','FUTURE_CANONICAL','STATISTICAL_ONLY','UNCONFIRMED_CANDIDATE','INTRINSIC_REFERENCE_ONLY'];
const GEOMETRIES = ['ISOTROPIC_TOTAL','BEAM_INTERSECTION_EXPLICIT','BEAM_ORIENTATION_UNKNOWN','UNRESOLVED'];
const FAMILIES = ['STELLAR_FLARE','SUPERNOVA','NOVA','KILONOVA','COMPACT_MERGER','GRB','FRB','TDE'];

/**
 * Pure evidence projection; never persists anything or mutates a planet, moon,
 * atmosphere, climate, history or biosphere. No hazard/damage thresholds are
 * smuggled in: fluence ≠ absorbed biological dose ≠ ecological consequence.
 */
export class TransientHistoricalEffectsEngine {
  private constructor() {}

  static assess(
    target: HistoricalTargetBody,
    events: readonly HistoricalTransientEvent[],
  ): HistoricalEffectsReport {
    validateTarget(target);
    const seen = new Set<string>();
    for (const event of events) {
      validateEvent(event);
      if (seen.has(event.id)) throw new RangeError('Duplicate historical event id.');
      seen.add(event.id);
    }
    const historical = events.filter(event => event.state === 'PAST_INTRINSIC_EXPLICIT');
    const futureOrStatistical = events.filter(event => event.state !== 'PAST_INTRINSIC_EXPLICIT');
    const sorted = [...historical.filter(e => e.yearsBeforeReference !== null)]
      .sort((a, b) => b.yearsBeforeReference! - a.yearsBeforeReference!);
    const unknownAge = historical.filter(e => e.yearsBeforeReference === null);
    // Undated events are NOT placed onto the chronological track.
    const assessment = [...sorted, ...unknownAge, ...futureOrStatistical].map(e => this.assessEvent(target, e));
    const knownBandSubtotals = BANDS.flatMap(band => {
      const rows = assessment.filter(item =>
        item.eventState === 'PAST_INTRINSIC_EXPLICIT' &&
        item.band === band &&
        item.topOfAtmosphereFluenceJoulesPerSquareMeter !== null);
      return rows.length === 0 ? [] : [{
        band,
        knownTopOfAtmosphereFluenceJoulesPerSquareMeter: rows.reduce(
          (sum, item) => sum + item.topOfAtmosphereFluenceJoulesPerSquareMeter!, 0),
        contributingEventCount: rows.length,
      }];
    });
    for (const row of knownBandSubtotals) {
      if (!Number.isFinite(row.knownTopOfAtmosphereFluenceJoulesPerSquareMeter)) {
        throw new RangeError('Known energy subtotal must remain finite.');
      }
    }
    return {
      targetId: target.id, targetLabel: target.label,
      events: assessment,
      knownBandSubtotals,
      unresolvedPastEventCount: assessment.filter(item =>
        item.eventState === 'PAST_INTRINSIC_EXPLICIT' &&
        item.topOfAtmosphereFluenceJoulesPerSquareMeter === null).length,
      eventCountPersisted: 0, alteredAtmospheres: 0, alteredBiospheres: 0,
      historicalCompleteness: 'PARTIAL_ONLY',
    };
  }

  static assessEvent(target: HistoricalTargetBody, event: HistoricalTransientEvent): HistoricalEventExposure {
    validateTarget(target);
    validateEvent(event);
    let state: HistoricalEventExposure['state'];
    let toa: number | null = null;
    let average: number | null = null;
    let transmitted: number | null = null;
    if (event.state !== 'PAST_INTRINSIC_EXPLICIT') {
      state = 'NO_INDIVIDUAL_PAST_EVENT';
    } else if (event.photonEnergyJoules === null || event.band === null) {
      state = 'NO_RADIANT_SPECTRUM';
    } else if (event.geometry === 'UNRESOLVED' || event.geometry === 'BEAM_ORIENTATION_UNKNOWN') {
      state = 'GEOMETRY_UNRESOLVED';
    } else if (target.separationAu === null) {
      state = 'DISTANCE_UNRESOLVED';
    } else {
      const distance = target.separationAu * ASTRONOMICAL_UNIT_METERS_29_11;
      if (!Number.isFinite(distance) || distance <= 0)
        throw new RangeError('Target separation is not representable in meters.');
      toa = event.photonEnergyJoules / (4 * Math.PI * distance ** 2);
      if (!Number.isFinite(toa) || toa === 0)
        throw new RangeError('Exposure fluence is not representable at the supplied scales.');
      if (event.sourceDurationSeconds !== null) {
        average = toa / event.sourceDurationSeconds;
        if (!Number.isFinite(average) || average === 0) throw new RangeError('Mean exposure flux is not representable.');
      }
      if (target.effectiveOpticalDepth === null) {
        state = 'TOA_RESOLVED_ATMOSPHERE_UNRESOLVED';
      } else {
        transmitted = toa * Math.exp(-target.effectiveOpticalDepth);
        state = 'BAND_ATTENUATION_RESOLVED';
      }
    }
    return {
      eventId: event.id, label: event.label, family: event.family, eventState: event.state,
      state, band: event.band, yearsBeforeReference: event.yearsBeforeReference,
      topOfAtmosphereFluenceJoulesPerSquareMeter: toa,
      meanTopOfAtmosphereFluxWattsPerSquareMeter: average,
      transmittedFluenceJoulesPerSquareMeter: transmitted,
      biosphereResponse: 'NOT_DERIVED', atmosphereEvolution: 'NOT_DERIVED',
      inventedPlanetaryMutations: 0,
    };
  }
}

function finitePositive(value: number | null, field: string): void {
  if (value !== null && (!Number.isFinite(value) || value <= 0))
    throw new RangeError(`${field} must be positive and finite when provided.`);
}
function validateTarget(target: HistoricalTargetBody): void {
  if (!target.id.trim() || !target.label.trim() || !['PLANET', 'MOON'].includes(target.kind))
    throw new RangeError('Invalid body identity or kind.');
  finitePositive(target.separationAu, 'separationAu');
  const tau = target.effectiveOpticalDepth;
  if (tau !== null && (!Number.isFinite(tau) || tau < 0))
    throw new RangeError('Band optical depth must be nonnegative and finite.');
  if (typeof target.biosphereCharacterized !== 'boolean') throw new RangeError('biosphereCharacterized must be boolean.');
}
function validateEvent(event: HistoricalTransientEvent): void {
  if (!event.id.trim() || !event.label.trim() || !FAMILIES.includes(event.family))
    throw new RangeError('Invalid event identity or family.');
  if (!STATES.includes(event.state) || !GEOMETRIES.includes(event.geometry))
    throw new RangeError('Invalid event state or emission geometry.');
  const age = event.yearsBeforeReference;
  if (age !== null && (!Number.isFinite(age) || age < 0))
    throw new RangeError('Historical age must be finite and nonnegative.');
  finitePositive(event.photonEnergyJoules, 'photonEnergyJoules');
  finitePositive(event.sourceDurationSeconds, 'sourceDurationSeconds');
  if (event.band !== null && !BANDS.includes(event.band))
    throw new RangeError('Unsupported photon band.');
  if ((event.band === null) !== (event.photonEnergyJoules === null))
    throw new RangeError('An explicit radiant-energy band must accompany radiant energy.');
  if (event.state === 'INTRINSIC_REFERENCE_ONLY') {
    if (event.yearsBeforeReference !== null) throw new RangeError('Unplaced intrinsic reference cannot have a historical age.');
  } else if (event.state !== 'PAST_INTRINSIC_EXPLICIT' &&
    (event.yearsBeforeReference !== null || event.photonEnergyJoules !== null || event.sourceDurationSeconds !== null)) {
    throw new RangeError('Future/statistical/candidate records may not masquerade as historical radiant events.');
  }
}
