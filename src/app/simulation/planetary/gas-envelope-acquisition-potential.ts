const V1_MATURE_CORE_PROMOTION_ONSET_MASS_EARTH =
  4.5;

const V1_MATURE_CORE_PROMOTION_FULL_MASS_EARTH =
  10.5;

const V1_MATURE_CORE_PROMOTION_STRENGTH =
  0.72;

const V1_MATURE_GAS_SUPPORT_ONSET =
  0.08;

const V1_MATURE_GAS_SUPPORT_FULL =
  0.45;

/**
 * Reconciles the pre-dynamics candidate gas opportunity with the final solid
 * core that actually survives point 17.6.
 *
 * Candidate gasAccretionPotential01 is intentionally estimated before embryo
 * mergers. During 17.6, merged bodies previously inherited only a mass-weighted
 * average of those pre-merger potentials. A body could therefore finish with a
 * genuinely critical 8-14 Mearth solid core while still carrying the weak gas
 * opportunity of its smaller progenitors. Point 17.7 then only attenuated that
 * inherited value, making the runaway consumer range unreachable.
 *
 * Keep the inherited signal as the baseline, but allow a newly consolidated
 * critical core to promote gas acquisition when primordial gas is still locally
 * available. The promotion is smooth, bounded and seed-agnostic. It does not
 * choose a planet type and it vanishes for small cores or gas-depleted disks.
 */
export function matureEnvelopeAcquisitionPotentialV1(
  inheritedCandidatePotential01: number,
  solidCoreMassEarth: number,
  gasAvailability01: number,
  growthPotential01: number,
  envelopeJitter: number,
): number {
  const inheritedPotential =
    clamp01(
      inheritedCandidatePotential01,
    );

  const gasAvailability =
    clamp01(
      gasAvailability01,
    );

  const massIndex01 =
    clamp01(
      Math.log10(
        1 +
        Math.max(
          0,
          solidCoreMassEarth,
        ),
      ) /
      Math.log10(
        1 + 25,
      ),
    );

  const inheritedMatureBaseline01 =
    inheritedPotential *
    (
      0.50 +
      0.50 *
        gasAvailability
    ) *
    (
      0.65 +
      0.35 *
        massIndex01
    ) *
    clamp(
      envelopeJitter,
      0.80,
      1.20,
    );

  const matureCorePromotion01 =
    smoothstep01(
      V1_MATURE_CORE_PROMOTION_ONSET_MASS_EARTH,
      V1_MATURE_CORE_PROMOTION_FULL_MASS_EARTH,
      solidCoreMassEarth,
    );

  /*
   * gasAvailability01 is itself already a compounded disk-environment signal:
   *
   * gasMassFraction
   * × (1 - gasDepletion)
   * × remaining-disk support
   *
   * Treating that compounded score as another direct linear multiplier
   * compressed even excellent post-merger cores into ~0.20..0.35 potential.
   * Re-map the physically useful interval instead: strongly depleted disks
   * still contribute nothing, while genuinely gas-bearing disks can fully
   * support a critical core without requiring an impossible raw score near 1.
   */
  const matureGasSupport01 =
    smoothstep01(
      V1_MATURE_GAS_SUPPORT_ONSET,
      V1_MATURE_GAS_SUPPORT_FULL,
      gasAvailability,
    );

  const growthSupport01 =
    0.75 +
    0.25 *
      clamp01(
        growthPotential01,
      );

  const postDynamicsCoreOpportunity01 =
    V1_MATURE_CORE_PROMOTION_STRENGTH *
    matureCorePromotion01 *
    matureGasSupport01 *
    growthSupport01;

  return clamp01(
    inheritedMatureBaseline01 +
    postDynamicsCoreOpportunity01,
  );
}

function smoothstep01(
  lower: number,
  upper: number,
  value: number,
): number {
  if (value <= lower) {
    return 0;
  }

  if (value >= upper) {
    return 1;
  }

  const t =
    (value - lower) /
    (upper - lower);

  return (
    t *
    t *
    (3 - 2 * t)
  );
}

function clamp01(
  value: number,
): number {
  return clamp(
    value,
    0,
    1,
  );
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}
