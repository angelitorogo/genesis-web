import {
  buildMultihostModelManifestV245, type MultihostModelManifestV245,
} from '../../domain/planetary/multihost-model-manifest-v245';
import { type SystemSceneSnapshot } from './system-scene-snapshot';

/** The manifest is built ONLY after all four V2.4 scientific catalogues have
 * been regenerated from one authorized, known BINARY system. */
export function manifestFromMultihostSceneV245(scene: SystemSceneSnapshot): MultihostModelManifestV245 {
  if (scene.multiplicityName !== 'BINARY' ||
    scene.scientificMultihostPlanetsV241 === undefined ||
    scene.scientificMultihostMoonsV242 === undefined ||
    scene.scientificMultihostMinorBodiesV243 === undefined ||
    scene.scientificMultihostHabitabilityV244 === undefined ||
    scene.formedMultihostSystemV22 === undefined) {
    throw new RangeError('V2.4.5 requires a complete scientific BINARY A/B scene.');
  }
  return buildMultihostModelManifestV245({
    planets: scene.scientificMultihostPlanetsV241,
    moons: scene.scientificMultihostMoonsV242,
    minorBodies: scene.scientificMultihostMinorBodiesV243,
    habitability: scene.scientificMultihostHabitabilityV244,
  });
}
