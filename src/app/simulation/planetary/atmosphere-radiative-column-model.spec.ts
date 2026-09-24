import {
  greenhouseTemperatureAmplificationFactor,
} from '../../domain/planetary/atmosphere-greenhouse-effect';

import {
  AtmosphereGas,
} from '../../domain/planetary/atmosphere-gas';

import {
  AtmosphereGasComponent,
} from '../../domain/planetary/atmosphere-gas-component';

import {
  atmosphereRadiativeColumnState,
} from './atmosphere-radiative-column-model';

const EARTH_GRAVITY =
  9.80665;

function gases(
  entries:
    readonly Readonly<[AtmosphereGas, number]>[],
): readonly AtmosphereGasComponent[] {
  return entries.map(
    ([gas, moleFraction01]) =>
      new AtmosphereGasComponent(
        gas,
        moleFraction01,
      ),
  );
}

function warmingKelvin(
  equilibriumTemperatureKelvin:
    number,

  opticalDepth:
    number,
): number {
  return equilibriumTemperatureKelvin *
    (
      greenhouseTemperatureAmplificationFactor(
        opticalDepth,
      ) -
      1
    );
}

describe(
  'atmosphereRadiativeColumnState greenhouse hotfix',
  () => {
    it(
      'keeps an extremely thin CO2-dominated atmosphere far from extreme greenhouse behavior',
      () => {
        const state =
          atmosphereRadiativeColumnState(
            700,
            0.38 *
              EARTH_GRAVITY,
            210,
            gases([
              [AtmosphereGas.CARBON_DIOXIDE, 0.95],
              [AtmosphereGas.NITROGEN, 0.05],
            ]),
          );

        expect(
          state.infraredOpticalDepthProxy,
        ).toBeLessThan(0.4);

        expect(
          warmingKelvin(
            210,
            state.infraredOpticalDepthProxy,
          ),
        ).toBeLessThan(15);
      },
    );

    it(
      'prevents a 0.05 bar wet CO2-rich atmosphere from producing the former +60 to +100 K artifact',
      () => {
        const state =
          atmosphereRadiativeColumnState(
            5_000,
            EARTH_GRAVITY,
            205,
            gases([
              [AtmosphereGas.CARBON_DIOXIDE, 0.30],
              [AtmosphereGas.WATER_VAPOR, 0.10],
              [AtmosphereGas.NITROGEN, 0.60],
            ]),
          );

        expect(
          state.infraredOpticalDepthProxy,
        ).toBeLessThan(0.5);

        expect(
          warmingKelvin(
            205,
            state.infraredOpticalDepthProxy,
          ),
        ).toBeLessThan(25);
      },
    );

    it(
      'does not let ordinary 0.1 to 0.3 bar atmospheres saturate easily at 80 to 95 percent longwave capture',
      () => {
        const pressures = [
          10_000,
          20_000,
          30_000,
        ];

        for (
          const pressurePascal of
          pressures
        ) {
          const state =
            atmosphereRadiativeColumnState(
              pressurePascal,
              EARTH_GRAVITY,
              200,
              gases([
                [AtmosphereGas.CARBON_DIOXIDE, 0.30],
                [AtmosphereGas.WATER_VAPOR, 0.05],
                [AtmosphereGas.NITROGEN, 0.65],
              ]),
            );

          const capture =
            state.infraredOpticalDepthProxy /
            (
              1 +
              state.infraredOpticalDepthProxy
            );

          expect(
            capture,
          ).toBeLessThan(0.70);
        }
      },
    );

    it(
      'keeps an Earth-pressure mixed atmosphere in a moderate greenhouse range rather than making one bar automatically extreme',
      () => {
        const state =
          atmosphereRadiativeColumnState(
            101_325,
            EARTH_GRAVITY,
            255,
            gases([
              [AtmosphereGas.CARBON_DIOXIDE, 0.0004],
              [AtmosphereGas.WATER_VAPOR, 0.01],
              [AtmosphereGas.METHANE, 0.0000018],
              [AtmosphereGas.NITROGEN, 0.7795982],
              [AtmosphereGas.OXYGEN, 0.21],
            ]),
          );

        const warming =
          warmingKelvin(
            255,
            state.infraredOpticalDepthProxy,
          );

        expect(
          warming,
        ).toBeGreaterThan(10);

        expect(
          warming,
        ).toBeLessThan(50);
      },
    );

    it(
      'still permits a many-bar CO2-rich atmosphere to enter an extreme greenhouse regime',
      () => {
        const state =
          atmosphereRadiativeColumnState(
            9_200_000,
            0.9 *
              EARTH_GRAVITY,
            232,
            gases([
              [AtmosphereGas.CARBON_DIOXIDE, 0.965],
              [AtmosphereGas.NITROGEN, 0.035],
            ]),
          );

        expect(
          state.infraredOpticalDepthProxy,
        ).toBeGreaterThan(10);

        expect(
          warmingKelvin(
            232,
            state.infraredOpticalDepthProxy,
          ),
        ).toBeGreaterThan(150);
      },
    );

    it(
      'increases CO2 forcing monotonically but with saturating line-band increments',
      () => {
        const partialColumns = [
          0.1,
          0.2,
          0.3,
          0.4,
        ];

        const opticalDepths =
          partialColumns.map(
            co2Fraction =>
              atmosphereRadiativeColumnState(
                101_325,
                EARTH_GRAVITY,
                250,
                gases([
                  [AtmosphereGas.CARBON_DIOXIDE, co2Fraction],
                  [AtmosphereGas.NITROGEN, 1 - co2Fraction],
                ]),
              ).greenhouseGasDiagnostics.find(
                diagnostic =>
                  diagnostic.gas ===
                  AtmosphereGas.CARBON_DIOXIDE,
              )!.opticalDepthContribution,
          );

        expect(
          opticalDepths[1],
        ).toBeGreaterThan(
          opticalDepths[0],
        );

        expect(
          opticalDepths[2],
        ).toBeGreaterThan(
          opticalDepths[1],
        );

        expect(
          opticalDepths[3],
        ).toBeGreaterThan(
          opticalDepths[2],
        );

        expect(
          opticalDepths[3] -
            opticalDepths[2],
        ).toBeLessThan(
          opticalDepths[2] -
            opticalDepths[1],
        );
      },
    );

    it(
      'uses P over g column mass so lower gravity strengthens the same pressure and composition',
      () => {
        const commonGases =
          gases([
            [AtmosphereGas.CARBON_DIOXIDE, 0.10],
            [AtmosphereGas.NITROGEN, 0.90],
          ]);

        const lowGravity =
          atmosphereRadiativeColumnState(
            50_000,
            0.5 *
              EARTH_GRAVITY,
            240,
            commonGases,
          );

        const highGravity =
          atmosphereRadiativeColumnState(
            50_000,
            2 *
              EARTH_GRAVITY,
            240,
            commonGases,
          );

        expect(
          lowGravity.totalColumnMassEarth,
        ).toBeGreaterThan(
          highGravity.totalColumnMassEarth,
        );

        expect(
          lowGravity.infraredOpticalDepthProxy,
        ).toBeGreaterThan(
          highGravity.infraredOpticalDepthProxy,
        );
      },
    );

    it(
      'limits cold-atmosphere water-vapor forcing by saturation vapor pressure instead of raw H2O percentage',
      () => {
        const state =
          atmosphereRadiativeColumnState(
            20_000,
            EARTH_GRAVITY,
            190,
            gases([
              [AtmosphereGas.WATER_VAPOR, 0.30],
              [AtmosphereGas.NITROGEN, 0.70],
            ]),
          );

        const water =
          state.greenhouseGasDiagnostics.find(
            diagnostic =>
              diagnostic.gas ===
              AtmosphereGas.WATER_VAPOR,
          )!;

        expect(
          water.effectivePartialPressurePascal,
        ).toBeLessThan(
          water.partialPressurePascal *
            0.01,
        );
      },
    );

    it(
      'keeps H2 collision-induced absorption weak in a thin atmosphere and stronger in a dense one',
      () => {
        const thin =
          atmosphereRadiativeColumnState(
            2_000,
            EARTH_GRAVITY,
            230,
            gases([
              [AtmosphereGas.HYDROGEN, 0.20],
              [AtmosphereGas.NITROGEN, 0.80],
            ]),
          );

        const dense =
          atmosphereRadiativeColumnState(
            2_000_000,
            EARTH_GRAVITY,
            230,
            gases([
              [AtmosphereGas.HYDROGEN, 0.20],
              [AtmosphereGas.NITROGEN, 0.80],
            ]),
          );

        const thinH2 =
          thin.greenhouseGasDiagnostics.find(
            diagnostic =>
              diagnostic.gas ===
              AtmosphereGas.HYDROGEN,
          )!;

        const denseH2 =
          dense.greenhouseGasDiagnostics.find(
            diagnostic =>
              diagnostic.gas ===
              AtmosphereGas.HYDROGEN,
          )!;

        expect(
          thinH2.opticalDepthContribution,
        ).toBeLessThan(0.1);

        expect(
          denseH2.opticalDepthContribution,
        ).toBeGreaterThan(
          thinH2.opticalDepthContribution,
        );
      },
    );

    it(
      'regresses the four observed thin-atmosphere pathologies without hardcoding planet identity',
      () => {
        const cases = [
          {
            pressurePascal: 4_600,
            gravityEarthSamples: [0.3, 0.5, 1, 2],
            co2: 0.267,
            h2o: 0.088,
            equilibriumKelvin: 204.6,
          },
          {
            pressurePascal: 10_300,
            gravityEarthSamples: [1.2890487890640296],
            co2: 0.222,
            h2o: 0.13,
            equilibriumKelvin: 206.8,
          },
          {
            pressurePascal: 24_300,
            gravityEarthSamples: [0.480644480904306],
            co2: 0.353,
            h2o: 0.024,
            equilibriumKelvin: 186.1,
          },
          {
            pressurePascal: 29_200,
            gravityEarthSamples: [0.9845921038794677],
            co2: 0.261,
            h2o: 0.068,
            equilibriumKelvin: 176.6,
          },
        ];

        for (
          const testCase of
          cases
        ) {
          for (
            const gravityEarth of
            testCase.gravityEarthSamples
          ) {
            const state =
              atmosphereRadiativeColumnState(
                testCase.pressurePascal,
                gravityEarth *
                  EARTH_GRAVITY,
                testCase.equilibriumKelvin,
                gases([
                  [AtmosphereGas.CARBON_DIOXIDE, testCase.co2],
                  [AtmosphereGas.WATER_VAPOR, testCase.h2o],
                  [AtmosphereGas.NITROGEN, 1 - testCase.co2 - testCase.h2o],
                ]),
              );

            const revisedWarmingKelvin =
              warmingKelvin(
                testCase.equilibriumKelvin,
                state.infraredOpticalDepthProxy,
              );

            const longwaveCapture =
              state.infraredOpticalDepthProxy /
              (
                1 +
                state.infraredOpticalDepthProxy
              );

            expect(
              longwaveCapture,
            ).toBeLessThan(0.75);

            expect(
              revisedWarmingKelvin,
            ).toBeLessThan(60);
          }
        }
      },
    );

    it(
      'is exactly deterministic for identical physical input',
      () => {
        const input =
          gases([
            [AtmosphereGas.CARBON_DIOXIDE, 0.08],
            [AtmosphereGas.WATER_VAPOR, 0.01],
            [AtmosphereGas.NITROGEN, 0.91],
          ]);

        expect(
          atmosphereRadiativeColumnState(
            80_000,
            EARTH_GRAVITY,
            250,
            input,
          ),
        ).toEqual(
          atmosphereRadiativeColumnState(
            80_000,
            EARTH_GRAVITY,
            250,
            input,
          ),
        );
      },
    );
  },
);
