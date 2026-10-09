import {
  GammaRayBurstEventProfile,
  GammaRayBurstFamily,
  GammaRayBurstObserverPromptStatus,
  GammaRayBurstOutcome,
} from '../../domain/transient/gamma-ray-burst-event-profile';
import {
  GammaRayBurstJetState,
  GammaRayBurstProgenitorKind,
  type GammaRayBurstSourceProfile,
} from '../../domain/transient/gamma-ray-burst-source-profile';

const SPEED_OF_LIGHT = 299_792_458;
const SOLAR_RADIUS_METERS = 6.957e8;
const RADIANS_TO_DEGREES = 180 / Math.PI;

/** Intrinsic jet/geometry resolver for phase 29.7. */
export class GammaRayBurstEventEngine {
  private constructor() {}

  static deriveProfile(source: GammaRayBurstSourceProfile): GammaRayBurstEventProfile {
    if (source.jetState === GammaRayBurstJetState.JET_LAUNCH_UNRESOLVED) {
      return unresolvedProfile(source);
    }

    const isCollapsar =
      source.progenitorKind === GammaRayBurstProgenitorKind.COLLAPSAR_STRIPPED_STAR;

    if (isCollapsar) {
      return deriveCollapsar(source);
    }

    if (source.jetState === GammaRayBurstJetState.CHOKED_JET_CONFIRMED) {
      throw new RangeError('A compact-merger GRB cannot use the collapsar-only choked-jet state.');
    }

    return successfulProfile(
      source,
      GammaRayBurstFamily.SHORT_MERGER,
      GammaRayBurstOutcome.SUCCESSFUL_SHORT_GRB_ENGINE,
      null,
      requireDuration(source),
    );
  }
}

function deriveCollapsar(source: GammaRayBurstSourceProfile): GammaRayBurstEventProfile {
  const stellarRadiusSolar = source.stellarRadiusSolar;
  const jetHeadVelocityFractionC = source.jetHeadVelocityFractionC;
  if (stellarRadiusSolar === null || jetHeadVelocityFractionC === null) {
    throw new RangeError('Collapsar breakout geometry is incomplete.');
  }

  const breakoutTimeSeconds =
    stellarRadiusSolar * SOLAR_RADIUS_METERS /
    (jetHeadVelocityFractionC * SPEED_OF_LIGHT);
  const engineDurationSeconds = requireDuration(source);

  if (
    source.jetState === GammaRayBurstJetState.CHOKED_JET_CONFIRMED ||
    engineDurationSeconds <= breakoutTimeSeconds
  ) {
    return new GammaRayBurstEventProfile(
      source,
      GammaRayBurstFamily.NO_CLASSICAL_GRB,
      GammaRayBurstOutcome.CHOKED_COLLAPSAR_NO_CLASSICAL_GRB,
      breakoutTimeSeconds,
      null,
      null,
      null,
      null,
      GammaRayBurstObserverPromptStatus.NO_CLASSICAL_PROMPT,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    );
  }

  return successfulProfile(
    source,
    GammaRayBurstFamily.LONG_COLLAPSAR,
    GammaRayBurstOutcome.SUCCESSFUL_LONG_GRB_ENGINE,
    breakoutTimeSeconds,
    engineDurationSeconds - breakoutTimeSeconds,
  );
}

function unresolvedProfile(source: GammaRayBurstSourceProfile): GammaRayBurstEventProfile {
  return new GammaRayBurstEventProfile(
    source,
    GammaRayBurstFamily.UNRESOLVED,
    GammaRayBurstOutcome.JET_LAUNCH_UNRESOLVED,
    null,
    null,
    null,
    null,
    null,
    GammaRayBurstObserverPromptStatus.ENGINE_UNRESOLVED,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  );
}

function successfulProfile(
  source: GammaRayBurstSourceProfile,
  family: GammaRayBurstFamily,
  outcome: GammaRayBurstOutcome,
  breakoutTimeSeconds: number | null,
  externalJetActivitySeconds: number,
): GammaRayBurstEventProfile {
  const halfOpeningAngleDegrees = source.jetHalfOpeningAngleDegrees;
  const lorentzFactor = source.bulkLorentzFactor;
  if (halfOpeningAngleDegrees === null || lorentzFactor === null) {
    throw new RangeError('Successful GRB jet geometry is incomplete.');
  }

  const angleRadians = halfOpeningAngleDegrees / RADIANS_TO_DEGREES;
  const oneJetSolidAngleSteradians = 2 * Math.PI * (1 - Math.cos(angleRadians));
  // Two antipodal cones cover 2*Omega out of 4*pi = 1-cos(theta).
  const twoSidedJetSkyFraction = 1 - Math.cos(angleRadians);
  const relativisticBeamingHalfAngleDegrees = RADIANS_TO_DEGREES / lorentzFactor;

  return new GammaRayBurstEventProfile(
    source,
    family,
    outcome,
    breakoutTimeSeconds,
    externalJetActivitySeconds,
    oneJetSolidAngleSteradians,
    twoSidedJetSkyFraction,
    relativisticBeamingHalfAngleDegrees,
    observerStatus(source, halfOpeningAngleDegrees),
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  );
}

function observerStatus(
  source: GammaRayBurstSourceProfile,
  halfOpeningAngleDegrees: number,
): GammaRayBurstObserverPromptStatus {
  const observerAngle = source.observerAngleToNearestJetAxisDegrees;
  if (observerAngle === null) {
    return GammaRayBurstObserverPromptStatus.ORIENTATION_UNRESOLVED;
  }
  return observerAngle <= halfOpeningAngleDegrees
    ? GammaRayBurstObserverPromptStatus.ON_AXIS_PROMPT_GEOMETRY
    : GammaRayBurstObserverPromptStatus.OFF_AXIS_PROMPT_SUPPRESSED;
}

function requireDuration(source: GammaRayBurstSourceProfile): number {
  if (source.engineActivityDurationSeconds === null) {
    throw new RangeError('A resolved GRB engine requires an activity duration.');
  }
  return source.engineActivityDurationSeconds;
}
