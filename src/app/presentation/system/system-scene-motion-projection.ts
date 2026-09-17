import {
  systemSceneMultihostProjectVectorV221,
  type SystemSceneMultihostRadialProjectionV22,
} from './system-scene-multihost-radial-projection';
import {
  SystemOrbitalMotionEngine,
  type SystemOrbitalMotionDefinition,
} from '../../simulation/orbital/system-orbital-motion-engine';

import {
  SystemSceneProjectionSpace,
  systemSceneProjectAuVector,
  systemSceneProjectAuVectorInSpace,
  type SystemSceneProjectionSpace as SystemSceneProjectionSpaceValue,
  type SystemSceneScaleSnapshot,
} from './system-scene-scale-projection';

export interface SystemSceneMotionProjectionContribution {
  readonly motionId:
    string;

  readonly scale:
    number;

  readonly projectionSpace?:
    SystemSceneProjectionSpaceValue;

  readonly linearScenePerAu?:
    number;

  readonly presentationTimeScale?:
    number;

  /** Renderer-only multiplier applied after AU -> scene projection. */
  readonly postProjectionScale?:
    number;

  /** Shared by V2.2 S-type motion and orbit guides; never changes physical AU. */
  readonly hostRadialProjectionV22?: SystemSceneMultihostRadialProjectionV22;
}

export interface SystemSceneMotionProjectionVector3 {
  readonly x:
    number;

  readonly y:
    number;

  readonly z:
    number;
}

export type SystemSceneMotionProjectionOrbitKind =
  | 'stellar'
  | 'planetary'
  | 'moon'
  | 'minor-body';

export type SystemSceneMotionResolver =
  (
    motionId:
      string,
  ) => SystemOrbitalMotionDefinition | undefined;

/**
 * Point-24.10 shared read-only orbital projection.
 *
 * This helper is the only bridge used by the presentation layer to turn the
 * already-authoritative orbital definitions carried by SystemSceneSnapshot
 * into ephemeral scene coordinates. It never mutates the snapshot and never
 * writes positions, velocities or orbital elements back to domain state.
 */
export function projectSystemSceneMotionContributions(
  contributions:
    readonly SystemSceneMotionProjectionContribution[],

  resolveMotion:
    SystemSceneMotionResolver,

  simulationDay:
    number,

  sceneScale:
    SystemSceneScaleSnapshot,
): SystemSceneMotionProjectionVector3 {

  if (
    !Number.isFinite(
      simulationDay,
    )
  ) {
    throw new RangeError(
      `SystemScene projection requires a finite simulation day: ${simulationDay}.`,
    );
  }

  let globalXAu = 0;
  let globalYAu = 0;
  let globalZAu = 0;
  let sceneX = 0;
  let sceneY = 0;
  let sceneZ = 0;

  for (
    const contribution
    of contributions
  ) {
    const motion =
      resolveMotion(
        contribution.motionId,
      );

    if (
      motion ===
        undefined
    ) {
      throw new RangeError(
        `Unknown SystemScene orbital motion ${contribution.motionId}.`,
      );
    }

    const presentationTimeScale =
      contribution.presentationTimeScale ??
      1;

    const position =
      SystemOrbitalMotionEngine
        .positionAtSimulationDay(
          motion,
          simulationDay *
            presentationTimeScale,
        );

    const postProjectionScale =
      finitePositiveOr(
        contribution.postProjectionScale,
        1,
      );

    const hostRadialProjectionV22 = contribution.hostRadialProjectionV22;
    if (hostRadialProjectionV22 !== undefined) {
      const projected = systemSceneMultihostProjectVectorV221(
        {x: position.xAu, y: position.yAu, z: position.zAu},
        hostRadialProjectionV22, contribution.scale,
      );
      sceneX += projected.x * postProjectionScale;
      sceneY += projected.y * postProjectionScale;
      sceneZ += projected.z * postProjectionScale;
      continue;
    }

    const linearScenePerAu =
      contribution.linearScenePerAu ??
      null;

    if (
      linearScenePerAu !==
        null &&
      Number.isFinite(
        linearScenePerAu,
      ) &&
      linearScenePerAu >
        0
    ) {
      sceneX +=
        position.xAu *
        contribution.scale *
        linearScenePerAu *
        postProjectionScale;
      sceneY +=
        position.yAu *
        contribution.scale *
        linearScenePerAu *
        postProjectionScale;
      sceneZ +=
        position.zAu *
        contribution.scale *
        linearScenePerAu *
        postProjectionScale;
      continue;
    }

    const projectionSpace =
      contribution.projectionSpace ??
      SystemSceneProjectionSpace.GLOBAL;

    if (
      projectionSpace ===
        SystemSceneProjectionSpace.GLOBAL &&
      Math.abs(
        postProjectionScale -
        1,
      ) <=
        1e-12
    ) {
      globalXAu +=
        position.xAu *
        contribution.scale;
      globalYAu +=
        position.yAu *
        contribution.scale;
      globalZAu +=
        position.zAu *
        contribution.scale;
      continue;
    }

    const projected =
      projectionSpace ===
        SystemSceneProjectionSpace.GLOBAL
        ? systemSceneProjectAuVector(
            {
              x:
                position.xAu *
                contribution.scale,
              y:
                position.yAu *
                contribution.scale,
              z:
                position.zAu *
                contribution.scale,
            },
            sceneScale,
          )
        : systemSceneProjectAuVectorInSpace(
            {
              x:
                position.xAu,
              y:
                position.yAu,
              z:
                position.zAu,
            },
            sceneScale,
            projectionSpace,
          );

    const physicalScale =
      projectionSpace ===
        SystemSceneProjectionSpace.GLOBAL
        ? 1
        : contribution.scale;

    sceneX +=
      projected.x *
      physicalScale *
      postProjectionScale;
    sceneY +=
      projected.y *
      physicalScale *
      postProjectionScale;
    sceneZ +=
      projected.z *
      physicalScale *
      postProjectionScale;
  }

  const globalProjected =
    systemSceneProjectAuVector(
      {
        x:
          globalXAu,
        y:
          globalYAu,
        z:
          globalZAu,
      },
      sceneScale,
    );

  return Object.freeze({
    x:
      sceneX +
      globalProjected.x,
    y:
      sceneY +
      globalProjected.y,
    z:
      sceneZ +
      globalProjected.z,
  });
}

function finitePositiveOr(
  value:
    number | undefined,

  fallback:
    number,
): number {

  return value !== undefined &&
    Number.isFinite(value) &&
    value > 0
    ? value
    : fallback;
}

/**
 * Produces presentation-only local AU samples for one orbit guide. Three.js
 * consumes these samples to draw a line; they are not persisted and therefore
 * cannot become an authoritative orbital catalogue.
 */
export function sampleSystemSceneOrbitLocalAu(
  motion:
    SystemOrbitalMotionDefinition,

  orbitKind:
    SystemSceneMotionProjectionOrbitKind,

  segmentCount:
    number,
): readonly SystemSceneMotionProjectionVector3[] {

  if (
    !Number.isInteger(
      segmentCount,
    ) ||
    segmentCount <
      8
  ) {
    throw new RangeError(
      `SystemScene orbit projection requires at least 8 integer segments: ${segmentCount}.`,
    );
  }

  const samples =
    orbitKind ===
      'minor-body'
      ? SystemOrbitalMotionEngine
          .sampleClosedOrbitPath(
            motion,
            segmentCount,
          )
      : Array.from(
          {
            length:
              segmentCount,
          },
          (
            _,
            index,
          ) =>
            SystemOrbitalMotionEngine
              .positionAtSimulationDay(
                motion,
                motion.periodDays *
                  index /
                  segmentCount,
              ),
        );

  return Object.freeze(
    samples.map(
      sample =>
        Object.freeze({
          x:
            sample.xAu,
          y:
            sample.yAu,
          z:
            sample.zAu,
        }),
    ),
  );
}
