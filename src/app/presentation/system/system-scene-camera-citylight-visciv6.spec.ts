import {
  systemSceneBodyFocusDistance,
  systemSceneCameraLimits,
  systemSceneTrackedBodyMinDistanceV1,
} from './system-scene-camera-controller';
import {
  civilizedLightsVisibilityVISCIV6d,
} from './system-scene-civilization-host-light-visciv6d';
import {
  patchSystemSceneDayNightFragmentShaderV1,
} from './system-scene-atmosphere-material';

describe('VISCIV.6 — cámara y luces basadas en anfitriona orbital', () => {
  it('mantiene el mismo suelo de acercamiento para sistemas simples, binarios y triples', () => {
    const single = systemSceneCameraLimits(4.8);
    const binary = systemSceneCameraLimits(35);
    const triple = systemSceneCameraLimits(280);
    expect(single.minDistance).toBe(0.08);
    expect(binary.minDistance).toBe(single.minDistance);
    expect(triple.minDistance).toBe(single.minDistance);
    expect(single.homeDistance).toBeLessThan(triple.homeDistance);
  });

  it('acerca un planeta según su propio tamaño, sin atravesar su radio', () => {
    const small = systemSceneTrackedBodyMinDistanceV1(0.04);
    const large = systemSceneTrackedBodyMinDistanceV1(0.3);
    expect(small).toBeCloseTo(0.0448, 10);
    expect(large).toBeCloseTo(0.336, 10);
    expect(small).toBeGreaterThan(0.04);
    expect(large).toBeGreaterThan(0.3);
    expect(small).toBeLessThan(systemSceneBodyFocusDistance(0.04, 0.08, 100));
    expect(systemSceneTrackedBodyMinDistanceV1(Number.NaN)).toBeGreaterThan(0);
  });

  it('separa día propio, penumbra ajena y noche incluso cuando cambia la estrella dominante', () => {
    const ownDay = civilizedLightsVisibilityVISCIV6d([1, 0], [0.1, 0.9], [true, false]);
    const otherDay = civilizedLightsVisibilityVISCIV6d([0, 1], [0.1, 0.9], [true, false]);
    const both = civilizedLightsVisibilityVISCIV6d([1, 1], [0.1, 0.9], [true, false]);
    const night = civilizedLightsVisibilityVISCIV6d([0, 0], [0.1, 0.9], [true, false]);
    expect(ownDay).toBe(0);
    expect(otherDay).toBeGreaterThan(0.1);
    expect(otherDay).toBeLessThan(0.25);
    expect(both).toBe(0);
    expect(night).toBe(1);
  });

  it('inyecta uniformes solo cuando hay ciudades confirmadas', () => {
    const base = '#include <common>\nvarying vec2 vMapUv;\nvec3 outgoingLight = vec3(1.0);\n#include <opaque_fragment>';
    const natural = patchSystemSceneDayNightFragmentShaderV1(base);
    const civilized = patchSystemSceneDayNightFragmentShaderV1(base, true);
    expect(natural).not.toContain('uGenesisCivilizationLights');
    expect(civilized).toContain('uGenesisCivilizationLights');
    expect(civilized).toContain('uGenesisOrbitalHomeDirectionsView[2]');
    expect(civilized).toContain('genesisHomeDarkness');
    expect(civilized).toContain('genesisForeignStarPenumbra');
    expect(civilized).toContain('genesisUrbanVisibility * 2.30');
  });
});
