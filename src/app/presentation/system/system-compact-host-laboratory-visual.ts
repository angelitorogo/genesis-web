import * as THREE from 'three';
import { ExtremeType, type ExtremeType as ExtremeTypeValue } from '../../domain/galactic-object/extreme-object-type';
import { BlackHoleLaboratoryRender } from '../laboratory/galactic-objects/black-hole-laboratory-render';
import { blackHoleLaboratoryModel } from '../laboratory/galactic-objects/black-hole-laboratory-render-model';
import { NeutronStarLaboratoryRender } from '../laboratory/galactic-objects/neutron-star-laboratory-render';
import { neutronStarLaboratoryModel } from '../laboratory/galactic-objects/neutron-star-laboratory-render-model';
import { type LaboratoryCompactSceneGraph } from '../laboratory/galactic-objects/laboratory-compact-scene-graph';

/** 31.4d: the APPROVED active laboratory silhouette is the 3D depiction,
 * including sphere, main disk, upper lens and lateral bands. In the snapshot
 * that disk is explicitly ILLUSTRATIVE, not evidence of physical accretion.
 * A physical emission channel remains null unless separately resolved. */
export function createCompactHostLaboratoryVisual(
  kind: ExtremeTypeValue,
  proceduralIdentity: string,
  radiusScene: number,
  accretionLuminositySolar: number | null,
): LaboratoryCompactSceneGraph {
  const sampleIndex = compactHostVisualSampleIndex(proceduralIdentity);
  let graph: LaboratoryCompactSceneGraph;
  let canonicalRadius: number;
  if (kind === ExtremeType.STELLAR_MASS_BLACK_HOLE) {
    graph = BlackHoleLaboratoryRender.createSceneGraph(
      blackHoleLaboratoryModel(kind, sampleIndex),
      false, // Always the approved full laboratory geometry, not the alternate quiescent silhouette.
    );
    canonicalRadius = 0.82;
  } else if (kind === ExtremeType.NEUTRON_STAR || kind === ExtremeType.PULSAR ||
    kind === ExtremeType.MILLISECOND_PULSAR || kind === ExtremeType.MAGNETAR) {
    graph = NeutronStarLaboratoryRender.createSceneGraph(neutronStarLaboratoryModel(kind, sampleIndex));
    canonicalRadius = 0.78;
  } else {
    throw new RangeError(`31.4c unsupported compact host: ${kind}`);
  }
  graph.root.scale.setScalar(radiusScene / canonicalRadius);
  graph.root.name = `GENESIS/compact-host/${kind}/${sampleIndex}`;
  return graph;
}

/** Deterministic presentation choice, independent of physics or PRNG streams. */
export function compactHostVisualSampleIndex(proceduralIdentity: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < proceduralIdentity.length; i += 1) {
    hash = Math.imul(hash ^ proceduralIdentity.charCodeAt(i), 0x01000193);
  }
  return (hash >>> 0) % 8;
}

/** Camera-stable laboratory projection: the entire canonical BH geometry,
 * including the tilted main disk, rotates as one visual unit with the camera.
 * Only this presentation group rotates; no physical orbit or camera changes.
 * Works even when SystemScene's presentationRoot has its own axial tilt. */
export function orientCompactBlackHoleToCamera(
  root: THREE.Group,
  camera: THREE.Camera,
): void {
  if (root.parent === null) throw new Error('Compact BH visual must be mounted before orientation.');
  root.parent.updateWorldMatrix(true, false);
  camera.updateWorldMatrix(true, false);
  const parentWorld = root.parent.getWorldQuaternion(new THREE.Quaternion());
  const cameraWorld = camera.getWorldQuaternion(new THREE.Quaternion());
  root.quaternion.copy(parentWorld.invert().multiply(cameraWorld));
}
