export interface SystemSceneMoonSpinPresentationInputV2 {
  readonly source: string;
  readonly rotationPeriodHours: number | null;
  readonly epochPhaseDegrees: number;
  readonly isSynchronized: boolean;
}

export interface SystemSceneMoonSpinPresentationTimingV2 {
  readonly epochSimulationDay: number;
  readonly playbackDaysPerRealSecond: number;
}

/**
 * Point-25.11 inspection cadence for every moon.
 *
 * Phase 21 remains authoritative for the physical rotation period and tidal
 * synchronization state. The renderer deliberately decouples the displayed
 * spin from accelerated simulation time so every lunar surface remains easy to
 * inspect. Synchronized and unsynchronized moons therefore share the same slow
 * visual cadence; the authoritative synchronization flag remains untouched in
 * the snapshot and domain.
 */
export const SYSTEM_SCENE_MOON_DISPLAY_CYCLE_SECONDS_V2 = 240;

const TWO_PI = Math.PI * 2;

export function systemSceneMoonDisplaySpinRadiansV2(
  spin: SystemSceneMoonSpinPresentationInputV2,
  simulationDay: number,
  timing: SystemSceneMoonSpinPresentationTimingV2,
): number {
  validateSpin(spin);
  validateTiming(timing);

  if (!Number.isFinite(simulationDay)) {
    throw new RangeError(`simulationDay must be finite: ${simulationDay}.`);
  }

  const epochRadians = degreesToRadians(normalizeDegrees(spin.epochPhaseDegrees));

  if (spin.rotationPeriodHours === null) {
    return epochRadians;
  }

  const elapsedRealSeconds =
    (simulationDay - timing.epochSimulationDay) /
    timing.playbackDaysPerRealSecond;

  return normalizeRadians(
    epochRadians +
      elapsedRealSeconds *
        (TWO_PI / SYSTEM_SCENE_MOON_DISPLAY_CYCLE_SECONDS_V2),
  );
}

function validateSpin(spin: SystemSceneMoonSpinPresentationInputV2): void {
  if (
    spin.source !== 'MOON_21_4' ||
    !Number.isFinite(spin.epochPhaseDegrees) ||
    (
      spin.rotationPeriodHours !== null &&
      (
        !Number.isFinite(spin.rotationPeriodHours) ||
        spin.rotationPeriodHours <= 0
      )
    )
  ) {
    throw new RangeError('Moon display spin requires one valid frozen point-21.4 spin snapshot.');
  }
}

function validateTiming(timing: SystemSceneMoonSpinPresentationTimingV2): void {
  if (
    !Number.isFinite(timing.epochSimulationDay) ||
    !Number.isFinite(timing.playbackDaysPerRealSecond) ||
    timing.playbackDaysPerRealSecond <= 0
  ) {
    throw new RangeError('Moon display spin timing must be finite with positive playbackDaysPerRealSecond.');
  }
}

function degreesToRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

function normalizeDegrees(degrees: number): number {
  const normalized = degrees % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function normalizeRadians(radians: number): number {
  const normalized = radians % TWO_PI;
  return normalized < 0 ? normalized + TWO_PI : normalized;
}
