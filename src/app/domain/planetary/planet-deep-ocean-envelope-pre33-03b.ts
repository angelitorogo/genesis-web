/**
 * PRE-33.03b — model of *possible* water-bearing layers and gas envelopes.
 * Not a discovery, player knowledge, or a certified CT-0 water inventory.
 * The inherited 19.5 ice/volatile buckets are NOT pure H2O and the 20.7
 * surface-coverage index is NOT a water mass or ocean depth.
 */
export const PLANET_DEEP_OCEAN_ENVELOPE_PRE3303B = 'PRE-33.03b/deep-layers/v1' as const;

export interface WaterLayerGeometryPRE3303B {
  /** Assumed constant-density layer; EOS/endmember, not a measured structure. */
  readonly waterDensityKilogramsPerCubicMeter: number;
  readonly underlyingDryRadiusMeters: number;
  readonly outerWaterRadiusMeters: number;
  readonly waterLayerThicknessMeters: number;
  /** Lithostatic/hydrostatic pressure *added* by this candidate shell. */
  readonly baseOverburdenPascal: number;
  readonly fitsFrozenPlanetRadius: boolean | null;
}

export interface ThermalLayerInputPRE3303B {
  readonly sourceRecordKey: string;
  /** Independent model of T at the top and bottom of the postulated H2O shell. */
  readonly topTemperatureKelvin: number;
  readonly baseTemperatureKelvin: number;
}

export interface PlanetDeepOceanEnvelopePRE3303B {
  readonly contractVersion: typeof PLANET_DEEP_OCEAN_ENVELOPE_PRE3303B;
  readonly bodyKey: string;
  readonly perspective: 'INTERNAL_SIMULATED_REALITY';
  readonly epoch: 'CT0_CONDITIONAL_STRUCTURE';
  readonly classification: 'SOLID_SURFACE_REFERENCE' | 'DEEP_GAS_ENVELOPE_NO_SOLID_SURFACE';
  readonly source: 'FORMATION_ENDMEMBER_ONLY' | 'DATED_H2O_EVOLUTION_CONDITIONAL';
  readonly masses: Readonly<{
    planetTotalKilograms: number;
    dryOrMineralBoundSolidKilograms: number;
    /** Bulk 19.5 gas; chemistry H/He/H2O NOT resolved. */
    gasEnvelopeKilograms: number;
    modeledH2OShellAvailableKilograms: number;
    separatelyCountedMineralBoundH2OKilograms: number;
    noDoubleCountingVerified: true;
  }>;
  readonly envelope: Readonly<{
    kind: '19_5_GAS_CHEMISTRY_UNRESOLVED';
    topOfSolidReferencePressurePascal: number | null;
    baseGasEnvelopePressurePascal: null;
    hHeMassKilograms: null;
    waterVaporInGasEnvelopeKilograms: null;
    hasExposedSolidSurface: boolean;
  }>;
  readonly candidateWaterShell: Readonly<{
    status: 'NO_MODELED_SHELL_SOURCE' | 'UPDATED_BULK_REQUIRED' | 'RADIAL_REFERENCE_INCOMPATIBLE' | 'CONDITIONAL_GEOMETRY';
    geometryBracket: readonly WaterLayerGeometryPRE3303B[];
    /** Water-rich shell is an endmember; NOT necessarily a real ocean. */
    couldReachHighPressureIceDomain: boolean | null;
    phaseBoundaryDepthMeters: null;
    confirmedLiquidThicknessMeters: null;
    /** Optional coarse P-T estimate; conditional even with an independent thermal source. */
    thermalScenario: Readonly<{
      sourceRecordKey: string;
      modeledLiquidThicknessMeters: number;
      modeledHighPressureSolidThicknessMeters: number;
      unresolvedThicknessMeters: number;
    }> | null;
  }>;
  readonly currentH2OTotalCertified: false;
  readonly oceanExistenceCertified: false;
  readonly observedEvidenceGranted: false;
  readonly habitabilityCertified: false;
  readonly lifeEvaluated: false;
}

const close = (a: number, b: number) =>
  Math.abs(a - b) <= 1e-8 * Math.max(1, Math.abs(a), Math.abs(b));

export function validatePlanetDeepOceanEnvelopePRE3303B(p: PlanetDeepOceanEnvelopePRE3303B): readonly string[] {
  const errors: string[] = [];
  if (p.contractVersion !== PLANET_DEEP_OCEAN_ENVELOPE_PRE3303B || !p.bodyKey ||
    p.perspective !== 'INTERNAL_SIMULATED_REALITY' || p.epoch !== 'CT0_CONDITIONAL_STRUCTURE' ||
    p.currentH2OTotalCertified !== false || p.oceanExistenceCertified !== false ||
    p.observedEvidenceGranted !== false || p.habitabilityCertified !== false || p.lifeEvaluated !== false)
    errors.push('PROVENANCE_OR_CERTIFICATION_LEAK');
  const m = p.masses;
  if (![m.planetTotalKilograms, m.dryOrMineralBoundSolidKilograms, m.gasEnvelopeKilograms,
    m.modeledH2OShellAvailableKilograms, m.separatelyCountedMineralBoundH2OKilograms]
    .every(v => Number.isFinite(v) && v >= 0) || !m.noDoubleCountingVerified ||
    !close(m.planetTotalKilograms,
      m.dryOrMineralBoundSolidKilograms + m.modeledH2OShellAvailableKilograms + m.gasEnvelopeKilograms))
    errors.push('MASS_BUDGET_OR_DOUBLE_COUNTING');
  const deep = p.classification === 'DEEP_GAS_ENVELOPE_NO_SOLID_SURFACE';
  if (p.envelope.kind !== '19_5_GAS_CHEMISTRY_UNRESOLVED' ||
    p.envelope.hasExposedSolidSurface === deep || p.envelope.hHeMassKilograms !== null ||
    p.envelope.waterVaporInGasEnvelopeKilograms !== null ||
    p.envelope.baseGasEnvelopePressurePascal !== null ||
    (deep && p.envelope.topOfSolidReferencePressurePascal !== null))
    errors.push('GAS_ENVELOPE_MASQUERADING_AS_OCEAN_OR_ATMOSPHERE');
  const shell = p.candidateWaterShell;
  if (shell.phaseBoundaryDepthMeters !== null || shell.confirmedLiquidThicknessMeters !== null)
    errors.push('UNSUPPORTED_PHASE_CERTIFICATION');
  if (shell.status !== 'CONDITIONAL_GEOMETRY' &&
      (shell.geometryBracket.length || shell.thermalScenario !== null || shell.couldReachHighPressureIceDomain !== null))
    errors.push('UNRESOLVED_GEOMETRY_PROMOTED');
  if (shell.status === 'CONDITIONAL_GEOMETRY') {
    if (shell.geometryBracket.length !== 2 || shell.couldReachHighPressureIceDomain === null)
      errors.push('INVALID_GEOMETRY_BRACKET');
    for (const g of shell.geometryBracket) {
      if (![g.waterDensityKilogramsPerCubicMeter, g.underlyingDryRadiusMeters,
        g.outerWaterRadiusMeters, g.waterLayerThicknessMeters, g.baseOverburdenPascal]
        .every(v => Number.isFinite(v) && v >= 0) ||
        !close(g.waterLayerThicknessMeters, g.outerWaterRadiusMeters - g.underlyingDryRadiusMeters) ||
        (deep && g.fitsFrozenPlanetRadius !== null)) errors.push('INVALID_GEOMETRY');
    }
  }
  if (shell.thermalScenario) {
    const t = shell.thermalScenario;
    if (!t.sourceRecordKey || ![t.modeledLiquidThicknessMeters,
      t.modeledHighPressureSolidThicknessMeters, t.unresolvedThicknessMeters]
      .every(v => Number.isFinite(v) && v >= 0) ||
      !close(t.modeledLiquidThicknessMeters + t.modeledHighPressureSolidThicknessMeters +
        t.unresolvedThicknessMeters, shell.geometryBracket[0]?.waterLayerThicknessMeters ?? NaN))
      errors.push('INVALID_THERMAL_LAYER_BUDGET');
  }
  return Object.freeze(errors);
}
