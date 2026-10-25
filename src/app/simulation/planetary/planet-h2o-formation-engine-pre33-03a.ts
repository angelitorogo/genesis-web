import type { Planet } from '../../domain/planetary/planet';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import {
  PLANET_H2O_FORMATION_PRE3303A,
  type PlanetH2OFormationContractPRE3303A,
  type PlanetH2OThermalWindowPRE3303A,
  validatePlanetH2OFormationPRE3303A,
} from '../../domain/planetary/planet-h2o-formation-contract-pre33-03a';
import { PlanetWaterReservoirProjectionPRE3303 } from './planet-water-reservoir-projection-pre33-03';

const EARTH_MASS_KG = 5.9722e24;
const TRIPLE_POINT_K = 273.16;
const TRIPLE_POINT_PA = 611.657;

/** Reproducible no-draw composition priors, isolated from all frozen V1/V2 streams. */
function formationUnit(seed: string, channel: number): number {
  if (!/^[0-9A-F]{32}$/.test(seed) || !Number.isInteger(channel))
    throw new RangeError('PRE-33.03a requires a valid frozen BodySeed.');
  // Non-cryptographic FNV-1a, domain-separated. No PRNG state, order dependency or seed exceptions.
  const data = `GENESIS-PRE-33.03a-H2O-FORMATION-v1/${channel}/${seed}`;
  let hash = 2166136261;
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function finiteNonNegative(x: number, name: string): void {
  if (!Number.isFinite(x) || x < 0) throw new RangeError(`PRE-33.03a invalid ${name}.`);
}

/** Only a reference surface WINDOW; no ocean/ice mass or historical continuity. */
function referenceWindow(tempK: number | null, pressurePa: number | null): PlanetH2OThermalWindowPRE3303A {
  if (tempK === null || pressurePa === null || !Number.isFinite(tempK) ||
      !Number.isFinite(pressurePa) || tempK <= 0 || pressurePa < 0 ||
      pressurePa > 1e6 || tempK > 647.096) return 'NOT_RESOLVED';
  if (pressurePa < TRIPLE_POINT_PA || tempK < TRIPLE_POINT_K)
    return 'SURFACE_LIQUID_REFERENCE_DISFAVORED';
  // Clausius-Clapeyron local approximate boiling threshold (limited to <= 1 MPa).
  const inverseBoiling = 1 / 373.15 - (8.314462618 / 40650) * Math.log(pressurePa / 101325);
  if (!Number.isFinite(inverseBoiling) || inverseBoiling <= 0) return 'NOT_RESOLVED';
  const boilingK = 1 / inverseBoiling;
  return tempK <= boilingK ? 'SURFACE_LIQUID_REFERENCE_POSSIBLE'
    : 'SURFACE_LIQUID_REFERENCE_DISFAVORED';
}

/**
 * PRE-33.03a: a chemical H2O formation END-MEMBER from physical 19.5 carriers.
 * It does not invert 20.7 indices, call a PRNG, or rewrite current planet physics.
 * Unlike a CT-0 claim, source H2O is explicit deterministic *model chemistry*,
 * is a conditional H2O species assignment to the mature 19.5 CT-0 carrier
 * masses, not a directly inferred formation or present-day global H2O total.
 * Redistribution, atmosphere and loss/depth remain unknown.
 */
export class PlanetH2OFormationEnginePRE3303A {
  private constructor() {}

  static project(planet: Planet, atmosphere: Atmosphere): PlanetH2OFormationContractPRE3303A {
    const inherited = PlanetWaterReservoirProjectionPRE3303.planet(planet, atmosphere);
    const carrier = planet.internalComposition;
    const seed = planet.seed;
    if (seed.kind !== 'body') throw new RangeError('PRE-33.03a requires a canonical body seed');
    const ice = carrier.condensedIceMassEarth * EARTH_MASS_KG;
    const volatile = carrier.volatileRichInteriorMassEarth * EARTH_MASS_KG;
    const silicate = carrier.silicateInteriorMassEarth * EARTH_MASS_KG;
    for (const [n, v] of [['ice',ice],['volatile',volatile],['silicate',silicate]] as const)
      finiteNonNegative(v, n);
    // These intervals are openly declared chemical endmember priors, NOT 19.5 measured species.
    // H2O shares condensed carriers with e.g. CO2/NH3/CH4 and minerals with non-water oxides.
    const fIce = 0.55 + 0.35 * formationUnit(seed.normalizedValue, 0);
    const fVolatile = 0.06 + 0.30 * formationUnit(seed.normalizedValue, 1);
    const fHydrated = 0.00005 + 0.003 * formationUnit(seed.normalizedValue, 2);
    const waterIce = ice * fIce;
    const waterVolatile = volatile * fVolatile;
    const waterBound = silicate * fHydrated;
    const formationH2O = waterIce + waterVolatile + waterBound;
    if (!Number.isFinite(formationH2O)) throw new RangeError('PRE-33.03a H2O source exceeds finite domain.');

    const column = inherited.atmosphere.approximateGlobalWaterVaporMassKilograms;
    const vapor = column.state === 'CONDITIONAL_SCENARIO' ? column.value : null;
    const tolerance = Math.max(1, formationH2O) * 1e-10;
    // The phase-20 column is an independent *conditional* atmosphere reference;
    // use it in a hypothetical no-loss transfer only if its mass fits the carrier budget.
    const canCloseReference = vapor !== null && vapor <= formationH2O + tolerance;
    const allocatedVapor = canCloseReference ? Math.min(vapor, formationH2O) : null;
    const remaining = allocatedVapor === null ? null : formationH2O - allocatedVapor;
    const p = inherited.sourcePressureStatus === 'CONSISTENT_DEEP_ENVELOPE'
      ? null : inherited.atmosphere.effectiveWaterVaporPartialPressurePascal.state === 'NOT_APPLICABLE'
        ? null : atmosphere.waterInventory.sourceRetainedSurfacePressurePascal;
    const temp = atmosphere.climateState.meanSurfaceTemperatureKelvin;
    const key = inherited.bodyKey;
    const out: PlanetH2OFormationContractPRE3303A = {
      contractVersion: PLANET_H2O_FORMATION_PRE3303A,
      perspective: 'INTERNAL_SIMULATED_REALITY', epoch: 'CT0_CARRIER_ENDMEMBER_SCENARIO',
      bodyKey: key, formationHypothesis: 'DETERMINISTIC_ENDMEMBER_SPECIATION_NOT_MEASURED',
      formation: Object.freeze({
        iceBearingCarrierKilograms: ice, volatileRichCarrierKilograms: volatile,
        silicateCarrierKilograms: silicate,
        iceH2OFraction01: fIce, volatileH2OFraction01: fVolatile,
        silicateBoundH2OFraction01: fHydrated,
        iceCarrierH2OKilograms: waterIce, volatileCarrierH2OKilograms: waterVolatile,
        silicateBoundH2OKilograms: waterBound,
        otherIceCarrierKilograms: ice - waterIce,
        otherVolatileCarrierKilograms: volatile - waterVolatile,
        drySilicateCarrierKilograms: silicate - waterBound,
        modeledFormationH2OKilograms: formationH2O,
      }),
      current: Object.freeze({
        conditionalH2OInMatureCarriersKilograms: formationH2O,
        retainedH2OKilograms: null, surfaceLiquidH2OKilograms: null,
        surfaceIceH2OKilograms: null, subsurfaceLiquidH2OKilograms: null,
        interiorBoundH2OKilograms: null, atmosphericVaporH2OKilograms: null,
        escapedH2OKilograms: null,
        surfaceWindow: inherited.surfaceDomain === 'SOLID_SURFACE_MODEL'
          ? referenceWindow(temp, p) : 'NOT_RESOLVED',
        conditionalVaporReferenceKilograms: vapor,
      }),
      closedReference: Object.freeze({
        status: canCloseReference ? 'CONDITIONAL_BALANCE' : 'NO_COUPLED_VAPOR_SOURCE',
        referenceVaporKilograms: allocatedVapor,
        unallocatedNonVaporKilograms: remaining,
        assumptions: 'NO_LOSS_HYPOTHESIS_NOT_CT0_PHYSICS',
      }),
      physicalCT0WaterConserved: false, habitableEnvironmentCertified: false, lifeEvaluated: false,
    };
    const problems = validatePlanetH2OFormationPRE3303A(out);
    if (problems.length) throw new RangeError(`PRE-33.03a H2O formation balance: ${problems.join(',')}`);
    return Object.freeze(out);
  }
}
