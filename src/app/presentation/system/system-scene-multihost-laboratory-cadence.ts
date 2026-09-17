/** Screen-only QA clocks: never change frozen orbital periods. */
export const MULTIHOST_V221_SECONDS_PER_ORBIT = Object.freeze({
  STELLAR_INNER: 1_200, STELLAR_OUTER: 3_600,
  PLANET_S: 180, PLANET_P: 240, QA_MOON: 55,
});

export function multihostPresentationTimeScaleV221(
  periodDays: number,
  playbackDaysPerRealSecond: number,
  displaySecondsPerOrbit: number,
): number {
  if (![periodDays, playbackDaysPerRealSecond, displaySecondsPerOrbit]
    .every(value => Number.isFinite(value) && value > 0)) {
    throw new RangeError('V2.2.1 preview clocks require positive finite values.');
  }
  return periodDays / (playbackDaysPerRealSecond * displaySecondsPerOrbit);
}
