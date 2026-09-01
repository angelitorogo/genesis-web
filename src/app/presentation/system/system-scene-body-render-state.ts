export type SystemSceneSphereBodyKind =
  | 'star'
  | 'planet'
  | 'moon';

export type SystemSceneBodySpinSource =
  | 'UNAVAILABLE'
  | 'PLANET_19_3'
  | 'MOON_21_4';

export interface SystemSceneBodySpinSnapshot {
  readonly source:
    SystemSceneBodySpinSource;

  /** Sidereal-equivalent rotation magnitude from domain Ground Truth. */
  readonly rotationPeriodHours:
    number | null;

  /**
   * Domain obliquity when available. Null means the domain currently exposes no
   * authoritative axial tilt for this body family, so presentation keeps the
   * default local axis instead of inventing one.
   */
  readonly axialTiltDegrees:
    number | null;

  /** Domain classification when available; null means intentionally unknown. */
  readonly isRetrograde:
    boolean | null;

  readonly isSynchronized:
    boolean;

  /** Deterministic presentation-only prime-meridian phase at simulation day 0. */
  readonly epochPhaseDegrees:
    number;
}

export interface SystemSceneBodySpinPresentationTiming {
  readonly epochSimulationDay:
    number;

  readonly playbackDaysPerRealSecond:
    number;
}

export interface SystemSceneSphereSegments {
  readonly widthSegments:
    number;

  readonly heightSegments:
    number;
}

const TWO_PI =
  Math.PI * 2;

/**
 * Readability ceiling for accelerated system playback. The authoritative
 * rotation period remains untouched in the snapshot; only the non-synchronized
 * planet mesh is visually time-compressed so procedural texture detail remains
 * inspectable while orbital motion is accelerated by point 24.3.
 */
const MAX_UNSYNCHRONIZED_PLANET_DISPLAY_CYCLES_PER_REAL_SECOND =
  1 / 30;

/**
 * Point-25.1 fixed sphere tessellation baseline.
 *
 * This is deliberately not LOD: point 25.10 owns adaptive tessellation and
 * instancing. 25.1 only gives the three spherical body families one explicit,
 * stable WebGL baseline instead of scattering magic segment counts in Three.js.
 */
export function systemSceneSphereSegments(
  kind:
    SystemSceneSphereBodyKind,
): SystemSceneSphereSegments {

  switch (
    kind
  ) {
    case 'star':
      return Object.freeze({
        widthSegments: 48,
        heightSegments: 32,
      });
    case 'planet':
      return Object.freeze({
        widthSegments: 40,
        heightSegments: 28,
      });
    case 'moon':
      return Object.freeze({
        widthSegments: 28,
        heightSegments: 20,
      });
  }
}

/**
 * Point-25.1 presentation spin projector.
 *
 * Rotation is evaluated from absolute simulation time, never accumulated frame
 * deltas, so 30/60/144 Hz produce the same orientation. The period itself comes
 * from frozen domain state (19.3 planets / 21.4 moons); epochPhaseDegrees is
 * presentation-only because those phases were never frozen as Ground Truth.
 *
 * Retrograde planets are represented by their >90 degree domain obliquity in
 * the axial pivot. We therefore rotate positively around the body's local spin
 * axis instead of applying a second sign flip that would reverse it twice.
 */
export function systemSceneBodySpinRadians(
  spin:
    SystemSceneBodySpinSnapshot,

  simulationDay:
    number,
): number {

  assertSpin(
    spin,
  );

  if (
    !Number.isFinite(
      simulationDay,
    )
  ) {
    throw new RangeError(
      `simulationDay must be finite: ${simulationDay}.`,
    );
  }

  const epochRadians =
    degreesToRadians(
      normalizeDegrees(
        spin.epochPhaseDegrees,
      ),
    );

  if (
    spin.rotationPeriodHours ===
      null
  ) {
    return epochRadians;
  }

  const elapsedHours =
    simulationDay *
    24;

  const elapsedCycles =
    elapsedHours /
    spin.rotationPeriodHours;

  return normalizeRadians(
    epochRadians +
    elapsedCycles *
      TWO_PI,
  );
}

/**
 * Presentation-only readable spin for the real Three.js renderer.
 *
 * Point 24.3 intentionally accelerates orbital simulation so a system can be
 * inspected in seconds rather than years. Feeding that accelerated
 * simulationDay directly into a 10-30 h planetary spin can make textures blur
 * through several turns per real second. For non-synchronized planets only,
 * compress that visual cadence monotonically and asymptotically cap it at one
 * turn per 30 real seconds.
 *
 * Synchronized planets and all moons keep the authoritative simulation-time
 * projection so tidal locking is never broken visually. No domain period is
 * mutated or written back.
 */
export function systemSceneBodyDisplaySpinRadians(
  spin:
    SystemSceneBodySpinSnapshot,

  simulationDay:
    number,

  timing:
    SystemSceneBodySpinPresentationTiming,
): number {

  assertSpin(
    spin,
  );
  assertPresentationTiming(
    timing,
  );

  if (
    spin.source !==
      'PLANET_19_3' ||
    spin.isSynchronized ||
    spin.rotationPeriodHours ===
      null
  ) {
    return systemSceneBodySpinRadians(
      spin,
      simulationDay,
    );
  }

  if (
    !Number.isFinite(
      simulationDay,
    )
  ) {
    throw new RangeError(
      `simulationDay must be finite: ${simulationDay}.`,
    );
  }

  const epochSpinRadians =
    systemSceneBodySpinRadians(
      spin,
      timing.epochSimulationDay,
    );

  const elapsedRealSeconds =
    (
      simulationDay -
      timing.epochSimulationDay
    ) /
    timing.playbackDaysPerRealSecond;

  const physicalCyclesPerRealSecond =
    timing.playbackDaysPerRealSecond *
    24 /
    spin.rotationPeriodHours;

  const displayCyclesPerRealSecond =
    MAX_UNSYNCHRONIZED_PLANET_DISPLAY_CYCLES_PER_REAL_SECOND *
    Math.tanh(
      physicalCyclesPerRealSecond /
      MAX_UNSYNCHRONIZED_PLANET_DISPLAY_CYCLES_PER_REAL_SECOND,
    );

  return normalizeRadians(
    epochSpinRadians +
    elapsedRealSeconds *
      displayCyclesPerRealSecond *
      TWO_PI,
  );
}

export function systemSceneBodyAxialTiltRadians(
  spin:
    SystemSceneBodySpinSnapshot,
): number {

  assertSpin(
    spin,
  );

  return degreesToRadians(
    spin.axialTiltDegrees ??
      0,
  );
}

/**
 * Maps authoritative stellar luminosity to a bounded Three.js presentation
 * intensity. It preserves luminosity ordering without pretending Three.js scene
 * units are SI radiometric units and protects the renderer from extreme stars.
 */
export function systemSceneStellarLightIntensity(
  luminositySolar:
    number,
): number {

  if (
    !Number.isFinite(
      luminositySolar,
    ) ||
    luminositySolar <=
      0
  ) {
    throw new RangeError(
      `luminositySolar must be finite and greater than 0: ${luminositySolar}.`,
    );
  }

  const logCompressed =
    Math.log10(
      1 +
      luminositySolar,
    );

  return clamp(
    10 +
      logCompressed *
        10,
    9,
    32,
  );
}

function assertSpin(
  spin:
    SystemSceneBodySpinSnapshot,
): void {

  if (
    spin.rotationPeriodHours !==
      null &&
    (
      !Number.isFinite(
        spin.rotationPeriodHours,
      ) ||
      spin.rotationPeriodHours <=
        0
    )
  ) {
    throw new RangeError(
      'rotationPeriodHours must be null or finite and greater than 0.',
    );
  }

  if (
    spin.axialTiltDegrees !==
      null &&
    (
      !Number.isFinite(
        spin.axialTiltDegrees,
      ) ||
      spin.axialTiltDegrees <
        0 ||
      spin.axialTiltDegrees >
        180
    )
  ) {
    throw new RangeError(
      'axialTiltDegrees must be null or finite and in [0, 180].',
    );
  }

  if (
    !Number.isFinite(
      spin.epochPhaseDegrees,
    )
  ) {
    throw new RangeError(
      'epochPhaseDegrees must be finite.',
    );
  }

  if (
    spin.source ===
      'UNAVAILABLE' &&
    spin.rotationPeriodHours !==
      null
  ) {
    throw new RangeError(
      'UNAVAILABLE spin cannot expose a rotation period.',
    );
  }

  if (
    spin.source !==
      'UNAVAILABLE' &&
    spin.rotationPeriodHours ===
      null
  ) {
    throw new RangeError(
      'Authoritative planet/moon spin requires a rotation period.',
    );
  }
}

function assertPresentationTiming(
  timing:
    SystemSceneBodySpinPresentationTiming,
): void {

  if (
    !Number.isFinite(
      timing.epochSimulationDay,
    )
  ) {
    throw new RangeError(
      'epochSimulationDay must be finite.',
    );
  }

  if (
    !Number.isFinite(
      timing.playbackDaysPerRealSecond,
    ) ||
    timing.playbackDaysPerRealSecond <=
      0
  ) {
    throw new RangeError(
      'playbackDaysPerRealSecond must be finite and greater than 0.',
    );
  }
}

function degreesToRadians(
  degrees:
    number,
): number {

  return degrees *
    Math.PI /
    180;
}

function normalizeDegrees(
  degrees:
    number,
): number {

  const normalized =
    degrees %
    360;

  return normalized <
    0
    ? normalized +
        360
    : normalized;
}

function normalizeRadians(
  radians:
    number,
): number {

  const normalized =
    radians %
    TWO_PI;

  return normalized <
    0
    ? normalized +
        TWO_PI
    : normalized;
}

function clamp(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {

  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}
