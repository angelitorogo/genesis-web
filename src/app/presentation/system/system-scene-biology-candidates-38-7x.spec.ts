import { systemSceneBiologyMayHaveVisibleFeatures387x } from './system-scene-civilization-visuals.data-source';

describe('38.7x — análisis barato de candidatos VIDA.9 (no autorización)', () => {
  it('incluye floras aunque no haya VIDA.7 ni colonización', () => {
    expect(systemSceneBiologyMayHaveVisibleFeatures387x(JSON.stringify({
      nativeCivilizationPresent:false,colonialPopulationPresent:false,
      ecosystem:{species:[{group:'PLANTS_TREES'}]},
    }))).toBe(true);
  });
  it('mantiene civilizaciones y colonias', () => {
    expect(systemSceneBiologyMayHaveVisibleFeatures387x('{"nativeCivilizationPresent":true}')).toBe(true);
    expect(systemSceneBiologyMayHaveVisibleFeatures387x('{"colonialPopulationPresent":true}')).toBe(true);
  });
  it('no deriva vegetación de ausencia de datos biológicos', () => {
    expect(systemSceneBiologyMayHaveVisibleFeatures387x('{"nativeLifePresent":true}')).toBe(false);
  });
});
