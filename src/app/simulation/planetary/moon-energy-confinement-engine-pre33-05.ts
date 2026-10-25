import type { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type { MoonTidalState } from '../../domain/planetary/moon-tidal-state';
import type { MoonFormationInventory32F1d } from '../../domain/planetary/moon-formation-inventory-32-f-1d';
import type { MoonInteriorStructure32F2b } from '../../domain/planetary/moon-interior-structure-32-f-2b';
import type { MoonOceanReality32F2c } from '../../domain/planetary/moon-ocean-reality-32-f-2c';
import type { MoonEnergyConfinementPRE3305 } from '../../domain/planetary/moon-energy-confinement-pre33-05';

const G = 6.67430e-11;
const EARTH_MASS = 5.9722e24;
const EARTH_RADIUS = 6371000;
const DAY = 86400;
const YEAR = 365.25 * DAY;
const K_ICE = 2.5;
const LIMITS = Object.freeze([
  'LOVE_NUMBER_USES_HOMOGENEOUS_INCOMPRESSIBLE_ELASTIC_ENDMEMBERS_NOT_A_LAYERED_VISCOELASTIC_SOLVER',
  'SHEAR_MODULUS_3E9_TO_8E10_PA_AND_QUALITY_FACTOR_25_TO_500_ARE_MATERIAL_PRIORS_NOT_OBSERVATIONS',
  'SMALL_E_SYNCHRONOUS_ECCENTRICITY_TIDE_FORMULA_OMITS_OBLIQUITY_LIBRATION_RESONANCES_AND_FREQUENCY_DEPENDENCE',
  'DAMPING_TIME_ASSUMES_FIXED_ORBIT_AND_RESPONSE_NO_ORBITAL_EVOLUTION_OR_RESONANCE_STABILITY',
  'RADIOGENIC_SOURCE_IS_THE_SAME_32F2C_CT0_SEEDED_PRIOR_NOT_AN_INDEPENDENT_DATED_RADIONUCLIDE_HISTORY',
  'REFERENCE_MELTING_FLUX_IS_PURE_H2O_CONDUCTIVE_ENDMEMBER_NOT_ACTUAL_OCEAN_OR_PRESSURE_DEPENDENT_EOS',
  'CONFINEMENT_PRESSURE_USES_CONDITIONAL_32F2B_RADIAL_GEOMETRY_NOT_OBSERVED_INTERNAL_LAYERS',
  'NO_OBSERVED_OCEAN_CHEMISTRY_BIOLOGICAL_COMPATIBILITY_OR_EARTHLIKE_HABITABILITY_INFERRED',
]);
const close = (a: number, b: number) => Number.isFinite(a) && Number.isFinite(b) &&
  Math.abs(a-b) <= 1e-9*Math.max(1,Math.abs(a),Math.abs(b));
const finiteNonnegative = (x: number | null) => x === null || (Number.isFinite(x) && x >= 0);

/** Model-based energy diagnostic from ALREADY materialized V3 moon sources.
 * No new random seeds, no changes to tidal spin/orbits and no redistribution
 * of lunar H2O or reinterpretation of legacy 32.F.2c ocean truth. */
export class MoonEnergyConfinementEnginePRE3305 {
  private constructor() {}
  static fromMaterialized(
    physical: MoonPhysicalProperties, tidal: MoonTidalState,
    formation: MoonFormationInventory32F1d, interior: MoonInteriorStructure32F2b,
    ocean: MoonOceanReality32F2c,
  ): MoonEnergyConfinementPRE3305 {
    const same = (x: {hostPlanetOrdinal:number;moonOrdinal:number}) =>
      x.hostPlanetOrdinal===physical.hostPlanetOrdinal && x.moonOrdinal===physical.moonOrdinal;
    const shell=interior.layers.find(x=>x.kind==='H2O_OUTER_SHELL');
    if (![tidal,formation,interior,ocean].every(same) || !shell ||
      formation.provenance!=='DETERMINISTIC_CONDITIONAL_FORMATION_MODEL_NOT_OBSERVATION' ||
      interior.provenance!=='CONDITIONAL_DIFFERENTIATED_FORMATION_ENDMEMBER_NOT_OBSERVED' ||
      ocean.provenance!=='SIMULATED_CT0_CONSTITUTIVE_MODEL_NOT_DIRECT_OBSERVATION' ||
      !close(physical.massEarth,tidal.sourceMoonMassEarth) ||
      !close(physical.radiusEarth,tidal.sourceMoonRadiusEarth) ||
      !close(formation.totalMassKilograms,interior.totalMassKilograms) ||
      !close(formation.waterIceMassKilograms,interior.waterMassKilograms) ||
      !close(ocean.waterInventoryKilograms,interior.waterMassKilograms) ||
      !close(shell.massKilograms,interior.waterMassKilograms) ||
      !close(shell.outerRadiusKilometers,physical.radiusEarth*6371) ||
      !Number.isFinite(ocean.surfaceTemperatureKelvin) || ocean.surfaceTemperatureKelvin<=0 ||
      !finiteNonnegative(ocean.generatedRadiogenicFluxWattsPerSquareMeter)) {
      throw new RangeError('PRE-33.05 requires consistent V3 lunar materialized orbital/interior/energy sources.');
    }
    const r=physical.radiusEarth*EARTH_RADIUS;
    const a=tidal.sourceSemiMajorAxisKilometers*1000;
    const mHost=tidal.sourceHostPlanetMassEarth*EARTH_MASS;
    const mMoon=physical.massEarth*EARTH_MASS;
    const ecc=tidal.sourceEccentricity;
    const n=2*Math.PI/(tidal.sourceOrbitalPeriodDays*DAY);
    const area=4*Math.PI*r*r;
    const lowE=tidal.isTidallyLocked && ecc < .15;
    let kMin: number|null=null, kMax: number|null=null;
    let pMin: number|null=null, pMax: number|null=null;
    let qMin: number|null=null, qMax: number|null=null;
    let dampingMin: number|null=null, dampingMax: number|null=null;
    if(lowE){
      // Homogeneous-elastic static k2 = (3/2)/(1 + 19*mu/(2*rho*g*R)).
      const rho=mMoon/(4/3*Math.PI*r*r*r);
      const surfaceG=G*mMoon/(r*r);
      const k2=(mu:number)=>1.5/(1+19*mu/(2*rho*surfaceG*r));
      kMin=k2(8e10)/500;
      kMax=k2(3e9)/25;
      const base=(21/2)*G*mHost*mHost*r**5*n*ecc*ecc/a**6;
      pMin=base*kMin; pMax=base*kMax;
      qMin=pMin/area; qMax=pMax/area;
      if(ecc>0){
        const factor=(2/21)*(mMoon/mHost)*(a/r)**5/n/YEAR;
        dampingMin=factor/kMax;
        dampingMax=factor/kMin;
      }
      if (![pMin,pMax,qMin,qMax,dampingMin,dampingMax].every(v=>v===null||(Number.isFinite(v)&&v>=0)))
        throw new RangeError('PRE-33.05 tidal energy outside finite orbital physical domain.');
    }
    const rad=ocean.generatedRadiogenicFluxWattsPerSquareMeter;
    const tMin=rad===null||qMin===null?null:rad+qMin;
    const tMax=rad===null||qMax===null?null:rad+qMax;
    const geometricMid=qMin===null||qMax===null?null:
      qMin===0?0:Math.sqrt(qMin*qMax);
    const tNom=rad===null||geometricMid===null?null:rad+geometricMid;
    if(![tMin,tMax,tNom].every(finiteNonnegative))
      throw new RangeError('PRE-33.05 invalid total lunar flux.');
    const water=interior.waterMassKilograms;
    const basal=water>0?ocean.pressureAtWaterShellBasePascal:null;
    if(basal!==null&&(!Number.isFinite(basal)||basal<0))throw new RangeError('Invalid lunar confinement pressure.');
    const pressureDomain:MoonEnergyConfinementPRE3305['pressureDomain']=water===0?'NO_H2O':
      basal!>1e10?'BEYOND_10_GPA':basal!>2e9?'FROM_2_TO_10_GPA':'BELOW_2_GPA';
    const shellThickness=shell.thicknessKilometers*1000;
    const baseRadius=r-shellThickness;
    // Reference surface heat flux to reach 273.15 K at assumed water-shell base.
    // Spherical steady conduction, no latent heat/convection or high-P melting.
    const required=water>0&&shellThickness>0&&baseRadius>0&&
      ocean.surfaceTemperatureKelvin<273.15 ?
      K_ICE*(273.15-ocean.surfaceTemperatureKelvin)*baseRadius/(r*shellThickness):null;
    let thermal:MoonEnergyConfinementPRE3305['thermalConfinement'];
    if(water===0)thermal='DRY_NO_WATER';
    else if(pressureDomain==='BEYOND_10_GPA')thermal='OUTSIDE_10_GPA';
    else if(ocean.surfaceTemperatureKelvin>=273.15)thermal='SURFACE_ICE_NOT_STABLE';
    else if(required===null||tMin===null||tMax===null)thermal='UNRESOLVED_HEAT_OR_STRUCTURE';
    else if(tMax<required)thermal='ENERGY_BELOW_REFERENCE';
    else if(tMin>required)thermal='ENERGY_ABOVE_REFERENCE';
    else thermal='ENERGY_SPANS_REFERENCE';
    return Object.freeze({
      contractVersion:'PRE-33.05/V3-LUNAR-ENERGY-CONFINEMENT/v1',
      provenance:'V3_MATERIALIZED_ORBIT_INTERIOR_AND_CT0_RADIOGENIC_PRIOR',
      hostPlanetOrdinal:physical.hostPlanetOrdinal,moonOrdinal:physical.moonOrdinal,
      tidalRegime:lowE?'BOUNDED_SYNCHRONOUS_LOW_E':'UNRESOLVED_SPIN_OR_HIGH_E',
      tidalResponseK2OverQMinimum:kMin,tidalResponseK2OverQMaximum:kMax,
      tidalPowerMinimumWatts:pMin,tidalPowerMaximumWatts:pMax,
      tidalFluxMinimumWattsPerSquareMeter:qMin,tidalFluxMaximumWattsPerSquareMeter:qMax,
      eccentricityDampingYearsMinimum:dampingMin,eccentricityDampingYearsMaximum:dampingMax,
      radiogenicFluxWattsPerSquareMeter:rad,
      totalFluxMinimumWattsPerSquareMeter:tMin,totalFluxNominalWattsPerSquareMeter:tNom,
      totalFluxMaximumWattsPerSquareMeter:tMax,
      referenceConductiveBasalMeltingFluxWattsPerSquareMeter:required,
      confinementPressurePascal:basal,thermalConfinement:thermal,pressureDomain,
      oceanConfirmed:false,independentThermalHistoryResolved:false,tidalResonanceSustained:false,
      scientificLimits:LIMITS,
    } satisfies MoonEnergyConfinementPRE3305);
  }
}
