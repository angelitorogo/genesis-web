import { AtmosphereGas as Gas } from '../../domain/planetary/atmosphere-gas';
import {
  buildAtmosphereOpticalScienceV1,
  type AtmosphereOpticalScienceV1,
} from './system-scene-atmosphere-optical-science';
import { buildSystemSceneMolecularAtmosphereVisualV2 } from './system-scene-atmosphere-optical-presentation-v2';
import { buildSystemSceneAtmosphereOpticsV1 } from './system-scene-atmosphere-optics';

/** Physical regression fixtures, not name- or seed-specific renderer branches. */
const mixtures = {
  quaelaen: {
    pressure: 938_068.03, gravity: 7.55, temperature: 410.77,
    composition: [
      [Gas.CARBON_DIOXIDE, 0.598], [Gas.NITROGEN, 0.247],
      [Gas.ARGON, 0.086], [Gas.CARBON_MONOXIDE, 0.029],
      [Gas.SULFUR_DIOXIDE, 0.025], [Gas.WATER_VAPOR, 0.014],
      [Gas.OXYGEN, 0.001],
    ],
  },
  krarum: {
    pressure: 208_063.94, gravity: 3.79, temperature: 92.76,
    // N2/Ar/CO are rounded in the fiche; a 0.1% remainder closes the column.
    composition: [
      [Gas.NITROGEN, 0.871], [Gas.ARGON, 0.103],
      [Gas.CARBON_MONOXIDE, 0.025], [Gas.OXYGEN, 0.001],
    ],
  },
  vrusar: {
    pressure: 385.42, gravity: 10.32, temperature: 150.07,
    composition: [
      [Gas.NITROGEN, 0.558], [Gas.CARBON_DIOXIDE, 0.304],
      [Gas.ARGON, 0.102], [Gas.CARBON_MONOXIDE, 0.026],
      [Gas.SULFUR_DIOXIDE, 0.010],
    ],
  },
  biten: {
    pressure: 89_516.64, gravity: 12.13, temperature: 327.48,
    composition: [
      [Gas.NITROGEN, 0.512], [Gas.CARBON_DIOXIDE, 0.258],
      [Gas.ARGON, 0.059], [Gas.HYDROGEN, 0.012],
      [Gas.HELIUM, 0.011], [Gas.WATER_VAPOR, 0.148],
    ],
  },
} as const;

type Mixture = typeof mixtures[keyof typeof mixtures];
const optical = (sample: Mixture, photosphereKelvin: number | null = null) =>
  buildAtmosphereOpticalScienceV1({
    columnKind: 'SOLID_SURFACE',
    retainedGasComposition: sample.composition.map(([gas, moleFraction01]) =>
      ({ gas, moleFraction01 })),
    retainedSurfacePressurePascal: sample.pressure,
    meanSurfaceTemperatureKelvin: sample.temperature,
    surfaceGravityMetersPerSecondSquared: sample.gravity,
    referenceBolometricFluxEarth: 1,
    stellarEffectiveTemperatureKelvin: photosphereKelvin,
  });
const profile = (sample: Mixture, science: AtmosphereOpticalScienceV1 | null,
  baseColorHex = '#8A7462') => buildSystemSceneAtmosphereOpticsV1({
  baseColorHex, surfaceStyle: 'rocky', giantAtmosphere: null, opticalScience: science,
  surfaceEnvironment: {
    solidSurfaceAvailable: true,
    retainedSurfacePressurePascal: sample.pressure,
    retainedAtmosphericWaterVaporMoleFraction01: 0,
    retainedGasComposition: sample.composition.map(([gas, moleFraction01]) =>
      ({ gas, moleFraction01 })),
    presentationCloudCoverageFraction01: 0.15,
    surfaceIceCoverageFraction01: 0.10,
  },
});
const blueBias = (hex: string) =>
  Number.parseInt(hex.slice(5, 7), 16) - Number.parseInt(hex.slice(1, 3), 16);
const brightness = (hex: string) =>
  [1, 3, 5].reduce((sum, start) =>
    sum + Number.parseInt(hex.slice(start, start + 2), 16), 0) / 3;

describe('ATM-VIS.2a — spectral calibration and regression', () => {
  it('keeps a stronger blue molecular tendency in the moderately opaque N2-rich case', () => {
    const n2 = optical(mixtures.krarum);
    const co2 = optical(mixtures.quaelaen);
    expect(n2.columnStatus).toBe('EVALUABLE');
    expect(co2.columnStatus).toBe('EVALUABLE');
    const a = buildSystemSceneMolecularAtmosphereVisualV2(n2, 0.15)!;
    const b = buildSystemSceneMolecularAtmosphereVisualV2(co2, 0.15)!;
    expect(blueBias(a.dayTintHex)).toBeGreaterThan(blueBias(b.dayTintHex));
    // Neither is a synthetic pigment assigned directly to N2 or CO2.
    expect(a.dayTintHex).toMatch(/^#[0-9A-F]{6}$/);
    expect(b.dayTintHex).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('does not wash a dense CO2-rich column into an almost-white shell', () => {
    const p = profile(mixtures.quaelaen, optical(mixtures.quaelaen));
    const calibration = buildSystemSceneMolecularAtmosphereVisualV2(
      optical(mixtures.quaelaen), 0.15)!;
    expect(brightness(p.presentationDayTintHex)).toBeLessThan(210);
    expect(p.presentationDayTintHex).toBe(calibration.dayTintHex);
    expect(calibration.shellRadianceScale01).toBeLessThan(0.91);
    expect(calibration.twilightRadianceScale01).toBeLessThan(0.90);
    expect(p.presentationFrontHaze01).toBeGreaterThan(0.2);
  });

  it('keeps trace-gas Vrusar practically transparent', () => {
    const p = profile(mixtures.vrusar, optical(mixtures.vrusar));
    expect(p.atmospherePresent).toBe(true);
    expect(p.presentationRimStrength01).toBeLessThan(0.06);
    expect(p.presentationFrontHaze01).toBeLessThan(0.03);
  });

  it('gives Biten a molecular limb but does not use water highlights as its color', () => {
    const science = optical(mixtures.biten);
    const mineral = profile(mixtures.biten, science, '#765B40');
    const ocean = profile(mixtures.biten, science, '#1266BD');
    expect(mineral.presentationDayTintHex).toBe(ocean.presentationDayTintHex);
    expect(mineral.presentationFrontHaze01).toBe(ocean.presentationFrontHaze01);
    expect(mineral.presentationShellScale).toBe(ocean.presentationShellScale);
    expect(mineral.presentationRimStrength01).toBeGreaterThan(0.15);
    // The original opaque surface texture/water-specular shader is not changed.
  });

  it('keeps D.4d geometry, a shared optical contract and determinism for fiche and SystemScene', () => {
    for (const sample of Object.values(mixtures)) {
      const science = optical(sample);
      const fromScene = profile(sample, science);
      const fromFiche = profile(sample, optical(sample));
      const originalGeometry = profile(sample, null);
      expect(fromScene).toEqual(fromFiche);
      expect(fromScene.presentationShellScale).toBe(originalGeometry.presentationShellScale);
      expect(fromScene.deepEnvelope).toBe(false);
      expect(Math.abs(fromScene.presentationTerminatorSoftness01 -
        originalGeometry.presentationTerminatorSoftness01)).toBeLessThan(0.05);
    }
  });

  it('bounds the photospheric illuminant without inventing clouds or absorption', () => {
    const mix = mixtures.krarum;
    const warm = buildSystemSceneMolecularAtmosphereVisualV2(optical(mix, 3600), 0)!;
    const hot = buildSystemSceneMolecularAtmosphereVisualV2(optical(mix, 9000), 0)!;
    expect(warm.dayTintHex).not.toBe(hot.dayTintHex);
    expect(warm.molecularVisibility01).toBe(hot.molecularVisibility01);
    expect(warm.shellRadianceScale01).toBe(hot.shellRadianceScale01);
    expect(warm.twilightRadianceScale01).toBe(hot.twilightRadianceScale01);
  });

  it('keeps a vacuum and an unresolved composition distinct from an evaluable column', () => {
    const template = optical(mixtures.biten);
    expect(buildSystemSceneMolecularAtmosphereVisualV2({
      ...template, columnStatus: 'VACUUM', estimatedRayleighOpticalDepth: null,
    }, null)).toBeNull();
    expect(buildSystemSceneMolecularAtmosphereVisualV2({
      ...template, columnStatus: 'COMPOSITION_UNRESOLVED',
      estimatedRayleighOpticalDepth: null,
    }, null)).toBeNull();
  });
});
