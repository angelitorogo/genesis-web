import {
  type SystemSceneCometActivityPresentationV1,
  type SystemSceneCometPresentationV1,
} from './system-scene-comet-presentation';
import {
  v2CometReadableActivity,
} from './system-scene-v2-comet-tail-presentation';
import {
  type SystemSceneBodySnapshot,
} from './system-scene-snapshot';

/**
 * COM-R2: the two 3D views must use the same activity authority.
 * 31.4g compact-host snapshots have orbital/nucleus statistics but no resolved
 * comet sublimation or transfer model. A fiducial NS temperature or a visual
 * host glow is NOT evidence for a particular comet's coma or dust/ion tail.
 * Their visual activity is therefore withheld in BOTH views. Preserve all
 * scientific quantities from `physical`: the gate only affects illustration.
 */
export function isCometActivityUnresolvedInSceneV1(
  stars: readonly Pick<SystemSceneBodySnapshot,
    'compactHostKind' | 'sourceLuminositySolar' | 'sourceRadiusSolar' | 'sourceEffectiveTemperatureKelvin'>[],
  generatorVersionCode = 2,
): boolean {
  // The conventional star must provide an actual luminous channel. A
  // compact-host depiction (and its separate inspection light) is not one.
  if (generatorVersionCode !== 2 && generatorVersionCode !== 3) return false;
  return !stars.some(star => star.compactHostKind === undefined && (
    (star.sourceLuminositySolar ?? 0) > 0 ||
    (star.sourceRadiusSolar ?? 0) > 0 &&
      (star.sourceEffectiveTemperatureKelvin ?? 0) > 0
  ));
}

export function systemSceneCometActivityVisualParityV1(
  scene: Readonly<{
    generatorVersionCode: number;
    stars: readonly Pick<SystemSceneBodySnapshot,
      'compactHostKind' | 'sourceLuminositySolar' | 'sourceRadiusSolar' | 'sourceEffectiveTemperatureKelvin'>[];
  }>,
  comet: SystemSceneCometPresentationV1,
  physical: SystemSceneCometActivityPresentationV1,
  radiusScene: number,
  incidentFluxEarth: number = physical.incidentFluxEarth,
): SystemSceneCometActivityPresentationV1 {
  if (isCometActivityUnresolvedInSceneV1(scene.stars, scene.generatorVersionCode)) {
    return Object.freeze({
      ...physical,
      hasComa: false,
      hasDustTail: false,
      hasIonTail: false,
      presentationComaRadiusScale: 1,
      presentationComaOpacity01: 0,
      presentationDustTailLengthRadii: 0,
      presentationDustTailWidthRadii: 0,
      presentationDustTailOpacity01: 0,
      presentationIonTailLengthRadii: 0,
      presentationIonTailWidthRadii: 0,
      presentationIonTailOpacity01: 0,
      presentationComaRadiusScene: radiusScene,
      presentationDustTailLengthScene: 0,
      presentationDustTailWidthScene: 0,
      presentationIonTailLengthScene: 0,
      presentationIonTailWidthScene: 0,
    });
  }

  return (scene.generatorVersionCode === 2 || scene.generatorVersionCode === 3)
    ? v2CometReadableActivity(comet, physical, radiusScene, incidentFluxEarth)
    : physical;
}
