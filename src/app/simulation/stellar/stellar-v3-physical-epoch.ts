import type { StellarV3PhysicalEpoch, StellarV3EpochComponent, StellarV3OrbitEpoch } from
  '../../domain/stellar/stellar-v3-physical-epoch';
import type { HistoricalSourceBridgePRE3303A2B3B } from
  './stellar-multihost-historical-bridge-pre33-03a2b3b';

function reject(message: string): never { throw new RangeError(`GENESIS_V3_EPOCH_${message}`); }

/**
 * The only safe present-day physical mass available for a compact remnant
 * is the result of its existing canonical 27.1 / 27.4 physical model.
 * Progenitor values from 15.1 never become an evolved current-mass claim.
 * The planetary and S/P orbit snapshots are never mutated.
 */
export class StellarV3PhysicalEpochEngine {
  private constructor() {}

  static inspect(bridge: Pick<HistoricalSourceBridgePRE3303A2B3B, 'candidate' | 'manifest'>): StellarV3PhysicalEpoch {
    const stars = bridge.candidate.components;
    const remnants = bridge.manifest.remnantProfiles;
    if (stars.length < 2 || stars.length > 3 || remnants.length !== stars.length ||
        bridge.manifest.legacyMutated || bridge.manifest.gamePublicationAllowed) {
      return reject('INVALID_MULTIPLE_SOURCE_OR_PUBLICATION');
    }
    const referenceAge = stars[0]!.lifetime.ageBillionYears;
    if (!Number.isFinite(referenceAge) || referenceAge < 0) return reject('INVALID_SYSTEM_AGE');
    const components: StellarV3EpochComponent[] = [];
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i]!;
      const remnant = remnants[i]!;
      const age = star.lifetime.ageBillionYears;
      const initial = star.physical.initialMassSolar;
      if (star.label !== remnant.component ||
          Math.abs(age - referenceAge) > 1e-9 ||
          !Number.isFinite(initial) || initial <= 0 ||
          remnant.state !== star.stellarSystem.primaryStar.evolutionState.name) {
        return reject('COMPONENT_IDENTITY_AGE_OR_STATE_DISAGREES');
      }
      const compact = remnant.remnantType === 'NEUTRON_STAR' ||
        remnant.remnantType === 'STELLAR_BLACK_HOLE';
      if (compact && (remnant.status !== 'PROJECTED_CT0_FROM_REVISED_SOURCE' ||
          remnant.remnantMassSolar === null ||
          !Number.isFinite(remnant.remnantMassSolar) ||
          remnant.remnantMassSolar <= 0 || remnant.remnantMassSolar > initial ||
          remnant.sourceFormationAgeGyr === null ||
          remnant.sourceFormationAgeGyr > age)) {
        return reject('INVALID_COMPACT_MASS_OR_TERMINAL_EPOCH');
      }
      const gravity = compact ? remnant.remnantMassSolar : null;
      const terminal = compact ? remnant.sourceFormationAgeGyr : null;
      components.push(Object.freeze({
        label: star.label, evolutionState: remnant.state,
        formationAgeGyr: age, progenitorInitialMassSolar: initial,
        resolvedCurrentGravityMassSolar: gravity,
        gravityMassProvenance: compact ? 'COMPACT_REMNANT_27_1_OR_27_4' as const :
          remnant.remnantType === 'WHITE_DWARF' ||
          remnant.state === 'GIANT' || remnant.state === 'SUPERGIANT' ? 'UNRESOLVED_EVOLVED_MASS' as const :
          'REFERENCE_PROGENITOR_NOT_CURRENT' as const,
        terminalEventAgeGyr: terminal,
        massLossAtTerminalSolar: gravity === null ? null : initial - gravity,
        currentBolometricLuminositySolar: null,
        radiationStatus: 'EVOLVED_CT0_SPECTRUM_NOT_SOURCE_BACKED' as const,
      }));
    }
    const candidate = bridge.candidate;
    const orbit = (
      branch: StellarV3OrbitEpoch['branch'],
      semi: number, e: number, m: number,
    ): StellarV3OrbitEpoch => {
      if (!Number.isFinite(semi) || semi <= 0 || !Number.isFinite(e) || e < 0 || e >= 1 ||
          !Number.isFinite(m) || m <= 0) return reject('INVALID_INITIAL_ORBIT');
      return Object.freeze({branch, referenceSemimajorAxisAu: semi,
        referenceEccentricity: e, referenceMassSolar: m,
        resolvedCurrentSemimajorAxisAu: null,
        resolvedCurrentEccentricity: null,
        status: 'DATED_ORBITAL_MASS_LOSS_AND_IMPULSE_NOT_RECONSTRUCTED' as const});
    };
    const a = components[0]!, b = components[1]!;
    const orbits: StellarV3OrbitEpoch[] = [orbit('INNER_AB',
      candidate.innerOrbit.semiMajorAxisAu, candidate.innerOrbit.eccentricity,
      a.progenitorInitialMassSolar + b.progenitorInitialMassSolar)];
    if (components.length === 3) {
      if (!candidate.outerOrbit) return reject('MISSING_TRIPLE_OUTER_ORBIT');
      orbits.push(orbit('OUTER_AB_C', candidate.outerOrbit.semiMajorAxisAu,
        candidate.outerOrbit.eccentricity, a.progenitorInitialMassSolar +
        b.progenitorInitialMassSolar + components[2]!.progenitorInitialMassSolar));
    } else if (candidate.outerOrbit) return reject('UNEXPECTED_BINARY_OUTER_ORBIT');
    for (const entry of candidate.publicPlanets) {
      const formedAtMyr = entry.planet.hostPlanetarySystem.formationBlueprint
        .formationCompletionAgeMillionYears;
      if (!Number.isFinite(formedAtMyr) || formedAtMyr > referenceAge * 1000 + 1e-9 ||
          entry.atmosphere.hostPlanet !== entry.planet ||
          entry.moonSystem.hostPlanet !== entry.planet) {
        return reject('UNMATURE_OR_MIXED_PLANETARY_SOURCE');
      }
    }
    return Object.freeze({
      contract: 'PRE-33.03a.2b.3b/V3_PHYSICAL_EPOCH/v1' as const,
      components: Object.freeze(components), orbits: Object.freeze(orbits),
      presentDayHistoryCompleteness: 'NOT_ESTABLISHED' as const,
      publishable: false as const,
      unresolved: Object.freeze([
        '15: evolved current luminosity, spectrum and winds lack common physically dated source',
        '16: orbital mass-loss response and recoil are not integrated or established',
        '29/31/32: dated transients, irradiation and planetary effects are not rebuilt',
        'V3: creation, navigation, catalogue and persistent-science routes are not publicly wired',
      ]),
    });
  }
}
