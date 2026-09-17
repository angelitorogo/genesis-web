/**
 * One host-relative radial mapping shared by all V2 laboratory render layers.
 * V2.3.4 BINARY delegates directly to the production SINGLE V3 + V5.3
 * first-orbit anchor; V2.2 and TRIPLE retain their original mapping.
 */
import {
  systemSceneProjectedRadiusAu,
  type SystemSceneScaleSnapshot,
} from './system-scene-scale-projection';

export interface SystemSceneMultihostRadialProjectionV22 {
  readonly firstPeriapsisAu: number;
  readonly firstPeriapsisScene: number;
  readonly lastApoapsisAu: number;
  readonly lastApoapsisScene: number;
  /** BINARY-only: production SINGLE V3 projection with its V5.3 first-orbit anchor. */
  readonly singleSystemScaleV233?: SystemSceneScaleSnapshot;
  /** Legacy V2.3.3 field, intentionally absent on new V2.3.4 disks. */
  readonly orbitLadderV233?: readonly Readonly<{
    readonly radiusAu: number;
    readonly radiusScene: number;
  }>[];
}

export function systemSceneMultihostProjectedRadiusV22(
  radiusAu: number,
  spec: SystemSceneMultihostRadialProjectionV22,
): number {
  if (!(Number.isFinite(radiusAu) && radiusAu >= 0) ||
      !(Number.isFinite(spec.firstPeriapsisAu) && spec.firstPeriapsisAu > 0) ||
      !(Number.isFinite(spec.lastApoapsisAu) &&
        spec.lastApoapsisAu > spec.firstPeriapsisAu) ||
      !(Number.isFinite(spec.firstPeriapsisScene) && spec.firstPeriapsisScene > 0) ||
      !(Number.isFinite(spec.lastApoapsisScene) &&
        spec.lastApoapsisScene > spec.firstPeriapsisScene)) {
    throw new RangeError('V2.2 requires a finite, strictly increasing host radial projection.');
  }
  if (spec.singleSystemScaleV233 !== undefined) {
    const single = spec.singleSystemScaleV233;
    if (!Object.isFrozen(single) || single.projectionMode !== 'SINGLE_PRESENTATION_V3') {
      throw new RangeError('V2.3.4 BINARY requires the original frozen SINGLE V3 scale.');
    }
    // No affine resize and no planet-by-planet orbit ladder: exactly the
    // same AU -> scene function that SINGLE passes to its orbital renderer.
    // The V5.3 first-orbit anchor is already inside this frozen scale.
    if (radiusAu <= single.outerRadiusAu) {
      return systemSceneProjectedRadiusAu(radiusAu, single);
    }
    // Exceptional overlays outside the SINGLE builder's outer boundary must
    // not collapse to a single radius (its production function clamps here).
    // Rendered planets and host HZ never enter this extension.
    return single.targetOuterRadiusScene +
      single.targetOuterRadiusScene * 0.20 *
      Math.log1p((radiusAu - single.outerRadiusAu) / single.outerRadiusAu);
  }
  if (radiusAu <= spec.firstPeriapsisAu) {
    return radiusAu / spec.firstPeriapsisAu * spec.firstPeriapsisScene;
  }
  const logSpan = Math.log(spec.lastApoapsisAu / spec.firstPeriapsisAu);
  const fraction = Math.log(radiusAu / spec.firstPeriapsisAu) / logSpan;
  return spec.firstPeriapsisScene +
    (spec.lastApoapsisScene - spec.firstPeriapsisScene) * fraction;
}

/** Shared exact vector projector for the V2 planet AND its orbit guide. */
export function systemSceneMultihostProjectVectorV221(
  point: { readonly x: number; readonly y: number; readonly z: number },
  radial: SystemSceneMultihostRadialProjectionV22,
  scale = 1,
): {readonly x: number; readonly y: number; readonly z: number} {
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new RangeError('V2.2.1 projection requires positive motion scale.');
  }
  const x = point.x * scale;
  const y = point.y * scale;
  const z = point.z * scale;
  const radius = Math.hypot(x, y, z);
  const factor = radius > 0 ? systemSceneMultihostProjectedRadiusV22(radius, radial) / radius : 0;
  return Object.freeze({x: x * factor, y: y * factor, z: z * factor});
}
