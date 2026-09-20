import { type SystemSceneSnapshot } from './system-scene-snapshot';

/** Address display bodies with public source identifiers. An explicit multihost
 * catalogue is authoritative; never reinterpret unknown IDs as legacy bodies. */
export function systemScenePlanetFicheRoute(snapshot: SystemSceneSnapshot, bodyId: string): readonly string[] | null {
  const mapped = snapshot.scientificPlanetBindings;
  let index: string;
  if (mapped !== undefined) {
    const matching = mapped.filter(entry => entry.sceneBodyId === bodyId);
    if (matching.length !== 1 || !/^(0|[1-9]\d*)$/.test(matching[0]!.bodyIndex)) return null;
    index = matching[0]!.bodyIndex;
  } else {
    const match = /^planet-([1-9]\d*)$/.exec(bodyId);
    if (!match) return null;
    index = (BigInt(match[1]!) - 1n).toString();
  }
  return Object.freeze(['/system', snapshot.address.galaxyIndex, snapshot.address.sectorKey,
    snapshot.address.galacticObjectIndex, 'planet', index]);
}

export function systemSceneMoonFicheRoute(snapshot: SystemSceneSnapshot, bodyId: string): readonly string[] | null {
  const mapped = snapshot.scientificMoonBindings;
  let index: string;
  let moonIndex: string;
  if (mapped !== undefined) {
    const matching = mapped.filter(entry => entry.sceneBodyId === bodyId);
    if (matching.length !== 1 || !/^(0|[1-9]\d*)$/.test(matching[0]!.bodyIndex) ||
        !/^(0|[1-9]\d*)$/.test(matching[0]!.moonIndex)) return null;
    index = matching[0]!.bodyIndex;
    moonIndex = matching[0]!.moonIndex;
  } else {
    // If any multihost map is supplied, absence of the moon map is NOT a
    // license to generate a legacy link to a different planet.
    if (snapshot.scientificPlanetBindings !== undefined) return null;
    const match = /^moon-([1-9]\d*)-([1-9]\d*)$/.exec(bodyId);
    if (!match) return null;
    index = (BigInt(match[1]!) - 1n).toString();
    moonIndex = (BigInt(match[2]!) - 1n).toString();
  }
  return Object.freeze(['/system', snapshot.address.galaxyIndex, snapshot.address.sectorKey,
    snapshot.address.galacticObjectIndex, 'planet', index, 'moon', moonIndex]);
}
