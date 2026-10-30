import {
  buildSystemSceneArtificialSatellitePlansV1,
  supportsSystemSceneArtificialSatellitesV1,
} from './system-scene-artificial-satellites-visciv2';

describe('VISCIV.2 — satélites orbitales artificiales de civilizaciones conocidas', () => {
  it('no habilita satélites para ausencia de civilización ni nivel primitivo', () => {
    expect(supportsSystemSceneArtificialSatellitesV1(null)).toBe(false);
    expect(supportsSystemSceneArtificialSatellitesV1('PRIMITIVE')).toBe(false);
    expect(supportsSystemSceneArtificialSatellitesV1('ADVANCED')).toBe(true);
    expect(supportsSystemSceneArtificialSatellitesV1('VERY_ADVANCED')).toBe(true);
  });

  it('genera pocos satélites para una civilización avanzada y más para una muy avanzada', () => {
    const advanced = buildSystemSceneArtificialSatellitePlansV1(1381, 'ADVANCED', 0.5);
    const veryAdvanced = buildSystemSceneArtificialSatellitePlansV1(1381, 'VERY_ADVANCED', 0.5);
    expect(advanced.length).toBeGreaterThanOrEqual(3);
    expect(advanced.length).toBeLessThanOrEqual(5);
    expect(veryAdvanced.length).toBeGreaterThanOrEqual(6);
    expect(veryAdvanced.length).toBeLessThanOrEqual(9);
  });

  it('conserva exactamente las mismas órbitas y colores para la misma semilla', () => {
    const first = buildSystemSceneArtificialSatellitePlansV1(789273, 'ADVANCED', 0.8);
    const second = buildSystemSceneArtificialSatellitePlansV1(789273, 'ADVANCED', 0.8);
    const different = buildSystemSceneArtificialSatellitePlansV1(789274, 'ADVANCED', 0.8);
    expect(second).toEqual(first);
    expect(different).not.toEqual(first);
  });

  it('mantiene órbitas fuera del planeta, con geometría finita y puntos pequeños', () => {
    for (const tier of ['ADVANCED', 'VERY_ADVANCED'] as const) {
      for (const plan of buildSystemSceneArtificialSatellitePlansV1(5555, tier, 0.8)) {
        expect(plan.orbitRadiusPlanetRadii).toBeGreaterThan(1.3);
        expect(plan.orbitRadiusPlanetRadii).toBeLessThan(2.5);
        expect(Number.isFinite(plan.phaseRadians)).toBe(true);
        expect(Number.isFinite(plan.inclinationRadians)).toBe(true);
        expect(Number.isFinite(plan.angularSpeedRadiansPerDay)).toBe(true);
        expect(plan.pointScaleScene).toBeLessThan(0.07);
        expect(plan.pointScaleScene).toBeGreaterThan(0);
        expect(plan.lineOpacity01).toBeGreaterThan(0);
        expect(plan.lineOpacity01).toBeLessThan(0.4);
      }
    }
  });
});
