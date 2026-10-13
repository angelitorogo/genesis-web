import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { CompactPlanetaryHost } from '../../domain/stellar/compact-planetary-host';
import { CompactHostPlanetarySystemGenerator } from './compact-host-planetary-system-generator';
import {
  CompactHostEnvironmentEngine,
  COMPACT_REFERENCE_THERMAL_ABSORPTION,
  COMPACT_REFERENCE_ENERGETIC_ABSORPTION,
  COMPACT_REFERENCE_ACCRETION_ABSORPTION,
} from './compact-host-environment-engine';
import { CompactHostPlanetCharacterizationEngine } from './compact-host-planet-characterization-engine';
import { greenhouseLongwaveTrappingFraction01 } from '../../domain/planetary/atmosphere-greenhouse-effect';

const key=new UniverseGenerationKey(UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),GeneratorVersion.V2);
function sample(){
  for(let i=0n;i<5000n;i++){
    const system=CompactHostPlanetarySystemGenerator.generateOrNull(key,new SystemLocator(0n,0n,i));
    if(system!==null && system.planets.length>0) return system;
  }
  throw new Error('Fixture compacto no encontrada');
}

describe('31.4f: compact planetary environment and scientific provenance',()=>{
  it('creates one immutable composition/geophysics scenario per compact planet without changing its orbital identity',()=>{
    const s=sample();
    const again=CompactHostPlanetarySystemGenerator.generateOrNull(key,s.host.systemLocator)!;
    expect(s.characterizations).toHaveLength(s.planets.length);
    expect(s.characterizations).toEqual(again.characterizations);
    for(const [i,c] of s.characterizations.entries()){
      expect(Object.isFrozen(c)).toBe(true);
      expect(c.planetOrdinal).toBe(s.planets[i]!.ordinal);
      expect(c.coreFraction01+c.silicateFraction01+c.iceInteriorFraction01+c.volatileInteriorFraction01).toBeCloseTo(1,10);
      expect(c.rotationPeriodHours).toBeGreaterThan(0);
      expect(c.initialPressurePa).toBeGreaterThan(0);
      expect(c.internalHeatFluxReferenceWm2).toBeGreaterThan(0);
      expect(c.geologyActivityIndex01).toBeGreaterThanOrEqual(0);
      expect(c.geologyActivityIndex01).toBeLessThanOrEqual(1);
      expect(s.planets[i]!.locator).toEqual(again.planets[i]!.locator);
      expect(s.planets[i]!.orbitalPeriodDays).toBe(again.planets[i]!.orbitalPeriodDays);
      if(c.atmosphericGasMoleFractions!==null){
        expect(c.atmosphericGasMoleFractions.reduce((a,g)=>a+g.fraction01,0)).toBeCloseTo(1,8);
        expect(c.atmosphericPressurePa).not.toBeNull();
      }
      if(c.surfaceLiquidWaterCoverageFraction01!==null){
        expect((c.surfaceIceCoverageFraction01??0)+c.surfaceLiquidWaterCoverageFraction01).toBeLessThanOrEqual(1);
      }
    }
  });
  it('does not infer climate, surviving atmosphere gas phase or accretion from a quiescent black-hole illustration',()=>{
    const s=sample();
    const original=s.planets[0]!;
    const bh=new CompactPlanetaryHost({generationKey:key,systemLocator:s.host.systemLocator,
      type:ExtremeType.STELLAR_MASS_BLACK_HOLE,scientificState:{
        massSolar:8,activityRegime:'QUIESCENT',thermalLuminositySolar:null,
        highEnergyLuminositySolar:null,accretionLuminositySolar:null,
        surfaceMagneticFieldTesla:null,rotationPeriodSeconds:null,
      }});
    const env=CompactHostEnvironmentEngine.project(bh,original);
    const c=CompactHostPlanetCharacterizationEngine.generate(bh,original,env);
    expect(env.modeledIncludedFluxWm2).toBeNull();
    expect(c.equilibriumTemperatureK).toBeNull();
    expect(c.surfaceTemperatureScenarioK).toBeNull();
    expect(c.atmosphericPressurePa).toBeNull();
    expect(c.surfaceLiquidWaterCoverageFraction01).toBeNull();
    expect(c.internalHeatFluxReferenceWm2).toBeGreaterThan(0);
    expect(c.initialPressurePa).toBeGreaterThan(0);
    expect(c.climateAssessment).toBe('HOST_RADIATION_UNRESOLVED');
    expect(c.atmosphereAssessment).toBe('GAS_PHASE_UNRESOLVED');
  });
});


describe('31.4h compact climate and uncertainty closure', () => {
  it('uses exactly the 31.3 spectral coupling, plus separately identified geothermal heat', () => {
    const fixture=sample();
    const planet=fixture.planets[0]!;
    const star=new CompactPlanetaryHost({
      generationKey:key,systemLocator:fixture.host.systemLocator,
      type:ExtremeType.NEUTRON_STAR,
      scientificState:{massSolar:1.4,activityRegime:'QUIESCENT',
        thermalLuminositySolar:0.02,highEnergyLuminositySolar:0.004,
        accretionLuminositySolar:0,surfaceMagneticFieldTesla:null,rotationPeriodSeconds:null},
    });
    const env=CompactHostEnvironmentEngine.project(star,planet);
    const c=CompactHostPlanetCharacterizationEngine.generate(star,planet,env);
    const hostAbsorbed=(env.modeledThermalFluxWm2??0)*COMPACT_REFERENCE_THERMAL_ABSORPTION+
      (env.modeledEnergeticFluxWm2??0)*COMPACT_REFERENCE_ENERGETIC_ABSORPTION+
      (env.modeledAccretionBolometricFluxWm2??0)*COMPACT_REFERENCE_ACCRETION_ABSORPTION;
    const sigma=5.670374419e-8;
    expect(4*sigma*env.referenceRadiativeTemperatureK!**4).toBeCloseTo(hostAbsorbed,8);
    expect(4*sigma*c.equilibriumTemperatureK!**4).toBeCloseTo(
      hostAbsorbed+c.internalHeatFluxReferenceWm2,8);
    expect(c.surfaceTemperatureScenarioK).not.toBeNull();
  });

  it('does not invent global water-phase percentages without a water reservoir mass', () => {
    const fixture=sample();
    const planet=fixture.planets[0]!;
    const star=new CompactPlanetaryHost({
      generationKey:key,systemLocator:fixture.host.systemLocator,
      type:ExtremeType.NEUTRON_STAR,
      scientificState:{massSolar:1.4,activityRegime:'QUIESCENT',thermalLuminositySolar:0.02,
        highEnergyLuminositySolar:null,accretionLuminositySolar:null,
        surfaceMagneticFieldTesla:null,rotationPeriodSeconds:null},
    });
    const env=CompactHostEnvironmentEngine.project(star,planet);
    const c=CompactHostPlanetCharacterizationEngine.generate(star,planet,env);
    expect(c.surfaceTemperatureScenarioK).not.toBeNull();
    expect(c.waterIceFraction01).toBeNull();
    expect(c.waterLiquidFraction01).toBeNull();
    expect(c.waterVaporFraction01).toBeNull();
    expect(c.surfaceIceCoverageFraction01).not.toBeNull();
    expect(c.surfaceLiquidWaterCoverageFraction01).not.toBeNull();
    expect((c.surfaceIceCoverageFraction01??0)+(c.surfaceLiquidWaterCoverageFraction01??0))
      .toBeLessThanOrEqual(1);
  });

  it('keeps an unpowered black hole unresolved despite a modeled partial escape factor', () => {
    const fixture=sample();
    const star=new CompactPlanetaryHost({
      generationKey:key,systemLocator:fixture.host.systemLocator,
      type:ExtremeType.STELLAR_MASS_BLACK_HOLE,
      scientificState:{massSolar:8,activityRegime:'QUIESCENT',thermalLuminositySolar:null,
        highEnergyLuminositySolar:null,accretionLuminositySolar:null,
        surfaceMagneticFieldTesla:null,rotationPeriodSeconds:null},
    });
    const env=CompactHostEnvironmentEngine.project(star,fixture.planets[0]!);
    const c=CompactHostPlanetCharacterizationEngine.generate(star,fixture.planets[0]!,env);
    expect(c.gasRetentionFraction01).toBeGreaterThan(0);
    expect(c.atmosphericPressurePa).toBeNull();
    expect(c.equilibriumTemperatureK).toBeNull();
    expect(c.waterIceFraction01).toBeNull();
    expect(c.surfaceLiquidWaterCoverageFraction01).toBeNull();
  });
});


describe('31.4k — same greenhouse proxy as conventional planet domain', () => {
  it('respects absence of compact-host radiation and never synthesizes a climate', () => {
    const fixture=sample();
    const bh=new CompactPlanetaryHost({generationKey:key,systemLocator:fixture.host.systemLocator,
      type:ExtremeType.STELLAR_MASS_BLACK_HOLE,scientificState:{
        massSolar:8,activityRegime:'QUIESCENT',thermalLuminositySolar:null,
        highEnergyLuminositySolar:null,accretionLuminositySolar:null,
        surfaceMagneticFieldTesla:null,rotationPeriodSeconds:null,
      }});
    const env=CompactHostEnvironmentEngine.project(bh,fixture.planets[0]!);
    const c=CompactHostPlanetCharacterizationEngine.generate(bh,fixture.planets[0]!,env);
    expect(c.greenhouseTrappingFraction01).toBeNull();
    expect(c.atmosphericPressurePa).toBeNull();
    expect(c.surfaceTemperatureScenarioK).toBeNull();
  });
  it('returns a physically bounded longwave trapping fraction for resolved compact scenarios', () => {
    for(const c of sample().characterizations){
      if(c.greenhouseTrappingFraction01!==null){
        expect(c.greenhouseTrappingFraction01).toBeGreaterThanOrEqual(0);
        expect(c.greenhouseTrappingFraction01).toBeLessThanOrEqual(1);
      }
    }
    expect(greenhouseLongwaveTrappingFraction01(1)).toBe(0.5);
  });
});
