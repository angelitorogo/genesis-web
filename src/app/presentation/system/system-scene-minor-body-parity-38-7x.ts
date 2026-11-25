import type { SystemSceneMinorBodySnapshot } from './system-scene-snapshot';
import type { ScientificMinorBodySurfaceKindVis3d2e } from '../scientific-body-preview/scientific-minor-body-texture-vis3d2e';

/** Same atlas source as the individual fiche, but only for a body approached
 * close enough to resolve texture detail. Never invents a presentation for
 * bodies which lack the corresponding scientific snapshot. */
export function systemSceneMinorBodyAtlasSource387x(
  body: SystemSceneMinorBodySnapshot,
): Readonly<{kind: ScientificMinorBodySurfaceKindVis3d2e; seedUint32: number}> | null {
  if (body.minorBodyKind.name === 'ASTEROID' && body.asteroidPresentation !== null) {
    return Object.freeze({kind: 'ASTEROID', seedUint32: body.asteroidPresentation.shapeSeedUint32});
  }
  if (body.minorBodyKind.name === 'COMET' && body.cometPresentation !== null) {
    return Object.freeze({kind: 'COMET', seedUint32: body.cometPresentation.shapeSeedUint32});
  }
  if (body.minorBodyKind.name === 'TRANS_NEPTUNIAN_OBJECT' && body.tnoPresentation != null) {
    return Object.freeze({kind: 'TNO', seedUint32: body.tnoPresentation.variantUint32});
  }
  if (body.minorBodyKind.name === 'CAPTURED_EXTRASOLAR_OBJECT' && body.capturedPresentation != null) {
    return Object.freeze({kind: 'CAPTURED', seedUint32: body.capturedPresentation.variantUint32});
  }
  return null;
}

/** Hysteresis prevents repeated atlas creation while crossing the LOD edge.
 * Exactly one small body may have the 1024×512 fiche atlas at a time. */
export function systemSceneMinorBodyNeedsAtlas387x(
  projectedDiameterPixels: number, sameBodyAsPrevious: boolean,
): boolean {
  return Number.isFinite(projectedDiameterPixels) &&
    projectedDiameterPixels >= (sameBodyAsPrevious ? 220 : 320);
}
