import { PlanetType } from '../../domain/planetary/planet-type';
import { adaptiveSystemPlanetRadiusScene } from './system-scene-scale-projection';
import { presentationPlanetRadiusFromPhysicsV1 } from './system-scene-planet-size-v1';

/** Independent regression of the frozen V1 formula, not just a range test. */
function originalV1(radius: number, type: PlanetType, density: number, gas: number): number {
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  const scale = (v: number, a: number, b: number, lo: number, hi: number) =>
    lo + (hi - lo) * clamp((Math.sqrt(v) - Math.sqrt(a)) /
      (Math.sqrt(b) - Math.sqrt(a)), 0, 1);
  const r = Math.max(radius, 0.12);
  const giant = [PlanetType.MINI_NEPTUNE, PlanetType.GAS_GIANT, PlanetType.ICE_GIANT].includes(type);
  const family = giant ? scale(r, 1.8, 16, 0.050, 0.122) :
    scale(r, 0.30, 2.8, 0.013, 0.036);
  const factor = type === PlanetType.GAS_GIANT ? 1.20 :
    type === PlanetType.ICE_GIANT ? 1.06 : type === PlanetType.MINI_NEPTUNE ? 0.88 :
    type === PlanetType.SUPER_EARTH ? 1.10 : type === PlanetType.OCEAN ? 1.02 :
    type === PlanetType.DESERT ? 0.97 : type === PlanetType.ICE ? 0.98 :
    type === PlanetType.VOLCANIC ? 0.92 : 0.88;
  const densityScale = giant ? clamp(1.07 - 0.04 * (density - 1.4), 0.94, 1.12) :
    clamp(1 - 0.022 * (density - 4.1), 0.92, 1.05);
  const gasScale = giant ? clamp(0.94 + 0.18 * gas, 0.94, 1.12) : 1;
  return clamp(((giant ? 0.16 : 0.22) * adaptiveSystemPlanetRadiusScene(r) +
    (giant ? 0.84 : 0.78) * family) * factor * densityScale * gasScale,
  giant ? 0.048 : 0.012, giant ? 0.138 : 0.040);
}

describe('V2.4.1 correction: shared SINGLE planet radius', () => {
  it('matches the exact V1 size formula for solids and deep envelopes', () => {
    for (const type of Object.values(PlanetType)) {
      for (const radiusEarth of [0.22, 0.48, 1, 1.8, 3.4, 5, 11.2]) {
        const density = type === PlanetType.GAS_GIANT ? 1.1 : 4.9;
        const gas = type === PlanetType.GAS_GIANT ? 0.85 : 0;
        expect(presentationPlanetRadiusFromPhysicsV1({
          radiusEarth, planetType: type, densityGramsPerCubicCentimeter: density,
          envelopeMassFraction01: gas,
          isDeepEnvelopeSurface: [PlanetType.MINI_NEPTUNE, PlanetType.GAS_GIANT,
            PlanetType.ICE_GIANT].includes(type),
        })).toBeCloseTo(originalV1(radiusEarth, type, density, gas), 14);
      }
    }
  });
  it('makes a gas giant measurably larger than a rocky world, without altering AU', () => {
    const solid = presentationPlanetRadiusFromPhysicsV1({radiusEarth: 1,
      planetType: PlanetType.ROCKY, densityGramsPerCubicCentimeter: 5.5,
      envelopeMassFraction01: 0, isDeepEnvelopeSurface: false});
    const giant = presentationPlanetRadiusFromPhysicsV1({radiusEarth: 8,
      planetType: PlanetType.GAS_GIANT, densityGramsPerCubicCentimeter: 1,
      envelopeMassFraction01: .8, isDeepEnvelopeSurface: true});
    expect(giant).toBeGreaterThan(solid * 2);
  });
});
