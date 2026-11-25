import { describe, it, expect } from 'vitest';
import { viscorbLocalOrbitLayoutV1, viscorbMoonOrbitPresentationScaleV1,
  viscorbPresentedMoonRadiusV1, viscorbBlendOrbitTransformV1,
} from './viscorb-local-orbit-projection';

describe('GENESIS VISCORB.1 · proyección orbital científica local compartida', () => {
  const moons = [
    {periapsisPlanetRadii:3,apoapsisPlanetRadii:5,radiusEarth:0.25},
    {periapsisPlanetRadii:7,apoapsisPlanetRadii:12,radiusEarth:0.12},
  ];
  it('reproduce el contrato visual de la ficha sin alterar los parámetros de entrada', () => {
    const original = JSON.stringify(moons);
    const plan = viscorbLocalOrbitLayoutV1(moons)!;
    expect(plan.scenePerPlanetRadius).toBeCloseTo(4.35 / 12);
    expect(plan.planetRadius).toBeGreaterThanOrEqual(0.18);
    expect(plan.planetRadius).toBeLessThanOrEqual(0.78);
    expect(JSON.stringify(moons)).toBe(original);
    expect(viscorbMoonOrbitPresentationScaleV1(plan)).toBeCloseTo(plan.scenePerPlanetRadius / plan.planetRadius);
  });
  it('conserva las diferencias físicas de tamaño de las lunas', () => {
    const plan = viscorbLocalOrbitLayoutV1(moons)!;
    expect(viscorbPresentedMoonRadiusV1(plan,0.25)).toBeGreaterThan(viscorbPresentedMoonRadiusV1(plan,0.12));
  });
  it('conserva la reducción de VISCORB.1a y aplica otro 15% sobre ella sin cambiar las órbitas', () => {
    const plan = viscorbLocalOrbitLayoutV1(moons)!;
    const previous1aMax = Math.max(0.052, Math.min(0.145, plan.planetRadius * 0.21));
    const previous1aMoon = Math.max(0.022, previous1aMax * moons[0]!.radiusEarth / plan.maximumMoonRadiusEarth);
    const reduced = viscorbPresentedMoonRadiusV1(plan, moons[0]!.radiusEarth);
    expect(reduced).toBeCloseTo(previous1aMoon * 0.85, 12);
    expect(plan.outermostRadiusScene).toBe(4.35);
    expect(plan.scenePerPlanetRadius).toBeCloseTo(4.35 / 12);
  });
  it('mantiene la jerarquía de tamaños y un mínimo legible para lunas diminutas', () => {
    const plan = viscorbLocalOrbitLayoutV1(moons)!;
    const bigger = viscorbPresentedMoonRadiusV1(plan, 0.25);
    const smaller = viscorbPresentedMoonRadiusV1(plan, 0.12);
    expect(bigger).toBeGreaterThan(smaller);
    expect(viscorbPresentedMoonRadiusV1(plan, 0.0001)).toBeCloseTo(0.0187);
  });
  it('rechaza órbitas inválidas sin inventar geometría', () => {
    expect(viscorbLocalOrbitLayoutV1([])).toBeNull();
    expect(viscorbLocalOrbitLayoutV1([{periapsisPlanetRadii:5,apoapsisPlanetRadii:3,radiusEarth:1}])).toBeNull();
  });
  it('interpola de manera acotada y sin modificación de la escala física', () => {
    expect(viscorbBlendOrbitTransformV1(1,4,0)).toBe(1);
    expect(viscorbBlendOrbitTransformV1(1,4,1)).toBe(4);
    expect(viscorbBlendOrbitTransformV1(1,4,0.5)).toBe(2.5);
    expect(viscorbBlendOrbitTransformV1(1,4,2)).toBe(4);
  });
});
