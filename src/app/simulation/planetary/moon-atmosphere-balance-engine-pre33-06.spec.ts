import { describe, expect, it } from 'vitest';
import { MoonAtmosphereBalanceEnginePRE3306 as Engine } from './moon-atmosphere-balance-engine-pre33-06';
import { MoonAtmospherePhysicalEngine32F1 } from './moon-atmosphere-physical-engine-32-f-1';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import type { MoonAtmosphereAssessment } from '../../domain/planetary/moon-atmosphere-assessment';
import type { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type { MoonIndependentExobasePRE3306 } from '../../domain/planetary/moon-atmosphere-balance-pre33-06';

const geo = {hostPlanetOrdinal:1,moonOrdinal:1,massEarth:0.01,radiusEarth:0.27,surfaceGravityEarth:0.1};
const model=(pressure:number|null):MoonAtmosphereAssessment => ({
  volatileInventoryIndex01:0.99,thermalEscapeSupportIndex01:1,
  replenishmentSupportIndex01:1,condensationRemovalIndex01:0,
  estimatedSurfacePressurePascal:pressure,
  pressureBasis:pressure===null?'UNRESOLVED':'CONDITIONAL_SCENARIO',
  species:pressure===null?[]:[{gas:AtmosphereGas.NITROGEN,moleFraction01:1,partialPressurePascal:pressure}],
  irradiationReferenceEarth:10,chargedParticleEnvironment:'UNRESOLVED',hostMagnetosphereShielding:'UNRESOLVED',
});
const forcing={sourceKind:'INDEPENDENT_MASS_AND_FLUXES' as const,sourceId:'laboratory-independent-inventory-and-rates',
 durationSeconds:86400,collisionCrossSectionSquareMeters:1e-19,
 gasForcings:[{gas:AtmosphereGas.NITROGEN,initialGasMassKilograms:1e12,
 replenishmentKilogramsPerSecond:1e4,thermalEscapeKilogramsPerSecond:1e3,
 particleEscapeKilogramsPerSecond:0,photolysisRatePerSecond:0,
 photolysisEscapingFraction01:0}]};
const exo:MoonIndependentExobasePRE3306={sourceId:'independent-EUV-particle-and-exobase-forcing',
 exobaseAltitudeMeters:10000,exobaseTemperatureKelvin:160,
 exobaseNumberDensityPerCubicMeter:1e14,collisionCrossSectionSquareMeters:1e-19,
 euvEnergyFluxWattsPerSquareMeter:0,incidentParticleNumberFluxPerSquareMeterPerSecond:0};
const physical=()=>MoonAtmospherePhysicalEngine32F1.evaluate(geo as MoonPhysicalProperties,160,forcing);

describe('PRE-33.06 — balance atmosférico lunar V3',()=>{
 it('no convierte V1, hielo ni insolación en gas, presión física o escapes',()=>{
  const out=Engine.fromMaterialized(geo,model(120));
  expect(out.status).toBe('MISSING_INDEPENDENT_GAS_INVENTORY');
  expect(out.scenarioPressurePascal).toBe(120);
  expect(out.scenarioEquivalentGasMassKilograms).toBeCloseTo(120*out.kilogramsOfGasPerPascal,4);
  expect(out.physicalSurfacePressurePascal).toBeNull();
  expect(out.initialGasMassKilograms).toBeNull();
  expect(out.thermalEscapeMassKilograms).toBeNull();
 });
 it('no inventa presión física para una luna sin escenario ni fuente',()=>{
  const out=Engine.fromMaterialized(geo,model(null));
  expect(out.scenarioPressurePascal).toBeNull();
  expect(out.scenarioPartialPressuresPascal).toEqual([]);
  expect(out.physicalSurfacePressurePascal).toBeNull();
  expect(out.actualAtmospherePresenceCertified).toBe(false);
 });
 it('sin exobase/EUV, el balance previo 32.F.1 no certifica presión PRE-33.06',()=>{
  const out=Engine.fromMaterialized(geo,{...model(null),physicalBalance32F1:physical()});
  expect(out.status).toBe('MISSING_INDEPENDENT_EXOBASE_AND_HIGH_ENERGY_FORCING');
  expect(out.initialGasMassKilograms).toBe(1e12);
  expect(out.physicalSurfacePressurePascal).toBeNull();
 });
 it('admite la presión de intervalo solo al completar todas las fuentes independientes',()=>{
  const out=Engine.fromMaterialized(geo,{...model(null),physicalBalance32F1:physical()},exo);
  expect(out.status).toBe('INDEPENDENT_INTERVAL_MODEL_NOT_OBSERVATION');
  expect(out.physicalSurfacePressurePascal).toBeGreaterThan(0);
  expect(out.physicalPartialPressuresPascal.reduce((s,g)=>s+g.pressurePascal,0))
    .toBeCloseTo(out.physicalSurfacePressurePascal!,7);
  expect(out.physicalSurfacePressureObserved).toBe(false);
  expect(out.historicalPersistenceCertified).toBe(false);
 });
 it('no confunde fotólisis retenida con pérdida atmosférica',()=>{
  const b=MoonAtmospherePhysicalEngine32F1.evaluate(geo as MoonPhysicalProperties,160,{
   ...forcing,gasForcings:[{...forcing.gasForcings[0],photolysisRatePerSecond:1e-8,
    photolysisEscapingFraction01:0}],
  });
  const out=Engine.fromMaterialized(geo,{...model(null),physicalBalance32F1:b},exo);
  expect(out.status).toBe('PHOTOCHEMICAL_PRODUCTS_UNIDENTIFIED');
  expect(out.physicalSurfacePressurePascal).toBeNull();
 });
 it('rechaza exobase suelta e insumos inventados o físicamente inválidos',()=>{
  expect(()=>Engine.fromMaterialized(geo,model(10),exo)).toThrow(/exobase cannot substitute/);
  expect(()=>Engine.fromMaterialized(geo,{...model(null),physicalBalance32F1:physical()},
    {...exo,exobaseTemperatureKelvin:0})).toThrow(/exobase and high-energy/);
 });
 it('fuera de la transición colisional no atribuye presión física',()=>{
  const out=Engine.fromMaterialized(geo,{...model(null),physicalBalance32F1:physical()},
   {...exo,exobaseNumberDensityPerCubicMeter:1e20});
  expect(out.status).toBe('EXOBASE_OUTSIDE_COLLISIONAL_TRANSITION_DOMAIN');
  expect(out.physicalSurfacePressurePascal).toBeNull();
 });
});
