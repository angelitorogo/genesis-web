import {
  circumstellarCriticalFraction,
  multipleBinarySemiMajorAxisAu,
  multipleTripleOuterSemiMajorAxisAu,
} from './stellar-multiple-orbital-spacing';

describe('Shared multiple-system orbital screening (future generator / current laboratory)', () => {
  it('preserves both circumstellar stability envelopes for unequal stars', () => {
    const massA = 1.1;
    const massB = 0.45;
    const eccentricity = 0.12;
    const a = multipleBinarySemiMajorAxisAu(8, 0.2, massA, massB, eccentricity, 1.12);
    expect(a * circumstellarCriticalFraction(massB / (massA + massB), eccentricity))
      .toBeGreaterThan(8);
    expect(a * circumstellarCriticalFraction(massA / (massA + massB), eccentricity))
      .toBeGreaterThan(0.2);
    expect(multipleBinarySemiMajorAxisAu(8, 0.2, massA, massB, eccentricity, 1.12))
      .toBe(a);
  });

  it('places the third complete system outside the screened A-B hierarchy', () => {
    const inner = multipleBinarySemiMajorAxisAu(2, 0.2, 1, 0.7, 0.12, 1.12);
    const outer = multipleTripleOuterSemiMajorAxisAu(
      inner, 0.12, 2, 0.2, 3, 1, 0.7, 0.35, 0.18, 1.12,
    );
    expect(outer).toBeGreaterThan(inner * (1 + 0.12));
    expect(Number.isFinite(outer)).toBe(true);
  });

  it('does not accept invalid stellar masses or eccentricities', () => {
    expect(() => multipleBinarySemiMajorAxisAu(2, 0.2, 1, 0, 0.12, 1.12))
      .toThrow(RangeError);
    expect(() => circumstellarCriticalFraction(0.3, 0.81)).toThrow(RangeError);
  });
});
