import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type { MoonTidalState } from '../../domain/planetary/moon-tidal-state';
import { MoonSeed } from '../../domain/seed/hierarchical-seeds';
import { PlanetType } from '../../domain/planetary/planet-type';
import type { MoonInternalWaterAssessment } from '../../domain/planetary/moon-internal-water-assessment';
import { MoonFormationInventoryEngine32F1d } from './moon-formation-inventory-engine-32-f-1d';
import { MoonWaterPhaseBalanceEngine32F2a } from './moon-water-phase-balance-32-f-2a';
import { MoonInteriorStructureEngine32F2b } from './moon-interior-structure-engine-32-f-2b';
import { MoonOceanRealityEngine32F2c } from './moon-ocean-reality-engine-32-f-2c';
import { MoonEnergyConfinementEnginePRE3305 as Engine } from './moon-energy-confinement-engine-pre33-05';
import { MoonSubsurfaceDomainEnginePRE3304 as Deep } from './moon-subsurface-domain-engine-pre33-04';

const seed = new MoonSeed('00000000000000000000000000000019');
function fixture(ecc = .012, locked = true, density = 1.32) {
  const physical = new MoonPhysicalProperties(8, 3, .003, .12, density, .05);
  const formation = MoonFormationInventoryEngine32F1d.fromMaterialized(physical,seed,PlanetType.GAS_GIANT);
  const interval: MoonInternalWaterAssessment = {
    basis:'ECCENTRICITY_TIDES_BOUNDED_SCENARIO',
    tidalHeatFluxMinimumWattsPerSquareMeter:.005,
    tidalHeatFluxMaximumWattsPerSquareMeter:.02,
    conductiveShellThicknessMinimumKilometers:null,
    conductiveShellThicknessMaximumKilometers:null,
    iceShellThermalRegime:'CONDITIONAL_ICE_OCEAN',cryovolcanism:'NOT_EVALUABLE',
    radiogenicHeatResolved:false,oceanConfirmed:false,
  };
  const phases=MoonWaterPhaseBalanceEngine32F2a.fromMaterialized(physical,formation,235.7);
  const interior=MoonInteriorStructureEngine32F2b.fromMaterialized(physical,formation,phases,interval,235.7);
  const ocean=MoonOceanRealityEngine32F2c.fromMaterialized(physical,seed,formation,phases,interior,interval,235.7);
  const tidal={hostPlanetOrdinal:8,moonOrdinal:3,sourceMoonMassEarth:physical.massEarth,
    sourceMoonRadiusEarth:physical.radiusEarth,sourceHostPlanetMassEarth:318,
    sourceEccentricity:ecc,sourceSemiMajorAxisKilometers:670000,
    sourceOrbitalPeriodDays:3.55,isTidallyLocked:locked} as MoonTidalState;
  const model=Engine.fromMaterialized(physical,tidal,formation,interior,ocean);
  return {physical,formation,interior,ocean,interval,tidal,model};
}
describe('PRE-33.05 — calentamiento mareal y confinamiento lunar V3',()=>{
  it('calcula k2/Q, potencia y flujo a partir de magnitudes orbitales; nunca del índice V1',()=>{
    const x=fixture();
    expect(x.model.tidalPowerMinimumWatts).toBeGreaterThan(0);
    expect(x.model.tidalFluxMaximumWattsPerSquareMeter).toBeGreaterThan(x.model.tidalFluxMinimumWattsPerSquareMeter!);
    expect(x.model.tidalResponseK2OverQMaximum).toBeGreaterThan(x.model.tidalResponseK2OverQMinimum!);
    expect(x.model.tidalRegime).toBe('BOUNDED_SYNCHRONOUS_LOW_E');
  });
  it('dependencia en e², sin fabricar calentamiento con órbita circular',()=>{
    const low=fixture(.01).model,high=fixture(.02).model,zero=fixture(0).model;
    expect(high.tidalPowerMaximumWatts! / low.tidalPowerMaximumWatts!).toBeCloseTo(4,10);
    expect(zero.tidalPowerMaximumWatts).toBe(0);
    expect(zero.eccentricityDampingYearsMinimum).toBeNull();
  });
  it('no computa mareas lineales para rotación no síncrona ni e elevada',()=>{
    for(const x of [fixture(.01,false),fixture(.19)]){
      expect(x.model.tidalFluxMinimumWattsPerSquareMeter).toBeNull();
      expect(x.model.totalFluxMaximumWattsPerSquareMeter).toBeNull();
      expect(x.model.thermalConfinement).toBe('UNRESOLVED_HEAT_OR_STRUCTURE');
    }
  });
  it('radiogénico reutiliza 32.F.2c sin doble suma',()=>{
    const x=fixture();
    expect(x.model.radiogenicFluxWattsPerSquareMeter).toBe(x.ocean.generatedRadiogenicFluxWattsPerSquareMeter);
    if(x.model.radiogenicFluxWattsPerSquareMeter!==null) {
      expect(x.model.totalFluxMaximumWattsPerSquareMeter).toBeCloseTo(
        x.model.radiogenicFluxWattsPerSquareMeter+x.model.tidalFluxMaximumWattsPerSquareMeter!,10);
    }
  });
  it('reproduce exactamente la misma luna sin consumir nuevo seed',()=>{
    expect(fixture().model).toEqual(fixture().model);
  });
  it('PRE-33.04 consume nuevo intervalo sin tocar el inventario ni los flags de océano',()=>{
    const x=fixture();
    const old=Deep.fromMaterialized(x.physical,x.formation,x.interior,x.ocean,x.interval);
    const next=Deep.fromMaterialized(x.physical,x.formation,x.interior,x.ocean,x.interval,x.model);
    expect(next.waterMassKilograms).toBe(old.waterMassKilograms);
    expect(next.basalPressurePascal).toBe(old.basalPressurePascal);
    expect(next.observationalOceanConfirmed).toBe(false);
    for(const s of next.thermalScenarios)expect(s.liquidMassKilograms+s.solidMassKilograms)
      .toBeCloseTo(next.waterMassKilograms,0);
  });
  it('rechaza identidad física o procedencia radiogénica cruzada',()=>{
    const x=fixture();
    expect(()=>Engine.fromMaterialized(x.physical,{...x.tidal,moonOrdinal:1} as MoonTidalState,
      x.formation,x.interior,x.ocean)).toThrow();
    expect(()=>Deep.fromMaterialized(x.physical,x.formation,x.interior,x.ocean,x.interval,
      {...x.model,radiogenicFluxWattsPerSquareMeter:1234})).toThrow();
  });
  it('una luna seca no crea agua ni océano y conserva su flujo mareal separado',()=>{
    const x=fixture(.01,true,4.8);
    expect(x.model.pressureDomain).toBe('NO_H2O');
    expect(x.model.thermalConfinement).toBe('DRY_NO_WATER');
    expect(x.model.oceanConfirmed).toBe(false);
  });
  it('no certifica historia térmica, resonancia ni fase profunda observada',()=>{
    const x=fixture();
    expect(x.model.independentThermalHistoryResolved).toBe(false);
    expect(x.model.tidalResonanceSustained).toBe(false);
    expect(x.model.oceanConfirmed).toBe(false);
  });
});
