import {describe,it,expect} from 'vitest';
import {GeochemicalFormationSensitivityEnginePRE3307 as Engine} from './geochemical-formation-sensitivity-pre33-07';
import {GeochemistryWorldPRE3307} from './geochemistry-world-pre33-07';
import type {MoonFormationInventory32F1d} from '../../domain/planetary/moon-formation-inventory-32-f-1d';
import type {MoonInteriorStructure32F2b} from '../../domain/planetary/moon-interior-structure-32-f-2b';
import type {MoonGeochemicalEnergy32F4} from '../../domain/planetary/moon-geochemical-energy-32-f-4';
const geo=()=>({contractVersion:'32.F.4-chemical-constraints-and-thermal-gradients-v1',
  hostPlanetOrdinal:1,moonOrdinal:2,solventState:'MODELLED_LIQUID_H2O_CT0',
  modeledLiquidH2OMassKilograms:1e18,modeledWaterRockContact:
  'LIQUID_SEPARATED_FROM_SILICATES_BY_UNIDENTIFIED_CONDENSABLES',
  modeledOceanBottomTemperatureKelvin:300,modeledOceanBottomPressurePascal:2e8,
  modeledOceanTopTemperatureKelvin:285,modeledOceanTopPressurePascal:1e8,
  generatedHeatFluxWattsPerSquareMeter:1e20} as MoonGeochemicalEnergy32F4);
const formation=()=>({contractVersion:'32.F.1d-density-endmember-scenario-v1',
  hostPlanetOrdinal:1,moonOrdinal:2,totalMassKilograms:1e22,
  silicateMassKilograms:5e21} as MoonFormationInventory32F1d);
// Fixture estructural completo: satisface el contrato 32.F.2b sin una conversión
// insegura. Los valores son exclusivamente de laboratorio; el motor probado
// utiliza la identidad, las cuatro capas y el radio exterior del manto.
const interior=():MoonInteriorStructure32F2b=>({
  contractVersion:'32.F.2b-differentiated-conditional-profile-v1',
  provenance:'CONDITIONAL_DIFFERENTIATED_FORMATION_ENDMEMBER_NOT_OBSERVED',
  hostPlanetOrdinal:1,moonOrdinal:2,totalMassKilograms:1e22,
  waterMassKilograms:2e21,surfaceRadiusKilometers:1900,
  layers:[
    {kind:'METALLIC_CORE',massKilograms:2e21,
      innerRadiusKilometers:0,outerRadiusKilometers:1200,thicknessKilometers:1200,
      effectiveDensityKilogramsPerCubicMeter:5500,
      pressureAtInnerBoundaryPascal:4e8,pressureAtOuterBoundaryPascal:3e8},
    {kind:'SILICATE_MANTLE',massKilograms:5e21,
      innerRadiusKilometers:1200,outerRadiusKilometers:1500,thicknessKilometers:300,
      effectiveDensityKilogramsPerCubicMeter:3300,
      pressureAtInnerBoundaryPascal:3e8,pressureAtOuterBoundaryPascal:1e8},
    {kind:'OTHER_CONDENSABLES_UNIDENTIFIED',massKilograms:1e21,
      innerRadiusKilometers:1500,outerRadiusKilometers:1750,thicknessKilometers:250,
      effectiveDensityKilogramsPerCubicMeter:1500,
      pressureAtInnerBoundaryPascal:1e8,pressureAtOuterBoundaryPascal:5e7},
    {kind:'H2O_OUTER_SHELL',massKilograms:2e21,
      innerRadiusKilometers:1750,outerRadiusKilometers:1900,thicknessKilometers:150,
      effectiveDensityKilogramsPerCubicMeter:1000,
      pressureAtInnerBoundaryPascal:5e7,pressureAtOuterBoundaryPascal:0},
  ],
  pressureProfile:[{depthKilometers:0,pressurePascal:0},
    {depthKilometers:1900,pressurePascal:4e8}],
  centralLithostaticPressurePascal:4e8,
  assumedWaterConductivityWattsPerMeterKelvin:2.5,
  pressureDependentMeltModel:'PURE_H2O_ICE_IH_ONLY_BELOW_200_MPA',
  assumedRadiogenicSpecificPowerUpperWattsPerKilogramRock:1e-11,
  actualRadiogenicHeatFluxWattsPerSquareMeter:null,
  actualSalinity:null,actualOceanPresence:'UNKNOWN',
  actualInteriorLiquidMassKilograms:null,actualIceShellThicknessKilometers:null,
  thermalScenarios:[],modelLimits:['TEST_FIXTURE_NOT_PHYSICAL_INFERENCE'],
});
describe('PRE-33.07b — formación mineral, transporte y potencias condicionales',()=>{
  it('resuelve una sensibilidad positiva solo como cota condicional',()=>{
    const x=Engine.moon(geo(),formation(),interior());
    expect(x.status).toBe('CONDITIONAL_CONTACT_UPPER_BOUND');
    expect(x.conditionalUpperPowerWatts).toBeGreaterThan(0);
    expect(x.physicallyResolvedPowerWatts).toBeNull();
    expect(x.lowerBoundPowerWatts).toBe(0);
    expect(x.conservationResidual01).toBeLessThan(1e-8);
  });
  it('no convierte capa desconocida en interfaz directa ni autoriza biología',()=>{
    const x=GeochemistryWorldPRE3307.moon(geo(),null,formation(),interior());
    expect(x.niche.waterRockContact).toBe('MODELLED_SEPARATED');
    expect(x.formationSensitivityPRE3307?.conditionalUpperPowerWatts).toBeGreaterThan(0);
    expect(x.quantifiedPathwayPowerWatts).toBeNull();
    expect(x.hasPositiveResolvedPower).toBe(false);
    expect(x.lifeEvaluated).toBe(false);
  });
  it('sin tasas o condiciones correctas no produce vatios',()=>{
    expect(Engine.moon({...geo(),modeledOceanBottomTemperatureKelvin:500},formation(),interior()).conditionalUpperPowerWatts).toBeNull();
    expect(Engine.moon(null,formation(),interior()).conditionalUpperPowerWatts).toBeNull();
  });
  it('hielo de alta presión excluye transporte directo bajo el escenario',()=>{
    const x=Engine.moon({...geo(),modeledWaterRockContact:'LIQUID_ISOLATED_BY_HIGH_PRESSURE_ICE'},formation(),interior());
    expect(x.conditionalUpperPowerWatts).toBe(0);
  });
  it('sin fuente de formación material alineada se mantiene incógnita',()=>{
    expect(Engine.moon(geo(),{...formation(),moonOrdinal:3},interior()).status).toBe('MISSING_FORMATION_OR_GEOMETRY');
  });
  it('el flujo térmico no sustituye química ni modifica el resultado',()=>{
    const a=Engine.moon(geo(),formation(),interior());
    const b=Engine.moon({...geo(),generatedHeatFluxWattsPerSquareMeter:0},formation(),interior());
    expect(a.conditionalUpperPowerWatts).toBe(b.conditionalUpperPowerWatts);
  });
});
