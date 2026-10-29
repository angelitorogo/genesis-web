import { buildSystemScenePlanetTextureV1 } from './system-scene-planet-texture';
import { buildSystemSceneGiantAtmospherePresentationV1 } from './system-scene-giant-atmosphere-presentation';
import { buildSystemSceneGiantAtmosphereTextureV1 } from './system-scene-giant-atmosphere-texture';
import {
  PLANET_TEXTURE_DETAIL_SIZES_V1,
  refinePlanetRgbaTextureV1,
} from './system-scene-planet-texture-refinement';

describe('VIS-3D.1: refinamiento planetario no destructivo', () => {
  const planet = buildSystemScenePlanetTextureV1({
    systemIdentity: 'V3-G8-S2', planetId: 'rock-7', surfaceStyle: 'rocky', baseColorHex: '#97856d',
  });

  it('mantiene el atlas D.4d original sin modificar', () => {
    const original = new Uint8Array(planet.rgba);
    const refined = refinePlanetRgbaTextureV1(planet.rgba, planet.width, planet.height, 1024, planet.seedUint32, 'COLOR');
    expect(refined).toHaveLength(1024 * 512 * 4);
    expect(planet.rgba).toEqual(original);
    expect(refined).not.toEqual(planet.rgba);
  });

  it('fija 256x128 para cuerpos distantes, 512x256 para zoom y 1024x512 para fichas', () => {
    expect(PLANET_TEXTURE_DETAIL_SIZES_V1.distant).toEqual({width: 256, height: 128});
    expect(PLANET_TEXTURE_DETAIL_SIZES_V1.closeSystem).toEqual({width: 512, height: 256});
    expect(PLANET_TEXTURE_DETAIL_SIZES_V1.scientificPreview).toEqual({width: 1024, height: 512});
  });

  it('repite exactamente la misma textura para el mismo seed y respeta la costura de longitud', () => {
    for (const width of [512, 1024]) {
      const first = refinePlanetRgbaTextureV1(planet.rgba, 256, 128, width, planet.seedUint32, 'COLOR');
      const second = refinePlanetRgbaTextureV1(planet.rgba, 256, 128, width, planet.seedUint32, 'COLOR');
      expect(first).toEqual(second);
      for (let y = 0; y < width / 2; y += 1) {
        const start = y * width * 4;
        const end = start + (width - 1) * 4;
        expect(first.subarray(start, start + 4)).toEqual(first.subarray(end, end + 4));
      }
    }
  });

  it('refina todos los mapas sin inventar nubes, lava o emisiones de noche', () => {
    const empty = new Uint8Array(256 * 128 * 4);
    for (const mode of ['CLOUD', 'EMISSION', 'DATA'] as const) {
      const result = refinePlanetRgbaTextureV1(empty, 256, 128, 512, 17, mode);
      expect(result.every(value => value === 0)).toBe(true);
    }
  });

  it('conserva la variedad gaseosa y la transparencia de la niebla', () => {
    const atmosphere = buildSystemSceneGiantAtmospherePresentationV1({
      planetType: 'GAS_GIANT', massEarth: 280, radiusEarth: 11, densityGramsPerCubicCentimeter: 1.12,
      envelopeMassFraction01: 0.78, iceBearingFractionOfSolids01: 0.12,
      rotationPeriodHours: 10.2, equilibriumTemperatureKelvin: 158,
      referenceBondAlbedo01: 0.45, retainedMeanMolarMassGramsPerMole: 2.5,
      retainedGasComposition: [{gas: 'HYDROGEN', moleFraction01: .80}, {gas: 'HELIUM', moleFraction01: .20}],
    });
    expect(atmosphere).not.toBeNull();
    const generated = buildSystemSceneGiantAtmosphereTextureV1({
      systemIdentity: 'V3-G8-S2', planetId: 'giant-3', atmosphere: atmosphere!,
    });
    const refined = refinePlanetRgbaTextureV1(generated.albedoRgba, 256, 128, 1024, generated.seedUint32, 'GAS');
    expect(refined).toHaveLength(1024 * 512 * 4);
    expect(refined[3]).toBe(255);
  });

  it('rechaza tamaños enormes o datos RGBA incoherentes', () => {
    expect(() => refinePlanetRgbaTextureV1(planet.rgba, 256, 128, 4096, 1, 'COLOR')).toThrow(RangeError);
    expect(() => refinePlanetRgbaTextureV1(new Uint8Array(8), 256, 128, 1024, 1, 'COLOR')).toThrow(RangeError);
  });
});
