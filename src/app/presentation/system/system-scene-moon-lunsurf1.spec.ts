import * as THREE from 'three';
import { buildSystemSceneMoonPresentationV1 } from './system-scene-moon-presentation';
import { buildSystemSceneMoonTextureV1 } from './system-scene-moon-texture';
import { createSystemSceneMoonRenderableV1 } from './system-scene-moon-renderable';
import {
  buildMoonTangentNormalMapLUNSURF1,
  moonMaterialRoughnessLUNSURF1,
  sampleMoonFineSurfaceLUNSURF1,
  shouldUseMoonDetailLUNSURF1,
} from './system-scene-moon-surface-detail-lunsurf1';

function moonFixture(ice: boolean, identity = 'AARAS-LUNSURF1') {
  return buildSystemSceneMoonPresentationV1({
    moonIdentity: identity,
    hostPlanetType: 'TERRESTRIAL',
    radiusEarth: 0.12,
    massEarth: 0.006,
    meanDensityGramsPerCubicCentimeter: 3.2,
    surfaceGravityEarth: 0.07,
    atmosphereRetentionIndex01: 0,
    atmosphereRegime: 'NONE',
    atmosphereScenarioPressurePascal: null,
    atmosphereScenarioSpecies: [],
    waterInventoryIndex01: ice ? 0.83 : 0.03,
    inferredIceRichnessIndex01: ice ? 0.96 : 0.1,
    subsurfaceOceanPotentialIndex01: 0,
    surfaceLiquidWaterPotentialIndex01: 0,
    waterRegime: ice ? 'SURFACE_ICE' : 'NONE',
    estimatedSurfaceTemperatureKelvin: ice ? 120 : 195,
    geologicalActivityIndex01: 0.03,
    tidalHeatingIndex01: 0,
    geologyRegime: 'INERT',
    overallHabitabilityIndex01: 0,
    isPotentiallyHabitable: false,
    giantHostSpecialization: false,
    giantCompositionRegime: ice ? 'ICE_RICH' : 'ROCK_RICH',
    isLargeGiantMoon: false,
    isTidallyActiveGiantMoon: false,
    isOceanBearingGiantMoonCandidate: false,
  });
}

describe('LUNSURF.1 — detalle lunar HD sin modificar la ciencia', () => {
  it('solo prepara una luna enfocada y aplica histéresis frente al planeta', () => {
    expect(shouldUseMoonDetailLUNSURF1(299,'moon-A',null,null)).toBe(false);
    expect(shouldUseMoonDetailLUNSURF1(300,'moon-A',null,null)).toBe(true);
    expect(shouldUseMoonDetailLUNSURF1(220,'moon-A','moon-A',null)).toBe(true);
    expect(shouldUseMoonDetailLUNSURF1(209,'moon-A','moon-A',null)).toBe(false);
    expect(shouldUseMoonDetailLUNSURF1(420,'moon-A',null,450)).toBe(false);
    expect(shouldUseMoonDetailLUNSURF1(480,'moon-A',null,450)).toBe(true);
  });
  it('mantiene el LOD ligero y solo genera normales y rugosidad propia en la ficha', () => {
    const moon = moonFixture(false);
    const low = buildSystemSceneMoonTextureV1(moon);
    expect(low.width).toBeLessThanOrEqual(192);
    expect(low.normalRgba).toBeNull();
    expect(low.roughnessRgba).toBeNull();

    const focused = buildSystemSceneMoonTextureV1(moon, { width: 512, height: 256 });
    expect(focused.normalRgba?.length).toBe(512 * 256 * 4);
    expect(focused.roughnessRgba?.length).toBe(512 * 256 * 4);
    expect(focused.width).toBe(512);
    expect(focused.height).toBe(256);
  }, 15_000);

  it('genera los mismos atlas y relieve para la misma semilla y conserva la identidad científica', () => {
    const moon = moonFixture(false);
    const original = JSON.stringify(moon);
    const first = buildSystemSceneMoonTextureV1(moon, { width: 512, height: 256 });
    const second = buildSystemSceneMoonTextureV1(moon, { width: 512, height: 256 });
    expect(first.albedoRgba).toEqual(second.albedoRgba);
    expect(first.reliefRgba).toEqual(second.reliefRgba);
    expect(first.normalRgba).toEqual(second.normalRgba);
    expect(first.roughnessRgba).toEqual(second.roughnessRgba);
    expect(JSON.stringify(moon)).toBe(original);
    const other = buildSystemSceneMoonTextureV1(moonFixture(false, 'DIFFERENT-LUNSURF1'), { width: 512, height: 256 });
    expect(other.albedoRgba).not.toEqual(first.albedoRgba);
  }, 15_000);

  it('no introduce costuras longitudinales en los cuatro mapas', () => {
    const moon = moonFixture(true);
    const output = buildSystemSceneMoonTextureV1(moon, { width: 512, height: 256 });
    for (const rgba of [output.albedoRgba, output.reliefRgba, output.normalRgba!, output.roughnessRgba!]) {
      for (let y = 0; y < output.height; y += 1) {
        const first = 4 * y * output.width;
        const last = first + 4 * (output.width - 1);
        expect([...rgba.slice(first, first + 4)]).toEqual([...rgba.slice(last, last + 4)]);
      }
    }
  }, 15_000);

  it('separa la rugosidad física del relieve y no altera una capa de nubes', () => {
    const icy = moonFixture(true);
    const rocky = moonFixture(false);
    expect(moonMaterialRoughnessLUNSURF1(icy, {
      iceMask01: 1, liquidMask01: 0, renewed01: 0,
    }, 0)).toBeLessThan(moonMaterialRoughnessLUNSURF1(rocky, {
      iceMask01: 0, liquidMask01: 0, renewed01: 0,
    }, 0));
    const sample = sampleMoonFineSurfaceLUNSURF1({x:1,y:0,z:0}, rocky);
    expect(sample).toEqual(sampleMoonFineSurfaceLUNSURF1({x:1,y:0,z:0}, rocky));
    expect(Number.isFinite(sample.displacement)).toBe(true);
    const input = new Uint8Array(4 * 8 * 4);
    expect(buildMoonTangentNormalMapLUNSURF1(input, 8, 4).length).toBe(input.length);
    expect(() => buildMoonTangentNormalMapLUNSURF1(input, 9, 4)).toThrow(RangeError);
  });

  it('instala mapas HD lineales y libera sus recursos sin modificar la malla lunar', () => {
    const moon = moonFixture(false);
    const visual = createSystemSceneMoonRenderableV1(moon, null, null,
      { width: 512, height: 256 });
    try {
      const map = visual.surfaceMaterial.map as THREE.DataTexture;
      const normal = visual.surfaceMaterial.normalMap as THREE.DataTexture;
      const roughness = visual.surfaceMaterial.roughnessMap as THREE.DataTexture;
      expect(map.colorSpace).toBe(THREE.SRGBColorSpace);
      expect(normal.colorSpace).toBe(THREE.NoColorSpace);
      expect(roughness.colorSpace).toBe(THREE.NoColorSpace);
      expect(visual.surfaceMaterial.bumpMap).not.toBeNull();
      expect(visual.surfaceMaterial.roughness).toBe(1);
      expect(visual.root.children).toContain(visual.surfaceMesh);
      expect(normal.image.width).toBe(512);
      const spyNormal = vi.spyOn(normal, 'dispose');
      const spyRoughness = vi.spyOn(roughness, 'dispose');
      visual.resources.forEach(resource => resource.dispose());
      expect(spyNormal).toHaveBeenCalledTimes(1);
      expect(spyRoughness).toHaveBeenCalledTimes(1);
    } finally {
      visual.resources.forEach(resource => resource.dispose());
    }
  }, 15_000);
});
