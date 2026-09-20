import {
  buildSystemSceneCometPresentationV1,
  systemSceneCometActivityAtDistanceV1,
} from './system-scene-comet-presentation';
import { v2CometReadableActivity } from './system-scene-v2-comet-tail-presentation';

const comet = buildSystemSceneCometPresentationV1({
  proceduralId: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', diameterKilometers: 12,
  iceFraction01: 0.7, dustFraction01: 0.3, porosityIndex01: 0.45,
  bulkDensityGramsPerCubicCentimeter: 0.7, geometricAlbedo01: 0.06,
  volatileRichnessIndex01: 0.6, periodRegime: 'SHORT_PERIOD',
  referenceLuminositySolar: 1, semiMajorAxisAu: 4, eccentricity: 0.75,
  periapsisAu: 1, apoapsisAu: 7, orbitalPeriodYears: 8,
  epochMeanAnomalyDegrees: 0, presentationTimeScale: 1,
});

function display(distance: number) {
  const physical = systemSceneCometActivityAtDistanceV1(comet, distance, 0.007);
  return { physical, visual: v2CometReadableActivity(comet, physical, 0.007) };
}

describe('15.3 — V2 comet periapsis tail presentation', () => {
  it('has a readable tail near periapsis, fades smoothly and vanishes far away', () => {
    const peri = display(1);
    const middle = display(3);
    const far = display(5);
    const apo = display(7);
    expect(peri.visual.hasDustTail).toBe(true);
    expect(peri.visual.presentationDustTailLengthScene).toBeGreaterThan(0.1);
    expect(peri.visual.presentationDustTailOpacity01).toBeGreaterThan(
      middle.visual.presentationDustTailOpacity01);
    expect(middle.visual.presentationDustTailLengthScene).toBe(0);
    expect(middle.visual.presentationComaOpacity01).toBeGreaterThan(0);
    expect(far.visual.hasDustTail).toBe(false);
    expect(apo.visual.hasDustTail).toBe(false);
    expect(apo.visual.hasComa).toBe(false);
    expect(apo.visual.presentationDustTailLengthScene).toBe(0);
  });

  it('does not invent a tail at a very distant periapsis around a faint star', () => {
    const physical = systemSceneCometActivityAtDistanceV1(comet, 1, 0.007);
    const cold = v2CometReadableActivity(comet, physical, 0.007, 0.001);
    expect(cold.hasComa).toBe(false);
    expect(cold.hasDustTail).toBe(false);
    expect(cold.hasIonTail).toBe(false);
    expect(cold.presentationDustTailLengthScene).toBe(0);
  });

  it('grows continuously with flux, so it is symmetric during approach and recession', () => {
    const p = systemSceneCometActivityAtDistanceV1(comet, 1, 0.007);
    const bright = v2CometReadableActivity(comet, p, 0.007, 1);
    const dimmer = v2CometReadableActivity(comet, p, 0.007, 0.40);
    const cold = v2CometReadableActivity(comet, p, 0.007, 0.06);
    expect(bright.presentationDustTailLengthScene).toBeGreaterThan(
      dimmer.presentationDustTailLengthScene);
    expect(dimmer.presentationDustTailLengthScene).toBeGreaterThan(0);
    expect(cold.presentationDustTailLengthScene).toBe(0);
    expect(v2CometReadableActivity(comet, p, 0.007, 0.40)).toEqual(dimmer);
    expect(dimmer.incidentFluxEarth).toBe(p.incidentFluxEarth);
  });

  it('is symmetric about periapsis for the same radial distance and never rewrites scientific activity', () => {
    const { physical, visual } = display(1.5);
    const again = v2CometReadableActivity(comet, physical, 0.007);
    expect(visual).toEqual(again);
    expect(visual.sourceDistanceAu).toBe(physical.sourceDistanceAu);
    expect(visual.incidentFluxEarth).toBe(physical.incidentFluxEarth);
    expect(visual.activityIndex01).toBe(physical.activityIndex01);
    expect(visual.equilibriumTemperatureKelvin).toBe(physical.equilibriumTemperatureKelvin);
    expect(Object.isFrozen(visual)).toBe(true);
    expect(physical).toEqual(systemSceneCometActivityAtDistanceV1(comet, 1.5, 0.007));
  });
});
