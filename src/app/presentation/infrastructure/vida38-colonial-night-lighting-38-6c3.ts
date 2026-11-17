/** 38.6c3. Presentation-only activity lighting in a VERIFIED VIDA.8 colony.
 * These are self-emitting equipment indicators, not PointLights: they never
 * illuminate moon terrain, alter physical flux, or modify native city lights.
 * The same top-three stellar view vectors/flux weights used by SystemScene's
 * moon day/night material determine how visible the indicators should be.
 */
import * as THREE from 'three';

export const VIDA38_COLONIAL_NIGHT_LIGHT_REVISION_386C3 = 'VIDA.38.6c3/colony-night-indicators/visual-v1' as const;

/** 0 = no stellar contribution at this location, 1 = fully lit by stars.
 * The weighted incidence is a sum, not a single home-star test. A secondary
 * star in a binary/triple can illuminate a region dark to the primary star.
 * Absent/zero flux means darkness; no fictional star is added. */
export function vida38ColonialDirectStellarExposure386c3(
  outwardNormalView: THREE.Vector3,
  directionsView: readonly THREE.Vector3[],
  weights: THREE.Vector3,
): number {
  if (outwardNormalView.lengthSq() <= 1e-12) return 0;
  const normal = outwardNormalView.clone().normalize();
  const contributions = [weights.x,weights.y,weights.z];
  let sum = 0;
  let sumWeights = 0;
  for (let i=0; i<Math.min(3,directionsView.length); i++) {
    const weight = contributions[i] ?? 0;
    const direction = directionsView[i];
    if (!(weight>0) || !Number.isFinite(weight) || !direction || direction.lengthSq()<1e-12) continue;
    // Vacuum moons have a narrow but nonzero terminator transition.
    const cosine = normal.dot(direction.clone().normalize());
    const t = Math.max(0,Math.min(1,(cosine + .025)/.05));
    const exposure = t*t*(3-2*t);
    sum += weight*exposure;
    sumWeights += weight;
  }
  return sumWeights>0 ? Math.max(0,Math.min(1,sum/sumWeights)) : 0;
}

/** Artificial status lamps remain lit in daylight, but are much more evident
 * on the dark hemisphere. Unlike star lights they have no diffuse spill. */
export function vida38ColonialLampOpacity386c3(stellarExposure: number): number {
  const day = Number.isFinite(stellarExposure) ? Math.max(0,Math.min(1,stellarExposure)) : 0;
  return .18 + .82*(1-day);
}
