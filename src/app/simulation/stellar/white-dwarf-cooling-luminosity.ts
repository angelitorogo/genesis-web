/**
 * 29.1E-H1 — bounded, deterministic WHITE_DWARF cooling projection.
 *
 * Uses the existing 29.2 initial-final mass relation's CURRENT remnant mass.
 * Only the WD cooling age (present stellar age - progenitor terminal age) is
 * employed: no random draws, real-world clock, seed special case or mutation.
 *
 * This is an explicitly APPROXIMATE Mestel-inspired bolometric cooling law:
 * L/Lsun = 0.01 * (Mwd/0.6 Msun) * (t_cool/0.1 Gyr)^(-7/5).
 * The normalization is a coarse GENESIS reference, NOT a cooling-track fit.
 * Envelope type, metallicity, crystallization, neutrino cooling and residual
 * burning are unresolved. Never extrapolate outside the guarded envelope.
 */

export interface WhiteDwarfCoolingProjection {
  readonly coolingAgeBillionYears: number;
  readonly presentLuminositySolar: number;
  readonly model: 'BOUNDED_MESTEL_REFERENCE_V1';
}

export const WD_COOLING_H1_MIN_AGE_GYR = 0.02;
export const WD_COOLING_H1_MAX_AGE_GYR = 13;
export const WD_COOLING_H1_MIN_MASS_SOLAR = 0.46;
export const WD_COOLING_H1_MAX_MASS_SOLAR = 1.20;

export function projectWhiteDwarfCoolingLuminosity(input: Readonly<{
  evolutionStateName: string;
  currentRemnantMassSolar: number | null;
  stellarAgeBillionYears: number | null;
  progenitorTerminalAgeBillionYears: number | null;
}>): WhiteDwarfCoolingProjection | null {
  if (input.evolutionStateName !== 'WHITE_DWARF') return null;
  const mass = input.currentRemnantMassSolar;
  const age = input.stellarAgeBillionYears;
  const terminal = input.progenitorTerminalAgeBillionYears;
  if (mass === null || age === null || terminal === null ||
      !Number.isFinite(mass) || !Number.isFinite(age) || !Number.isFinite(terminal) ||
      mass < WD_COOLING_H1_MIN_MASS_SOLAR || mass > WD_COOLING_H1_MAX_MASS_SOLAR ||
      terminal <= 0 || age < terminal) return null;
  const coolingAgeBillionYears = age - terminal;
  if (coolingAgeBillionYears < WD_COOLING_H1_MIN_AGE_GYR ||
      coolingAgeBillionYears > WD_COOLING_H1_MAX_AGE_GYR) return null;
  const presentLuminositySolar = 0.01 * (mass / 0.6) *
    (coolingAgeBillionYears / 0.1) ** (-7 / 5);
  if (!Number.isFinite(presentLuminositySolar) || presentLuminositySolar <= 0) return null;
  return Object.freeze({
    coolingAgeBillionYears,
    presentLuminositySolar,
    model: 'BOUNDED_MESTEL_REFERENCE_V1' as const,
  });
}
