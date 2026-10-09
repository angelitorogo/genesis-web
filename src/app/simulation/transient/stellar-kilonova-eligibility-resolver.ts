import { type CompactBinaryMember, type CompactBinarySystem } from '../../domain/stellar/compact-binary-system';
import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import { KilonovaProgenitorProfile } from '../../domain/transient/kilonova-progenitor';
import { KilonovaStellarLineage, KilonovaStellarLineageStage } from '../../domain/transient/kilonova-stellar-lineage';
import { KilonovaType } from '../../domain/transient/kilonova-type';
import { KilonovaEventEngine } from './kilonova-event-engine';

const MAX_MERGER_DELAY_YEARS = 13.8e9;
const G = 6.67430e-11;
const C = 299_792_458;
const SOLAR_MASS_KG = 1.98847e30;

export interface StellarKilonovaDesignations {
  readonly A: string;
  readonly B: string;
}

/**
 * 29.3: only the EXISTING compact A-B pair can produce a canonical kilonova.
 *
 * NS-BH deserves a deliberately stricter boundary: point 27.1 does not model
 * Kerr spin or spin-orbit orientation. Both quantities strongly control whether
 * the neutron star is disrupted outside the ISCO. Therefore a real NS-BH pair
 * is surfaced as an unresolved candidate, never assigned a synthetic seed spin.
 * The laboratory may still exercise an explicit, declared NS-BH spin fixture.
 */
export class StellarKilonovaEligibilityResolver {
  private constructor() {}

  static resolve(
    binary: CompactBinarySystem | null,
    designations: StellarKilonovaDesignations,
  ): KilonovaStellarLineage | null {
    if (binary === null || (binary.kind !== 'NS_NS' && binary.kind !== 'NS_BH')) return null;

    const inspiralYears = eccentricInspiralReferenceYears(
      binary.referenceCircularInspiralYears,
      binary.originalInnerOrbit.eccentricity,
    );
    if (!Number.isFinite(inspiralYears) || inspiralYears <= 0 || inspiralYears > MAX_MERGER_DELAY_YEARS) return null;

    const currentAge = Math.max(binary.primary.currentAgeBillionYears, binary.secondary.currentAgeBillionYears);
    if (binary.kind === 'NS_NS') {
      const nsRadius = (binary.primary.referenceRadiusKm + binary.secondary.referenceRadiusKm) / 2;
      const progenitor = new KilonovaProgenitorProfile(
        KilonovaType.BINARY_NEUTRON_STAR,
        binary.primary.massSolar,
        binary.secondary.massSolar,
        nsRadius,
        binary.originalInnerOrbit.semiMajorAxisAu,
        binary.originalInnerOrbit.eccentricity,
        inspiralYears,
        null,
        null,
      );
      return new KilonovaStellarLineage(
        KilonovaStellarLineageStage.FUTURE_NS_NS_MERGER,
        StellarSystemComponentLabel.A,
        StellarSystemComponentLabel.B,
        designations.A,
        designations.B,
        currentAge,
        progenitor,
        KilonovaEventEngine.deriveProfile(progenitor),
      );
    }

    // No canonical NS-BH kilonova is invented while the real BH spin/orientation
    // remains outside the stellar Ground Truth contract.
    return new KilonovaStellarLineage(
      KilonovaStellarLineageStage.NS_BH_SPIN_UNRESOLVED,
      StellarSystemComponentLabel.A,
      StellarSystemComponentLabel.B,
      designations.A,
      designations.B,
      currentAge,
      null,
      null,
    );
  }
}

export function eccentricInspiralReferenceYears(circularYears: number, eccentricity: number): number {
  if (!Number.isFinite(circularYears) || circularYears <= 0 || !Number.isFinite(eccentricity) || eccentricity < 0 || eccentricity >= 1) {
    throw new RangeError('Invalid Peters inspiral inputs.');
  }
  const e2 = eccentricity * eccentricity;
  const factor = (1 - e2) ** 3.5 / (1 + 73 / 24 * e2 + 37 / 96 * e2 * e2);
  return circularYears * factor;
}

/** Explicit-spin helper reserved for declared laboratory/validated inputs. */
export function kerrIscoRadiusGravitationalUnits(spin: number): number {
  const a = clamp(spin, -0.98, 0.98);
  const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
  const z2 = Math.sqrt(3 * a * a + z1 * z1);
  return 3 + z2 - Math.sign(a || 1) * Math.sqrt((3 - z1) * (3 + z1 + 2 * z2));
}

/** Explicit-spin helper reserved for declared laboratory/validated inputs. */
export function kilonovaTidalDisruptionRatio(neutron: CompactBinaryMember, blackHole: CompactBinaryMember, spin: number): number {
  const tidalRadiusKm = neutron.referenceRadiusKm * (blackHole.massSolar / neutron.massSolar) ** (1 / 3);
  const gravitationalRadiusKm = G * blackHole.massSolar * SOLAR_MASS_KG / (C * C) / 1000;
  const iscoKm = kerrIscoRadiusGravitationalUnits(spin) * gravitationalRadiusKm;
  return tidalRadiusKm / iscoKm;
}

function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
