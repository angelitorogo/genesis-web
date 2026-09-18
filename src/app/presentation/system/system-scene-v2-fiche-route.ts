import { multihostPublicRefV245, type MultihostModelKindV245 } from '../../domain/planetary/multihost-model-manifest-v245';
import { type SystemSceneSnapshot } from './system-scene-snapshot';
import { systemSceneV2ReferenceFiche } from './system-scene-v2-reference-fiche';

/** V2 references have their own address space. A V2 source ID must never be
 * interpreted as a V1 body index or appended to the original V1 planet route. */
export function systemSceneV2FicheRoute(
  scene: SystemSceneSnapshot,
  bodyId: string,
): readonly string[] | null {
  const fiche = systemSceneV2ReferenceFiche(scene, bodyId);
  if (fiche === null) return null;
  const kind: MultihostModelKindV245 = fiche.kind;
  return Object.freeze([
    '/system',
    scene.address.galaxyIndex,
    scene.address.sectorKey,
    scene.address.galacticObjectIndex,
    'v2', kind.toLowerCase(), multihostPublicRefV245(kind, bodyId),
  ]);
}
