import {
  multihostManifestMatchesV245, type MultihostModelIdentityV245,
  type MultihostModelKindV245, type MultihostModelManifestV245,
} from '../../domain/planetary/multihost-model-manifest-v245';
import {type SystemSceneSnapshot} from '../system/system-scene-snapshot';
import {systemSceneV2ReferenceFiche, type SystemSceneV2ReferenceFiche} from '../system/system-scene-v2-reference-fiche';

export type V2FicheResolution =
  | Readonly<{status: 'stale' | 'missing'}>
  | Readonly<{status: 'available'; identity: MultihostModelIdentityV245; fiche: SystemSceneV2ReferenceFiche}>;

/** Resolve ONLY against the exact stored and regenerated manifest. A matching
 * public ref in a different system/kind must never select a V1 body or V2 twin. */
export function resolveV2FicheReference(
  saved: MultihostModelManifestV245,
  regenerated: MultihostModelManifestV245,
  scene: SystemSceneSnapshot,
  kind: string,
  publicRef: string,
): V2FicheResolution {
  if (!multihostManifestMatchesV245(saved, regenerated)) return {status: 'stale'};
  if (!['PLANET', 'MOON', 'ASTEROID', 'COMET'].includes(kind) ||
      !/^[0-9A-F]{32}$/.test(publicRef)) return {status: 'missing'};
  const identity = saved.identities.find(item =>
    item.kind === kind as MultihostModelKindV245 && item.publicRef === publicRef);
  const fiche = identity === undefined ? null :
    systemSceneV2ReferenceFiche(scene, identity.sourceId, false);
  if (identity === undefined || fiche === null ||
      fiche.kind !== identity.kind || fiche.hostId !== identity.hostId) return {status: 'missing'};
  return {status: 'available', identity, fiche};
}
