import {
  type SystemSceneBodySnapshot,
  type SystemSceneMinorBodySnapshot,
  type SystemSceneMoonSnapshot,
  type SystemSceneMotionContributionSnapshot,
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

export const SYSTEM_SCENE_PROJECTION_AUTHORITY =
  Object.freeze({
    authoritativePhysicsSource:
      'DOMAIN_SNAPSHOT' as const,
    sceneRole:
      'READ_ONLY_VISUAL_PROJECTION' as const,
    allowsPhysicsWriteBack:
      false as const,
    allowsGroundTruthMutation:
      false as const,
  });

type SystemSceneBodyProjectionSnapshot =
  | SystemSceneBodySnapshot
  | SystemSceneMoonSnapshot
  | SystemSceneMinorBodySnapshot;

/**
 * Point-24.10 runtime boundary for the real Three.js renderer.
 *
 * SystemScene accepts only the immutable projection assembled before Three.js
 * is entered. This deliberately fails fast if a future caller tries to hand
 * the renderer a mutable physics/state object and therefore makes accidental
 * scene -> domain authority creep observable in tests instead of silently
 * permitting it.
 */
export function assertSystemSceneProjectionSnapshot(
  snapshot:
    SystemSceneSnapshot,
): void {

  assertFrozen(
    snapshot,
    'snapshot',
  );
  assertFrozen(
    snapshot.address,
    'snapshot.address',
  );

  assertFrozenArray(
    snapshot.stars,
    'snapshot.stars',
    assertBodyProjection,
  );
  assertFrozenArray(
    snapshot.planets,
    'snapshot.planets',
    assertBodyProjection,
  );
  assertFrozenArray(
    snapshot.moons,
    'snapshot.moons',
    assertBodyProjection,
  );
  assertFrozenArray(
    snapshot.minorBodies,
    'snapshot.minorBodies',
    assertBodyProjection,
  );

  assertFrozenArray(
    snapshot.orbits,
    'snapshot.orbits',
    (
      orbit,
      label,
    ) => {
      assertFrozen(
        orbit,
        label,
      );
      assertMotionContributions(
        orbit.anchorMotionContributions,
        `${label}.anchorMotionContributions`,
      );
    },
  );

  assertFrozenArray(
    snapshot.motions,
    'snapshot.motions',
    (
      motion,
      label,
    ) => {
      assertFrozen(
        motion,
        label,
      );
    },
  );

  assertFrozenArray(
    snapshot.orbitalRiskTargets,
    'snapshot.orbitalRiskTargets',
    (
      target,
      label,
    ) => {
      assertFrozen(
        target,
        label,
      );
    },
  );

  assertFrozen(
    snapshot.layers,
    'snapshot.layers',
  );
  assertFrozen(
    snapshot.simulation,
    'snapshot.simulation',
  );
  assertFrozen(
    snapshot.scale,
    'snapshot.scale',
  );

  if (
    snapshot.habitableZone !==
      null
  ) {
    assertFrozen(
      snapshot.habitableZone,
      'snapshot.habitableZone',
    );
    assertMotionContributions(
      snapshot.habitableZone
        .anchorMotionContributions,
      'snapshot.habitableZone.anchorMotionContributions',
    );
  }
}

function assertBodyProjection(
  body:
    SystemSceneBodyProjectionSnapshot,

  label:
    string,
): void {

  assertFrozen(
    body,
    label,
  );
  assertFrozen(
    body.position,
    `${label}.position`,
  );

  if (
    body.kind ===
      'minor-body' &&
    body.asteroidPresentation !==
      null
  ) {
    assertFrozen(
      body.asteroidPresentation,
      `${label}.asteroidPresentation`,
    );
  }

  if (
    body.kind ===
      'minor-body' &&
    body.cometPresentation !==
      null
  ) {
    assertFrozen(
      body.cometPresentation,
      `${label}.cometPresentation`,
    );
  }

  if (
    body.kind !==
      'minor-body'
  ) {
    assertFrozen(
      body.spin,
      `${label}.spin`,
    );

    if (
      body.kind ===
        'planet' &&
      body.surfaceEnvironment !==
        null
    ) {
      assertFrozen(
        body.surfaceEnvironment,
        `${label}.surfaceEnvironment`,
      );
    }


    if (
      body.kind ===
        'planet' &&
      body.giantAtmosphere !==
        null
    ) {
      assertFrozen(
        body.giantAtmosphere,
        `${label}.giantAtmosphere`,
      );
    }
  }

  assertMotionContributions(
    body.motionContributions,
    `${label}.motionContributions`,
  );
}

function assertMotionContributions(
  contributions:
    readonly SystemSceneMotionContributionSnapshot[],

  label:
    string,
): void {

  assertFrozenArray(
    contributions,
    label,
    (
      contribution,
      contributionLabel,
    ) => {
      assertFrozen(
        contribution,
        contributionLabel,
      );
    },
  );
}

function assertFrozenArray<T>(
  values:
    readonly T[],

  label:
    string,

  assertEntry:
    (
      value:
        T,
      entryLabel:
        string,
    ) => void,
): void {

  assertFrozen(
    values,
    label,
  );

  values.forEach(
    (
      value,
      index,
    ) => {
      assertEntry(
        value,
        `${label}[${index}]`,
      );
    },
  );
}

function assertFrozen(
  value:
    object,

  label:
    string,
): void {

  if (
    !Object.isFrozen(
      value,
    )
  ) {
    throw new TypeError(
      `SystemScene point 24.10 requires immutable presentation data: ${label} is mutable.`,
    );
  }
}
