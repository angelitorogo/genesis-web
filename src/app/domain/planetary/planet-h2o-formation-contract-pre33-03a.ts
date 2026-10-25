/**
 * PRE-33.03a — internal, hypothesis-qualified, species-resolved H2O formation budget.
 * This is NOT an observed composition nor an established CT-0 ocean. In contrast
 * to 19.5 (material *classes*) it makes the assumed chemical H2O proportions
 * explicit and checks conservation within EACH carrier class.
 *
 * Never infer biological compatibility or persist this into player knowledge.
 */
export const PLANET_H2O_FORMATION_PRE3303A = 'PRE-33.03a/formation-endmembers/v1' as const;

export type PlanetH2OThermalWindowPRE3303A =
  | 'SURFACE_LIQUID_REFERENCE_POSSIBLE'
  | 'SURFACE_LIQUID_REFERENCE_DISFAVORED'
  | 'NOT_RESOLVED';

export interface PlanetH2OFormationContractPRE3303A {
  readonly contractVersion: typeof PLANET_H2O_FORMATION_PRE3303A;
  readonly perspective: 'INTERNAL_SIMULATED_REALITY';
  readonly epoch: 'CT0_CARRIER_ENDMEMBER_SCENARIO';
  readonly bodyKey: string;
  readonly formationHypothesis: 'DETERMINISTIC_ENDMEMBER_SPECIATION_NOT_MEASURED';
  readonly formation: Readonly<{
    /** The physical 19.5 carrier classes, in kilograms. */
    iceBearingCarrierKilograms: number;
    volatileRichCarrierKilograms: number;
    silicateCarrierKilograms: number;
    /** Fractions sampled in isolated PRE-33.03a seed domain; model assumptions. */
    iceH2OFraction01: number;
    volatileH2OFraction01: number;
    silicateBoundH2OFraction01: number;
    iceCarrierH2OKilograms: number;
    volatileCarrierH2OKilograms: number;
    silicateBoundH2OKilograms: number;
    otherIceCarrierKilograms: number;
    otherVolatileCarrierKilograms: number;
    drySilicateCarrierKilograms: number;
    modeledFormationH2OKilograms: number;
  }>;
  readonly current: Readonly<{
    /** Quantified H2O IN THE FROZEN CT-0 19.5 CARRIER BUCKETS, under
     * the explicitly sampled conditional endmember chemistry; excludes any
     * independently specified atmospheric/deep-envelope H2O. Not global total. */
    conditionalH2OInMatureCarriersKilograms: number;
    /** Cannot identify the global CT-0 total without coupling other reservoirs. */
    retainedH2OKilograms: null;
    surfaceLiquidH2OKilograms: null;
    surfaceIceH2OKilograms: null;
    subsurfaceLiquidH2OKilograms: null;
    interiorBoundH2OKilograms: null;
    atmosphericVaporH2OKilograms: null;
    escapedH2OKilograms: null;
    surfaceWindow: PlanetH2OThermalWindowPRE3303A;
    /** Only a conditional 20.4 column, not a conserved water reservoir. */
    conditionalVaporReferenceKilograms: number | null;
  }>;
  readonly closedReference: Readonly<{
    /** Strictly hypothetical no-loss transfer of formation H2O to vapor. */
    status: 'CONDITIONAL_BALANCE' | 'NO_COUPLED_VAPOR_SOURCE';
    referenceVaporKilograms: number | null;
    unallocatedNonVaporKilograms: number | null;
    /** Unallocated includes unknown phases/depth; NEVER treated as ocean. */
    assumptions: 'NO_LOSS_HYPOTHESIS_NOT_CT0_PHYSICS';
  }>;
  readonly physicalCT0WaterConserved: false;
  readonly habitableEnvironmentCertified: false;
  readonly lifeEvaluated: false;
}

function near(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-11 * Math.max(1, Math.abs(a), Math.abs(b));
}

export function validatePlanetH2OFormationPRE3303A(
  c: PlanetH2OFormationContractPRE3303A,
): readonly string[] {
  const errors: string[] = [];
  if (c.contractVersion !== PLANET_H2O_FORMATION_PRE3303A ||
      c.perspective !== 'INTERNAL_SIMULATED_REALITY' ||
      c.epoch !== 'CT0_CARRIER_ENDMEMBER_SCENARIO' || !c.bodyKey ||
      c.formationHypothesis !== 'DETERMINISTIC_ENDMEMBER_SPECIATION_NOT_MEASURED' ||
      c.physicalCT0WaterConserved !== false ||
      c.habitableEnvironmentCertified !== false || c.lifeEvaluated !== false)
    errors.push('INTERNAL_CONTRACT_OR_PROVENANCE');
  const f = c.formation;
  const keys = Object.values(f);
  if (keys.some(v => typeof v !== 'number' || !Number.isFinite(v) || v < 0))
    errors.push('NONFINITE_OR_NEGATIVE_MASS');
  for (const ratio of [f.iceH2OFraction01, f.volatileH2OFraction01, f.silicateBoundH2OFraction01])
    if (ratio > 1) errors.push('INVALID_CHEMICAL_RATIO');
  if (!near(f.iceBearingCarrierKilograms, f.iceCarrierH2OKilograms + f.otherIceCarrierKilograms) ||
      !near(f.volatileRichCarrierKilograms, f.volatileCarrierH2OKilograms + f.otherVolatileCarrierKilograms) ||
      !near(f.silicateCarrierKilograms, f.silicateBoundH2OKilograms + f.drySilicateCarrierKilograms) ||
      !near(f.modeledFormationH2OKilograms,
        f.iceCarrierH2OKilograms + f.volatileCarrierH2OKilograms + f.silicateBoundH2OKilograms) ||
      !near(f.iceCarrierH2OKilograms, f.iceBearingCarrierKilograms * f.iceH2OFraction01) ||
      !near(f.volatileCarrierH2OKilograms, f.volatileRichCarrierKilograms * f.volatileH2OFraction01) ||
      !near(f.silicateBoundH2OKilograms, f.silicateCarrierKilograms * f.silicateBoundH2OFraction01))
    errors.push('FORMATION_SPECIES_MASS_NOT_CONSERVED');
  const ct = c.current;
  if (!Number.isFinite(ct.conditionalH2OInMatureCarriersKilograms) ||
      !near(ct.conditionalH2OInMatureCarriersKilograms, f.modeledFormationH2OKilograms))
    errors.push('CT0_CARRIER_ENDMEMBER_NOT_CONSERVED');
  if ([ct.retainedH2OKilograms, ct.surfaceLiquidH2OKilograms, ct.surfaceIceH2OKilograms,
       ct.subsurfaceLiquidH2OKilograms, ct.interiorBoundH2OKilograms,
       ct.atmosphericVaporH2OKilograms, ct.escapedH2OKilograms].some(v => v !== null))
    errors.push('UNSUPPORTED_CT0_WATER_PROMOTION');
  if (!['SURFACE_LIQUID_REFERENCE_POSSIBLE','SURFACE_LIQUID_REFERENCE_DISFAVORED','NOT_RESOLVED']
      .includes(ct.surfaceWindow)) errors.push('INVALID_SURFACE_WINDOW');
  if (ct.conditionalVaporReferenceKilograms !== null &&
      (!Number.isFinite(ct.conditionalVaporReferenceKilograms) || ct.conditionalVaporReferenceKilograms < 0))
    errors.push('INVALID_CONDITIONAL_VAPOR');
  const r = c.closedReference;
  if (r.assumptions !== 'NO_LOSS_HYPOTHESIS_NOT_CT0_PHYSICS') errors.push('REFERENCE_PROMOTED_TO_CT0');
  if (r.status === 'CONDITIONAL_BALANCE') {
    if (r.referenceVaporKilograms === null || r.unallocatedNonVaporKilograms === null ||
        !Number.isFinite(r.referenceVaporKilograms) || !Number.isFinite(r.unallocatedNonVaporKilograms) ||
        r.referenceVaporKilograms < 0 || r.unallocatedNonVaporKilograms < 0 ||
        !near(r.referenceVaporKilograms + r.unallocatedNonVaporKilograms,
          f.modeledFormationH2OKilograms) ||
        !near(r.referenceVaporKilograms, ct.conditionalVaporReferenceKilograms ?? NaN))
      errors.push('REFERENCE_WATER_NOT_CONSERVED');
  } else if (r.status !== 'NO_COUPLED_VAPOR_SOURCE' ||
      r.referenceVaporKilograms !== null || r.unallocatedNonVaporKilograms !== null) {
    errors.push('INVALID_REFERENCE_BALANCE');
  }
  return Object.freeze(errors);
}
