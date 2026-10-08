import { StellarEvolutionState } from '../../domain/stellar/stellar-evolution-state';
import { type StellarLifetimeProfile } from '../../domain/stellar/stellar-lifetime-profile';
import { type StellarPhysicalProperties } from '../../domain/stellar/stellar-physical-properties';

/**
 * Canonical GENESIS estimate for the present-day mass of a formed white dwarf.
 *
 * The phase-15 StellarPhysicalProperties object intentionally keeps the
 * zero-age/reference mass. Once the lifetime state is WHITE_DWARF, consumers
 * that need gravitating/remnant mass must use this projection instead of the
 * progenitor mass.
 */
export function stellarWhiteDwarfCurrentMassSolar(
  physical: StellarPhysicalProperties,
  lifetime: StellarLifetimeProfile,
): number | null {
  if (lifetime.evolutionAssessment.evolutionState.name !== StellarEvolutionState.WHITE_DWARF.name) {
    return null;
  }

  const initialMassSolar = lifetime.evolutionAssessment.input.initialMassSolar;
  if (Math.abs(physical.initialMassSolar - initialMassSolar) > 1e-12 * Math.max(1, initialMassSolar)) {
    throw new RangeError('White-dwarf current mass requires matching physical and lifetime progenitor mass.');
  }

  return estimateWhiteDwarfCurrentMassSolar(initialMassSolar);
}

/** Initial-final mass relation shared by nova, Ia eligibility, fiches and dynamics. */
export function estimateWhiteDwarfCurrentMassSolar(initialMassSolar: number): number {
  if (!Number.isFinite(initialMassSolar) || initialMassSolar <= 0) {
    throw new RangeError('initialMassSolar must be finite and greater than 0.');
  }

  return clamp(0.109 * initialMassSolar + 0.394, 0.46, 1.35);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
