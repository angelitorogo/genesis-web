import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import { AtmosphereGas, atmosphereGasMolarMassGramsPerMole } from '../../domain/planetary/atmosphere-gas';
import { AtmosphereGasComponent } from '../../domain/planetary/atmosphere-gas-component';
import { greenhouseLongwaveTrappingFraction01 } from '../../domain/planetary/atmosphere-greenhouse-effect';
import { atmospherePressureRegimeForSurfacePressurePascal } from '../../domain/planetary/atmosphere-pressure-regime';
import { type CompactHostPlanetCharacterization } from '../../domain/planetary/compact-host-planet-characterization';
import { type CompactHostPlanet } from '../../domain/planetary/compact-host-planetary-system';
import { type CompactHostPlanetEnvironment } from '../../domain/planetary/compact-host-planetary-environment';
import { type CompactPlanetaryHost } from '../../domain/stellar/compact-planetary-host';
import { resolvePlanetaryAtmosphericColumn } from './planetary-shared-atmosphere-kernel';
import {
  COMPACT_REFERENCE_THERMAL_ABSORPTION,
  COMPACT_REFERENCE_ENERGETIC_ABSORPTION,
  COMPACT_REFERENCE_ACCRETION_ABSORPTION,
} from './compact-host-environment-engine';

const DOMAIN = 'GENESIS-V2-COMPACT-PLANET-31.4F-SNAPSHOT-1';
const SIGMA = 5.670374419e-8;
const G_EARTH = 9.80665;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const finiteOrNull = (v: number | null) => v === null || Number.isFinite(v) && v >= 0;

/** No world-age, progenitor, irradiation history or N-body stability is fabricated.
 * The sha2 slots are separate from the frozen 31.2 orbital entropy branch. */
export class CompactHostPlanetCharacterizationEngine {
  private constructor() {}

  static generate(
    host: CompactPlanetaryHost,
    planet: CompactHostPlanet,
    environment: CompactHostPlanetEnvironment,
  ): CompactHostPlanetCharacterization {
    if (planet.ordinal !== environment.planetOrdinal ||
      host.systemLocator.galaxyIndex !== planet.locator.galaxyIndex ||
      host.systemLocator.sectorKey !== planet.locator.sectorKey ||
      host.systemLocator.galacticObjectIndex !== planet.locator.galacticObjectIndex) {
      throw new RangeError('31.4f characterisation requires one matching physical system and planet.');
    }
    const prefix = [DOMAIN,host.generationKey.universeSeed.normalizedValue,
      host.systemLocator.galaxyIndex,host.systemLocator.sectorKey,
      host.systemLocator.galacticObjectIndex,planet.locator.bodyIndex].join('|');
    const sample = (slot: string): number => {
      const bytes = sha256(utf8ToBytes(`${prefix}|${slot}`));
      const view = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
      return (view.getUint32(0,false)*2**21+(view.getUint32(4,false)>>>11))/2**53;
    };
    const core = lerp(0.19, 0.44, sample('CORE'));
    const ice = lerp(0.005,0.16,sample('ICE'));
    const volatile = lerp(0.005,0.075,sample('VOLATILES'));
    const silicate = 1-core-ice-volatile;
    const albedo = lerp(0.10,0.48,sample('ALBEDO'));
    const rotation = lerp(5,145,sample('ROTATION'));
    const axialTilt = lerp(0,48,sample('OBLIQUITY'));
    const retrograde = sample('SPIN-SENSE') < 0.12;
    const water = clamp(ice*1.8+volatile*1.1+sample('WATER')*0.22);
    const roughness = lerp(0.28,0.95,sample('ROUGHNESS'));
    const heatRetention = clamp(0.20+0.23*Math.log1p(planet.massEarth)+0.2*core+0.18*sample('HEAT'));
    // Present-day retained internal heat is a geophysical DESIGN PRIOR, not a recovered history.
    const heatFlux = 0.015+0.20*heatRetention**2*lerp(0.65,1.35,sample('GEOTHERMAL'));
    const tidal = clamp(0.04*(planet.eccentricity/0.08)**2*
      (0.3/planet.semiMajorAxisAu)**4);
    const geology = clamp(0.13+heatRetention*0.51+tidal*0.28);
    const volcanism = clamp(geology*lerp(0.6,1.12,sample('VOLCANISM')));
    const tectonics = clamp(geology*lerp(0.30,0.96,sample('TECTONICS')));
    const dynamo = clamp(core*0.74+heatRetention*0.42+
      0.20*Math.sqrt(24/rotation));
    const magneticField = clamp(dynamo*lerp(0.54,0.94,sample('FIELD')));
    const gravity = G_EARTH*planet.massEarth/planet.radiusEarth**2;

    // Initial inventory is a simulated PRIOR; no atmospheric composition is
    // inferred from measured bulk mass or obtained from a fictional progenitor.
    const initialPressure = 10**lerp(2.2,6.05,sample('GAS-PRESSURE'))*
      (0.45+volatile*5);
    const energetic = environment.modeledEnergeticFluxWm2;
    // Exposure to unquantified winds stays unresolved, regardless of this
    // modeled photons/energetic channel. This is a scenario, not a survival claim.
    const energeticStress = energetic === null ? 0 :
      clamp(Math.log1p(energetic)/Math.log1p(15000));
    const retention = clamp(
      (0.30+0.66*clamp(environment.escapeVelocityKmS/14)) *
      (1-0.73*energeticStress*(1-0.46*magneticField)),0.002,1);
    const retainedPressure = initialPressure*retention;
    const gasWeights: readonly [AtmosphereGas,number][] = [
      [AtmosphereGas.NITROGEN, lerp(0.32,0.74,sample('N2'))],
      [AtmosphereGas.CARBON_DIOXIDE,lerp(0.08,0.40,sample('CO2'))],
      [AtmosphereGas.ARGON,lerp(0.015,0.105,sample('AR'))],
      [AtmosphereGas.CARBON_MONOXIDE,lerp(0.008,0.07,sample('CO'))],
      [AtmosphereGas.WATER_VAPOR,lerp(0.002,0.048,sample('H2O'))],
    ];
    const sum = gasWeights.reduce((s,[,weight])=>s+weight,0);
    const gases = gasWeights.map(([gas,weight]) =>
      new AtmosphereGasComponent(gas,weight/sum));

    const thermal = environment.modeledThermalFluxWm2;
    const accretion = environment.modeledAccretionBolometricFluxWm2;
    // Do not turn the BH's illustrated disk/inspection lighting into energy.
    // A missing radiative source remains missing; geothermal heat alone does
    // not establish an actual equilibrium surface/climate for a planet.
    const heatSourceResolved = [thermal,energetic,accretion].some(v => v !== null);
    // 31.4h: exactly the SAME per-channel reference coupling as 31.3.
    // The illustrative disk is never read here. Do not apply Bond albedo a
    // second time to these effective spectral absorption coefficients: their
    // wavelength dependence is unresolved. The Bond prior is retained only
    // as an independently labelled intrinsic property until that is solved.
    // 31.4h adds explicit geothermal heat to 31.3's HOST-ONLY reference.
    const absorbed = heatSourceResolved ?
      (thermal ?? 0)*COMPACT_REFERENCE_THERMAL_ABSORPTION+
      (energetic ?? 0)*COMPACT_REFERENCE_ENERGETIC_ABSORPTION+
      (accretion ?? 0)*COMPACT_REFERENCE_ACCRETION_ABSORPTION+heatFlux : null;
    const equilibrium = absorbed !== null && absorbed > 0 ?
      (absorbed/(4*SIGMA))**0.25 : null;
    const column = equilibrium !== null ?
      resolvePlanetaryAtmosphericColumn({
        retainedSurfacePressurePascal:retainedPressure,
        surfaceGravityMetersPerSecondSquared:gravity,
        equilibriumTemperatureKelvin:equilibrium,
        gasComponents:gases,
        climateContext:{isTidallySynchronized:false,dayLengthHours:rotation},
      }) : null;
    if (column !== null && !column.condensableEquilibriumState.converged) {
      // The solver exposes nonconvergence. Never present an unstable atmosphere
      // or a false positive for water as a resolved value.
      return this.unresolvedAtmosphere(host,planet,environment,prefix,{
        core,silicate,ice,volatile,albedo,rotation,axialTilt,retrograde,roughness,water,
        initialPressure,retainedPressure,retention,heatRetention,heatFlux,tidal,geology,
        volcanism,tectonics,dynamo,magneticField,energetic,energeticStress,equilibrium,
      });
    }
    return this.assemble(host,planet,environment,{
      core,silicate,ice,volatile,albedo,rotation,axialTilt,retrograde,roughness,water,
      initialPressure,retainedPressure,retention,heatRetention,heatFlux,tidal,geology,
      volcanism,tectonics,dynamo,magneticField,energetic,energeticStress,equilibrium,
    },column);
  }

  private static unresolvedAtmosphere(host: CompactPlanetaryHost, planet: CompactHostPlanet,
    env: CompactHostPlanetEnvironment, _prefix: string, p: Intrinsic): CompactHostPlanetCharacterization {
    return this.assemble(host,planet,env,p,null);
  }

  private static assemble(
    _host:CompactPlanetaryHost,planet:CompactHostPlanet,env:CompactHostPlanetEnvironment,
    p:Intrinsic,
    column: ReturnType<typeof resolvePlanetaryAtmosphericColumn> | null,
  ): CompactHostPlanetCharacterization {
    const atmosphericPressure = column?.effectiveSurfacePressurePascal ?? null;
    const fractions = column === null ? null : Object.freeze(column.effectiveGasComponents.map(c=>
      Object.freeze({gas:c.gas,fraction01:c.moleFraction01})));
    const molarMass = fractions === null ? null : fractions.reduce((sum,c)=>
      sum+c.fraction01*atmosphereGasMolarMassGramsPerMole(c.gas),0);
    const surfaceT = column?.resolvedSurfaceTemperatureKelvin ?? null;
    const greenhouse = surfaceT !== null && p.equilibrium !== null ?
      Math.max(0,surfaceT-p.equilibrium) : null;
    const trapping = column === null ? null :
      greenhouseLongwaveTrappingFraction01(column.infraredOpticalDepthProxy);
    const redistribution = column?.condensableEquilibriumState.heatRedistributionEfficiency01 ?? null;
    const diurnal = surfaceT === null ? null : surfaceT*0.23*(1-(redistribution??0.0));
    const season = surfaceT === null ? null : surfaceT*0.025*Math.sin(p.axialTilt*Math.PI/180);
    const tMin = surfaceT === null ? null : Math.max(1,surfaceT-(diurnal??0)/2-(season??0));
    const tMax = surfaceT === null ? null : surfaceT+(diurnal??0)/2+(season??0);
    const climateStability = surfaceT === null ? null :
      clamp(1-((diurnal??0)+(season??0))/(2*Math.max(surfaceT,1)));
    const liquidAllowed = surfaceT !== null && atmosphericPressure !== null &&
      atmosphericPressure >= 611.657 && surfaceT >= 273.16 && surfaceT < 373.15 &&
      tMin !== null && tMin >= 273.16;
    // The waterInventoryIndex01 is a PRIOR, not a water-reservoir mass.
    // Temperature and gas pressure can restrict which phases are viable, but
    // cannot determine whole-planet ice/liquid/vapor percentages. Never repeat
    // the old fixed 99.5/0/0.5 split as though mass balance had been solved.
    const icePhase = null;
    const liquidPhase = null;
    const vaporPhase = null;
    // Illustration-only upper coverage assumptions (water accessible at the
    // surface). They are NOT a quantitative water phase partition.
    const liquidCoverage = surfaceT === null ? null :
      liquidAllowed ? clamp(p.water*0.55) : 0;
    const iceCoverage = surfaceT === null ? null :
      surfaceT < 273.16 ? clamp(p.water*0.55) : 0;
    // Identical pressure boundaries to the conventional atmosphere domain.
    // This is a *scenario gas pressure*, not verified atmospheric survival.
    const pressureRegime: CompactHostPlanetCharacterization['atmosphereRegime'] =
      atmosphericPressure === null ? 'UNRESOLVED' :
        atmospherePressureRegimeForSurfacePressurePascal(atmosphericPressure);
    const magneticProtection = env.modeledEnergeticFluxWm2 === null ? null :
      clamp(p.magneticField/(1+0.36*p.energeticStress));
    const radiationExposure = env.modeledEnergeticFluxWm2 === null ? null :
      clamp(p.energeticStress*(1-(magneticProtection??0)*0.8));
    const result: CompactHostPlanetCharacterization = {
      modelVersion:'COMPACT_PLANET_CHARACTERIZATION_31_4F_V1',planetOrdinal:planet.ordinal,
      intrinsicSource:'DETERMINISTIC_SNAPSHOT_PRIOR', environmentalSource:'CONDITIONAL_COMPACT_RADIATION',
      coreFraction01:p.core,silicateFraction01:p.silicate,
      iceInteriorFraction01:p.ice,volatileInteriorFraction01:p.volatile,
      albedoBond01:p.albedo,rotationPeriodHours:p.rotation,axialTiltDegrees:p.axialTilt,
      retrograde:p.retrograde,roughnessIndex01:p.roughness,waterInventoryIndex01:p.water,
      initialPressurePa:p.initialPressure,retainedPressureBeforeCondensationPa:p.retainedPressure,
      gasRetentionFraction01:p.retention,atmosphericPressurePa:atmosphericPressure,
      atmosphericGasMoleFractions:fractions,meanMolarMassGramsPerMole:molarMass,
      atmosphereRegime:pressureRegime,equilibriumTemperatureK:p.equilibrium,
      surfaceTemperatureScenarioK:surfaceT,greenhouseWarmingScenarioK:greenhouse,
      greenhouseTrappingFraction01:trapping,heatRedistributionIndex01:redistribution,
      diurnalTemperatureRangeK:diurnal,seasonalAmplitudeK:season,
      surfaceMinimumScenarioK:tMin,surfaceMaximumScenarioK:tMax,
      climateStabilityIndex01:climateStability,
      waterIceFraction01:icePhase,waterLiquidFraction01:liquidPhase,
      waterVaporFraction01:vaporPhase,surfaceIceCoverageFraction01:iceCoverage,
      surfaceLiquidWaterCoverageFraction01:liquidCoverage,
      internalHeatRetentionIndex01:p.heatRetention,internalHeatFluxReferenceWm2:p.heatFlux,
      tidalHeatingIndex01:p.tidal,geologyActivityIndex01:p.geology,volcanismIndex01:p.volcanism,
      tectonicMobilityIndex01:p.tectonics,outgassingIndex01:clamp(p.volcanism*p.volatile*4),
      surfaceRenewalIndex01:clamp((p.tectonics+p.volcanism)*0.45),
      dynamoIndex01:p.dynamo,magneticFieldIndex01:p.magneticField,
      magneticProtectionIndex01:magneticProtection,radiationExposureIndex01:radiationExposure,
      radiationAssessment:env.modeledEnergeticFluxWm2 === null ?
        'ENERGETIC_CHANNEL_UNRESOLVED' : 'MODELED_ENERGETIC_COMPONENT_ONLY',
      climateAssessment:p.equilibrium === null ? 'HOST_RADIATION_UNRESOLVED' : 'CONDITIONAL_REFERENCE',
      atmosphereAssessment:column === null ? 'GAS_PHASE_UNRESOLVED' :
        'CONDENSATION_AND_ESCAPE_SCENARIO',
    };
    for (const [name,value] of Object.entries(result)) {
      if (typeof value === 'number' && !finiteOrNull(value)) {
        throw new RangeError(`Non-finite 31.4f ${name}`);
      }
    }
    return Object.freeze(result);
  }
}

interface Intrinsic {
  core:number;silicate:number;ice:number;volatile:number;albedo:number;rotation:number;
  axialTilt:number;retrograde:boolean;roughness:number;water:number;initialPressure:number;
  retainedPressure:number;retention:number;heatRetention:number;heatFlux:number;tidal:number;
  geology:number;volcanism:number;tectonics:number;dynamo:number;magneticField:number;
  energetic:number|null;energeticStress:number;equilibrium:number|null;
}
