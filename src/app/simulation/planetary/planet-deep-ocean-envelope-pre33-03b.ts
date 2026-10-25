import type { Planet } from '../../domain/planetary/planet';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import type { PlanetH2OFormationContractPRE3303A } from '../../domain/planetary/planet-h2o-formation-contract-pre33-03a';
import type { H2OEvolutionResultPRE3303A1 } from '../../domain/planetary/planet-h2o-evolution-contract-pre33-03a1';
import {
  PLANET_DEEP_OCEAN_ENVELOPE_PRE3303B,
  type PlanetDeepOceanEnvelopePRE3303B as Result,
  type ThermalLayerInputPRE3303B,
  type WaterLayerGeometryPRE3303B,
  validatePlanetDeepOceanEnvelopePRE3303B,
} from '../../domain/planetary/planet-deep-ocean-envelope-pre33-03b';
import { PlanetWaterReservoirProjectionPRE3303 } from './planet-water-reservoir-projection-pre33-03';
import { PlanetH2OFormationEnginePRE3303A } from './planet-h2o-formation-engine-pre33-03a';

const ME = 5.9722e24;
const RE = 6_371_000;
const G = 6.67430e-11;
const DENSITIES = Object.freeze([950, 1600]);
const HIGH_PRESSURE_REFERENCE_PA = 2e8; // Reference ONLY; HP ice requires temperature + mineralogy.

/** A dry/mineral-bound reference interior, NOT a solved planetary EOS. */
function dryRadius(metal: number, silicate: number, nonWaterIce: number, nonWaterVolatile: number): number {
  const volume = metal / 7900 + silicate / 3800 + nonWaterIce / 2000 + nonWaterVolatile / 2200;
  if (!Number.isFinite(volume) || volume <= 0) throw new RangeError('PRE-33.03b INVALID_DRY_VOLUME');
  return Math.cbrt(3 * volume / (4 * Math.PI));
}
function layer(m: number, dryMass: number, radius: number, density: number,
  knownSurfaceRadius: number | null): WaterLayerGeometryPRE3303B {
  const outer = Math.cbrt(radius ** 3 + 3 * m / (4 * Math.PI * density));
  const difference = 1/radius - 1/outer;
  // Analytical integral of rho * G * enclosed_mass(r) / r² in a constant-rho shell.
  const selfGravityIntegral = (outer**2 - radius**2)/2 + radius**3*(1/outer - 1/radius);
  const pressure = G*density*dryMass*difference + 4*Math.PI*G*density**2/3*selfGravityIntegral;
  if (![outer, pressure].every(Number.isFinite) || pressure < 0)
    throw new RangeError('PRE-33.03b NONFINITE_RADIAL_SOLUTION');
  return Object.freeze({
    waterDensityKilogramsPerCubicMeter: density, underlyingDryRadiusMeters: radius,
    outerWaterRadiusMeters: outer, waterLayerThicknessMeters: outer-radius,
    baseOverburdenPascal: pressure,
    fitsFrozenPlanetRadius: knownSurfaceRadius === null ? null : outer <= knownSurfaceRadius*(1+1e-6),
  });
}

/**
 * The 0.2–1 GPa pressure bracket is a coarse ice-Ih -> high-pressure-ice
 * transition screening range, NOT an equilibrium water phase diagram.
 * Temperatures must arrive as an independent P–T model. Outside that domain
 * the phase is UNRESOLVED, not automatically ice or liquid.
 */
function thermalScan(reference: WaterLayerGeometryPRE3303B, input: ThermalLayerInputPRE3303B) {
  const count=256, dz=reference.waterLayerThicknessMeters/count;
  const pbase=reference.baseOverburdenPascal;
  let liquid=0, highPressure=0, unresolved=0;
  for(let i=0;i<count;i++) {
    const x=(i+0.5)/count;
    // Linear pressure/temperature interpolation is a labeled reference, NOT solved adiabatic structure.
    const p=pbase*x;
    const t=input.topTemperatureKelvin+(input.baseTemperatureKelvin-input.topTemperatureKelvin)*x;
    if (p > 1e9 || t >= 647.096 || p < 611.657) { unresolved += dz; continue; }
    const melt=p <= 2e8 ? 273.15-22*(p/2e8) : 251.15+104*((p-2e8)/8e8);
    if (t > melt) liquid += dz;
    else if (p >= HIGH_PRESSURE_REFERENCE_PA) highPressure += dz;
    else unresolved += dz; // lower-pressure ice can exist but isn't HP ice.
  }
  return Object.freeze({sourceRecordKey:input.sourceRecordKey,
    modeledLiquidThicknessMeters:liquid, modeledHighPressureSolidThicknessMeters:highPressure,
    unresolvedThicknessMeters:unresolved});
}

/** PRE-33.03b deterministic, read-only *conditional* depth/pressure reconstruction. */
export class PlanetDeepOceanEnvelopeEnginePRE3303B {
  private constructor() {}

  static project(planet: Planet, atmosphere: Atmosphere,
    formation?: PlanetH2OFormationContractPRE3303A,
    evolution?: H2OEvolutionResultPRE3303A1,
    thermal?: ThermalLayerInputPRE3303B): Result {
    const inherited = PlanetWaterReservoirProjectionPRE3303.planet(planet,atmosphere);
    const f = formation ?? PlanetH2OFormationEnginePRE3303A.project(planet,atmosphere);
    if (f.bodyKey !== inherited.bodyKey || f.physicalCT0WaterConserved !== false ||
      f.formationHypothesis !== 'DETERMINISTIC_ENDMEMBER_SPECIATION_NOT_MEASURED')
      throw new RangeError('PRE-33.03b FOREIGN_OR_CERTIFIED_FORMATION');
    if (evolution && (evolution.bodyKey !== inherited.bodyKey || evolution.ct0PhysicalInventoryCertified !== false))
      throw new RangeError('PRE-33.03b FOREIGN_OR_CERTIFIED_HISTORY');
    if (thermal && (!thermal.sourceRecordKey?.trim() ||
      ![thermal.topTemperatureKelvin, thermal.baseTemperatureKelvin]
        .every(t=>Number.isFinite(t)&&t>0)))
      throw new RangeError('PRE-33.03b INVALID_INDEPENDENT_THERMAL_SOURCE');
    const c = planet.internalComposition, deep = inherited.surfaceDomain === 'DEEP_ENVELOPE_NO_SOLID_SURFACE';
    const fd = f.formation;
    const gas = c.gaseousEnvelopeMassEarth*ME;
    const bound = fd.silicateBoundH2OKilograms;
    const otherIce = fd.otherIceCarrierKilograms;
    const otherVolatile = fd.otherVolatileCarrierKilograms;
    const bareDry = (c.metallicCoreMassEarth+c.silicateInteriorMassEarth)*ME+otherIce+otherVolatile;
    let candidate = fd.iceCarrierH2OKilograms+fd.volatileCarrierH2OKilograms;
    const realized = evolution?.state === 'CONDITIONAL_EVOLUTION_COMPLETED';
    if (realized) {
      const pools=evolution.reservoirs;
      const nonGasNonMineral = (['ICE_UNLOCATED','INTERIOR_UNSPECIFIED','SURFACE_ICE',
        'SURFACE_LIQUID','SUBSURFACE_LIQUID','DEEP_ENVELOPE_UNRESOLVED'] as const)
        .reduce((sum,k)=>sum+(pools[k]??0),0);
      if (!Number.isFinite(nonGasNonMineral)|| nonGasNonMineral<0)
        throw new RangeError('PRE-33.03b INVALID_DATED_WATER_POOLS');
      // External delivery and losses mean the 19.5 frozen bulk budget can no
      // longer support a radial fit without an independently updated bulk model.
      if (evolution.massBalance.externalDeliveryKilograms !== 0 ||
          evolution.massBalance.escapedH2OKilograms !== 0 ||
          Math.abs(nonGasNonMineral-candidate)>1e-9*Math.max(1,candidate)) {
        // Do not silently alter CT-0 total mass, density and radius.
        candidate=NaN;
      } else candidate=nonGasNonMineral;
    }
    const m = planet.physicalProperties.massEarth*ME;
    const nominal=candidate>=0 && Number.isFinite(candidate);
    const dry=nominal?m-gas-candidate:bareDry;
    const sourceRadius = deep?null:planet.physicalProperties.radiusEarth*RE;
    const sourcePressure=deep?null:atmosphere.waterInventory.sourceRetainedSurfacePressurePascal;
    const p = sourcePressure===null||sourcePressure===undefined ? null :
      Number.isFinite(sourcePressure)&&sourcePressure>=0 ? sourcePressure : null;
    let geometry: readonly WaterLayerGeometryPRE3303B[]=[];
    let status: Result['candidateWaterShell']['status']=nominal?'NO_MODELED_SHELL_SOURCE':'UPDATED_BULK_REQUIRED';
    if (nominal && candidate>0) {
      const r=dryRadius(c.metallicCoreMassEarth*ME, c.silicateInteriorMassEarth*ME,otherIce,otherVolatile);
      geometry=Object.freeze(DENSITIES.map(d=>layer(candidate,dry,r,d,sourceRadius)));
      status=geometry.some(g=>g.fitsFrozenPlanetRadius===false)?'RADIAL_REFERENCE_INCOMPATIBLE':'CONDITIONAL_GEOMETRY';
      if (status!=='CONDITIONAL_GEOMETRY') geometry=[];
    }
    const phase = status==='CONDITIONAL_GEOMETRY' && thermal
      ? thermalScan(geometry[0],thermal) : null;
    const res: Result = Object.freeze({
      contractVersion:PLANET_DEEP_OCEAN_ENVELOPE_PRE3303B,
      bodyKey:inherited.bodyKey,perspective:'INTERNAL_SIMULATED_REALITY',epoch:'CT0_CONDITIONAL_STRUCTURE',
      classification:deep?'DEEP_GAS_ENVELOPE_NO_SOLID_SURFACE':'SOLID_SURFACE_REFERENCE',
      source:realized?'DATED_H2O_EVOLUTION_CONDITIONAL':'FORMATION_ENDMEMBER_ONLY',
      masses:Object.freeze({planetTotalKilograms:m,dryOrMineralBoundSolidKilograms:nominal?dry:m-gas,
        gasEnvelopeKilograms:gas,modeledH2OShellAvailableKilograms:nominal?candidate:0,
        separatelyCountedMineralBoundH2OKilograms:bound,noDoubleCountingVerified:true}),
      envelope:Object.freeze({kind:'19_5_GAS_CHEMISTRY_UNRESOLVED',
        topOfSolidReferencePressurePascal:p,baseGasEnvelopePressurePascal:null,
        hHeMassKilograms:null,waterVaporInGasEnvelopeKilograms:null,
        hasExposedSolidSurface:!deep}),
      candidateWaterShell:Object.freeze({status,geometryBracket:geometry,
        couldReachHighPressureIceDomain:status==='CONDITIONAL_GEOMETRY'
          ?geometry.some(g=>g.baseOverburdenPascal>=HIGH_PRESSURE_REFERENCE_PA):null,
        phaseBoundaryDepthMeters:null,confirmedLiquidThicknessMeters:null,thermalScenario:phase}),
      currentH2OTotalCertified:false,oceanExistenceCertified:false,observedEvidenceGranted:false,
      habitabilityCertified:false,lifeEvaluated:false,
    });
    const problems=validatePlanetDeepOceanEnvelopePRE3303B(res);
    if(problems.length)throw new RangeError(`PRE-33.03b ${problems.join(',')}`);
    return res;
  }
}
