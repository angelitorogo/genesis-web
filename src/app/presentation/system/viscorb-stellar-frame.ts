import { scientificPreviewDaylightCameraT7s } from '../scientific-body-preview/scientific-preview-daylight-camera-t7s';

export interface ViscorbStellarPositionV1 {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly sourceLuminositySolar: number | null;
}

/**
 * Inspect from a luminous direction without changing the actual light field.
 * An unresolved/compact-dark host yields null, not an invented stellar source.
 * Directions supplied in one coordinate frame (world for SystemScene).
 */
export function viscorbStellarViewDirectionV1(
  body: Readonly<{x:number;y:number;z:number}>,
  stars: readonly ViscorbStellarPositionV1[],
  orbitalHostIds: readonly string[] = [],
): Readonly<{x:number;y:number;z:number}> | null {
  const hostIds = new Set(orbitalHostIds);
  const sources = stars.flatMap(star => {
    if (!Number.isFinite(star.sourceLuminositySolar) || (star.sourceLuminositySolar ?? 0) <= 0) return [];
    const dx=star.x-body.x,dy=star.y-body.y,dz=star.z-body.z;
    const distance=Math.hypot(dx,dy,dz);
    if (!Number.isFinite(distance) || distance<1e-8) return [];
    const flux=(star.sourceLuminositySolar ?? 0)/Math.max(0.05,distance*distance);
    return [{x:dx/distance,y:dy/distance,z:dz/distance,
      weight01:Math.sqrt(flux),isOrbitalHost:hostIds.has(star.id)}];
  });
  if (!sources.length) return null;
  const camera=scientificPreviewDaylightCameraT7s(sources);
  // Keep orbital planes perceptible while remaining on the illuminated side.
  const x=camera.x,y=camera.y+0.18,z=camera.z;
  const length=Math.hypot(x,y,z);
  return {x:x/length,y:y/length,z:z/length};
}
