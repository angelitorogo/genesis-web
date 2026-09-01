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
        linearScenePerAu;
      sceneY +=
        position.yAu *
        contribution.scale *
        linearScenePerAu;
      sceneZ +=
        position.zAu *
        contribution.scale *
        linearScenePerAu;
      continue;
    }

    const projectionSpace =
      contribution.projectionSpace ??
      SystemSceneProjectionSpace.GLOBAL;

    if (
      projectionSpace ===
        SystemSceneProjectionSpace.GLOBAL
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
      systemSceneProjectAuVectorInSpace(
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

    sceneX +=
      projected.x *
      contribution.scale;
    sceneY +=
      projected.y *
      contribution.scale;
    sceneZ +=
      projected.z *
      contribution.scale;
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
