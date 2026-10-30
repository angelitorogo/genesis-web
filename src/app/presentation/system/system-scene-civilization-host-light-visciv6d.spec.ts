import {
  civilizedLightsVisibilityVISCIV6d,
  resolveOrbitalHomeStarIdsVISCIV6d,
} from './system-scene-civilization-host-light-visciv6d';
import { patchSystemSceneDayNightFragmentShaderV1 } from './system-scene-atmosphere-material';

const stars = [
  { id: 'mh-a-star', label: 'A' },
  { id: 'mh-b-star', label: 'B' },
  { id: 'mh-c-star', label: 'C' },
] as const;

describe('VISCIV.6d — alumbrado según estrella anfitriona orbital', () => {
  it('determina la anfitriona por identidad orbital, no por brillo ni cercanía', () => {
    expect(resolveOrbitalHomeStarIdsVISCIV6d({ id: 'mh-a-planet-3' }, stars)).toEqual(['mh-a-star']);
    expect(resolveOrbitalHomeStarIdsVISCIV6d({ id: 'mh-b-planet-7' }, stars)).toEqual(['mh-b-star']);
    expect(resolveOrbitalHomeStarIdsVISCIV6d({ id: 'mh-c-planet-4' }, stars)).toEqual(['mh-c-star']);
    expect(resolveOrbitalHomeStarIdsVISCIV6d({ id: 'mh-p-planet-2' }, stars)).toEqual(['mh-a-star', 'mh-b-star']);
    expect(resolveOrbitalHomeStarIdsVISCIV6d({ id: 'planet-1', orbitalHomeStarIds: ['mh-c-star'] }, stars))
      .toEqual(['mh-c-star']);
  });

  it('descarta referencias a fuentes inexistentes sin inventar estrellas', () => {
    expect(resolveOrbitalHomeStarIdsVISCIV6d({
      id: 'mh-a-planet-3', orbitalHomeStarIds: ['not-a-star', 'mh-a-star', 'mh-a-star'],
    }, stars)).toEqual(['mh-a-star']);
  });

  it('apaga ciudades si la estrella anfitriona ilumina, incluso si la ajena es más luminosa', () => {
    const hostOnly = civilizedLightsVisibilityVISCIV6d([1, 0], [0.10, 0.90], [true, false]);
    const both = civilizedLightsVisibilityVISCIV6d([1, 1], [0.10, 0.90], [true, false]);
    expect(hostOnly).toBe(0);
    expect(both).toBe(0);
  });

  it('mantiene luces tenues con iluminación solo ajena, incluso si la ajena domina el flujo', () => {
    const onlyForeignBright = civilizedLightsVisibilityVISCIV6d([0, 1], [0.10, 0.90], [true, false]);
    const onlyForeignDim = civilizedLightsVisibilityVISCIV6d([0, 1], [0.80, 0.20], [true, false]);
    expect(onlyForeignBright).toBeGreaterThan(0.1);
    expect(onlyForeignBright).toBeLessThan(0.25);
    expect(onlyForeignDim).toBeGreaterThan(0.1);
    expect(onlyForeignDim).toBeLessThan(0.25);
  });

  it('mantiene iluminación urbana plena si ninguna estrella ilumina', () => {
    expect(civilizedLightsVisibilityVISCIV6d([0, 0], [0.90, 0.10], [true, false])).toBe(1);
    expect(civilizedLightsVisibilityVISCIV6d([0, 0, 0], [0.10, 0.30, 0.60], [true, true, false]))
      .toBe(1);
  });

  it('para planetas circumbinarios apaga luces ante A o B, pero no ante C', () => {
    expect(civilizedLightsVisibilityVISCIV6d([1, 0, 0], [0.20, 0.30, 0.50], [true, true, false]))
      .toBe(0);
    expect(civilizedLightsVisibilityVISCIV6d([0, 1, 0], [0.20, 0.30, 0.50], [true, true, false]))
      .toBe(0);
    const foreignC = civilizedLightsVisibilityVISCIV6d([0, 0, 1], [0.20, 0.30, 0.50], [true, true, false]);
    expect(foreignC).toBeGreaterThan(0.1);
    expect(foreignC).toBeLessThan(0.25);
  });

  it('el shader usa máscaras de anfitriona independientes de los pesos y conserva shader natural', () => {
    const base = '#include <common>\nvarying vec2 vMapUv;\nvec3 outgoingLight = vec3(1.0);\n#include <opaque_fragment>';
    const ordinary = patchSystemSceneDayNightFragmentShaderV1(base);
    const civilized = patchSystemSceneDayNightFragmentShaderV1(base, true);
    expect(ordinary).not.toContain('uGenesisOrbitalHomeFlags');
    expect(civilized).toContain('uGenesisOrbitalHomeFlags');
    expect(civilized).toContain('genesisHomeDarkness');
    expect(civilized).toContain('genesisForeignStarPenumbra');
    expect(civilized).not.toContain('genesisDominantStarDayFactor');
    expect(civilized).toContain('genesisUrbanVisibility * 2.30');
  });
});
