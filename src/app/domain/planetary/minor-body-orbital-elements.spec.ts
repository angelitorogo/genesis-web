import {
  MinorBodyKind,
} from './minor-body-kind';

import {
  MinorBodyOrbitConicRegime,
} from './minor-body-orbit-conic-regime';

import {
  MinorBodyOrbitalElements,
} from './minor-body-orbital-elements';

describe(
  'MinorBodyOrbitalElements point 23.2',
  () => {
    it(
      'should validate one normalized bound elliptic orbit and expose negative specific energy',
      () => {
        const orbit =
          new MinorBodyOrbitalElements(
            MinorBodyKind.COMET,
            '11111111111111111111111111111111',
            'COM-001',
            MinorBodyOrbitConicRegime.ELLIPTIC,
            1,
            4,
            0.25,
            12,
            20,
            30,
            40,
            3,
            5,
            8,
          );

        expect(
          orbit.isBound,
        ).toBe(true);

        expect(
          orbit.isHyperbolic,
        ).toBe(false);

        expect(
          orbit.specificOrbitalEnergyAu2PerYear2,
        ).toBeLessThan(0);
      },
    );

    it(
      'should preserve a hyperbolic visitor without inventing apoapsis, period or elliptic mean anomaly',
      () => {
        const orbit =
          new MinorBodyOrbitalElements(
            MinorBodyKind.INTERSTELLAR_OBJECT,
            '22222222222222222222222222222222',
            'ISO-001',
            MinorBodyOrbitConicRegime.HYPERBOLIC,
            1,
            -20,
            1.1,
            120,
            50,
            60,
            null,
            2,
            null,
            null,
          );

        expect(
          orbit.isBound,
        ).toBe(false);

        expect(
          orbit.isHyperbolic,
        ).toBe(true);

        expect(
          orbit.apoapsisAu,
        ).toBeNull();

        expect(
          orbit.orbitalPeriodYears,
        ).toBeNull();

        expect(
          orbit.specificOrbitalEnergyAu2PerYear2,
        ).toBeGreaterThan(0);

        expect(
          orbit.isRetrograde,
        ).toBe(true);
      },
    );

    it(
      'should reject conic-inconsistent signed axes, eccentricities and elliptic-only fields',
      () => {
        expect(
          () =>
            new MinorBodyOrbitalElements(
              MinorBodyKind.ASTEROID,
              '33333333333333333333333333333333',
              'AST-IN-001',
              MinorBodyOrbitConicRegime.ELLIPTIC,
              1,
              -1,
              0.1,
              0,
              0,
              0,
              0,
              0.9,
              1.1,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new MinorBodyOrbitalElements(
              MinorBodyKind.INTERSTELLAR_OBJECT,
              '44444444444444444444444444444444',
              'ISO-001',
              MinorBodyOrbitConicRegime.HYPERBOLIC,
              1,
              -20,
              1.1,
              120,
              0,
              0,
              0,
              2,
              null,
              null,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
