/**
 * Point-20.4 coarse longwave greenhouse/blanketing regimes.
 *
 * DEEP_ENVELOPE is deliberately separate from the solid-surface optical-depth
 * ladder because mini-Neptunes and giant planets have no phase-19 solid surface
 * pressure to which a surface greenhouse temperature amplification can be
 * attached.
 */
export enum AtmosphereGreenhouseRegime {
  NONE =
    'NONE',

  NEGLIGIBLE =
    'NEGLIGIBLE',

  WEAK =
    'WEAK',

  MODERATE =
    'MODERATE',

  STRONG =
    'STRONG',

  EXTREME =
    'EXTREME',

  DEEP_ENVELOPE =
    'DEEP_ENVELOPE',
}

export const ATMOSPHERE_V1_GREENHOUSE_NEGLIGIBLE_MAX_OPTICAL_DEPTH =
  0.05;

export const ATMOSPHERE_V1_GREENHOUSE_WEAK_MAX_OPTICAL_DEPTH =
  0.30;

export const ATMOSPHERE_V1_GREENHOUSE_MODERATE_MAX_OPTICAL_DEPTH =
  1.00;

export const ATMOSPHERE_V1_GREENHOUSE_STRONG_MAX_OPTICAL_DEPTH =
  3.00;

export function atmosphereGreenhouseRegimeForOpticalDepthProxy(
  opticalDepthProxy:
    number,

  isDeepEnvelope:
    boolean,
): AtmosphereGreenhouseRegime {

  if (
    !Number.isFinite(
      opticalDepthProxy,
    ) ||
    opticalDepthProxy <
      0
  ) {
    throw new RangeError(
      `opticalDepthProxy must be finite and non-negative: ${opticalDepthProxy}.`,
    );
  }

  if (
    isDeepEnvelope
  ) {
    return AtmosphereGreenhouseRegime.DEEP_ENVELOPE;
  }

  if (
    opticalDepthProxy ===
    0
  ) {
    return AtmosphereGreenhouseRegime.NONE;
  }

  if (
    opticalDepthProxy <
    ATMOSPHERE_V1_GREENHOUSE_NEGLIGIBLE_MAX_OPTICAL_DEPTH
  ) {
    return AtmosphereGreenhouseRegime.NEGLIGIBLE;
  }

  if (
    opticalDepthProxy <
    ATMOSPHERE_V1_GREENHOUSE_WEAK_MAX_OPTICAL_DEPTH
  ) {
    return AtmosphereGreenhouseRegime.WEAK;
  }

  if (
    opticalDepthProxy <
    ATMOSPHERE_V1_GREENHOUSE_MODERATE_MAX_OPTICAL_DEPTH
  ) {
    return AtmosphereGreenhouseRegime.MODERATE;
  }

  if (
    opticalDepthProxy <
    ATMOSPHERE_V1_GREENHOUSE_STRONG_MAX_OPTICAL_DEPTH
  ) {
    return AtmosphereGreenhouseRegime.STRONG;
  }

  return AtmosphereGreenhouseRegime.EXTREME;
}
