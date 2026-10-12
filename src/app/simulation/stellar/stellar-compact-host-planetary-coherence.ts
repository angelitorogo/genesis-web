import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import { type SupernovaStellarConsequence } from '../../domain/transient/supernova-stellar-consequence';
import { StellarSupernovaCanonicalEventResolver } from '../transient/stellar-supernova-canonical-event-resolver';
import { StellarSupernovaConsequenceResolver } from '../transient/stellar-supernova-consequence-resolver';
import { StellarBlackHoleEngine } from './stellar-black-hole-engine';
import { type GeneratedMultipleHost, type GeneratedPublicPlanet, type GeneratedSingleHost, type MultihostLabel } from './stellar-multihost-formation';
import { multihostPhysicalSourceKey } from './stellar-multihost-physical-source-key';
import { StellarNeutronStarEngine } from './stellar-neutron-star-engine';
import { stellarWhiteDwarfCurrentMassSolar } from './stellar-white-dwarf-current-mass';
import { projectWhiteDwarfCoolingLuminosity } from './white-dwarf-cooling-luminosity';
import { boundCompanionBolometricInsolationEarth, sumRadiativeBounds, type RadiativeBound } from '../planetary/white-dwarf-conditional-thermal-envelope';
import { PLANETARY_HABITABLE_ZONE_V1_INNER_EFFECTIVE_FLUX_SOLAR, PLANETARY_HABITABLE_ZONE_V1_OUTER_EFFECTIVE_FLUX_SOLAR } from '../planetary/planetary-system-habitable-zone-generator';
import {
  StellarPostSupernovaPlanetaryDynamics,
  type StellarPostSupernovaPlanetaryState,
  type StellarPostSupernovaHierarchyState,
} from './stellar-post-supernova-planetary-dynamics';

const DAYS_PER_JULIAN_YEAR = 365.25;

export type StellarPlanetaryHostLabel = MultihostLabel | 'AB';

export type StellarPlanetaryHostRadiativeRegime =
  | 'CURRENT_STELLAR_SOURCE'
  | 'QUIESCENT_BLACK_HOLE'
  | 'COMPACT_LUMINOSITY_UNMODELED'
  | 'WHITE_DWARF_COOLING_ESTIMATE';

export interface StellarPlanetaryHostCurrentState {
  readonly hostLabel: StellarPlanetaryHostLabel;
  readonly componentEvolutionStates: readonly string[];
  readonly containsCompactRemnant: boolean;
  readonly requiresPostStellarEvolutionReassessment: boolean;
  readonly currentGravitatingMassSolar: number | null;
  readonly currentLuminositySolar: number | null;
  readonly radiativeRegime: StellarPlanetaryHostRadiativeRegime;
  readonly whiteDwarfCoolingAgeBillionYears?: number | null;
}

/**
 * 29.1E-e — read-only bridge from the exact multihost stellar Ground Truth to
 * present-day planetary host parameters. It never mutates or removes the frozen
 * phase-18 planets; 29.1E-g derives post-SN survival/reconfiguration separately.
 */
export class StellarCompactHostPlanetaryCoherence {
  private readonly consequenceByComponent = new Map<number, SupernovaStellarConsequence>();
  private readonly postSupernovaDynamics: StellarPostSupernovaPlanetaryDynamics;

  constructor(private readonly formation: GeneratedMultipleHost) {
    this.postSupernovaDynamics = new StellarPostSupernovaPlanetaryDynamics(formation);
    const components = Object.freeze(formation.components.map(host => Object.freeze({
      componentLabel: componentLabel(host.label),
      designation: `${formation.parentLocator.galacticObjectIndex.toString()}-${host.label}`,
      physicalProperties: host.physical,
      lifetimeProfile: host.lifetime,
    })));
    const events = StellarSupernovaCanonicalEventResolver.resolveGroundTruthSystem(
      Object.freeze({
        generationKey: multihostPhysicalSourceKey(formation.parentGenerationKey),
        innerPeriastronAu: formation.innerOrbit.periastronAu,
        outerPeriastronAu: formation.outerOrbit?.periastronAu ?? null,
      }),
      components,
    );
    for (const consequence of StellarSupernovaConsequenceResolver.resolveEvents(events)) {
      this.consequenceByComponent.set(consequence.componentLabel.code, consequence);
    }
  }

  get postSupernovaHierarchy(): StellarPostSupernovaHierarchyState {
    return this.postSupernovaDynamics.hierarchy;
  }

  planetaryDynamics(entry: GeneratedPublicPlanet): StellarPostSupernovaPlanetaryState {
    return this.postSupernovaDynamics.resolvePlanet(entry);
  }

  stateFor(hostLabel: StellarPlanetaryHostLabel): StellarPlanetaryHostCurrentState {
    if (hostLabel === 'AB') {
      return combineAB(this.stateFor('A'), this.stateFor('B'));
    }
    const host = this.formation.components.find(component => component.label === hostLabel);
    if (host === undefined) throw new RangeError(`Unknown multihost component ${hostLabel}.`);
    return this.componentState(host);
  }

  correctedPeriodYears(hostLabel: StellarPlanetaryHostLabel, semiMajorAxisAu: number): number | null {
    const state = this.stateFor(hostLabel);

    // 29.1E-e.1 regression guard: this bridge exists only for hosts whose
    // present-day compact-remnant state invalidates the frozen progenitor
    // dynamics. Ordinary stellar hosts must retain the canonical generated
    // orbital period exactly; recomputing them from currentMassSolar would
    // silently alter every V2 S-type orbit as the star evolves.
    if (!state.requiresPostStellarEvolutionReassessment) {
      return null;
    }

    const mass = state.currentGravitatingMassSolar;
    if (mass === null || !Number.isFinite(mass) || mass <= 0 || !Number.isFinite(semiMajorAxisAu) || semiMajorAxisAu <= 0) {
      return null;
    }
    return stellarPlanetaryPeriodYearsFromCurrentMass(semiMajorAxisAu, mass);
  }

  correctedPeriodDays(hostLabel: StellarPlanetaryHostLabel, semiMajorAxisAu: number): number | null {
    const years = this.correctedPeriodYears(hostLabel, semiMajorAxisAu);
    return years === null ? null : years * DAYS_PER_JULIAN_YEAR;
  }

  currentMeanInsolationEarth(
    hostLabel: StellarPlanetaryHostLabel,
    semiMajorAxisAu: number,
    eccentricity: number,
  ): number | null {
    const luminosity = this.stateFor(hostLabel).currentLuminositySolar;
    if (luminosity === null || !Number.isFinite(semiMajorAxisAu) || semiMajorAxisAu <= 0 ||
        !Number.isFinite(eccentricity) || eccentricity < 0 || eccentricity >= 1) return null;
    return stellarPlanetaryMeanInsolationEarth(semiMajorAxisAu, eccentricity, luminosity);
  }

  /**
   * H2: conservative bolometric companion flux range for a SINGLE circumstellar
   * host. It is not a phase-resolved solution and never assumes that unknown
   * luminosities are zero. Do not apply to P-type planets: their geometry
   * requires an independent barycentric phase model.
   */
  companionRadiativeBoundEarth(
    hostLabel: MultihostLabel,
    planetarySemiMajorAxisAu: number,
    planetaryEccentricity: number,
  ): RadiativeBound {
    if (!Number.isFinite(planetarySemiMajorAxisAu) || planetarySemiMajorAxisAu <= 0 ||
        !Number.isFinite(planetaryEccentricity) ||
        planetaryEccentricity < 0 || planetaryEccentricity >= 1) {
      throw new RangeError('H2 requires a valid circumstellar planetary orbit.');
    }
    const apo = planetarySemiMajorAxisAu * (1 + planetaryEccentricity);
    const result: RadiativeBound[] = [];
    if (hostLabel === 'A' || hostLabel === 'B') {
      const other = hostLabel === 'A' ? 'B' : 'A';
      result.push(boundCompanionBolometricInsolationEarth({
        luminositySolar: this.stateFor(other).currentLuminositySolar,
        relativePeriastronAu: this.formation.innerOrbit.periastronAu,
        relativeApoastronAu: this.formation.innerOrbit.apoastronAu,
        planetaryApoastronAu: apo,
      }));
      if (this.formation.components.some(component => component.label === 'C') &&
          this.formation.outerOrbit !== null) {
        result.push(boundCompanionBolometricInsolationEarth({
          luminositySolar: this.stateFor('C').currentLuminositySolar,
          relativePeriastronAu: this.formation.outerOrbit.periastronAu,
          relativeApoastronAu: this.formation.outerOrbit.apoastronAu,
          planetaryApoastronAu: apo,
          offsetBoundAu: this.formation.innerOrbit.apoastronAu,
        }));
      }
    } else {
      if (this.formation.outerOrbit === null) {
        return Object.freeze({lowerEarth: 0, upperEarth: null,
          unresolvedSource: true, includesCompanion: false});
      }
      // Triple C is separated from the AB barycenter. The unknown A/B
      // barycentric offsets are conservatively bounded by inner apoastron.
      for (const other of ['A', 'B'] as const) {
        result.push(boundCompanionBolometricInsolationEarth({
          luminositySolar: this.stateFor(other).currentLuminositySolar,
          relativePeriastronAu: this.formation.outerOrbit.periastronAu,
          relativeApoastronAu: this.formation.outerOrbit.apoastronAu,
          planetaryApoastronAu: apo,
          offsetBoundAu: this.formation.innerOrbit.apoastronAu,
        }));
      }
    }
    return sumRadiativeBounds(result);
  }

  private componentState(host: GeneratedSingleHost): StellarPlanetaryHostCurrentState {
    const state = host.stellarSystem.primaryStar.evolutionState.name;
    const compact = state === 'WHITE_DWARF' || state === 'NEUTRON_STAR' || state === 'STELLAR_BLACK_HOLE';
    if (!compact) {
      return Object.freeze({
        hostLabel: host.label,
        componentEvolutionStates: Object.freeze([state]),
        containsCompactRemnant: false,
        requiresPostStellarEvolutionReassessment: false,
        currentGravitatingMassSolar: host.physical.currentMassSolar,
        currentLuminositySolar: host.physical.luminositySolar,
        radiativeRegime: 'CURRENT_STELLAR_SOURCE' as const,
      });
    }

    if (state === 'WHITE_DWARF') {
      // Single authoritative remnant mass from phase 29.2; no second IFMR.
      const mass = stellarWhiteDwarfCurrentMassSolar(host.physical, host.lifetime);
      const cooling = projectWhiteDwarfCoolingLuminosity({
        evolutionStateName: state,
        currentRemnantMassSolar: mass,
        stellarAgeBillionYears: host.lifetime.ageBillionYears,
        progenitorTerminalAgeBillionYears: host.lifetime.terminalAgeBillionYears,
      });
      return Object.freeze({
        hostLabel: host.label,
        componentEvolutionStates: Object.freeze([state]),
        containsCompactRemnant: true,
        requiresPostStellarEvolutionReassessment: true,
        currentGravitatingMassSolar: positiveOrNull(mass),
        currentLuminositySolar: cooling?.presentLuminositySolar ?? null,
        whiteDwarfCoolingAgeBillionYears: cooling?.coolingAgeBillionYears ?? null,
        radiativeRegime: cooling === null
          ? 'COMPACT_LUMINOSITY_UNMODELED' as const
          : 'WHITE_DWARF_COOLING_ESTIMATE' as const,
      });
    }

    const consequence = this.consequenceByComponent.get(componentLabel(host.label).code) ?? null;
    if (state === 'STELLAR_BLACK_HOLE') {
      const direct = consequence === null
        ? StellarBlackHoleEngine.fromExistingStar(host.stellarSystem.primaryStar, host.physical, host.lifetime)
        : null;
      const mass = consequence?.postEventStellarMassSolar ?? direct?.massSolar ?? null;
      return Object.freeze({
        hostLabel: host.label,
        componentEvolutionStates: Object.freeze([state]),
        containsCompactRemnant: true,
        requiresPostStellarEvolutionReassessment: true,
        currentGravitatingMassSolar: positiveOrNull(mass),
        currentLuminositySolar: 0,
        radiativeRegime: 'QUIESCENT_BLACK_HOLE' as const,
      });
    }

    const neutron = consequence === null
      ? StellarNeutronStarEngine.fromExistingStar(host.stellarSystem.primaryStar, host.physical, host.lifetime)
      : null;
    const mass = consequence?.postEventStellarMassSolar ?? neutron?.massSolar ?? null;
    return Object.freeze({
      hostLabel: host.label,
      componentEvolutionStates: Object.freeze([state]),
      containsCompactRemnant: true,
      requiresPostStellarEvolutionReassessment: true,
      currentGravitatingMassSolar: positiveOrNull(mass),
      currentLuminositySolar: null,
      radiativeRegime: 'COMPACT_LUMINOSITY_UNMODELED' as const,
    });
  }
}

export function stellarPlanetaryPeriodYearsFromCurrentMass(
  semiMajorAxisAu: number,
  currentHostMassSolar: number,
): number {
  if (!Number.isFinite(semiMajorAxisAu) || semiMajorAxisAu <= 0 ||
      !Number.isFinite(currentHostMassSolar) || currentHostMassSolar <= 0) {
    throw new RangeError('Current-host Kepler period requires positive finite semi-major axis and mass.');
  }
  return Math.sqrt(semiMajorAxisAu ** 3 / currentHostMassSolar);
}

export function stellarPlanetaryPeriodDaysFromCurrentMass(
  semiMajorAxisAu: number,
  currentHostMassSolar: number,
): number {
  return stellarPlanetaryPeriodYearsFromCurrentMass(semiMajorAxisAu, currentHostMassSolar) *
    DAYS_PER_JULIAN_YEAR;
}

export function stellarPlanetaryMeanInsolationEarth(
  semiMajorAxisAu: number,
  eccentricity: number,
  currentHostLuminositySolar: number,
): number {
  if (!Number.isFinite(semiMajorAxisAu) || semiMajorAxisAu <= 0 ||
      !Number.isFinite(eccentricity) || eccentricity < 0 || eccentricity >= 1 ||
      !Number.isFinite(currentHostLuminositySolar) || currentHostLuminositySolar < 0) {
    throw new RangeError('Current-host insolation requires a valid orbit and non-negative finite luminosity.');
  }
  return currentHostLuminositySolar /
    (semiMajorAxisAu ** 2 * Math.sqrt(1 - eccentricity ** 2));
}


/** Solar-spectrum reference flux boundaries ONLY; WD SED and dynamical
 * stability still require separate assessment. Not a habitability verdict. */
export function currentHostRadiativeReferenceZoneAu(
  luminositySolar: number | null,
): Readonly<{ innerAu: number; outerAu: number }> | null {
  if (luminositySolar === null || !Number.isFinite(luminositySolar) || luminositySolar <= 0) return null;
  return Object.freeze({
    innerAu: Math.sqrt(luminositySolar / PLANETARY_HABITABLE_ZONE_V1_INNER_EFFECTIVE_FLUX_SOLAR),
    outerAu: Math.sqrt(luminositySolar / PLANETARY_HABITABLE_ZONE_V1_OUTER_EFFECTIVE_FLUX_SOLAR),
  });
}

function combineAB(
  a: StellarPlanetaryHostCurrentState,
  b: StellarPlanetaryHostCurrentState,
): StellarPlanetaryHostCurrentState {
  const mass = a.currentGravitatingMassSolar !== null && b.currentGravitatingMassSolar !== null
    ? a.currentGravitatingMassSolar + b.currentGravitatingMassSolar : null;
  const luminosity = a.currentLuminositySolar !== null && b.currentLuminositySolar !== null
    ? a.currentLuminositySolar + b.currentLuminositySolar : null;
  const compact = a.containsCompactRemnant || b.containsCompactRemnant;
  return Object.freeze({
    hostLabel: 'AB',
    componentEvolutionStates: Object.freeze([...a.componentEvolutionStates, ...b.componentEvolutionStates]),
    containsCompactRemnant: compact,
    requiresPostStellarEvolutionReassessment:
      a.requiresPostStellarEvolutionReassessment || b.requiresPostStellarEvolutionReassessment,
    currentGravitatingMassSolar: positiveOrNull(mass),
    currentLuminositySolar: luminosity,
    // AB combines luminosities but does not assign one WD cooling age.
    whiteDwarfCoolingAgeBillionYears: null,
    radiativeRegime: luminosity === null
      ? 'COMPACT_LUMINOSITY_UNMODELED' as const
      : luminosity === 0 && compact
        ? 'QUIESCENT_BLACK_HOLE' as const
        : a.radiativeRegime === 'WHITE_DWARF_COOLING_ESTIMATE' ||
          b.radiativeRegime === 'WHITE_DWARF_COOLING_ESTIMATE'
          ? 'WHITE_DWARF_COOLING_ESTIMATE' as const
          : 'CURRENT_STELLAR_SOURCE' as const,
  });
}

function componentLabel(label: MultihostLabel): StellarSystemComponentLabel {
  switch (label) {
    case 'A': return StellarSystemComponentLabel.A;
    case 'B': return StellarSystemComponentLabel.B;
    case 'C': return StellarSystemComponentLabel.C;
  }
}

function positiveOrNull(value: number | null): number | null {
  return value !== null && Number.isFinite(value) && value > 0 ? value : null;
}
