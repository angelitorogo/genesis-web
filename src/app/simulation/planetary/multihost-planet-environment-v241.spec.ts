import { PlanetType } from '../../domain/planetary/planet-type';
import { greenhouseTemperatureAmplificationFactor } from '../../domain/planetary/atmosphere-greenhouse-effect';
import { planetaryEquilibriumTemperatureKelvin } from '../../domain/planetary/planet-climate-state';
import { generateMultihostPlanetEnvironmentV241 } from './multihost-planet-environment-v241';

const solid = Object.freeze({
  planetType: PlanetType.ROCKY, formationSeedHex: '0123456789ABCDEF0123456789ABCDEF',
  massEarth: 1, radiusEarth: 1, envelopeMassFraction01: 0.001,
  iceBearingFractionOfSolids01: 0.4, volatileRichFraction01: 0.15,
  referenceMeanInsolationEarth: 1, referenceBondAlbedo01: 0.3,
});

describe('V2.4.1 modeled host-only atmosphere, climate and surface water', () => {
  it('shares V1 radiative and greenhouse equations while preserving modeled provenance', () => {
    const first = generateMultihostPlanetEnvironmentV241(solid);
    expect(generateMultihostPlanetEnvironmentV241(solid)).toEqual(first);
    expect(first.source).toBe('V2_4_1_ESTIMATED_ENVIRONMENT');
    expect(first.referenceOnly).toBe(true);
    expect(first.equilibriumTemperatureKelvin).toBeCloseTo(
      planetaryEquilibriumTemperatureKelvin(1, 0.3), 12);
    expect(first.atmosphere.pressurePascal).not.toBeNull();
    if (first.atmosphere.infraredOpticalDepthProxy !== null) {
      expect(first.atmosphere.greenhouseAmplificationFactor).toBeCloseTo(
        greenhouseTemperatureAmplificationFactor(first.atmosphere.infraredOpticalDepthProxy), 12);
    }
    const liquid = first.water.surfaceLiquidWaterCoverageFraction01;
    const ice = first.water.surfaceIceCoverageFraction01;
    if (liquid !== null && ice !== null) {
      expect(liquid).toBeGreaterThanOrEqual(0);
      expect(ice).toBeGreaterThanOrEqual(0);
      expect(liquid + ice).toBeLessThanOrEqual(1);
    }
  });
  it('does not manufacture temperature or oceans without a stellar flux', () => {
    const unknown = generateMultihostPlanetEnvironmentV241({...solid,
      referenceMeanInsolationEarth: null});
    expect(unknown.equilibriumTemperatureKelvin).toBeNull();
    expect(unknown.atmosphere.pressurePascal).toBeNull();
    expect(unknown.climate.meanSurfaceTemperatureKelvin).toBeNull();
    expect(unknown.water.surfaceLiquidWaterCoverageFraction01).toBeNull();
  });
  it('never invents a physical surface under a giant envelope', () => {
    const giant = generateMultihostPlanetEnvironmentV241({...solid,
      planetType: PlanetType.GAS_GIANT, massEarth: 90, radiusEarth: 9,
      envelopeMassFraction01: 0.84});
    expect(giant.atmosphere.regime).toBe('DEEP_ENVELOPE');
    expect(giant.atmosphere.pressurePascal).toBeNull();
    expect(giant.climate.meanSurfaceTemperatureKelvin).toBeNull();
    expect(giant.water.surfaceLiquidWaterCoverageFraction01).toBeNull();
    expect(giant.water.surfaceIceCoverageFraction01).toBeNull();
  });
  it('rejects invalid source mass, composition or host flux', () => {
    expect(() => generateMultihostPlanetEnvironmentV241({...solid, massEarth: 0})).toThrow(RangeError);
    expect(() => generateMultihostPlanetEnvironmentV241({...solid,
      referenceMeanInsolationEarth: Number.NaN})).toThrow(RangeError);
    expect(() => generateMultihostPlanetEnvironmentV241({...solid,
      volatileRichFraction01: -0.1})).toThrow(RangeError);
  });
});
