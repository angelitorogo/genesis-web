import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type SystemLocator } from '../../domain/generation/procedural-locator';
import { type MinorBodyScientificTargetKind, MinorBodyScientificTargetKind as Kind } from '../../simulation/planetary/minor-body-scientific-target-resolver';
import { CometGenerator } from '../../simulation/planetary/comet-generator';
import { TransNeptunianObjectGenerator } from '../../simulation/planetary/trans-neptunian-object-generator';
import { CapturedExtrasolarObjectGenerator } from '../../simulation/planetary/captured-extrasolar-object-generator';
import { StellarMultihostFormation, type GeneratedSingleHost } from '../../simulation/stellar/stellar-multihost-formation';
import { type RelevantCapturedExtrasolarObject } from '../../domain/planetary/relevant-captured-extrasolar-object';
import { type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { type SystemSceneSnapshot } from '../system/system-scene-snapshot';
import { SystemV2SingleScientificSession } from '../system/system-v2-single-scientific-session';
import { SystemMultihostGameCutover } from '../system/system-multihost-game-cutover';

export interface V2MinorBodySource {
  readonly host: GeneratedSingleHost;
  readonly scene: SystemSceneSnapshot;
  readonly captured: RelevantCapturedExtrasolarObject | null;
}

/** Look up the exact body in the SAME deterministic physical host as SystemPage.
 * An absent ID must not accidentally resolve in another private host/universe.
 */
export function resolveV2MinorBodySource(
  model: ArchiveDiscoveryDetailModel,
  key: UniverseGenerationKey,
  locator: SystemLocator,
  kind: MinorBodyScientificTargetKind,
  proceduralId: string,
): V2MinorBodySource | null {
  const single = SystemV2SingleScientificSession.buildOrNull(model);
  const multiple = single === null ? SystemMultihostGameCutover.sessionOrNull(model) : null;
  const scene = single?.scene ?? multiple?.scene;
  if (scene === undefined) return null;
  const formation = StellarMultihostFormation.generateOrNull(key, locator);
  const source = formation?.components ?? [StellarMultihostFormation.generateV2SingleOrNull(key, locator)];
  const matching = source.flatMap(host => {
    if (host?.planetarySystem === null || host?.planetarySystem === undefined ||
        host.asteroidBelts === null) return [];
    const key = host.internalGenerationKey;
    const system = host.planetarySystem;
    const captured = kind === Kind.CAPTURED_EXTRASOLAR_OBJECT
      ? CapturedExtrasolarObjectGenerator.generate(key, system).relevantObjects.find(
          object => object.proceduralId === proceduralId) ?? null
      : null;
    const exists = kind === Kind.ASTEROID
      ? host.asteroidBelts.relevantAsteroids.some(body => body.proceduralId === proceduralId)
      : kind === Kind.COMET
        ? CometGenerator.generate(key, system).relevantComets.some(body => body.proceduralId === proceduralId)
        : kind === Kind.TRANS_NEPTUNIAN_OBJECT
          ? TransNeptunianObjectGenerator.generate(key, system).relevantObjects.some(
              body => body.proceduralId === proceduralId)
          : captured !== null;
    return exists ? [Object.freeze({ host, scene, captured })] : [];
  });
  if (matching.length > 1) throw new Error('V2 minor-body identity resolves to multiple physical hosts.');
  if (matching.length === 0) return null;
  const result = matching[0]!;
  const sceneKind = kind === Kind.ASTEROID ? 'ASTEROID'
    : kind === Kind.COMET ? 'COMET'
    : kind === Kind.TRANS_NEPTUNIAN_OBJECT ? 'TRANS_NEPTUNIAN_OBJECT'
    : 'CAPTURED_EXTRASOLAR_OBJECT';
  if (!scene.minorBodies.some(body => body.minorBodyKind.name === sceneKind &&
      body.id.endsWith(proceduralId))) {
    throw new Error('V2 minor-body scientific target and displayed scene disagree.');
  }
  return result;
}
