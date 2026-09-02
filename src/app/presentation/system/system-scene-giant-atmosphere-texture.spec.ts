import {
  buildSystemSceneGiantAtmosphereTextureV1,
} from './system-scene-giant-atmosphere-texture';

import {
  buildSystemSceneGiantAtmospherePresentationV1,
} from './system-scene-giant-atmosphere-presentation';

describe(
  'SystemScene giant-atmosphere texture point 25.4',
  () => {
    const atmosphere = (
      planetType: 'GAS_GIANT' | 'ICE_GIANT',
      methane: number,
    ) => buildSystemSceneGiantAtmospherePresentationV1({
      planetType,
      massEarth: planetType === 'GAS_GIANT' ? 250 : 19,
      radiusEarth: planetType === 'GAS_GIANT' ? 10.8 : 4.2,
      densityGramsPerCubicCentimeter: planetType === 'GAS_GIANT' ? 1.1 : 1.6,
      envelopeMassFraction01: planetType === 'GAS_GIANT' ? 0.74 : 0.26,
      iceBearingFractionOfSolids01: planetType === 'GAS_GIANT' ? 0.12 : 0.78,
      rotationPeriodHours: planetType === 'GAS_GIANT' ? 9.8 : 16.2,
      equilibriumTemperatureKelvin: planetType === 'GAS_GIANT' ? 170 : 68,
      referenceBondAlbedo01: planetType === 'GAS_GIANT' ? 0.44 : 0.55,
      retainedMeanMolarMassGramsPerMole: 2.5,
      retainedGasComposition: [
        { gas: 'HYDROGEN', moleFraction01: 0.82 - methane },
        { gas: 'HELIUM', moleFraction01: 0.18 },
        ...(methane > 0
          ? [{ gas: 'METHANE', moleFraction01: methane }]
          : []),
      ],
    })!;

    it(
      'should be deterministic and seam-safe',
      () => {
        const input = {
          systemIdentity: 'G0/S0/O77',
          planetId: 'planet-4',
          atmosphere: atmosphere('GAS_GIANT', 0.02),
        };
        const first = buildSystemSceneGiantAtmosphereTextureV1(input);
        const second = buildSystemSceneGiantAtmosphereTextureV1(input);

        expect(first.albedoRgba).toEqual(second.albedoRgba);
        expect(first.upperHazeRgba).toEqual(second.upperHazeRgba);

        for (let y = 0; y < first.height; y += 1) {
          const left = y * first.width * 4;
          const right = (y * first.width + first.width - 1) * 4;
          expect(first.albedoRgba.subarray(left, left + 4))
            .toEqual(first.albedoRgba.subarray(right, right + 4));
          expect(first.upperHazeRgba!.subarray(left, left + 4))
            .toEqual(first.upperHazeRgba!.subarray(right, right + 4));
        }
      },
    );

    it(
      'should produce clearly distinct gas-giant and methane-rich ice-giant cloud tops',
      () => {
        const gas = buildSystemSceneGiantAtmosphereTextureV1({
          systemIdentity: 'G0/S0/O77',
          planetId: 'gas',
          atmosphere: atmosphere('GAS_GIANT', 0.02),
        });
        const ice = buildSystemSceneGiantAtmosphereTextureV1({
          systemIdentity: 'G0/S0/O77',
          planetId: 'ice',
          atmosphere: atmosphere('ICE_GIANT', 0.10),
        });

        const gasMean = meanRgb(gas.albedoRgba);
        const iceMean = meanRgb(ice.albedoRgba);
        expect(colorDistance(gasMean, iceMean)).toBeGreaterThan(45);
        expect(iceMean[2]).toBeGreaterThan(iceMean[0]);
      },
    );

    it(
      'should vary cloud-top identity between planets while preserving physical presentation inputs',
      () => {
        const state = atmosphere('GAS_GIANT', 0.02);
        const a = buildSystemSceneGiantAtmosphereTextureV1({
          systemIdentity: 'G0/S0/O77',
          planetId: 'planet-a',
          atmosphere: state,
        });
        const b = buildSystemSceneGiantAtmosphereTextureV1({
          systemIdentity: 'G0/S0/O77',
          planetId: 'planet-b',
          atmosphere: state,
        });

        expect(a.seedUint32).not.toBe(b.seedUint32);
        expect(sampledDifference(a.albedoRgba, b.albedoRgba)).toBeGreaterThan(250);
      },
    );
  },
);

function meanRgb(rgba: Uint8Array): readonly [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let index = 0; index < rgba.length; index += 4 * 97) {
    r += rgba[index] ?? 0;
    g += rgba[index + 1] ?? 0;
    b += rgba[index + 2] ?? 0;
    count += 1;
  }
  return [r / count, g / count, b / count] as const;
}

function colorDistance(
  a: readonly number[],
  b: readonly number[],
): number {
  return Math.sqrt(
    a.reduce((sum, value, index) => sum + (value - (b[index] ?? 0)) ** 2, 0),
  );
}

function sampledDifference(a: Uint8Array, b: Uint8Array): number {
  let difference = 0;
  for (let index = 0; index < a.length; index += 4 * 211) {
    difference += Math.abs((a[index] ?? 0) - (b[index] ?? 0));
  }
  return difference;
}
