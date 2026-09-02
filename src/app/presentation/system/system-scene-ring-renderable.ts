import * as THREE from 'three';

import {
  type SystemScenePlanetRingPresentationV1,
} from './system-scene-planet-special-presentation';

export interface SystemSceneRingBandSpecV1 {
  readonly innerRadiusPlanetRadii: number;
  readonly outerRadiusPlanetRadii: number;
  readonly colorHex: string;
  readonly opacity01: number;
}

export interface SystemSceneRingRenderableV1 {
  readonly group: THREE.Group;
  readonly resources: readonly { dispose(): void }[];
  readonly bandSpecs: readonly SystemSceneRingBandSpecV1[];
}

/**
 * Expands the compact point-25.9 ring proxy into deterministic non-overlapping
 * radial bands. Gaps are visual structure only; no particle/moon resonances are
 * asserted by this renderer.
 */
export function buildSystemSceneRingBandSpecsV1(
  rings: SystemScenePlanetRingPresentationV1,
): readonly SystemSceneRingBandSpecV1[] {
  validateRingPresentation(rings);

  const totalWidth =
    rings.outerRadiusPlanetRadii - rings.innerRadiusPlanetRadii;
  const slotCount = rings.bandCount + rings.gapCount;
  const slotWidth = totalWidth / slotCount;
  const gapSlots = new Set<number>();
  let mixed = mixUint32(rings.presentationSeedUint32 ^ 0xa341316c);

  while (gapSlots.size < rings.gapCount) {
    mixed = mixUint32(mixed + 0x9e3779b9);
    const candidate = 1 + (mixed % Math.max(1, slotCount - 2));
    gapSlots.add(candidate);
  }

  const bands: SystemSceneRingBandSpecV1[] = [];
  let bandOrdinal = 0;

  for (let slot = 0; slot < slotCount; slot += 1) {
    if (gapSlots.has(slot)) {
      continue;
    }

    const inner = rings.innerRadiusPlanetRadii + slot * slotWidth;
    const outer = Math.min(
      rings.outerRadiusPlanetRadii,
      inner + slotWidth * 0.88,
    );
    const alternating = bandOrdinal % 2 === 0;
    const microVariation =
      0.72 +
      0.46 *
        uint32Unit(
          mixUint32(
            rings.presentationSeedUint32 + bandOrdinal * 0x85ebca6b,
          ),
        );
    const illuminatedOpacity = clamp(
      rings.opticalDepth01 * microVariation + 0.05,
      0.10,
      0.96,
    );

    bands.push(
      Object.freeze({
        innerRadiusPlanetRadii: inner,
        outerRadiusPlanetRadii: outer,
        colorHex: alternating
          ? rings.presentationBaseColorHex
          : rings.presentationAccentColorHex,
        opacity01: illuminatedOpacity,
      }),
    );
    bandOrdinal += 1;
  }

  return Object.freeze(bands);
}

export function createSystemSceneRingRenderableV1(
  planetRadiusScene: number,
  rings: SystemScenePlanetRingPresentationV1,
): SystemSceneRingRenderableV1 {
  if (!Number.isFinite(planetRadiusScene) || planetRadiusScene <= 0) {
    throw new RangeError('planetRadiusScene must be positive and finite.');
  }

  const bandSpecs = buildSystemSceneRingBandSpecsV1(rings);
  const group = new THREE.Group();
  group.name = 'GENESIS rings 25.9';
  // RingGeometry is generated in XY. Planet spin axis is local +Y, therefore
  // the equatorial plane is XZ before the already-existing axial tilt pivot.
  group.rotation.x = -Math.PI / 2;

  const resources: { dispose(): void }[] = [];

  for (let index = 0; index < bandSpecs.length; index += 1) {
    const band = bandSpecs[index]!;
    const geometry = new THREE.RingGeometry(
      planetRadiusScene * band.innerRadiusPlanetRadii,
      planetRadiusScene * band.outerRadiusPlanetRadii,
      96,
      1,
    );
    const material = new THREE.MeshStandardMaterial({
      color: band.colorHex,
      emissive: band.colorHex,
      emissiveIntensity: 0.04 + 0.16 * band.opacity01,
      transparent: true,
      opacity: band.opacity01,
      depthWrite: false,
      side: THREE.DoubleSide,
      roughness: 0.52,
      metalness: 0.02,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `GENESIS ring band ${index + 1}`;
    mesh.renderOrder = 2;
    group.add(mesh);
    resources.push(geometry, material);
  }

  return Object.freeze({
    group,
    resources: Object.freeze(resources),
    bandSpecs,
  });
}

function validateRingPresentation(
  rings: SystemScenePlanetRingPresentationV1,
): void {
  if (
    rings.source !== 'GIANT_RING_PRESENTATION_PROXY_25_9' ||
    rings.presenceAuthoritative !== false
  ) {
    throw new RangeError('Unsupported point-25.9 ring source contract.');
  }
  if (
    !Number.isFinite(rings.innerRadiusPlanetRadii) ||
    !Number.isFinite(rings.outerRadiusPlanetRadii) ||
    rings.innerRadiusPlanetRadii <= 1 ||
    rings.outerRadiusPlanetRadii <= rings.innerRadiusPlanetRadii
  ) {
    throw new RangeError('Ring radii must form a finite annulus outside the planet.');
  }
  if (!Number.isInteger(rings.bandCount) || rings.bandCount < 1) {
    throw new RangeError('bandCount must be a positive integer.');
  }
  if (
    !Number.isInteger(rings.gapCount) ||
    rings.gapCount < 0 ||
    rings.gapCount >= rings.bandCount + rings.gapCount
  ) {
    throw new RangeError('gapCount must be a valid non-negative integer.');
  }
  if (!Number.isFinite(rings.opticalDepth01) || rings.opticalDepth01 <= 0 || rings.opticalDepth01 > 1) {
    throw new RangeError('opticalDepth01 must be finite in (0, 1].');
  }
}

function mixUint32(value: number): number {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

function uint32Unit(value: number): number {
  return (value >>> 0) / 0xffffffff;
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
