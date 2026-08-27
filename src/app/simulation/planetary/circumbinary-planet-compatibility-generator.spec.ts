import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  CircumbinaryPlanetCompatibilityRegime,
} from '../../domain/planetary/circumbinary-planet-compatibility';

import {
  type StellarCompanion,
} from '../../domain/stellar/stellar-companion';

import {
  StellarOrbitHierarchy,
} from '../../domain/stellar/stellar-orbit-hierarchy';

import {
  StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';

import {
  StellarRelativeOrbit,
} from '../../domain/stellar/stellar-relative-orbit';

import {
  StellarSystemComponentLabel,
} from '../../domain/stellar/stellar-system-component-label';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  CircumbinaryPlanetCompatibilityGenerator,
} from './circumbinary-planet-compatibility-generator';

describe(
  'CircumbinaryPlanetCompatibilityGenerator point 16.5',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const primaryPhysicalProperties =
      new StellarPhysicalProperties(
        1,
        1,
        1,
        1,
        5772,
      );

    function companion(
      label:
        StellarSystemComponentLabel,

      massSolar:
        number,
    ): StellarCompanion {

      return {
        componentLabel:
          label,

        physicalProperties:
          {
            initialMassSolar:
              massSolar,
          },
      } as unknown as StellarCompanion;
    }

    const secondary =
      companion(
        StellarSystemComponentLabel.B,
        0.5,
      );

    const tertiary =
      companion(
        StellarSystemComponentLabel.C,
        0.25,
      );

    it(
      'should compute the buffered Holman-Wiegert P-type inner edge for a binary without inventing an outer cutoff',
      () => {
        const hierarchy =
          new StellarOrbitHierarchy(
            StellarSystemMultiplicity.BINARY,
            new StellarRelativeOrbit(
              1,
              0,
              1,
            ),
            null,
          );

        const compatibility =
          CircumbinaryPlanetCompatibilityGenerator
            .generateBinary(
              generationKey,
              hierarchy,
              primaryPhysicalProperties,
              secondary,
            );

        expect(
          compatibility.regime,
        ).toBe(
          CircumbinaryPlanetCompatibilityRegime.OPEN_OUTER,
        );

        expect(
          compatibility.binaryMassFraction,
        ).toBeCloseTo(
          1 / 3,
          14,
        );

        expect(
          compatibility.minimumStableSemiMajorAxisAu,
        ).toBeCloseTo(
          2.528166666666667,
          14,
        );

        expect(
          compatibility.referenceMinimumPeriodYears,
        ).toBeCloseTo(
          3.2821839837392117,
          14,
        );

        expect(
          compatibility.maximumStableSemiMajorAxisAu,
        ).toBeNull();
      },
    );

    it(
      'should derive a finite compatible annulus when the tertiary is sufficiently distant',
      () => {
        const hierarchy =
          new StellarOrbitHierarchy(
            StellarSystemMultiplicity.TRIPLE,
            new StellarRelativeOrbit(
              1,
              0,
              1,
            ),
            new StellarRelativeOrbit(
              10,
              0.2,
              20,
            ),
          );

        const compatibility =
          CircumbinaryPlanetCompatibilityGenerator
            .generateTriple(
              generationKey,
              hierarchy,
              primaryPhysicalProperties,
              secondary,
              tertiary,
            );

        expect(
          compatibility.regime,
        ).toBe(
          CircumbinaryPlanetCompatibilityRegime.TERTIARY_BOUNDED,
        );

        expect(
          compatibility.tertiaryMassFraction,
        ).toBeCloseTo(
          1 / 7,
          14,
        );

        expect(
          compatibility.minimumStableSemiMajorAxisAu,
        ).toBeCloseTo(
          2.528166666666667,
          14,
        );

        expect(
          compatibility.maximumStableSemiMajorAxisAu,
        ).toBeCloseTo(
          2.8986942857142854,
          14,
        );

        expect(
          compatibility.isCompatible,
        ).toBe(true);
      },
    );

    it(
      'should classify a valid stellar triple as planet-excluding when C truncates inside the circumbinary critical edge',
      () => {
        const hierarchy =
          new StellarOrbitHierarchy(
            StellarSystemMultiplicity.TRIPLE,
            new StellarRelativeOrbit(
              1,
              0,
              1,
            ),
            new StellarRelativeOrbit(
              7,
              0.2,
              12,
            ),
          );

        const compatibility =
          CircumbinaryPlanetCompatibilityGenerator
            .generateTriple(
              generationKey,
              hierarchy,
              primaryPhysicalProperties,
              secondary,
              tertiary,
            );

        expect(
          compatibility.regime,
        ).toBe(
          CircumbinaryPlanetCompatibilityRegime.DYNAMICALLY_EXCLUDED,
        );

        expect(
          compatibility.maximumStableSemiMajorAxisAu,
        ).toBeLessThan(
          compatibility.minimumStableSemiMajorAxisAu,
        );

        expect(
          compatibility.isCompatible,
        ).toBe(false);
      },
    );

    it(
      'should conservatively accept companions below the empirical mass-fraction calibration floor without changing their real masses',
      () => {
        const lightSecondary =
          companion(
            StellarSystemComponentLabel.B,
            0.05,
          );

        const hierarchy =
          new StellarOrbitHierarchy(
            StellarSystemMultiplicity.BINARY,
            new StellarRelativeOrbit(
              1,
              0.1,
              1,
            ),
            null,
          );

        const compatibility =
          CircumbinaryPlanetCompatibilityGenerator
            .generateBinary(
              generationKey,
              hierarchy,
              primaryPhysicalProperties,
              lightSecondary,
            );

        expect(
          compatibility.binaryMassFraction,
        ).toBeCloseTo(
          0.05 / 1.05,
          14,
        );

        expect(
          compatibility.minimumStableSemiMajorAxisAu,
        ).toBeGreaterThan(
          hierarchy.innerOrbit!.apoastronAu,
        );
      },
    );

    it(
      'should reject mismatched architecture, out-of-calibration eccentricity and unsupported generator versions',
      () => {
        const binaryHierarchy =
          new StellarOrbitHierarchy(
            StellarSystemMultiplicity.BINARY,
            new StellarRelativeOrbit(
              1,
              0.1,
              1,
            ),
            null,
          );

        expect(
          () =>
            CircumbinaryPlanetCompatibilityGenerator
              .generateTriple(
                generationKey,
                binaryHierarchy,
                primaryPhysicalProperties,
                secondary,
                tertiary,
              ),
        ).toThrow(RangeError);

        const eccentricHierarchy =
          new StellarOrbitHierarchy(
            StellarSystemMultiplicity.BINARY,
            new StellarRelativeOrbit(
              1,
              0.81,
              1,
            ),
            null,
          );

        expect(
          () =>
            CircumbinaryPlanetCompatibilityGenerator
              .generateBinary(
                generationKey,
                eccentricHierarchy,
                primaryPhysicalProperties,
                secondary,
              ),
        ).toThrow(RangeError);

        const unsupportedVersion =
          Object.freeze({
            name:
              'V2',

            code:
              2,
          }) as unknown as GeneratorVersion;

        const fakeV2 =
          new UniverseGenerationKey(
            generationKey.universeSeed,
            unsupportedVersion,
          );

        expect(
          () =>
            CircumbinaryPlanetCompatibilityGenerator
              .generateBinary(
                fakeV2,
                binaryHierarchy,
                primaryPhysicalProperties,
                secondary,
              ),
        ).toThrow(RangeError);
      },
    );
  },
);
