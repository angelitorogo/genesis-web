import {
  CircumbinaryPlanetCompatibility,
  CircumbinaryPlanetCompatibilityRegime,
} from './circumbinary-planet-compatibility';

import {
  StellarSystemMultiplicity,
} from '../stellar/stellar-system-multiplicity';

describe(
  'CircumbinaryPlanetCompatibility point 16.5',
  () => {
    it(
      'should model an open compatible P-type zone for an isolated binary',
      () => {
        const compatibility =
          new CircumbinaryPlanetCompatibility(
            StellarSystemMultiplicity.BINARY,
            CircumbinaryPlanetCompatibilityRegime.OPEN_OUTER,
            2.2,
            null,
            3.2,
            null,
            0.25,
            null,
          );

        expect(compatibility.isCompatible).toBe(true);
        expect(compatibility.isOuterBounded).toBe(false);
        expect(compatibility.stableAnnulusWidthAu).toBeNull();
        expect(compatibility.stableSpanRatio).toBeNull();
        expect(compatibility.containsSemiMajorAxisAu(2.19)).toBe(false);
        expect(compatibility.containsSemiMajorAxisAu(2.2)).toBe(true);
        expect(compatibility.containsSemiMajorAxisAu(200)).toBe(true);
      },
    );

    it(
      'should model a finite compatible annulus for a hierarchical triple',
      () => {
        const compatibility =
          new CircumbinaryPlanetCompatibility(
            StellarSystemMultiplicity.TRIPLE,
            CircumbinaryPlanetCompatibilityRegime.TERTIARY_BOUNDED,
            2.0,
            8.0,
            3.0,
            20.0,
            0.30,
            0.15,
          );

        expect(compatibility.isCompatible).toBe(true);
        expect(compatibility.isOuterBounded).toBe(true);
        expect(compatibility.stableAnnulusWidthAu).toBe(6);
        expect(compatibility.stableSpanRatio).toBe(4);
        expect(compatibility.containsSemiMajorAxisAu(5)).toBe(true);
        expect(compatibility.containsSemiMajorAxisAu(8.01)).toBe(false);
      },
    );

    it(
      'should preserve diagnostic critical radii when the tertiary removes the stable annulus',
      () => {
        const compatibility =
          new CircumbinaryPlanetCompatibility(
            StellarSystemMultiplicity.TRIPLE,
            CircumbinaryPlanetCompatibilityRegime.DYNAMICALLY_EXCLUDED,
            3.0,
            2.5,
            4.0,
            3.0,
            0.20,
            0.10,
          );

        expect(compatibility.isCompatible).toBe(false);
        expect(compatibility.stableAnnulusWidthAu).toBe(0);
        expect(compatibility.containsSemiMajorAxisAu(3)).toBe(false);
      },
    );

    it(
      'should reject single-host, regime/boundary mismatches and invalid mass fractions',
      () => {
        expect(
          () =>
            new CircumbinaryPlanetCompatibility(
              StellarSystemMultiplicity.SINGLE,
              CircumbinaryPlanetCompatibilityRegime.OPEN_OUTER,
              2,
              null,
              3,
              null,
              0.25,
              null,
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new CircumbinaryPlanetCompatibility(
              StellarSystemMultiplicity.BINARY,
              CircumbinaryPlanetCompatibilityRegime.TERTIARY_BOUNDED,
              2,
              5,
              3,
              9,
              0.25,
              0.10,
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new CircumbinaryPlanetCompatibility(
              StellarSystemMultiplicity.TRIPLE,
              CircumbinaryPlanetCompatibilityRegime.TERTIARY_BOUNDED,
              5,
              4,
              10,
              8,
              0.25,
              0.10,
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new CircumbinaryPlanetCompatibility(
              StellarSystemMultiplicity.TRIPLE,
              CircumbinaryPlanetCompatibilityRegime.DYNAMICALLY_EXCLUDED,
              2,
              5,
              3,
              9,
              0.25,
              0.10,
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new CircumbinaryPlanetCompatibility(
              StellarSystemMultiplicity.BINARY,
              CircumbinaryPlanetCompatibilityRegime.OPEN_OUTER,
              2,
              null,
              3,
              null,
              0.51,
              null,
            ),
        ).toThrow(RangeError);
      },
    );
  },
);
