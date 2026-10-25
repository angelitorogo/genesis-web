import type { Planet } from '../../domain/planetary/planet';
import type { Atmosphere } from '../../domain/planetary/atmosphere';

/**
 * PRE-33.02 — Conciliación física NO MUTANTE de las presiones 20.3/20.4/20.6/20.7.
 * 20.3 = columna retenida antes de condensar; 20.4 = gas efectivo tras
 * condensación multiespecie; 20.6 y 20.7 consumen esa columna efectiva.
 * La diferencia NO es pérdida atmosférica adicional ni masa de océano.
 * Ninguna de estas columnas acredita por sí sola un balance independiente
 * de masa+flujos, una atmósfera observada, habitabilidad o vida.
 */
export type PressureCoherenceStatusPRE3302 =
  | 'CONSISTENT_PHASE_PARTITION'
  | 'CONSISTENT_NO_CHANGE'
  | 'CONSISTENT_DEEP_ENVELOPE'
  | 'CONSISTENT_VACUUM'
  | 'UNRESOLVED_PHASE_BASIS'
  | 'INCONSISTENT';

export type PressureCoherenceIssuePRE3302 =
  | 'HOST_OR_LOCATOR_MISMATCH'
  | 'NONFINITE_OR_NEGATIVE_PRESSURE'
  | 'MISSING_CONDENSATION_DIAGNOSTIC'
  | 'SOURCE_PRESSURE_MISMATCH'
  | 'EFFECTIVE_PRESSURE_MISMATCH'
  | 'CLIMATE_HANDOFF_MISMATCH'
  | 'WATER_HANDOFF_MISMATCH'
  | 'NON_CONVERGED_PHASE_MODEL'
  | 'GAS_PRESSURE_INCREASED_AFTER_CONDENSATION'
  | 'CONDENSATION_BUDGET_MISMATCH'
  | 'SPECIES_PARTIAL_PRESSURE_MISMATCH'
  | 'SPECIES_DUPLICATED'
  | 'GAS_MOLE_FRACTIONS_MISMATCH'
  | 'SOLID_SURFACE_PRESSURE_ON_DEEP_ENVELOPE';

export interface PlanetAtmosphericPressureCoherencePRE3302 {
  readonly contractVersion: 'PRE-33.02/v1';
  readonly status: PressureCoherenceStatusPRE3302;
  readonly issues: readonly PressureCoherenceIssuePRE3302[];
  readonly sourceRetainedPressure20_3Pascal: number | null;
  readonly effectiveGasPressure20_4Pascal: number | null;
  readonly climatePressure20_6Pascal: number | null;
  readonly waterPressure20_7Pascal: number | null;
  readonly condensedEquivalentPressurePascal: number | null;
  readonly pressureChangePascal: number | null;
  readonly phaseBasis: 'MULTISPECIES_20_4' | 'NO_SOLID_GAS_COLUMN' | 'UNRESOLVED';
  /** Always false: 20.x columns are model estimates, not independent mass/flux balances. */
  readonly independentPhysicalAtmosphereCertified: false;
  readonly lifeEvaluated: false;
}

const CT = 1e-6;
const PRESSURE_ABSOLUTE_TOLERANCE_PASCAL = 1e-7;
function comparable(a: number, b: number): boolean {
  return Math.abs(a - b) <= Math.max(PRESSURE_ABSOLUTE_TOLERANCE_PASCAL,
    CT * Math.max(Math.abs(a), Math.abs(b)));
}
function validPressure(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0;
}
function sharedLocator(p: Planet, a: Atmosphere): boolean {
  const r = a.retentionState.bodyLocator;
  const w = a.waterInventory.bodyLocator;
  const pl = p.locator;
  return a.hostPlanet === p && a.retentionState.planetOrdinal === p.planetOrdinal &&
    a.waterInventory.planetOrdinal === p.planetOrdinal &&
    a.climateVariabilityState.planetOrdinal === p.planetOrdinal &&
    a.climateState.planetOrdinal === p.planetOrdinal &&
    r.galaxyIndex === pl.galaxyIndex && r.sectorKey === pl.sectorKey &&
    r.galacticObjectIndex === pl.galacticObjectIndex && r.bodyIndex === pl.bodyIndex &&
    w.galaxyIndex === pl.galaxyIndex && w.sectorKey === pl.sectorKey &&
    w.galacticObjectIndex === pl.galacticObjectIndex && w.bodyIndex === pl.bodyIndex;
}

export function reconcilePlanetAtmosphericPressurePRE3302(
  planet: Planet, atmosphere: Atmosphere,
): PlanetAtmosphericPressureCoherencePRE3302 {
  const issues: PressureCoherenceIssuePRE3302[] = [];
  const add = (issue: PressureCoherenceIssuePRE3302): void => {
    if (!issues.includes(issue)) issues.push(issue);
  };
  if (!sharedLocator(planet, atmosphere)) add('HOST_OR_LOCATOR_MISMATCH');

  const source = atmosphere.retentionState.retainedSurfacePressurePascal;
  const climate = atmosphere.climateVariabilityState.sourceRetainedSurfacePressurePascal;
  const water = atmosphere.waterInventory.sourceRetainedSurfacePressurePascal;
  const phase = atmosphere.greenhouseEffect.condensableEquilibriumState;
  const vapor = atmosphere.greenhouseEffect.waterVaporEquilibriumState;
  const effective = phase?.effectiveSurfacePressurePascal ?? vapor?.effectiveSurfacePressurePascal ?? source;
  const deep = atmosphere.climateState.meanSurfaceTemperatureKelvin === null;
  const noSurface = source === null;
  const required = [source, effective, climate, water];
  if (required.some(p => p !== null && !validPressure(p))) add('NONFINITE_OR_NEGATIVE_PRESSURE');
  if (noSurface !== deep || deep && (effective !== null || climate !== null || water !== null))
    add('SOLID_SURFACE_PRESSURE_ON_DEEP_ENVELOPE');

  let condensed: number | null = null;
  if (phase) {
    const pSource = phase.sourceSurfacePressurePascal;
    const pEffective = phase.effectiveSurfacePressurePascal;
    if (!validPressure(pSource) || !validPressure(pEffective)) add('NONFINITE_OR_NEGATIVE_PRESSURE');
    if (validPressure(source) && validPressure(pSource) && !comparable(source, pSource))
      add('SOURCE_PRESSURE_MISMATCH');
    if (validPressure(effective) && validPressure(pEffective) && !comparable(effective, pEffective))
      add('EFFECTIVE_PRESSURE_MISMATCH');
    if (!phase.converged || vapor && !vapor.converged) add('NON_CONVERGED_PHASE_MODEL');
    if (validPressure(source) && validPressure(effective) &&
        effective > source && !comparable(source, effective))
      add('GAS_PRESSURE_INCREASED_AFTER_CONDENSATION');

    const species = phase.speciesEquilibria;
    const gases = new Set<string>();
    condensed = 0;
    for (const s of species) {
      if (gases.has(s.gas)) add('SPECIES_DUPLICATED');
      gases.add(s.gas);
      if (![s.sourcePartialPressurePascal, s.effectivePartialPressurePascal,
        s.condensedPartialPressurePascal].every(validPressure)) {
        add('NONFINITE_OR_NEGATIVE_PRESSURE');
        continue;
      }
      condensed += s.condensedPartialPressurePascal;
      if (!comparable(s.sourcePartialPressurePascal - s.effectivePartialPressurePascal,
            s.condensedPartialPressurePascal)) add('SPECIES_PARTIAL_PRESSURE_MISMATCH');
      const sourceFrac = atmosphere.retentionState.retainedGasComponents.find(c => c.gas === s.gas)?.moleFraction01 ?? 0;
      if (validPressure(source) && !comparable(source * sourceFrac, s.sourcePartialPressurePascal))
        add('SPECIES_PARTIAL_PRESSURE_MISMATCH');
    }
    if (validPressure(source) && validPressure(effective) && condensed !== null &&
        !comparable(source - effective, condensed)) add('CONDENSATION_BUDGET_MISMATCH');
    const sum = phase.effectiveGasComponents.reduce((a, c) => a + c.moleFraction01, 0);
    if (!Number.isFinite(sum) || phase.effectiveGasComponents.some(c =>
      !Number.isFinite(c.moleFraction01) || c.moleFraction01 < 0 || c.moleFraction01 > 1) ||
      phase.effectiveGasComponents.length > 0 && Math.abs(sum - 1) > CT)
      add('GAS_MOLE_FRACTIONS_MISMATCH');
  } else if (validPressure(source) && source > 0 && !deep) {
    // No gas-phase source partition can establish WHY two positive columns differ.
    if (!validPressure(effective) || !comparable(source, effective) ||
        validPressure(climate) && !comparable(source, climate) ||
        validPressure(water) && !comparable(source, water))
      add('MISSING_CONDENSATION_DIAGNOSTIC');
  }

  if (vapor) {
    if (validPressure(source) && !comparable(vapor.sourceSurfacePressurePascal, source))
      add('SOURCE_PRESSURE_MISMATCH');
    if (validPressure(effective) && !comparable(vapor.effectiveSurfacePressurePascal, effective))
      add('EFFECTIVE_PRESSURE_MISMATCH');
  }
  if (validPressure(effective) && validPressure(climate) && !comparable(effective, climate) ||
      (effective === null) !== (climate === null)) add('CLIMATE_HANDOFF_MISMATCH');
  if (validPressure(effective) && validPressure(water) && !comparable(effective, water) ||
      (effective === null) !== (water === null)) add('WATER_HANDOFF_MISMATCH');

  const status: PressureCoherenceStatusPRE3302 = issues.length ? 'INCONSISTENT' :
    deep ? 'CONSISTENT_DEEP_ENVELOPE' :
    source === 0 && effective === 0 ? 'CONSISTENT_VACUUM' :
    !phase ? 'UNRESOLVED_PHASE_BASIS' :
    validPressure(source) && validPressure(effective) && !comparable(source, effective)
      ? 'CONSISTENT_PHASE_PARTITION' : 'CONSISTENT_NO_CHANGE';
  return Object.freeze({
    contractVersion: 'PRE-33.02/v1' as const, status,
    issues: Object.freeze(issues),
    sourceRetainedPressure20_3Pascal: validPressure(source) ? source : null,
    effectiveGasPressure20_4Pascal: validPressure(effective) ? effective : null,
    climatePressure20_6Pascal: validPressure(climate) ? climate : null,
    waterPressure20_7Pascal: validPressure(water) ? water : null,
    condensedEquivalentPressurePascal: condensed,
    pressureChangePascal: validPressure(source) && validPressure(effective) ? source - effective : null,
    phaseBasis: phase ? 'MULTISPECIES_20_4' as const : deep ? 'NO_SOLID_GAS_COLUMN' as const : 'UNRESOLVED' as const,
    independentPhysicalAtmosphereCertified: false as const,
    lifeEvaluated: false as const,
  });
}
