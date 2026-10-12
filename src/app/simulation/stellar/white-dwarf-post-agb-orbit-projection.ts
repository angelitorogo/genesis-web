/**
 * 29.1E-H3 — read-only, CONDITIONAL test-particle adiabatic mass-loss scenario.
 * Not a reconstructed orbit, stability verdict, or a replacement for canonical
 * or post-supernova dynamics. No simulated clock, seed, persistence or mutation.
 *
 * For approximately isotropic slow loss from an isolated point-mass host,
 * a_final/a_initial = M_initial/M_final and eccentricity stays constant.
 * This is not an automatic claim of survival through giant/AGB phases.
 */
export type WhiteDwarfOrbitContext = 'SINGLE' | 'BINARY_S' | 'TRIPLE_S' | 'P_TYPE';

export interface WhiteDwarfPostAgbOrbitHypothesis {
  readonly status: 'ADIABATIC_CONDITIONAL';
  readonly formationSemiMajorAxisAu: number;
  readonly hypotheticalSemiMajorAxisAu: number;
  readonly hypotheticalEccentricity: number;
  readonly massExpansionFactor: number;
  readonly hypotheticalPeriodYears: number;
  readonly hypotheticalHostMeanInsolationEarth: number | null;
  readonly stabilityResolved: false;
  readonly survivalResolved: false;
  readonly companionHierarchyResolved: false;
}

export function projectWhiteDwarfPostAgbOrbit(input: Readonly<{
  evolutionStateName: string;
  context: WhiteDwarfOrbitContext;
  initialHostMassSolar: number | null;
  currentHostMassSolar: number | null;
  formationSemiMajorAxisAu: number;
  formationEccentricity: number;
  currentWhiteDwarfLuminositySolar: number | null;
  explosiveReconfiguration: boolean;
}>): WhiteDwarfPostAgbOrbitHypothesis | null {
  if (input.evolutionStateName !== 'WHITE_DWARF' ||
      input.context === 'P_TYPE' || input.explosiveReconfiguration) return null;
  const m0 = input.initialHostMassSolar;
  const mf = input.currentHostMassSolar;
  const a0 = input.formationSemiMajorAxisAu;
  const e = input.formationEccentricity;
  if (m0 === null || mf === null ||
      ![m0, mf, a0, e].every(Number.isFinite) || m0 <= 0 || mf <= 0 || mf > m0 ||
      a0 <= 0 || e < 0 || e >= 1) return null;
  const factor = m0 / mf;
  const axis = a0 * factor;
  const period = Math.sqrt(axis ** 3 / mf);
  if (!Number.isFinite(axis) || !Number.isFinite(period) || period <= 0) return null;
  const lum = input.currentWhiteDwarfLuminositySolar;
  const flux = lum !== null && Number.isFinite(lum) && lum >= 0
    ? lum / (axis * axis * Math.sqrt(1 - e * e)) : null;
  return Object.freeze({
    status: 'ADIABATIC_CONDITIONAL' as const,
    formationSemiMajorAxisAu: a0,
    hypotheticalSemiMajorAxisAu: axis,
    hypotheticalEccentricity: e,
    massExpansionFactor: factor,
    hypotheticalPeriodYears: period,
    hypotheticalHostMeanInsolationEarth: flux,
    stabilityResolved: false as const,
    survivalResolved: false as const,
    companionHierarchyResolved: false as const,
  });
}
