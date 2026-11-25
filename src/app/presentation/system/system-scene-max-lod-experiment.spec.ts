import {
  SYSTEM_SCENE_MAX_LOD_TEXTURE_V1,
  systemSceneMaxLodExperimentEnabledV1,
  systemSceneLodBenchmarkTelemetryEnabledV1,
  systemSceneMaxLodTextureBudgetMiBV1,
} from './system-scene-max-lod-experiment';

describe('GENESIS LODMAX.1 — experimento de escena 3D con detalle máximo', () => {
  it('permanece desactivado por defecto y no cambia el modo de producción', () => {
    expect(systemSceneMaxLodExperimentEnabledV1('')).toBe(false);
    expect(systemSceneMaxLodExperimentEnabledV1('?other=1')).toBe(false);
    expect(systemSceneMaxLodExperimentEnabledV1('?genesisLod=adaptive')).toBe(false);
    expect(systemSceneMaxLodExperimentEnabledV1('?genesisLod=high')).toBe(false);
  });

  it('se habilita únicamente mediante el parámetro opt-in explícito', () => {
    expect(systemSceneMaxLodExperimentEnabledV1('?genesisLod=max')).toBe(true);
    expect(systemSceneMaxLodExperimentEnabledV1('?foo=1&genesisLod=max')).toBe(true);
    expect(systemSceneMaxLodExperimentEnabledV1('?genesisLod=MAX')).toBe(false);
    expect(systemSceneMaxLodExperimentEnabledV1('?genesisLod=maximum')).toBe(false);
  });

  it('admite un referente medible sin activar el LOD máximo', () => {
    expect(systemSceneLodBenchmarkTelemetryEnabledV1('?genesisLod=adaptive')).toBe(true);
    expect(systemSceneLodBenchmarkTelemetryEnabledV1('?genesisLod=max')).toBe(true);
    expect(systemSceneLodBenchmarkTelemetryEnabledV1('')).toBe(false);
    expect(systemSceneMaxLodExperimentEnabledV1('?genesisLod=adaptive')).toBe(false);
  });

  it('utiliza la resolución HD conocida de las fichas y la luna enfocada', () => {
    expect(SYSTEM_SCENE_MAX_LOD_TEXTURE_V1).toEqual({ width: 1024, height: 512 });
    expect(Object.isFrozen(SYSTEM_SCENE_MAX_LOD_TEXTURE_V1)).toBe(true);
  });

  it('expone una estimación conservadora de consumo, no una falsa medición de VRAM', () => {
    expect(systemSceneMaxLodTextureBudgetMiBV1(0, 0, 0)).toBe(0);
    expect(systemSceneMaxLodTextureBudgetMiBV1(5, 12, 2)).toBe(208);
    expect(systemSceneMaxLodTextureBudgetMiBV1(1, 1, 1)).toBe(26);
  });

  it('rechaza conteos inválidos en los diagnósticos de presupuesto', () => {
    expect(() => systemSceneMaxLodTextureBudgetMiBV1(-1, 0, 0)).toThrow(RangeError);
    expect(() => systemSceneMaxLodTextureBudgetMiBV1(0.5, 0, 0)).toThrow(RangeError);
    expect(() => systemSceneMaxLodTextureBudgetMiBV1(1, Number.NaN, 0)).toThrow(RangeError);
  });
});
