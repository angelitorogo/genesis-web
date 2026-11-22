import {
  buildSystemSceneMoonPresentationV1,
  type SystemSceneMoonPresentationInputV1,
} from './system-scene-moon-presentation';
import { buildSystemSceneMoonTextureV1 } from './system-scene-moon-texture';
import { buildMoonSurfaceMorphologyD, sampleMoonTerrainD } from './system-scene-moon-geomorphology';
import {
  interpretMoonHydricVisualLUNSURF2,
  sampleMoonHydricFaciesLUNSURF2,
} from './system-scene-moon-hydric-facies-lunsurf2';

const tripherLike: SystemSceneMoonPresentationInputV1 = {
  moonIdentity: 'TRIPHER-LUNSURF2-REGRESSION',
  hostPlanetType: 'GAS_GIANT', radiusEarth: 0.275,
  massEarth: 0.005, meanDensityGramsPerCubicCentimeter: 1.36,
  surfaceGravityEarth: 0.067, atmosphereRetentionIndex01: 0,
  atmosphereRegime: 'NONE', atmosphereScenarioPressurePascal: null,
  atmosphereScenarioSpecies: [], waterInventoryIndex01: 0.90,
  inferredIceRichnessIndex01: 0.82, subsurfaceOceanPotentialIndex01: 0.40,
  surfaceLiquidWaterPotentialIndex01: 1, waterRegime: 'SURFACE_LIQUID',
  estimatedSurfaceTemperatureKelvin: 311.3,
  geologicalActivityIndex01: 0.74, tidalHeatingIndex01: 0.97,
  geologyRegime: 'EXTREME', overallHabitabilityIndex01: 0,
  isPotentiallyHabitable: false, giantHostSpecialization: true,
  giantCompositionRegime: 'ICE_RICH', isLargeGiantMoon: true,
  isTidallyActiveGiantMoon: true, isOceanBearingGiantMoonCandidate: true,
};

describe('LUNSURF.2 — hipótesis hídrica lunar sin agua observada ficticia', () => {
  it('Tripher-like: detecta la alteración mineral, no genera océanos o hielo a 311.3 K sin presión', () => {
    const projected = buildSystemSceneMoonPresentationV1(tripherLike);
    const interpretation = interpretMoonHydricVisualLUNSURF2(projected);
    expect(interpretation.state).toBe('POTENTIAL_ALTERED_MINERAL');
    expect(interpretation.intensity01).toBeGreaterThan(0.5);
    expect(projected.presentationLiquidCoverage01).toBe(0);
    expect(projected.presentationIceCoverage01).toBeLessThanOrEqual(0.05);
    expect(projected.presentationAtmospherePresent).toBe(false);
    expect(projected.sourceSurfaceLiquidWaterPotentialIndex01).toBe(1);
    const terrain = sampleMoonTerrainD({x:0.1,y:0.3,z:0.95}, projected, buildMoonSurfaceMorphologyD(projected));
    const sample = sampleMoonHydricFaciesLUNSURF2({x:0.1,y:0.3,z:0.95},projected,terrain,interpretation);
    expect(sample).not.toBeNull();
    if (sample) {
      expect(sample.pigment.r).toBeGreaterThan(sample.pigment.b);
      expect(sample.blend01).toBeGreaterThanOrEqual(0);
      expect(sample.roughnessDelta).toBeGreaterThanOrEqual(0);
    }
  });

  it('no altera una luna seca, ni deduce agua de un inventario sin potencial superficial', () => {
    const dry = buildSystemSceneMoonPresentationV1({ ...tripherLike,
      moonIdentity:'LUNSURF2-DRY', surfaceLiquidWaterPotentialIndex01:0,
      waterRegime:'NONE', waterInventoryIndex01:0.01, inferredIceRichnessIndex01:0.04,
    });
    const state = interpretMoonHydricVisualLUNSURF2(dry);
    expect(state.state).toBe('NONE');
    expect(sampleMoonHydricFaciesLUNSURF2({x:1,y:0,z:0},dry,
      {terrain01:.5,crater01:.1,scarp01:0,renewed01:.1,province01:.4},state)).toBeNull();
  });

  it('el frío admite solo depósitos localizados; el escenario líquido de D.3 no se reinterpreta como confirmación', () => {
    const cold = buildSystemSceneMoonPresentationV1({ ...tripherLike,
      moonIdentity:'LUNSURF2-COLD', estimatedSurfaceTemperatureKelvin:225,
      waterRegime:'SURFACE_ICE',
    });
    expect(interpretMoonHydricVisualLUNSURF2(cold).state).toBe('POTENTIAL_COLD_DEPOSITS');
    const pressure = buildSystemSceneMoonPresentationV1({ ...tripherLike,
      moonIdentity:'LUNSURF2-SCENARIO', estimatedSurfaceTemperatureKelvin:288,
      atmosphereRegime:'SUBSTANTIAL', atmosphereScenarioPressurePascal:40_000,
      atmosphereScenarioSpecies:[{gas:'NITROGEN',moleFraction01:1}],
    });
    expect(pressure.presentationLiquidCoverage01).toBeGreaterThan(0);
    expect(interpretMoonHydricVisualLUNSURF2(pressure).state).toBe('SUPPORTED_LIQUID_SCENARIO');
  });

  it('el atlas es determinista, conserva las costuras y los datos científicos; el terreno no se altera', () => {
    const moon = buildSystemSceneMoonPresentationV1(tripherLike);
    const before = JSON.stringify(moon);
    const first = buildSystemSceneMoonTextureV1(moon,{width:512,height:256});
    const second = buildSystemSceneMoonTextureV1(moon,{width:512,height:256});
    expect(first.albedoRgba).toEqual(second.albedoRgba);
    expect(first.reliefRgba).toEqual(second.reliefRgba);
    expect(first.normalRgba).toEqual(second.normalRgba);
    expect(first.roughnessRgba).toEqual(second.roughnessRgba);
    expect(JSON.stringify(moon)).toBe(before);
    expect(first.normalRgba).not.toBeNull();
    expect(first.roughnessRgba).not.toBeNull();
    for (const data of [first.albedoRgba,first.reliefRgba,first.normalRgba!,first.roughnessRgba!]) {
      for (let y = 0; y < first.height; y++) {
        const l = 4*y*first.width, r=l+4*(first.width-1);
        expect([...data.slice(l,l+4)]).toEqual([...data.slice(r,r+4)]);
      }
    }
  }, 15_000);

  it('la ficha y el LOD cercano utilizan la misma semilla y el mismo atlas; el LOD distante sigue ligero', () => {
    const moon=buildSystemSceneMoonPresentationV1(tripherLike);
    const distant=buildSystemSceneMoonTextureV1(moon);
    expect(distant.width).toBeLessThanOrEqual(192);
    expect(distant.normalRgba).toBeNull();
    expect(distant.roughnessRgba).toBeNull();
    const fiche=buildSystemSceneMoonTextureV1(moon,{width:512,height:256});
    const scene=buildSystemSceneMoonTextureV1(moon,{width:512,height:256});
    expect(fiche.albedoRgba).toEqual(scene.albedoRgba);
    expect(fiche.reliefRgba).toEqual(scene.reliefRgba);
    expect(fiche.roughnessRgba).toEqual(scene.roughnessRgba);
  },15_000);
});
