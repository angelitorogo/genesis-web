import { buildSystemSceneGiantAtmospherePresentationV1 } from './system-scene-giant-atmosphere-presentation';
import { buildSystemSceneGiantAtmosphereTextureV1 } from './system-scene-giant-atmosphere-texture';
import {
  refineGiantAtmosphereMultiresVISCATM1,
  GIANT_ATMOSPHERE_DETAIL_VERSION_VISCATM1,
} from './system-scene-giant-atmosphere-multires-viscatm1';
import {
  GIANT_ATMOSPHERE_FINE_SEGMENTS_VISCATM1C,
  giantAtmosphereFineShellRequiredVISCATM1c,
} from './system-scene-giant-atmosphere-geometry-viscatm1c';
import { refinePlanetRgbaTextureV1 } from './system-scene-planet-texture-refinement';

const state = (kind: 'GAS_GIANT' | 'ICE_GIANT' | 'MINI_NEPTUNE') =>
  buildSystemSceneGiantAtmospherePresentationV1({
    planetType: kind, massEarth: kind === 'GAS_GIANT' ? 260 : 18,
    radiusEarth: kind === 'GAS_GIANT' ? 10.5 : 4.0,
    densityGramsPerCubicCentimeter: 1.1,
    envelopeMassFraction01: 0.78,
    iceBearingFractionOfSolids01: 0.72,
    rotationPeriodHours: 16,
    equilibriumTemperatureKelvin: 70,
    referenceBondAlbedo01: 0.47,
    retainedMeanMolarMassGramsPerMole: 2.6,
    retainedGasComposition: [
      { gas: 'HYDROGEN', moleFraction01: 0.72 },
      { gas: 'HELIUM', moleFraction01: 0.20 },
      { gas: 'METHANE', moleFraction01: 0.08 },
    ],
  })!;

function spatialVariation(p: Uint8Array, width: number): number {
  let sum = 0, count = 0;
  for (let y = 22; y < width / 2 - 22; y += 4) {
    for (let x = 3; x < width - 8; x += 7) {
      const o = 4 * (y * width + x);
      sum += Math.abs(p[o]! - p[o + 4]!);
      sum += Math.abs(p[o]! - p[o + width * 4]!);
      count += 2;
    }
  }
  return sum / count;
}

describe('GENESIS VISCATM.1c — estructura y geometría atmosférica', () => {
  it('mantiene la versión de identidad visual y el presupuesto compartido de esfera fina', () => {
    expect(GIANT_ATMOSPHERE_DETAIL_VERSION_VISCATM1).toBe(3);
    expect(GIANT_ATMOSPHERE_FINE_SEGMENTS_VISCATM1C.widthSegments).toBeGreaterThanOrEqual(128);
    expect(GIANT_ATMOSPHERE_FINE_SEGMENTS_VISCATM1C.heightSegments).toBeGreaterThanOrEqual(96);
    expect(giantAtmosphereFineShellRequiredVISCATM1c(210, false)).toBe(false);
    expect(giantAtmosphereFineShellRequiredVISCATM1c(240, false)).toBe(true);
    expect(giantAtmosphereFineShellRequiredVISCATM1c(190, true)).toBe(true);
    expect(giantAtmosphereFineShellRequiredVISCATM1c(140, true)).toBe(false);
  });

  it.each(['GAS_GIANT','ICE_GIANT','MINI_NEPTUNE'] as const)(
    'conserva semillas, hace visibles nuevas estructuras y no introduce costuras en %s', kind => {
      const atmosphere = state(kind);
      const input = { systemIdentity: 'G/Droveria', planetId: 'h', atmosphere };
      const low = buildSystemSceneGiantAtmosphereTextureV1(input);
      const original = low.albedoRgba.slice();
      const fiche = buildSystemSceneGiantAtmosphereTextureV1({ ...input, width: 1024, height: 512 });
      const focused = refineGiantAtmosphereMultiresVISCATM1(
        low.albedoRgba, low.width, low.height, 1024, low.seedUint32, atmosphere, 'CLOUD_TOPS',
      );
      const interpolated = refinePlanetRgbaTextureV1(
        low.albedoRgba, low.width, low.height, 1024, low.seedUint32, 'GAS',
      );
      expect(fiche.albedoRgba).toEqual(focused);
      expect(spatialVariation(focused, 1024)).toBeGreaterThan(spatialVariation(interpolated, 1024) * 1.3);
      expect(low.albedoRgba).toEqual(original);
      expect(buildSystemSceneGiantAtmosphereTextureV1({ ...input, width: 1024, height: 512 }).albedoRgba)
        .toEqual(focused);
      for (let y = 0; y < 512; y++) {
        const a = 4 * y * 1024, b = a + 4 * 1023;
        for (let channel = 0; channel < 4; channel++) {
          expect(focused[a + channel]).toBe(focused[b + channel]);
        }
      }
      for (let i = 3; i < focused.length; i += 4) expect(focused[i]).toBe(255);
    },
  );

  it('no inventa bruma cuando el atlas fuente no la contiene', () => {
    const atmosphere = state('ICE_GIANT');
    const base = new Uint8Array(256 * 128 * 4);
    const haze = refineGiantAtmosphereMultiresVISCATM1(
      base, 256, 128, 512, 0x17837, atmosphere, 'UPPER_HAZE',
    );
    for (let i = 3; i < haze.length; i += 4) expect(haze[i]).toBe(0);
  });
});
