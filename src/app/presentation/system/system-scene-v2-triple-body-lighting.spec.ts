import {
  v2TripleBodyLightFluxes,
  v2TripleLightingSources,
} from './system-scene-v2-body-lighting';
import { v2CometStellarIrradianceAtDay } from './system-scene-v2-comet-stellar-flux';
import {
  type SystemSceneBodySnapshot,
  type SystemSceneMotionContributionSnapshot,
  type SystemSceneOrbitalMotionSnapshot,
} from './system-scene-snapshot';

const motion = (id: string, semiMajorAxisAu: number, periodDays: number): SystemSceneOrbitalMotionSnapshot => ({
  id, semiMajorAxisAu, periodDays, eccentricity: 0,
  rotationDegrees: 0, inclinationDegrees: 0, epochMeanAnomalyDegrees: 0,
});
const motions = [motion('AB', 2, 100), motion('ABC', 400, 1000), motion('planet', 0.6, 40)];

const part = (motionId: string, scale: number, linearScenePerAu: number): SystemSceneMotionContributionSnapshot => ({
  motionId, scale, linearScenePerAu,
});
const outerAB = part('ABC', -1 / 3, 0.045);
const outerC = part('ABC', 2 / 3, 0.045);
const innerA = part('AB', -0.5, 3);
const innerB = part('AB', 0.5, 3);
const local = part('planet', 1, 0.1);

const star = (
  id: string, motionContributions: readonly SystemSceneMotionContributionSnapshot[],
  radiusSolar = 1,
): SystemSceneBodySnapshot => ({
  id, kind: 'star', sourceLuminositySolar: radiusSolar ** 2,
  sourceRadiusSolar: radiusSolar, sourceEffectiveTemperatureKelvin: 5772,
  motionContributions,
}) as SystemSceneBodySnapshot;
const snapshot = {
  motions,
  stars: [star('A', [outerAB, innerA]), star('B', [outerAB, innerB]), star('C', [outerC], 2)],
};
const fluxes = (parts: readonly SystemSceneMotionContributionSnapshot[], day = 0) =>
  v2TripleBodyLightFluxes(parts, snapshot.motions, v2TripleLightingSources(snapshot, day), day);
const flux = (entries: readonly { starId: string; flux: number }[], starId: string) =>
  entries.find(entry => entry.starId === starId)!.flux;

describe('15.3 TRIPLE — orbital-hierarchy lighting', () => {
  it('illuminates an A-host planet primarily from A and a C-host planet primarily from C', () => {
    const atA = fluxes([outerAB, innerA, local]);
    const atC = fluxes([outerC, local]);
    expect(flux(atA, 'A')).toBeGreaterThan(flux(atA, 'B'));
    expect(flux(atA, 'B')).toBeGreaterThan(flux(atA, 'C'));
    expect(flux(atC, 'C')).toBeGreaterThan(flux(atC, 'A'));
    expect(flux(atC, 'C')).toBeGreaterThan(flux(atC, 'B'));
    expect(flux(atC, 'C')).toBeCloseTo(4 / 0.6 ** 2, 8);
  });

  it('keeps the AU lighting unchanged when the local or outer orbit is visually exaggerated', () => {
    const parts = [outerAB, innerA, local];
    const original = fluxes(parts);
    const extreme = {
      motions,
      stars: snapshot.stars.map(star => ({ ...star, motionContributions: star.motionContributions.map(p => ({
        ...p, linearScenePerAu: p.motionId === 'ABC' ? 50000 : 0.00001, postProjectionScale: 400,
      })) })),
    };
    const alteredParts = parts.map(p => ({ ...p, linearScenePerAu: 1e7, postProjectionScale: 0.002 }));
    const modified = v2TripleBodyLightFluxes(alteredParts, motions, v2TripleLightingSources(extreme, 0), 0);
    for (const source of original) expect(flux(modified, source.starId)).toBeCloseTo(source.flux, 10);
  });

  it('keeps planet, moon and minor body directions and weights tied to their own positions', () => {
    const planet = fluxes([outerAB, innerA, local]);
    const moon = fluxes([outerAB, innerA, local, part('planet', 0.25, 99)]);
    const asteroid = fluxes([outerC, part('planet', 2, 99)]);
    expect(flux(moon, 'A')).not.toBeCloseTo(flux(planet, 'A'), 8);
    expect(flux(asteroid, 'C')).toBeGreaterThan(flux(asteroid, 'A'));
  });

  it('updates the real separation in time and uses the same physical flux as comet irradiation', () => {
    const parts = [outerAB, innerA, local];
    const day0 = fluxes(parts);
    const day17 = fluxes(parts, 17);
    expect(flux(day17, 'B')).not.toBeCloseTo(flux(day0, 'B'), 5);
    const comet = v2CometStellarIrradianceAtDay(snapshot, { motionContributions: parts }, 17);
    for (const source of comet) expect(flux(day17, source.starId)).toBeCloseTo(source.fluxEarth, 10);
  });

  it('bounds a body at the photosphere and validates its motion and time', () => {
    const atC = fluxes([outerC]);
    expect(Number.isFinite(flux(atC, 'C'))).toBe(true);
    expect(flux(atC, 'C')).toBeGreaterThan(0);
    expect(() => v2TripleLightingSources(snapshot, Number.NaN)).toThrow(RangeError);
    expect(() => v2TripleBodyLightFluxes([], motions, [], Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => fluxes([part('missing', 1, 1)])).toThrow(RangeError);
  });
});
