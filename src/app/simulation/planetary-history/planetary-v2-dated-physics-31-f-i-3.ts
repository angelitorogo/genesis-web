import type { Planet } from '../../domain/planetary/planet';
import { PlanetarySystemOrbitTopology } from '../../domain/planetary/planetary-system-orbit-topology';
import type { MoonSystem } from '../../domain/planetary/moon-system';
import type { StellarPhysicalProperties } from '../../domain/stellar/stellar-physical-properties';
import type { StellarLifetimeProfile } from '../../domain/stellar/stellar-lifetime-profile';
import type { HistoricalHabContext31_7 } from '../../domain/habitability/habitability-historical-windows-31-7';
import {
  PlanetaryHistoricalPhysicalForcingProducer31Fi2,
  type DatedPhysicalIrradiationSegment31Fi2,
  type HistoricalPhysicalForcingInput31Fi2,
  type HistoricalPhysicalForcingResult31Fi2,
} from './planetary-historical-physical-forcing-producer-31-f-i-2';

/**
 * 31.F.i.3 — Physical, deterministic, model-conditioned irradiation history.
 *
 * Source: already-materialized phase-15 ZAMS luminosity + coeval phase-15
 * lifetime, phase-16 Keplerian hierarchy, phase-18 planet geometry and the
 * phase-21 relevant-moon Keplerian geometry. NO generators, entropy or CURRENT
 * climate are consulted. The first-order main-sequence luminosity law is a
 * MODELLING ASSUMPTION, not an observed time series or certified paleoclimate.
 * Keplerian envelopes presume frozen orbital elements and constant stellar
 * masses before any unresolved transition. Their conditional status is retained
 * even when the analytic L/r² producer is successful.
 *
 * Only the well-defined ordinary MAIN_SEQUENCE, not remnant, regime is used.
 * 32.F.5a includes low-mass hydrogen-burning MS hosts: the low-mass
 * luminosity law is a deliberately broad conditional envelope, never a
 * calibrated evolutionary track or an extrapolation through stellar death.
 * No atmosphere, volatile, radiation, tidal migration, event consequence, or
 * temperature history is inferred. Those properties remain UNKNOWN.
 */
export interface MaterializedPrimary31Fi3 {
  readonly physical: StellarPhysicalProperties;
  readonly lifetime: StellarLifetimeProfile;
}
export interface PhysicalGap31Fi3 {
  readonly startYear: number;
  readonly endYear: number;
  readonly reason: 'PRE_MAIN_SEQUENCE_OR_FORMATION' | 'NOT_MODELLED_STELLAR_ORBITAL_EVOLUTION' |
    'UNRESOLVED_EVENT' | 'UNRESOLVED_ORBIT_GEOMETRY';
}
export interface PhysicalWorldHistory31Fi3 {
  readonly bodyKind: 'PLANET' | 'MOON';
  readonly bodyKey: string;
  readonly source: HistoricalPhysicalForcingInput31Fi2;
  readonly irradiation: HistoricalPhysicalForcingResult31Fi2;
  readonly gaps: readonly PhysicalGap31Fi3[];
  readonly pressureHistory: 'UNKNOWN';
  readonly waterHistory: 'UNKNOWN';
  readonly radiationHistory: 'UNKNOWN';
  readonly dynamicalHistory: 'CONDITIONAL_KEPLERIAN_BOUNDS_NOT_SECULAR_EVOLUTION';
  readonly historicalHabitability: 'UNKNOWN';
  readonly playerVisible: false;
  /** 32.F.5a: WHY dated irradiation is/is not available for this materialized body. */
  readonly conditionalIrradianceStatus32F5a?: 'MODELLED_MS_CONDITIONAL' |
    'UNSUPPORTED_ORBIT_GEOMETRY' | 'HOST_NOT_MAIN_SEQUENCE' |
    'HOST_OUTSIDE_MS_LUMINOSITY_DOMAIN' | 'TOO_YOUNG_OR_FORMING' |
    'EVENT_INVALIDATED_ORBITAL_MODEL';
}
export interface MaterializedPhysicalHistory31Fi3 {
  readonly contractVersion: '31.F.i.3-v1';
  readonly ageYearsCT0: number;
  readonly planet: PhysicalWorldHistory31Fi3;
  readonly moons: readonly PhysicalWorldHistory31Fi3[];
  readonly certification: 'CONDITIONAL_IRRADIANCE_ONLY_NOT_COMPLETE_HABITABILITY';
  readonly playerVisible: false;
}
export interface ResolvedDisruption31Fi3 {
  /** Inclusive dated CT-0 physical event whose environmental effects are unresolved. */
  readonly startYear: number;
  readonly endYear: number;
  readonly sourceRecordKey: string;
}
export interface MaterializedHistoryRequest31Fi3 {
  readonly planet: Planet;
  readonly moons: MoonSystem;
  readonly primary: MaterializedPrimary31Fi3;
  /** Only actual resolved physical events, never generated pseudo-events. */
  readonly unresolvedEvents?: readonly ResolvedDisruption31Fi3[];
}

const YEAR = 1_000_000_000;
const MIN_MODEL_AGE = 100_000_000; // No ZAMS extrapolation into primordial disk.
/** Conservative MODEL assumption for the low-mass pre-main-sequence exclusion.
 * Not a calibrated PMS track. Values for low-mass hosts are deliberately
 * delayed up to 1 Gyr; the missing early interval is explicitly UNKNOWN. */
function modelStartAfterFormation31Fi3(massSolar: number): number {
  return Math.min(1_000_000_000, Math.max(MIN_MODEL_AGE,
    Math.ceil(50_000_000 / Math.pow(massSolar, 1.5))));
}
const SEGMENT_YEARS = 250_000_000;
const MAX_SEGMENTS = 128;
const AU_KM = 149_597_870.7;
const finite = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const nonempty = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0 && s.trim() === s;

type Component = { label: 'A' | 'B' | 'C'; physical: StellarPhysicalProperties; lifetime: StellarLifetimeProfile };
type Bounds = { min: number; max: number };

function bodyKey(planet: Planet): string {
  const l = planet.locator;
  return `G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}/B${l.bodyIndex}`;
}
function modelledLuminosity(component: Component, year: number): number {
  const tms = component.lifetime.evolutionAssessment.mainSequenceLifetimeBillionYears! * YEAR;
  // Explicit MODEL ASSUMPTION, ZAMS (phase-15) anchored. Low mass stars
  // evolve far more slowly in MS luminosity than the solar-analog proxy.
  // This is not a stellar evolutionary track, and broad uncertainty is
  // retained on each interval. Never extend through post-MS or remnants.
  const brighteningFraction = component.physical.initialMassSolar < 0.8 ? 0.10 : 0.80;
  return component.physical.luminositySolar * (1 + brighteningFraction * year / tms);
}
function stellarComponents(planet: Planet, primary: MaterializedPrimary31Fi3): Component[] {
  const starSystem = planet.hostPlanetarySystem.hostStellarSystem;
  const expected = starSystem.primaryReferenceLuminositySolar;
  if (!finite(expected) || expected <= 0 ||
      Math.abs(expected - primary.physical.luminositySolar) > Math.max(1e-8, expected * 1e-8) ||
      !finite(primary.lifetime.ageBillionYears) ||
      Math.abs(primary.lifetime.evolutionAssessment.input.initialMassSolar - primary.physical.initialMassSolar) > 1e-8 ||
      primary.lifetime.evolutionAssessment.evolutionState.name !== starSystem.primaryStar.evolutionState.name) {
    throw new RangeError('31.F.i.3 primary is not the retained physical stellar reference.');
  }
  const components: Component[] = [{ label: 'A', physical: primary.physical, lifetime: primary.lifetime }];
  if (starSystem.secondaryCompanion) components.push({
    label: 'B', physical: starSystem.secondaryCompanion.physicalProperties,
    lifetime: starSystem.secondaryCompanion.lifetimeProfile,
  });
  if (starSystem.tertiaryCompanion) components.push({
    label: 'C', physical: starSystem.tertiaryCompanion.physicalProperties,
    lifetime: starSystem.tertiaryCompanion.lifetimeProfile,
  });
  if (components.length !== ({ SINGLE: 1, BINARY: 2, TRIPLE: 3 } as Record<string, number>)[starSystem.multiplicity.name] ||
      components.some(c => Math.abs(c.lifetime.ageBillionYears - primary.lifetime.ageBillionYears) > 1e-9)) {
    throw new RangeError('31.F.i.3 stellar components must be complete and coeval.');
  }
  return components;
}
function orbitBounds(planet: Planet, components: readonly Component[], moonExcursionAu: number): Bounds[] | null {
  const sys = planet.hostPlanetarySystem.hostStellarSystem;
  const pmin = planet.orbit.periastronAu - moonExcursionAu;
  const pmax = planet.orbit.apoastronAu + moonExcursionAu;
  if (!(pmin > 0) || !finite(pmax)) return null;
  const topology = planet.hostPlanetarySystem.architecture.orbitTopology;
  if (components.length === 1) return topology === PlanetarySystemOrbitTopology.CIRCUMSTELLAR
    ? [{ min: pmin, max: pmax }] : null;
  // S-type worlds do NOT orbit the A+B barycentre; the phase-16/18 P-type
  // triangle inequalities are inapplicable, so preserve UNKNOWN for S-type.
  if (topology !== PlanetarySystemOrbitTopology.CIRCUMBINARY) return null;
  const ab = sys.orbitHierarchy.innerOrbit;
  if (!ab) return null;
  const a = components[0].physical.initialMassSolar;
  const b = components[1].physical.initialMassSolar;
  const pairMass = a + b;
  // Triangle inequality relative to the A+B barycentre, independent of phase.
  const amax = ab.apoastronAu * b / pairMass;
  const bmax = ab.apoastronAu * a / pairMass;
  if (pmin <= Math.max(amax, bmax)) return null;
  const out: Bounds[] = [
    { min: pmin - amax, max: pmax + amax },
    { min: pmin - bmax, max: pmax + bmax },
  ];
  if (components.length === 3) {
    const c = sys.orbitHierarchy.outerOrbit;
    if (!c || c.periastronAu <= pmax) return null;
    // C is described relative to the A+B barycentre in phase 16.4.
    out.push({ min: c.periastronAu - pmax, max: c.apoastronAu + pmax });
  }
  return out.every(b => finite(b.min) && finite(b.max) && b.min > 0 && b.max >= b.min) ? out : null;
}
function validateDisruptions(items: readonly ResolvedDisruption31Fi3[], now: number): void {
  let previous = -1;
  const seen = new Set<string>();
  for (const e of [...items].sort((a, b) => a.startYear - b.startYear)) {
    if (!Number.isSafeInteger(e.startYear) || !Number.isSafeInteger(e.endYear) ||
        e.startYear < 0 || e.endYear < e.startYear || e.endYear > now ||
        !nonempty(e.sourceRecordKey) || seen.has(e.sourceRecordKey) || e.startYear <= previous) {
      throw new RangeError('31.F.i.3 needs distinct dated, bounded disruption records.');
    }
    previous = e.endYear;
    seen.add(e.sourceRecordKey);
  }
}

export class PlanetaryV2DatedPhysics31Fi3 {
  private constructor() {}

  static fromMaterialized(input: MaterializedHistoryRequest31Fi3): MaterializedPhysicalHistory31Fi3 {
    if (!input?.planet || input.moons?.hostPlanet !== input.planet || !input.primary) {
      throw new RangeError('31.F.i.3 requires the SAME materialized planet and moon source.');
    }
    const planet = input.planet;
    const components = stellarComponents(planet, input.primary);
    const age = input.primary.lifetime.ageBillionYears;
    const now = Math.round(age * YEAR);
    if (!Number.isSafeInteger(now) || now < 0) throw new RangeError('31.F.i.3 invalid CT-0 system age.');
    const unresolved = [...(input.unresolvedEvents ?? [])].sort((a, b) => a.startYear - b.startYear);
    validateDisruptions(unresolved, now);
    const key = bodyKey(planet);
    const planetHistory = this.buildWorld(planet, components, key, 'PLANET', 0, unresolved);
    const moons = input.moons.relevantMoons.map(moon => {
      if (moon.hostPlanetLocator !== planet.locator || moon.hostPlanetOrdinal !== planet.planetOrdinal) {
        throw new RangeError('31.F.i.3 refuses foreign lunar identities.');
      }
      const excursionAu = moon.orbit.semiMajorAxisKilometers * (1 + moon.orbit.eccentricity) / AU_KM;
      return this.buildWorld(planet, components, `${key}/M${moon.moonOrdinal - 1}`,
        'MOON', excursionAu, unresolved);
    });
    return Object.freeze({
      contractVersion: '31.F.i.3-v1', ageYearsCT0: now, planet: planetHistory,
      moons: Object.freeze(moons),
      certification: 'CONDITIONAL_IRRADIANCE_ONLY_NOT_COMPLETE_HABITABILITY',
      playerVisible: false,
    });
  }

  private static buildWorld(
    planet: Planet, components: readonly Component[], key: string,
    kind: 'PLANET' | 'MOON', moonExcursionAu: number,
    disruptions: readonly ResolvedDisruption31Fi3[],
  ): PhysicalWorldHistory31Fi3 {
    const now = Math.round(components[0].lifetime.ageBillionYears * YEAR);
    const host = planet.hostPlanetarySystem.hostStellarSystem.multiplicity.name as
      'SINGLE' | 'BINARY' | 'TRIPLE';
    const context: HistoricalHabContext31_7 = Object.freeze({
      bodyKind: kind, bodyKey: key, multiplicity: host,
      time: Object.freeze({ kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: components[0].lifetime.ageBillionYears }),
    });
    const sourceRevision = '31.F.i.3-KEPLER-MS-BOUNDS-32F5a-v2';
    const orbital = orbitBounds(planet, components, moonExcursionAu);
    // Main-sequence-only physical model, and only if *all* hosts currently
    // remain main sequence. Remnant mass loss / stellar transitions require
    // independently time-resolved histories; reference orbits cannot survive
    // them by fiat.
    const baseModelled = orbital !== null && components.every(c =>
      c.lifetime.evolutionAssessment.evolutionState.name === 'MAIN_SEQUENCE' &&
      finite(c.lifetime.evolutionAssessment.mainSequenceLifetimeBillionYears) &&
      c.lifetime.evolutionAssessment.mainSequenceLifetimeBillionYears! * YEAR > now &&
      c.physical.initialMassSolar >= 0.075 && c.physical.initialMassSolar <= 1.2);
    const start = Math.max(...components.map(c =>
      modelStartAfterFormation31Fi3(c.physical.initialMassSolar)),
      Math.ceil(planet.hostPlanetarySystem.formationBlueprint.formationCompletionAgeMillionYears * 1_000_000));
    const modelled = baseModelled && !disruptions.some(e => e.startYear < start);
    const conditionalIrradianceStatus32F5a: NonNullable<PhysicalWorldHistory31Fi3[
      'conditionalIrradianceStatus32F5a']> = orbital === null
      ? 'UNSUPPORTED_ORBIT_GEOMETRY'
      : components.some(c => c.lifetime.evolutionAssessment.evolutionState.name !== 'MAIN_SEQUENCE')
        ? 'HOST_NOT_MAIN_SEQUENCE'
        : !baseModelled ? 'HOST_OUTSIDE_MS_LUMINOSITY_DOMAIN'
          : disruptions.some(e => e.startYear < start) ? 'EVENT_INVALIDATED_ORBITAL_MODEL'
            : start > now ? 'TOO_YOUNG_OR_FORMING'
              : 'MODELLED_MS_CONDITIONAL';
    const records: DatedPhysicalIrradiationSegment31Fi2[] = [];
    const gaps: PhysicalGap31Fi3[] = [];
    if (now >= 0 && start > 0) gaps.push(Object.freeze({
      startYear: 0, endYear: Math.min(now, start - 1), reason: 'PRE_MAIN_SEQUENCE_OR_FORMATION',
    }));
    if (modelled && start <= now) {
      let cursor = start;
      while (cursor <= now && records.length < MAX_SEGMENTS) {
      // We cannot propagate a frozen orbit through an unresolved event.
      // Terminate the model at the FIRST dated disruption; no restart after it.
      const first = disruptions.find(e => e.endYear >= cursor);
      if (first && first.startYear <= cursor) {
        gaps.push(Object.freeze({ startYear: cursor, endYear: now,
          reason: 'UNRESOLVED_EVENT' }));
        cursor = now + 1;
        break;
      }
        const end = Math.min(now, cursor + SEGMENT_YEARS - 1,
          first ? first.startYear - 1 : now);
        if (end <= cursor) {
          gaps.push(Object.freeze({ startYear: cursor, endYear: now,
            reason: 'NOT_MODELLED_STELLAR_ORBITAL_EVOLUTION' }));
          cursor = now + 1;
          break;
        }
        const loYear = cursor;
        const hiYear = end + 1;
        records.push(Object.freeze({
          startYear: cursor, endYear: end,
          hosts: Object.freeze(components.map((c, i) => Object.freeze({
            label: c.label,
            luminositySolar: Object.freeze({
              min: (c.physical.initialMassSolar < 0.8 ? 0.50 : 0.75) * modelledLuminosity(c, loYear),
              max: (c.physical.initialMassSolar < 0.8 ? 1.50 : 1.25) * modelledLuminosity(c, hiYear),
            }),
            distanceAu: Object.freeze({ ...orbital![i] }),
            luminositySource: Object.freeze({
              sourcePhase: '15.1/15.3+31.F.i.3/32.F.5a', sourceModel: c.physical.initialMassSolar < 0.8
                ? 'LOW_MASS_MS_LUMINOSITY_SENSITIVITY_ENVELOPE_NOT_TRACK'
                : 'BOUNDED_MAIN_SEQUENCE_LUMINOSITY_EVOLUTION',
              sourceRecordKey: `${key}/${cursor}/${end}/${c.label}/luminosity`,
              temporalSupport: 'CONTINUOUS_DATED_PHYSICAL_MODEL' as const,
            }),
            orbitalSource: Object.freeze({
              sourcePhase: '16.4/18.3/21.3+31.F.i.3', sourceModel: 'CONDITIONAL_KEPLERIAN_DISTANCE_BOUNDS',
              sourceRecordKey: `${key}/${cursor}/${end}/${c.label}/orbit`,
              temporalSupport: 'CONTINUOUS_DATED_PHYSICAL_MODEL' as const,
              bodyKey: key,
            }),
          }))),
        }));
        cursor = end + 1;
      }
      if (cursor <= now) gaps.push(Object.freeze({ startYear: cursor, endYear: now,
        reason: 'NOT_MODELLED_STELLAR_ORBITAL_EVOLUTION' }));
    } else if (start <= now) {
      gaps.push(Object.freeze({ startYear: start, endYear: now,
        reason: disruptions.some(e => e.startYear < start) ? 'UNRESOLVED_EVENT' :
          orbital ? 'NOT_MODELLED_STELLAR_ORBITAL_EVOLUTION' : 'UNRESOLVED_ORBIT_GEOMETRY' }));
    }
    // Phase 31.F.i.2 performs independent physical L/r² integration and keeps
    // atmospheric, water, thermal and radiation history unresolved.
    const source = Object.freeze({ context, sourceRevision, intervals: Object.freeze(records) });
    const irradiation = PlanetaryHistoricalPhysicalForcingProducer31Fi2.produce(source);
    return Object.freeze({
      bodyKind: kind, bodyKey: key, source, irradiation,
      gaps: Object.freeze(gaps), pressureHistory: 'UNKNOWN', waterHistory: 'UNKNOWN',
      radiationHistory: 'UNKNOWN', dynamicalHistory: 'CONDITIONAL_KEPLERIAN_BOUNDS_NOT_SECULAR_EVOLUTION',
      historicalHabitability: 'UNKNOWN', playerVisible: false,
      conditionalIrradianceStatus32F5a,
    });
  }
}
