import type { SystemSceneSnapshot } from '../../system/system-scene-snapshot';
import {
  laboratoryBinarySemiMajorAxisAu,
  laboratoryCircumstellarCriticalFraction,
  laboratoryOrbitalSpacingProfile,
  laboratoryProtectedSingleExtentAu,
  laboratoryTripleOuterSemiMajorAxisAu,
} from './stellar-system-laboratory-orbital-spacing';

const eInner = 0.12;
const eOuter = 0.18;

// A compact real source is an input requirement, never manufactured by
// rescaling/truncating planetary orbits after generation.
describe('Laboratory orbital diversity: full source systems, analytic separation', () => {
  it('makes compact sources genuinely closer than the former fixed 12x rule, without dropping any orbit', () => {
    const radiusA = 6;
    const radiusB = 3;
    const massA = 1;
    const massB = 0.8;
    const compact = laboratoryBinarySemiMajorAxisAu(
      radiusA, radiusB, massA, massB, eInner,
      laboratoryOrbitalSpacingProfile('A').safetyFactor,
    );
    const wide = laboratoryBinarySemiMajorAxisAu(
      radiusA, radiusB, massA, massB, eInner,
      laboratoryOrbitalSpacingProfile('H').safetyFactor,
    );
    expect(compact).toBeLessThan(300);
    expect(compact).toBeLessThan(12 * radiusA / (1 - eInner));
    expect(wide).toBeGreaterThan(compact);
    expect(radiusA).toBeLessThan(
      compact * laboratoryCircumstellarCriticalFraction(massB / (massA + massB), eInner),
    );
    expect(radiusB).toBeLessThan(
      compact * laboratoryCircumstellarCriticalFraction(massA / (massA + massB), eInner),
    );
    expect(compact * (1 - eInner)).toBeGreaterThan(radiusA + radiusB);
  });

  it('includes actual planet apastra, radiative HZ and asteroid-belt edges, not just a visual radius', () => {
    const source = {
      motions: [
        { id: 'planet-1', semiMajorAxisAu: 8, eccentricity: 0.25 },
      ],
      planets: [
        { motionContributions: [{ motionId: 'planet-1' }] },
      ],
      habitableZone: { radiativeOuterEdgeAu: 11 },
      asteroidBelts: [{ outerEdgeAu: 14 }],
    } as unknown as SystemSceneSnapshot;
    expect(laboratoryProtectedSingleExtentAu(source)).toBe(14);
    expect(laboratoryProtectedSingleExtentAu({ ...source, asteroidBelts: [] })).toBe(11);
    expect(laboratoryProtectedSingleExtentAu({
      ...source, asteroidBelts: [], habitableZone: null,
    })).toBe(10);
  });

  it('does not reserve an unoccupied star\'s HZ, but retains its original HZ data', () => {
    const empty = {
      motions: [],
      planets: [],
      asteroidBelts: [],
      habitableZone: { radiativeOuterEdgeAu: 80 },
    } as unknown as SystemSceneSnapshot;
    const originalZone = empty.habitableZone;
    expect(laboratoryProtectedSingleExtentAu(empty)).toBe(0.2);
    expect(empty.habitableZone).toBe(originalZone);
    expect(empty.habitableZone?.radiativeOuterEdgeAu).toBe(80);

    // A belt-only host still protects its physical reservoir and, under the
    // existing conservative rule, the HZ of a host with an occupied region.
    expect(laboratoryProtectedSingleExtentAu({
      ...empty,
      asteroidBelts: [{ outerEdgeAu: 6 }],
    } as unknown as SystemSceneSnapshot)).toBe(80);

    // Having planets but no belt preserves the previous HZ clearance.
    const planetHost = {
      ...empty,
      motions: [{ id: 'planet-1', semiMajorAxisAu: 2, eccentricity: 0.1 }],
      planets: [{ motionContributions: [{ motionId: 'planet-1' }] }],
      habitableZone: { radiativeOuterEdgeAu: 4 },
    } as unknown as SystemSceneSnapshot;
    expect(laboratoryProtectedSingleExtentAu(planetHost)).toBe(4);
  });

  it('allows a sparse companion to approach without moving a populated host or removing its HZ', () => {
    const populated = {
      motions: [{ id: 'planet-1', semiMajorAxisAu: 2, eccentricity: 0.15 }],
      planets: [{ motionContributions: [{ motionId: 'planet-1' }] }],
      asteroidBelts: [],
      habitableZone: { radiativeOuterEdgeAu: 3 },
    } as unknown as SystemSceneSnapshot;
    const empty = {
      motions: [], planets: [], asteroidBelts: [],
      habitableZone: { radiativeOuterEdgeAu: 60 },
    } as unknown as SystemSceneSnapshot;
    const extentA = laboratoryProtectedSingleExtentAu(populated);
    const extentB = laboratoryProtectedSingleExtentAu(empty);
    const compact = laboratoryBinarySemiMajorAxisAu(extentA, extentB, 1, 0.7, eInner, 1.12);
    const formerlyHZLimited = laboratoryBinarySemiMajorAxisAu(extentA, 60, 1, 0.7, eInner, 1.12);
    expect(extentA).toBe(3);
    expect(extentB).toBe(0.2);
    expect(compact).toBeLessThan(formerlyHZLimited);
    expect(compact * (1 - eInner)).toBeGreaterThan(extentA + extentB);
    expect(compact * laboratoryCircumstellarCriticalFraction(0.7 / 1.7, eInner))
      .toBeGreaterThanOrEqual(extentA * 1.12 - 1e-10);
    expect(compact * laboratoryCircumstellarCriticalFraction(1 / 1.7, eInner))
      .toBeGreaterThanOrEqual(extentB * 1.12 - 1e-10);
    expect(populated.planets).toHaveLength(1);
    expect(empty.habitableZone?.radiativeOuterEdgeAu).toBe(60);
  });

  it('permits a closer outer companion C when it is empty, retaining triple hierarchy clearance', () => {
    const empty = {
      motions: [], planets: [], asteroidBelts: [],
      habitableZone: { radiativeOuterEdgeAu: 90 },
    } as unknown as SystemSceneSnapshot;
    const extC = laboratoryProtectedSingleExtentAu(empty);
    const inner = laboratoryBinarySemiMajorAxisAu(2, 0.2, 1, 0.8, eInner, 1.12);
    const compactOuter = laboratoryTripleOuterSemiMajorAxisAu(
      inner, eInner, 2, 0.2, extC, 1, 0.8, 0.6, eOuter, 1.12,
    );
    const formerlyHZLimited = laboratoryTripleOuterSemiMajorAxisAu(
      inner, eInner, 2, 0.2, 90, 1, 0.8, 0.6, eOuter, 1.12,
    );
    expect(extC).toBe(0.2);
    expect(compactOuter).toBeLessThan(formerlyHZLimited);
    expect(compactOuter * (1 - eOuter)).toBeGreaterThan(inner * (1 + eInner));
    expect(empty.habitableZone?.radiativeOuterEdgeAu).toBe(90);
  });

  it('preserves (A+B)+C hierarchy, checking the outer orbit against both the inner excursion and C', () => {
    const massA = 1;
    const massB = 0.8;
    const massC = 0.6;
    const aInner = laboratoryBinarySemiMajorAxisAu(6, 3, massA, massB, eInner, 1.12);
    const aOuter = laboratoryTripleOuterSemiMajorAxisAu(
      aInner, eInner, 6, 3, 4, massA, massB, massC, eOuter, 1.12,
    );
    const maxExcursion = aInner * (1 + eInner) * Math.max(massA, massB) / (massA + massB);
    const envelopeAB = maxExcursion + 6;
    expect(aOuter * (1 - eOuter)).toBeGreaterThan(envelopeAB + 4);
    expect(aOuter).toBeGreaterThan(aInner);
    expect(envelopeAB).toBeLessThan(aOuter * laboratoryCircumstellarCriticalFraction(
      massC / (massA + massB + massC), eOuter,
    ));
    expect(4).toBeLessThan(aOuter * laboratoryCircumstellarCriticalFraction(
      (massA + massB) / (massA + massB + massC), eOuter,
    ));
    const wide = laboratoryTripleOuterSemiMajorAxisAu(
      aInner, eInner, 6, 3, 4, massA, massB, massC, eOuter, 3.05,
    );
    expect(wide).toBeGreaterThan(aOuter);
  });

  it('does not quietly accept unsupported mass/eccentricity inputs', () => {
    expect(() => laboratoryBinarySemiMajorAxisAu(5, 2, 0, 1, eInner, 1.12)).toThrow();
    expect(() => laboratoryBinarySemiMajorAxisAu(5, 2, 1, 1, 0.9, 1.12)).toThrow();
    expect(() => laboratoryTripleOuterSemiMajorAxisAu(
      20, eInner, 5, 2, 1, 1, 1, 1, 0.9, 1.12,
    )).toThrow();
  });
});
