import {
  MULTIHOST_V221_SECONDS_PER_ORBIT,
  multihostPresentationTimeScaleV221,
} from './system-scene-multihost-laboratory-cadence';

describe('V2.2.1 multihost laboratory cadence', () => {
  it('keeps the requested on-screen orbital periods while preserving physical periods', () => {
    const playbackDaysPerRealSecond = 8;
    const physicalPeriodDays = 2400;
    for (const displaySecondsPerOrbit of Object.values(MULTIHOST_V221_SECONDS_PER_ORBIT)) {
      const scale = multihostPresentationTimeScaleV221(
        physicalPeriodDays,
        playbackDaysPerRealSecond,
        displaySecondsPerOrbit,
      );
      expect(physicalPeriodDays / (playbackDaysPerRealSecond * scale))
        .toBeCloseTo(displaySecondsPerOrbit, 12);
    }
  });

  it('keeps stars far slower than planets and moons in the QA renderer', () => {
    expect(MULTIHOST_V221_SECONDS_PER_ORBIT.STELLAR_INNER)
      .toBeGreaterThan(MULTIHOST_V221_SECONDS_PER_ORBIT.PLANET_P * 4);
    expect(MULTIHOST_V221_SECONDS_PER_ORBIT.STELLAR_OUTER)
      .toBeGreaterThan(MULTIHOST_V221_SECONDS_PER_ORBIT.STELLAR_INNER);
    expect(MULTIHOST_V221_SECONDS_PER_ORBIT.PLANET_P)
      .toBeGreaterThan(MULTIHOST_V221_SECONDS_PER_ORBIT.PLANET_S);
    expect(MULTIHOST_V221_SECONDS_PER_ORBIT.PLANET_S)
      .toBeGreaterThan(MULTIHOST_V221_SECONDS_PER_ORBIT.QA_MOON);
    expect(() => multihostPresentationTimeScaleV221(0, 1, 1)).toThrow(RangeError);
  });
});
