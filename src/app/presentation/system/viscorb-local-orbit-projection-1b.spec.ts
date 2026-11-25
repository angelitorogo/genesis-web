import { describe, expect, it } from 'vitest';
import {
  viscorbLocalOrbitLayoutV1,
  viscorbMoonOrbitPresentationScaleV1,
  viscorbPresentedMoonRadiusV1,
} from './viscorb-local-orbit-projection';

/** Exact historical VISCORB.1a contract: use it as a numerical baseline. */
function previousMoonRadius1a(planetRadius: number, maximumRadiusEarth: number, moonRadiusEarth: number): number {
  const max = Math.max(0.052, Math.min(0.145, planetRadius * 0.21));
  return Math.max(0.022, max * moonRadiusEarth / maximumRadiusEarth);
}

describe('GENESIS VISCORB.1b — 15% adicional en fichas y escena local', () => {
  const scenarios = [
    [{ periapsisPlanetRadii: 3, apoapsisPlanetRadii: 5, radiusEarth: 0.25 },
     { periapsisPlanetRadii: 7, apoapsisPlanetRadii: 12, radiusEarth: 0.12 }],
    [{ periapsisPlanetRadii: 2, apoapsisPlanetRadii: 3, radiusEarth: 0.2 }],
    [{ periapsisPlanetRadii: 3, apoapsisPlanetRadii: 4, radiusEarth: 0.3 },
     { periapsisPlanetRadii: 25, apoapsisPlanetRadii: 50, radiusEarth: 0.04 }],
  ] as const;

  it('reduce exactamente 15% sobre 1a en distintos encuadres y tamaños, incluso en el mínimo', () => {
    for (const moons of scenarios) {
      const before = JSON.stringify(moons);
      const layout = viscorbLocalOrbitLayoutV1(moons)!;
      for (const radiusEarth of [...moons.map(m => m.radiusEarth), 0.0001]) {
        const previous = previousMoonRadius1a(layout.planetRadius, layout.maximumMoonRadiusEarth, radiusEarth);
        expect(viscorbPresentedMoonRadiusV1(layout, radiusEarth)).toBeCloseTo(previous * 0.85, 12);
      }
      expect(layout.maximumDisplayedMoonRadius).toBeCloseTo(
        previousMoonRadius1a(layout.planetRadius, layout.maximumMoonRadiusEarth, layout.maximumMoonRadiusEarth) * 0.85, 12,
      );
      expect(JSON.stringify(moons)).toBe(before);
    }
  });

  it('mantiene las órbitas y las relaciones de tamaños', () => {
    const layout = viscorbLocalOrbitLayoutV1(scenarios[0])!;
    expect(viscorbMoonOrbitPresentationScaleV1(layout))
      .toBeCloseTo(layout.scenePerPlanetRadius / layout.planetRadius, 12);
    expect(layout.outermostRadiusScene).toBe(4.35);
    expect(viscorbPresentedMoonRadiusV1(layout, 0.25))
      .toBeGreaterThan(viscorbPresentedMoonRadiusV1(layout, 0.12));
  });
});
