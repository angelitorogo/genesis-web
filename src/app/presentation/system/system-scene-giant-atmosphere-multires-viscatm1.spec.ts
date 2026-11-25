import { buildSystemSceneGiantAtmospherePresentationV1 } from './system-scene-giant-atmosphere-presentation';
import { buildSystemSceneGiantAtmosphereTextureV1 } from './system-scene-giant-atmosphere-texture';
import { refineGiantAtmosphereMultiresVISCATM1, giantAtmosphereFocusWidthVISCATM1 } from './system-scene-giant-atmosphere-multires-viscatm1';
import { refinePlanetRgbaTextureV1 } from './system-scene-planet-texture-refinement';

const presentation = (planetType: 'GAS_GIANT' | 'ICE_GIANT' | 'MINI_NEPTUNE') =>
  buildSystemSceneGiantAtmospherePresentationV1({
    planetType,
    massEarth: planetType === 'GAS_GIANT' ? 260 : planetType === 'ICE_GIANT' ? 18 : 9,
    radiusEarth: planetType === 'GAS_GIANT' ? 10.5 : planetType === 'ICE_GIANT' ? 4.0 : 3.3,
    densityGramsPerCubicCentimeter: planetType === 'GAS_GIANT' ? 1.1 : 1.5,
    envelopeMassFraction01: planetType === 'GAS_GIANT' ? .78 : .28,
    iceBearingFractionOfSolids01: planetType === 'GAS_GIANT' ? .14 : .72,
    rotationPeriodHours: planetType === 'GAS_GIANT' ? 10 : 16,
    equilibriumTemperatureKelvin: planetType === 'GAS_GIANT' ? 180 : 70,
    referenceBondAlbedo01: .47,
    retainedMeanMolarMassGramsPerMole: 2.6,
    retainedGasComposition: [
      { gas: 'HYDROGEN', moleFraction01: .72 },
      { gas: 'HELIUM', moleFraction01: .20 },
      { gas: 'METHANE', moleFraction01: .08 },
    ],
  })!;

const atlas = (regime: 'GAS_GIANT' | 'ICE_GIANT' | 'MINI_NEPTUNE', id = 'giant-7') =>
  buildSystemSceneGiantAtmosphereTextureV1({
    systemIdentity: 'V3-GAL-8/SYS-6', planetId: id, atmosphere: presentation(regime),
  });

const energy = (rgba: Uint8Array, width: number): number => {
  let total = 0;
  let count = 0;
  for (let y = 24; y < width / 2 - 24; y += 5) {
    for (let x = 3; x < width - 12; x += 7) {
      const i = (y * width + x) * 4;
      total += Math.abs(rgba[i]! - rgba[i + 4]!) +
        Math.abs(rgba[i]! - rgba[i + width * 4]!);
      count += 2;
    }
  }
  return total / count;
};

const seamSafe = (rgba: Uint8Array, width: number): boolean => {
  for (let y = 0; y < width / 2; y++) {
    const a = y * width * 4;
    const b = a + (width - 1) * 4;
    for (let channel = 0; channel < 4; channel++) {
      if (rgba[a + channel] !== rgba[b + channel]) return false;
    }
  }
  return true;
};

describe('GENESIS VISCATM.1 — atmósferas multirresolución', () => {
  it('conserva solo atlas 256 y 512 en SystemScene, sin tercera transición', () => {
    expect(giantAtmosphereFocusWidthVISCATM1(300, null)).toBe(512);
    expect(giantAtmosphereFocusWidthVISCATM1(350, 512)).toBe(512);
    expect(giantAtmosphereFocusWidthVISCATM1(390, 512)).toBe(512);
    expect(giantAtmosphereFocusWidthVISCATM1(300, 1024)).toBe(512);
    expect(giantAtmosphereFocusWidthVISCATM1(250, 1024)).toBe(512);
  });

  it('conserva las mismas semillas y la costura UV en las tres resoluciones', () => {
    const gas = atlas('GAS_GIANT');
    const science = presentation('GAS_GIANT');
    const original = new Uint8Array(gas.albedoRgba);
    for (const size of [256, 512, 1024]) {
      const a = refineGiantAtmosphereMultiresVISCATM1(
        gas.albedoRgba, 256, 128, size, gas.seedUint32, science, 'CLOUD_TOPS',
      );
      const b = refineGiantAtmosphereMultiresVISCATM1(
        gas.albedoRgba, 256, 128, size, gas.seedUint32, science, 'CLOUD_TOPS',
      );
      expect(a).toEqual(b);
      expect(a.length).toBe(size * size * 2);
      expect(seamSafe(a, size)).toBe(true);
    }
    expect(gas.albedoRgba).toEqual(original);
  });

  it('aumenta el microdetalle en 1024 respecto a la interpolación gaseosa antigua', () => {
    const gas = atlas('ICE_GIANT');
    const science = presentation('ICE_GIANT');
    const old = refinePlanetRgbaTextureV1(gas.albedoRgba, 256, 128, 1024, gas.seedUint32, 'GAS');
    const next = refineGiantAtmosphereMultiresVISCATM1(
      gas.albedoRgba, 256, 128, 1024, gas.seedUint32, science, 'CLOUD_TOPS',
    );
    expect(energy(next, 1024)).toBeGreaterThan(energy(old, 1024) * 1.08);
  });

  it('mantiene el patrón global y la paleta sin sustituir la identidad procedural', () => {
    const gas = atlas('GAS_GIANT');
    const science = presentation('GAS_GIANT');
    const old = refinePlanetRgbaTextureV1(gas.albedoRgba, 256, 128, 1024, gas.seedUint32, 'GAS');
    const next = refineGiantAtmosphereMultiresVISCATM1(
      gas.albedoRgba, 256, 128, 1024, gas.seedUint32, science, 'CLOUD_TOPS',
    );
    let meanDifference = 0;
    let count = 0;
    for (let i = 0; i < old.length; i += 4 * 43) {
      meanDifference += Math.abs(old[i]! - next[i]!);
      count++;
    }
    expect(meanDifference / count).toBeLessThan(22);
    expect(meanDifference / count).toBeGreaterThan(1);
  });

  it('no añade niebla donde antes había transparencia y conserva alpha sin alteración en albedo', () => {
    const giant = atlas('MINI_NEPTUNE');
    const science = presentation('MINI_NEPTUNE');
    const haze = giant.upperHazeRgba!;
    const empty = new Uint8Array(haze);
    for (let i = 3; i < empty.length; i += 8) empty[i] = 0;
    const expanded = refineGiantAtmosphereMultiresVISCATM1(
      empty, 256, 128, 512, giant.seedUint32, science, 'UPPER_HAZE',
    );
    expect(seamSafe(expanded, 512)).toBe(true);
    const zero = refineGiantAtmosphereMultiresVISCATM1(
      new Uint8Array(empty.length), 256, 128, 512,
      giant.seedUint32, science, 'UPPER_HAZE',
    );
    for (let i = 3; i < zero.length; i += 4) expect(zero[i]).toBe(0);
    const main = refineGiantAtmosphereMultiresVISCATM1(
      giant.albedoRgba, 256, 128, 512, giant.seedUint32, science, 'CLOUD_TOPS',
    );
    for (let i = 3; i < main.length; i += 4) expect(main[i]).toBe(255);
  });

  it('distingue gigantes gaseosos, helados y minineptunos sin información biológica', () => {
    const variants = ['GAS_GIANT','ICE_GIANT','MINI_NEPTUNE'] as const;
    const results = variants.map(kind => atlas(kind));
    expect(new Set(results.map(item => item.seedUint32)).size).toBe(3);
    expect(results.every(result => result.width === 256 && result.height === 128)).toBe(true);
    expect(results.every(result => seamSafe(result.albedoRgba, 256))).toBe(true);
  });

  it('rechaza presupuestos inválidos sin modificar el atlas original', () => {
    const giant = atlas('GAS_GIANT');
    const science = presentation('GAS_GIANT');
    expect(() => refineGiantAtmosphereMultiresVISCATM1(
      giant.albedoRgba, 256, 128, 4096, giant.seedUint32, science, 'CLOUD_TOPS',
    )).toThrow(RangeError);
  });
});
