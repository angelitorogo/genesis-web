import {buildSystemSceneMinorBodyOrbitPresentationV1} from './system-scene-minor-body-orbit-v1';

describe('V1 minor-body orbit presentation shared by SINGLE and BINARY', () => {
  it('reproduces the frozen V1 24.6 semi-axes, focus and clearance for elliptical comets', () => {
    for (const semiMajorAxisAu of [0.5, 2.4, 20, 900]) {
      for (const eccentricity of [0, 0.4, 0.725, 0.9, 0.97]) {
        for (const starRadius of [0.12, 0.3, 0.7]) {
          const projected = 0.6 + Math.log1p(semiMajorAxisAu);
          const oldProjectedPeri = projected * (1 - eccentricity);
          const oldMinimumPeri = Math.max(0.48, starRadius + 0.22);
          const oldExpansion = oldProjectedPeri > Number.EPSILON &&
            oldProjectedPeri < oldMinimumPeri ? oldMinimumPeri / oldProjectedPeri : 1;
          const oldAxis = projected * oldExpansion;
          const actual = buildSystemSceneMinorBodyOrbitPresentationV1({
            semiMajorAxisAu, eccentricity, projectedSemiMajorScene: projected,
            maximumVisibleStarRadiusScene: starRadius,
          });
          expect(actual.semiMajorScene).toBe(oldAxis);
          expect(actual.semiMinorScene).toBe(oldAxis * Math.sqrt(1 - eccentricity ** 2));
          expect(actual.focusOffsetScene).toBe(oldAxis * eccentricity);
          expect(actual.presentationExpansionFactor).toBe(oldExpansion);
          expect(actual.linearScenePerAu).toBe(oldExpansion > 1 ? oldAxis / semiMajorAxisAu : null);
          expect(actual.semiMajorScene - actual.focusOffsetScene)
            .toBeGreaterThanOrEqual(oldMinimumPeri - 1e-9);
          expect(Object.isFrozen(actual)).toBe(true);
        }
      }
    }
  });

  it('rejects unbound, nonphysical or undefined ellipse inputs', () => {
    expect(() => buildSystemSceneMinorBodyOrbitPresentationV1({
      semiMajorAxisAu: 2, eccentricity: 1, projectedSemiMajorScene: 3,
      maximumVisibleStarRadiusScene: 0.2,
    })).toThrow(RangeError);
    expect(() => buildSystemSceneMinorBodyOrbitPresentationV1({
      semiMajorAxisAu: 0, eccentricity: 0.5, projectedSemiMajorScene: 3,
      maximumVisibleStarRadiusScene: 0.2,
    })).toThrow(RangeError);
  });
});
