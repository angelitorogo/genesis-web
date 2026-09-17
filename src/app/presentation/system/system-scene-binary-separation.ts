import { SystemOrbitalMotionEngine } from '../../simulation/orbital/system-orbital-motion-engine';
import {
  type SystemSceneBodySnapshot,
  type SystemSceneOrbitalMotionSnapshot,
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

const auFormatters = [2, 3, 5].map(digits => new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
}));

/**
 * Separation in PHYSICAL AU at the phase currently shown by the renderer.
 * The laboratory can slow the orbital clock, but postProjectionScale,
 * host-local radial remapping and visual positions NEVER enter this result.
 * Read-only: no dynamics, seeds or orbit definitions are modified.
 */
export function systemSceneBinarySeparationAu(
  snapshot: SystemSceneSnapshot,
  simulationDay: number,
  motions: ReadonlyMap<string, SystemSceneOrbitalMotionSnapshot> =
    new Map(snapshot.motions.map(motion => [motion.id, motion])),
): number | null {
  if (snapshot.multiplicityName !== 'BINARY' || !Number.isFinite(simulationDay)) {
    return null;
  }
  const a = snapshot.stars.find(star => star.label === 'A');
  const b = snapshot.stars.find(star => star.label === 'B');
  if (a === undefined || b === undefined ||
      a.motionContributions.length === 0 || b.motionContributions.length === 0) {
    return null;
  }
  const physicalPosition = (star: SystemSceneBodySnapshot) => {
    let x = 0;
    let y = 0;
    let z = 0;
    for (const contribution of star.motionContributions) {
      const motion = motions.get(contribution.motionId);
      if (motion === undefined) return null;
      const timeScale = contribution.presentationTimeScale ?? 1;
      if (!Number.isFinite(timeScale) || timeScale <= 0 ||
          !Number.isFinite(contribution.scale)) return null;
      const point = SystemOrbitalMotionEngine.positionAtSimulationDay(
        motion, simulationDay * timeScale,
      );
      x += point.xAu * contribution.scale;
      y += point.yAu * contribution.scale;
      z += point.zAu * contribution.scale;
    }
    return {x, y, z};
  };
  const positionA = physicalPosition(a);
  const positionB = physicalPosition(b);
  if (positionA === null || positionB === null) return null;
  const separation = Math.hypot(
    positionA.x - positionB.x,
    positionA.y - positionB.y,
    positionA.z - positionB.z,
  );
  return Number.isFinite(separation) && separation > 0 ? separation : null;
}

/** A stable HUD string avoids change detection on every WebGL animation frame. */
export function formatSystemSceneBinarySeparationAu(value: number | null): string | null {
  if (value === null || !Number.isFinite(value) || value <= 0) return null;
  if (value < 0.00001) return value.toExponential(2).replace('.', ',');
  return auFormatters[value < 0.01 ? 2 : value < 0.1 ? 1 : 0]!.format(value);
}
