import type { Atmosphere } from '../../domain/planetary/atmosphere';
import type { Planet } from '../../domain/planetary/planet';
import { GeochemistryWorldPRE3307 } from './geochemistry-world-pre33-07';
import { RadiationTransportEnginePRE3308 } from './radiation-transport-engine-pre33-08';
import { PlanetH2OV3FormationOrigin } from './planet-h2o-v3-formation-origin';
import { AtmosphereV3FormationEvolutionPRE3306 } from './atmosphere-v3-formation-evolution-pre33-06';
import type { RelevantMoon } from '../../domain/planetary/relevant-moon';
import type { MoonIdentity } from '../../domain/planetary/moon-identity';
import type { EnvironmentalEvidencePRE3301 as E, EnvironmentalPhysicalContractPRE3301 as Contract } from '../../domain/planetary/environmental-physical-contract-pre33-01';
import {
  ENVIRONMENTAL_CONTRACT_PRE33_01,
  environmentalModelledPRE3301 as model,
  environmentalConditionalPRE3301 as conditional,
  environmentalUnknownPRE3301 as unknown,
  environmentalNotApplicablePRE3301 as notApplicable,
  validateEnvironmentalContractPRE3301,
} from '../../domain/planetary/environmental-physical-contract-pre33-01';

/**
 * PRE-33.01: non-mutating mapping of EXISTING phase-19/20/21 and 32.F values.
 * No RNG, no source regeneration, no discovery grants, no invented chemistry,
 * no extrapolation of CT-0 into history, no V1 habitability-based verdicts.
 */
export class EnvironmentalPhysicalProjectionPRE3301 {
  private constructor() {}

  static planet(planet: Planet, atmosphere: Atmosphere): Contract {
    if (atmosphere.hostPlanet !== planet ||
        atmosphere.climateState.planetOrdinal !== planet.planetOrdinal ||
        atmosphere.retentionState.planetOrdinal !== planet.planetOrdinal ||
        atmosphere.waterInventory.planetOrdinal !== planet.planetOrdinal) {
      throw new RangeError('PRE-33.01 rejects different planets/atmospheres.');
    }
    const key = planetKey(planet.locator);
    const retained = atmosphere.retentionState.retainedSurfacePressurePascal;
    const water = atmosphere.waterInventory.sourceRetainedSurfacePressurePascal;
    const noSolidSurface = atmosphere.climateState.meanSurfaceTemperatureKelvin === null;
    // Multihost V3 may wrap frozen private V2 planets: source provenance, not
    // their private version code, is the public V3 formation authorization.
    const v3Origin = PlanetH2OV3FormationOrigin.sourceForPlanet(planet);
    const closureV3 = v3Origin!==null
      ? AtmosphereV3FormationEvolutionPRE3306.planet(planet,atmosphere,v3Origin) : null;
    const causalCT0 = closureV3?.causalModelPressurePascal ?? null;
    const radiationV3 = v3Origin!==null ? RadiationTransportEnginePRE3308.world({
      bodyKind:'PLANET',hasSolidSurface:!noSolidSurface,surfaceGravityEarth:planet.surfaceGravityEarth,
      atmosphericClosure:closureV3}) : null;
    const geoV3 = v3Origin!==null ? GeochemistryWorldPRE3307.planet(planet,closureV3,null) : null;
    const relation: Contract['atmosphere']['columnRelation'] =
      retained === null || water === null ? 'NOT_COMPARABLE'
      : nearlyEqual(retained, water) ? 'ALIGNED' : 'DIVERGENT';
    const contract: Contract = {
      contractVersion: ENVIRONMENTAL_CONTRACT_PRE33_01,
      perspective: 'INTERNAL_SIMULATED_REALITY', epoch: 'CT0',
      bodyKind: 'PLANET', bodyKey: key, hostPlanetKey: null,
      materialization: 'PHYSICALLY_MATERIALIZED',
      bulk: {
        massEarth: positive(planet.physicalProperties.massEarth, 'massEarth', 'BULK_19_21'),
        radiusEarth: positive(planet.physicalProperties.radiusEarth, 'radiusEarth', 'BULK_19_21'),
        gravityMetersPerSecondSquared: positive(
          planet.physicalProperties.surfaceGravityMetersPerSecondSquared, 'surfaceGravity', 'BULK_19_21'),
      },
      thermal: {
        referenceEquilibriumKelvin: nonnegative(
          atmosphere.climateState.equilibriumTemperatureKelvin, 'thermal equilibrium', 'CLIMATE_20'),
        surfaceTemperatureKelvin: nullableConditional(
          atmosphere.climateState.meanSurfaceTemperatureKelvin, 'CLIMATE_20',
          '20.5 global mean climate estimate, not dated or spatially resolved',
          noSolidSurface ? 'No solid surface resolved under deep envelope' : 'No physical surface temperature'),
      },
      atmosphere: {
        retainedSurfacePressurePascal: nullableConditional(retained, 'ATMOSPHERE_20_3',
          '20.3 retained-column estimate, not an independent mass/flux balance',
          noSolidSurface ? 'No defined solid surface pressure' : '20.3 pressure unresolved'),
        waterAssessmentPressurePascal: nullableConditional(water, 'WATER_20_7',
          '20.7 effective water-assessment pressure; not necessarily identical to 20.3',
          noSolidSurface ? '20.7 solid-surface water column inapplicable' : '20.7 pressure unresolved'),
        physicallySupportedSurfacePressurePascal: causalCT0!==null
          ? model(causalCT0,'ATMOSPHERE_V3_FORMATION_CT0','INDEPENDENT_INTERVAL_MODEL',
              'PRE-33.06 V3: source primordial, desgasificación, pérdida y exobase modeladas; sin evidencia observacional ni vida')
          : unknown(closureV3===null
              ? 'No independent atmospheric gas and flux source for this generator version'
              : `PRE-33.06 V3 not physically resolved: ${closureV3.status}`,
              closureV3===null?'NO_QUANTIFIED_SOURCE':'ATMOSPHERE_V3_FORMATION_CT0'),
        columnRelation: relation,
      },
      water: {
        surfaceLiquidCoverage01: atmosphere.waterInventory.surfaceLiquidWaterCoverageFraction01 === null
          ? noSolidSurface ? notApplicable('No exposed solid surface for a coverage fraction')
                           : unknown('20.7 surface liquid coverage unresolved', 'WATER_20_7')
          : fraction(atmosphere.waterInventory.surfaceLiquidWaterCoverageFraction01,
            '20.7 representative surface coverage, NOT direct evidence of stable liquid'),
        subsurfaceOceanState: unknown('Phase 20 does not resolve CT-0 planetary subsurface ocean state'),
        liquidOceanMassKilograms: unknown('20.7 relative inventory/coverage does not resolve ocean mass'),
      },
      energy: {
        interiorHeatFluxWattsPerSquareMeter: unknown('No direct W/m² interior heat source in 19/20 here'),
        extractableChemicalPowerWatts: geoV3?.quantifiedPathwayPowerWatts!==null &&
          geoV3?.quantifiedPathwayPowerWatts!==undefined
          ? model(geoV3.quantifiedPathwayPowerWatts,'GEOCHEMISTRY_PRE33_07','CT0_CONSTITUTIVE',
            'Potencia de una ruta resuelta; no es potencia total ni vida')
          : unknown('PRE-33.07: especies/actividades/ΔG y cinética no independientes',
            'GEOCHEMISTRY_PRE33_07'),
        ...(geoV3!==null?{chemicalPowerUpperScenarioWatts: geoV3?.formationSensitivityPRE3307?.conditionalUpperPowerWatts!==null &&
          geoV3?.formationSensitivityPRE3307?.conditionalUpperPowerWatts!==undefined
          ? conditional(geoV3.formationSensitivityPRE3307.conditionalUpperPowerWatts,
            'GEOCHEMISTRY_PRE33_07','HYPOTHETICAL_COLUMN',
            'FeO/reactivos, mineralogía, transporte, termodinámica y cinética son endmembers; NO potencia física ni vida')
          : unknown('Sin escenario mineral cuantificable en el nicho y dominio CT-0',
            'GEOCHEMISTRY_PRE33_07')}:{}),
        chemicalDisequilibriumJoulesPerMole: geoV3?.quantifiedPathwayPowerWatts!==null &&
          geoV3?.quantifiedPathwayPowerWatts!==undefined &&
          geoV3.reactions.filter(x=>x.chemicalPowerWatts!==null).length===1
          ? model(geoV3.reactions.find(x=>x.chemicalPowerWatts!==null)!.gibbsJoulesPerMole!,
            'GEOCHEMISTRY_PRE33_07','CT0_CONSTITUTIVE',
            'ΔG individual con actividades de reacción y temperatura/presión, sin vida')
          : unknown('PRE-33.07: actividades y ΔG todavía no resueltos',
            'GEOCHEMISTRY_PRE33_07'),
      },
      radiation: {
        bolometricFluxWattsPerSquareMeter: unknown('20.x insolation index is not an independently quantified spectrum or W/m² input'),
        surfaceIonizingDoseGrayPerYear: radiationV3?.surface.doseGrayPerYear!==null &&
          radiationV3?.surface.doseGrayPerYear!==undefined
          ? model(radiationV3.surface.doseGrayPerYear,'RADIATION_PRE33_08','CT0_CONSTITUTIVE',
            'Dosis CT0 con fuente espectral y respuesta de transporte independiente; no hay vida inferida')
          : unknown(radiationV3?.surface.reason ?? '20.10 dimensionless index is not dose','RADIATION_PRE33_08'),
        subsurfaceIonizingDoseGrayPerYear: radiationV3?.subsurface.doseGrayPerYear!==null &&
          radiationV3?.subsurface.doseGrayPerYear!==undefined
          ? model(radiationV3.subsurface.doseGrayPerYear,'RADIATION_PRE33_08','CT0_CONSTITUTIVE',
            'Dosis subsuperficial CT0 con transporte cuantificado')
          : unknown(radiationV3?.subsurface.reason ?? 'No modeled subsurface dose','RADIATION_PRE33_08'),
      },
      history: {
        continuousCompatibleYears: unknown('A current snapshot cannot demonstrate continuous dated habitability',
          'NO_DATED_PHYSICAL_SOURCE'),
      },
      lifeEvaluated: false,
    };
    return checked(contract);
  }

  static moon(moon: RelevantMoon, hostPlanet: Planet): Contract {
    if (!sameHostLocator(moon.hostPlanetLocator, hostPlanet.locator) ||
        !sameHostLocator(moon.identity.hostPlanetLocator, hostPlanet.locator) ||
        moon.hostPlanetOrdinal !== hostPlanet.planetOrdinal ||
        moon.identity.hostPlanetOrdinal !== hostPlanet.planetOrdinal ||
        moon.identity.moonOrdinal !== moon.moonOrdinal ||
        moon.environmentState.hostPlanetOrdinal !== hostPlanet.planetOrdinal ||
        moon.environmentState.moonOrdinal !== moon.moonOrdinal ||
        moon.physicalProperties.moonOrdinal !== moon.moonOrdinal) {
      throw new RangeError('PRE-33.01 refuses a moon with mismatched host/ordinal.');
    }
    const key = planetKey(hostPlanet.locator);
    const atm = moon.environmentState.atmosphereAssessment;
    const balance = atm?.physicalBalance32F1 ?? null;
    const physicallySupported = atm?.pressureBasis === 'PHYSICAL_BALANCE' &&
      balance?.sourceKind === 'INDEPENDENT_MASS_AND_FLUXES' &&
      balance.interpretation === 'PHYSICAL_INTERVAL_MODEL_NOT_OBSERVATION' &&
      typeof balance.sourceId === 'string' && balance.sourceId.trim().length > 0 &&
      positiveNumber(balance.durationSeconds) && validNonnegative(balance.remainingGasMassKilograms) &&
      validNonnegative(balance.surfacePressurePascal) &&
      validNonnegative(atm.estimatedSurfacePressurePascal) &&
      atm.estimatedSurfacePressurePascal === balance.surfacePressurePascal &&
      Array.isArray(balance.gasResults) && balance.gasResults.length > 0;
    const v3MoonHostOrigin = PlanetH2OV3FormationOrigin.sourceForPlanet(hostPlanet);
    const candidateV3 = v3MoonHostOrigin!==null
      ? AtmosphereV3FormationEvolutionPRE3306.moon(
          moon.physicalProperties,atm,moon.formationInventory32F1d??null,
          hostPlanet,v3MoonHostOrigin,moon.environmentState.equilibriumTemperatureKelvin) : null;
    const ocean = moon.oceanReality32F2c;
    const geo = moon.geochemicalEnergy32F4;
    const geoV3 = moon.formationInventory32F1d
      ? GeochemistryWorldPRE3307.moon(geo,null,moon.formationInventory32F1d??null,
          moon.interiorStructure32F2b??null) : null;
    const radiation = moon.radiationProtection32F3;
    const radiationV3 = v3MoonHostOrigin!==null ? RadiationTransportEnginePRE3308.world({
      bodyKind:'MOON',hasSolidSurface:true,surfaceGravityEarth:moon.physicalProperties.surfaceGravityEarth,
      atmosphericClosure:candidateV3,lunarReference:radiation}) : null;
    const oceanState: E<'PRESENT' | 'ABSENT'> = !ocean
      ? unknown('32.F.2c not materialized', 'LUNAR_OCEAN_32_F_2C')
      : ocean.state === 'PRESENT_IN_SIMULATED_MODEL'
        ? model('PRESENT', 'LUNAR_OCEAN_32_F_2C', 'CT0_CONSTITUTIVE',
          'Physical scenario of the generated universe, NOT direct observation or biological viability')
      : ocean.state === 'ABSENT_IN_SIMULATED_MODEL'
        ? model('ABSENT', 'LUNAR_OCEAN_32_F_2C', 'CT0_CONSTITUTIVE',
          'Absence only within 32.F.2c constituent model/domain')
      : unknown(`32.F.2c unresolved: ${ocean.reason}`, 'LUNAR_OCEAN_32_F_2C');
    const gasScenario = atm?.estimatedSurfacePressurePascal ?? null;
    const contract: Contract = {
      contractVersion: ENVIRONMENTAL_CONTRACT_PRE33_01,
      perspective: 'INTERNAL_SIMULATED_REALITY', epoch: 'CT0', bodyKind: 'MOON',
      bodyKey: `${key}/M${moon.moonOrdinal - 1}`, hostPlanetKey: key,
      materialization: 'PHYSICALLY_MATERIALIZED',
      bulk: {
        massEarth: positive(moon.physicalProperties.massEarth, 'lunar mass', 'BULK_19_21'),
        radiusEarth: positive(moon.physicalProperties.radiusEarth, 'lunar radius', 'BULK_19_21'),
        gravityMetersPerSecondSquared: positive(
          moon.physicalProperties.surfaceGravityEarth * 9.80665, 'lunar gravity V2', 'BULK_19_21'),
      },
      thermal: {
        referenceEquilibriumKelvin: nonnegative(
          moon.environmentState.equilibriumTemperatureKelvin, 'lunar equilibrium', 'LUNAR_ENVIRONMENT_21_5'),
        surfaceTemperatureKelvin: conditional(
          finiteNonnegative(moon.environmentState.estimatedSurfaceTemperatureKelvin, 'lunar surface temperature'),
          'LUNAR_ENVIRONMENT_21_5', 'LEGACY_ESTIMATE',
          '21.5 estimated lunar surface temperature, not a dated measurement'),
      },
      atmosphere: {
        retainedSurfacePressurePascal: gasScenario === null ?
          unknown('21.5 atmospheric scenario not resolved', 'LUNAR_ATMOSPHERE_SCENARIO_21_5')
          : conditional(finiteNonnegative(gasScenario, 'lunar conditional pressure'),
            'LUNAR_ATMOSPHERE_SCENARIO_21_5', 'HYPOTHETICAL_COLUMN',
            'Conditional lunar atmosphere estimate, NOT independent physical pressure'),
        waterAssessmentPressurePascal: notApplicable('20.7 water-column handoff is planet-only'),
        physicallySupportedSurfacePressurePascal: candidateV3?.causalModelPressurePascal!==null &&
          candidateV3?.causalModelPressurePascal!==undefined
          ? model(candidateV3.causalModelPressurePascal,'ATMOSPHERE_V3_FORMATION_CT0',
            'INDEPENDENT_INTERVAL_MODEL',
            'PRE-33.06 V3 generated atmospheric mass/flux/kinetics, not an observation')
          : physicallySupported
          ? model(balance!.surfacePressurePascal!, 'LUNAR_ATMOSPHERE_32_F_1',
            'INDEPENDENT_INTERVAL_MODEL',
            'Mass/flux-sourced 32.F.1 physical interval; NOT a direct observation or historical stability')
          : unknown(candidateV3!==null
              ? `PRE-33.06 V3: ${candidateV3.status}; no independent species certification`
              : 'No independently mass/flux-supported 32.F.1 atmospheric balance',
            candidateV3===null?'LUNAR_ATMOSPHERE_32_F_1':'ATMOSPHERE_V3_FORMATION_CT0'),
        columnRelation: 'NOT_COMPARABLE',
      },
      water: {
        surfaceLiquidCoverage01: unknown('21.x water index is NOT physical surface liquid coverage'),
        subsurfaceOceanState: oceanState,
        liquidOceanMassKilograms: oceanState.state === 'MODELLED_CT0' && oceanState.value === 'PRESENT'
          && ocean && validNonnegative(ocean.simulatedLiquidWaterMassKilograms)
          ? model(ocean.simulatedLiquidWaterMassKilograms, 'LUNAR_OCEAN_32_F_2C',
            'CT0_CONSTITUTIVE', 'Liquid H2O mass of the CT-0 constitutive realization')
          : unknown('No physically resolved liquid mass in 32.F.2c', 'LUNAR_OCEAN_32_F_2C'),
      },
      energy: {
        interiorHeatFluxWattsPerSquareMeter: ocean &&
          validNonnegative(ocean.generatedTotalSurfaceHeatFluxWattsPerSquareMeter)
          ? model(ocean.generatedTotalSurfaceHeatFluxWattsPerSquareMeter,
            'LUNAR_OCEAN_32_F_2C', 'CT0_CONSTITUTIVE',
            'Generated CT-0 heat flow, NOT chemical or metabolic energy')
          : unknown('No CT-0 heat flux established', 'LUNAR_OCEAN_32_F_2C'),
        extractableChemicalPowerWatts: geoV3?.quantifiedPathwayPowerWatts!==null &&
          geoV3?.quantifiedPathwayPowerWatts!==undefined
          ? model(geoV3.quantifiedPathwayPowerWatts,'GEOCHEMISTRY_PRE33_07','CT0_CONSTITUTIVE',
            'Potencia individual CT-0 con reactivos, ΔG y tasas; sin vida inferida')
          : unknown('PRE-33.07: faltan reactivos/actividades/tasas independientes',
            'GEOCHEMISTRY_PRE33_07'),
        ...(geoV3!==null?{chemicalPowerUpperScenarioWatts: geoV3?.formationSensitivityPRE3307?.conditionalUpperPowerWatts!==null &&
          geoV3?.formationSensitivityPRE3307?.conditionalUpperPowerWatts!==undefined
          ? conditional(geoV3.formationSensitivityPRE3307.conditionalUpperPowerWatts,
            'GEOCHEMISTRY_PRE33_07','HYPOTHETICAL_COLUMN',
            'FeO/reactivos, mineralogía, transporte, termodinámica y cinética son endmembers; NO potencia física ni vida')
          : unknown('Sin escenario mineral cuantificable en el nicho y dominio CT-0',
            'GEOCHEMISTRY_PRE33_07')}:{}),
        chemicalDisequilibriumJoulesPerMole: geoV3?.quantifiedPathwayPowerWatts!==null &&
          geoV3?.quantifiedPathwayPowerWatts!==undefined &&
          geoV3.reactions.filter(x=>x.chemicalPowerWatts!==null).length===1
          ? model(geoV3.reactions.find(x=>x.chemicalPowerWatts!==null)!.gibbsJoulesPerMole!,
            'GEOCHEMISTRY_PRE33_07','CT0_CONSTITUTIVE',
            'ΔG individual con especies y actividad, sin inferir metabolismo')
          : unknown('PRE-33.07: composición reactiva y energía libre no cuantificadas',
            'GEOCHEMISTRY_PRE33_07'),
      },
      radiation: {
        bolometricFluxWattsPerSquareMeter: radiation &&
          validNonnegative(radiation.referenceBolometricWattsPerSquareMeter)
          ? model(radiation.referenceBolometricWattsPerSquareMeter, 'LUNAR_RADIATION_32_F_3',
            'CT0_CONSTITUTIVE', 'Bolometric irradiance only, NOT ionizing irradiation')
          : unknown('32.F.3 bolometric reference unresolved', 'LUNAR_RADIATION_32_F_3'),
        surfaceIonizingDoseGrayPerYear: radiationV3?.surface.doseGrayPerYear!==null &&
          radiationV3?.surface.doseGrayPerYear!==undefined
          ? model(radiationV3.surface.doseGrayPerYear,'RADIATION_PRE33_08','CT0_CONSTITUTIVE',
            'Espectro/dosimetría CT0, no índice ni transmisión de referencia')
          : unknown(radiationV3?.surface.reason ?? 'No 32.F.3 dose','RADIATION_PRE33_08'),
        subsurfaceIonizingDoseGrayPerYear: radiationV3?.subsurface.doseGrayPerYear!==null &&
          radiationV3?.subsurface.doseGrayPerYear!==undefined
          ? model(radiationV3.subsurface.doseGrayPerYear,'RADIATION_PRE33_08','CT0_CONSTITUTIVE',
            'Transporte independiente de espectro y cubierta CT0')
          : unknown(radiationV3?.subsurface.reason ?? 'No 32.F.3 dose','RADIATION_PRE33_08'),
      },
      history: {
        continuousCompatibleYears: unknown('32.F.5 current state is NOT a dated environmental continuity proof',
          'NO_DATED_PHYSICAL_SOURCE'),
      },
      lifeEvaluated: false,
    };
    return checked(contract);
  }

  /** Moon identities without a 21.3 relevant-moon body are NOT silently materialized. */
  static moonIdentityOnly(identity: MoonIdentity): Contract {
    const key = planetKey(identity.hostPlanetLocator);
    const missing = () => unknown<number>('Moon 21.8 identity exists but detailed physical source is not materialized',
      'NOT_MATERIALIZED');
    const contract: Contract = {
      contractVersion: ENVIRONMENTAL_CONTRACT_PRE33_01,
      perspective: 'INTERNAL_SIMULATED_REALITY', epoch: 'CT0', bodyKind: 'MOON',
      bodyKey: `${key}/M${identity.moonOrdinal - 1}`, hostPlanetKey: key,
      materialization: 'IDENTITY_ONLY',
      bulk: { massEarth: missing(), radiusEarth: missing(), gravityMetersPerSecondSquared: missing() },
      thermal: { referenceEquilibriumKelvin: missing(), surfaceTemperatureKelvin: missing() },
      atmosphere: { retainedSurfacePressurePascal: missing(), waterAssessmentPressurePascal: missing(),
        physicallySupportedSurfacePressurePascal: missing(), columnRelation: 'NOT_COMPARABLE' },
      water: { surfaceLiquidCoverage01: missing(), subsurfaceOceanState: unknown(
        'Unmaterialized moon cannot have a CT-0 ocean verdict', 'NOT_MATERIALIZED'),
        liquidOceanMassKilograms: missing() },
      energy: {interiorHeatFluxWattsPerSquareMeter: missing(), extractableChemicalPowerWatts: missing(),
        chemicalDisequilibriumJoulesPerMole: missing()},
      radiation: {bolometricFluxWattsPerSquareMeter: missing(), surfaceIonizingDoseGrayPerYear: missing(),
        subsurfaceIonizingDoseGrayPerYear: missing()},
      history: { continuousCompatibleYears: missing() }, lifeEvaluated: false,
    };
    return checked(contract);
  }
}

function sameHostLocator(a: Planet['locator'], b: Planet['locator']): boolean {
  return a?.galaxyIndex === b.galaxyIndex && a.sectorKey === b.sectorKey &&
    a.galacticObjectIndex === b.galacticObjectIndex && a.bodyIndex === b.bodyIndex;
}
function planetKey(locator: Planet['locator']): string {
  return `G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}/B${locator.bodyIndex}`;
}
function checked(contract: Contract): Contract {
  const errors = validateEnvironmentalContractPRE3301(contract);
  if (errors.length) throw new RangeError(`PRE-33.01 invalid physical contract: ${errors.join(',')}`);
  // Only newly allocated DTO nodes are frozen; domain generator input is never touched.
  for (const group of [contract.bulk, contract.thermal, contract.atmosphere,
    contract.water, contract.energy, contract.radiation, contract.history]) Object.freeze(group);
  return Object.freeze(contract);
}
function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
}
function validNonnegative(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
function positiveNumber(value: number | null | undefined): value is number {
  return validNonnegative(value) && value > 0;
}
function finiteNonnegative(value: number, label: string): number {
  if (!validNonnegative(value)) throw new RangeError(`PRE-33.01 invalid ${label}`);
  return value;
}
function positive(value: number, label: string,
  source: 'BULK_19_21'): E<number> {
  if (!positiveNumber(value)) throw new RangeError(`PRE-33.01 invalid ${label}`);
  return model(value, source, 'BULK_PHYSICAL', `Generated bulk physical ${label} CT-0`);
}
function nonnegative(value: number, label: string,
  source: 'CLIMATE_20' | 'LUNAR_ENVIRONMENT_21_5'): E<number> {
  return model(finiteNonnegative(value, label), source, 'CT0_CONSTITUTIVE',
    `Present-day reference ${label}, not a historical constraint`);
}
function nullableConditional(value: number | null,
  source: 'CLIMATE_20' | 'ATMOSPHERE_20_3' | 'WATER_20_7',
  note: string, missing: string): E<number> {
  return value === null ? unknown(missing, source)
    : conditional(finiteNonnegative(value, note), source, 'LEGACY_ESTIMATE', note);
}
function fraction(value: number, note: string): E<number> {
  if (!validNonnegative(value) || value > 1) throw new RangeError('PRE-33.01 fraction outside 0..1');
  return conditional(value, 'WATER_20_7', 'LEGACY_ESTIMATE', note);
}
