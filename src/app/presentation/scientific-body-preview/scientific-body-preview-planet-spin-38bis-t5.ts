import {
  systemSceneBodyDisplaySpinRadians,
  type SystemSceneBodySpinPresentationTiming,
  type SystemSceneBodySpinSnapshot,
} from '../system/system-scene-body-render-state';

/**
 * 38.bis-T5 — presentation ONLY: inspect synchronized planets at a readable
 * cadence, like the already approved lunar scientific preview.
 *
 * Domain spin, tidal locking, epoch phase and orbital projection remain
 * authoritative and unchanged. Since T6, the SystemScene mesh of a synchronized
 * planet also uses a slow inspection cadence. Neither display pivot is intended
 * to visualize exact tidal locking under accelerated orbital playback.
 */
export const SCIENTIFIC_PLANET_SYNCHRONIZED_PREVIEW_CYCLE_SECONDS_38BIS_T5 = 240;

const TWO_PI = Math.PI * 2;

export function scientificBodyPreviewPlanetSpinRadians38bisT5(
  spin: SystemSceneBodySpinSnapshot,
  simulationDay: number,
  timing: SystemSceneBodySpinPresentationTiming,
): number {
  // Reuse the existing domain/timing validation and unchanged cadence for
  // nonsynchronized, unavailable and static planets.
  if (
    !spin.isSynchronized ||
    spin.rotationPeriodHours === null ||
    (spin.source !== 'PLANET_19_3' && spin.source !== 'COMPACT_31_4F')
  ) {
    return systemSceneBodyDisplaySpinRadians(spin, simulationDay, timing);
  }

  if (!Number.isFinite(simulationDay)) {
    throw new RangeError('Scientific planet preview simulation day must be finite.');
  }

  // The epoch phase is exactly the phase of the existing render contract;
  // only elapsed visual time is compressed. Never integrate frame deltas.
  const epochRadians = systemSceneBodyDisplaySpinRadians(
    spin,
    timing.epochSimulationDay,
    timing,
  );
  const elapsedRealSeconds =
    (simulationDay - timing.epochSimulationDay) /
    timing.playbackDaysPerRealSecond;

  const radians =
    epochRadians +
    elapsedRealSeconds *
      (TWO_PI / SCIENTIFIC_PLANET_SYNCHRONIZED_PREVIEW_CYCLE_SECONDS_38BIS_T5);
  const normalized = radians % TWO_PI;
  return normalized < 0 ? normalized + TWO_PI : normalized;
}
