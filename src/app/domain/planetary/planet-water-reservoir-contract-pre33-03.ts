import type { EnvironmentalEvidencePRE3301 } from './environmental-physical-contract-pre33-01';

/**
 * PRE-33.03: exclusively internal CT-0 water/material budget for a planet.
 * Crucial distinction: a 19.5 material bucket is NOT pure H2O, and a 20.7
 * fraction/coverage is NOT an inventory of kilograms. No life or discovery.
 */
export const PLANET_WATER_RESERVOIR_CONTRACT_PRE3303 = 'PRE-33.03/CT0/v1' as const;
export type WaterEvidencePRE3303 = EnvironmentalEvidencePRE3301<number>;

export interface PlanetWaterReservoirContractPRE3303 {
  readonly contractVersion: typeof PLANET_WATER_RESERVOIR_CONTRACT_PRE3303;
  readonly perspective: 'INTERNAL_SIMULATED_REALITY';
  readonly epoch: 'CT0';
  readonly bodyKey: string;
  readonly surfaceDomain: 'SOLID_SURFACE_MODEL' | 'DEEP_ENVELOPE_NO_SOLID_SURFACE';
  readonly sourcePressureStatus: string;
  readonly constituents: Readonly<{
    /** 19.5 physical coarse material buckets; neither is H2O mass. */
    condensedIceBearingMaterialKilograms: WaterEvidencePRE3303;
    volatileRichInteriorMaterialKilograms: WaterEvidencePRE3303;
    gaseousEnvelopeMaterialKilograms: WaterEvidencePRE3303;
  }>;
  readonly water: Readonly<{
    /** Relative V1 proxy ONLY, no unit conversion to kg. */
    inheritedWaterInventoryIndex01: WaterEvidencePRE3303;
    estimatedSurfaceLiquidCoverage01: WaterEvidencePRE3303;
    estimatedSurfaceIceCoverage01: WaterEvidencePRE3303;
    /** ALL require species-resolved water inventory/phase+depth; currently unknown. */
    totalH2OMassKilograms: WaterEvidencePRE3303;
    surfaceLiquidMassKilograms: WaterEvidencePRE3303;
    subsurfaceLiquidMassKilograms: WaterEvidencePRE3303;
    interiorBoundWaterMassKilograms: WaterEvidencePRE3303;
    deepEnvelopeLiquidLayerMassKilograms: WaterEvidencePRE3303;
  }>;
  readonly atmosphere: Readonly<{
    /** 20.4 equilibrium mixture, approximate hydrostatic well-mixed column only. */
    effectiveWaterVaporPartialPressurePascal: WaterEvidencePRE3303;
    approximateWaterVaporColumnKilogramsPerSquareMeter: WaterEvidencePRE3303;
    approximateGlobalWaterVaporMassKilograms: WaterEvidencePRE3303;
    /** Condensation diagnostic NOT a deposition or liquid-ocean mass. */
    condensedH2OEquivalentPressurePascal: WaterEvidencePRE3303;
    independentMassFluxAtmosphereCertified: false;
  }>;
  readonly deepEnvelope: Readonly<{
    physicalTotalEnvelopeMassKilograms: WaterEvidencePRE3303;
    pressureTemperatureProfile: WaterEvidencePRE3303;
    waterPhaseBoundaryDepthMeters: WaterEvidencePRE3303;
    waterChemicalSpeciation: 'UNRESOLVED';
  }>;
  readonly physicalWaterMassConserved: false;
  readonly habitableEnvironmentCertified: false;
  readonly lifeEvaluated: false;
}

/** No malformed or promoted data may be exposed to downstream biology. */
export function validatePlanetWaterReservoirPRE3303(
  c: PlanetWaterReservoirContractPRE3303,
): readonly string[] {
  const issues: string[] = [];
  if (c.contractVersion !== PLANET_WATER_RESERVOIR_CONTRACT_PRE3303 ||
      c.perspective !== 'INTERNAL_SIMULATED_REALITY' || c.epoch !== 'CT0' ||
      !c.bodyKey || c.lifeEvaluated !== false || c.physicalWaterMassConserved !== false ||
      c.habitableEnvironmentCertified !== false) issues.push('INVALID_INTERNAL_CONTRACT');
  if (c.atmosphere.independentMassFluxAtmosphereCertified !== false)
    issues.push('ATMOSPHERE_PROMOTED_TO_INDEPENDENT');
  if (c.deepEnvelope.waterChemicalSpeciation !== 'UNRESOLVED')
    issues.push('UNSUPPORTED_DEEP_SPECIATION');
  const all = [ ...Object.values(c.constituents), ...Object.values(c.water),
    c.atmosphere.effectiveWaterVaporPartialPressurePascal,
    c.atmosphere.approximateWaterVaporColumnKilogramsPerSquareMeter,
    c.atmosphere.approximateGlobalWaterVaporMassKilograms,
    c.atmosphere.condensedH2OEquivalentPressurePascal,
    c.deepEnvelope.physicalTotalEnvelopeMassKilograms,
    c.deepEnvelope.pressureTemperatureProfile, c.deepEnvelope.waterPhaseBoundaryDepthMeters ];
  for (const e of all) {
    if (!e || !['MODELLED_CT0', 'CONDITIONAL_SCENARIO', 'UNRESOLVED', 'NOT_APPLICABLE'].includes(e.state)) {
      issues.push('INVALID_EVIDENCE'); continue;
    }
    if (e.state === 'UNRESOLVED' || e.state === 'NOT_APPLICABLE') {
      if (e.value !== null) issues.push('UNKNOWN_HAS_VALUE');
    } else if (typeof e.value !== 'number' || !Number.isFinite(e.value) || e.value < 0) {
      issues.push('INVALID_NUMERIC_VALUE');
    }
  }
  if (c.surfaceDomain === 'DEEP_ENVELOPE_NO_SOLID_SURFACE') {
    if (c.water.estimatedSurfaceLiquidCoverage01.state !== 'NOT_APPLICABLE' ||
        c.water.estimatedSurfaceIceCoverage01.state !== 'NOT_APPLICABLE' ||
        c.atmosphere.approximateWaterVaporColumnKilogramsPerSquareMeter.state !== 'NOT_APPLICABLE' ||
        c.atmosphere.approximateGlobalWaterVaporMassKilograms.state !== 'NOT_APPLICABLE' ||
        c.atmosphere.effectiveWaterVaporPartialPressurePascal.state !== 'NOT_APPLICABLE' ||
        c.atmosphere.condensedH2OEquivalentPressurePascal.state !== 'NOT_APPLICABLE')
      issues.push('DEEP_ENVELOPE_FAKE_SURFACE');
    if (c.deepEnvelope.physicalTotalEnvelopeMassKilograms.state !== 'MODELLED_CT0')
      issues.push('DEEP_ENVELOPE_MISSING_BULK_MASS');
  } else if (c.surfaceDomain === 'SOLID_SURFACE_MODEL') {
    if (c.deepEnvelope.pressureTemperatureProfile.state !== 'NOT_APPLICABLE' ||
        c.deepEnvelope.waterPhaseBoundaryDepthMeters.state !== 'NOT_APPLICABLE')
      issues.push('SOLID_SURFACE_FAKE_DEEP_PROFILE');
  } else issues.push('UNKNOWN_SURFACE_DOMAIN');
  // Neither 19.5 material buckets nor 20.7 indices resolve H2O kilograms.
  for (const e of [c.water.totalH2OMassKilograms, c.water.surfaceLiquidMassKilograms,
    c.water.subsurfaceLiquidMassKilograms, c.water.interiorBoundWaterMassKilograms,
    c.water.deepEnvelopeLiquidLayerMassKilograms]) {
    if (e.state !== 'UNRESOLVED') issues.push('UNSUPPORTED_H2O_MASS_PROMOTION');
  }
  return Object.freeze(issues);
}
