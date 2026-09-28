const V1_RUNAWAY_CORE_ONSET_MASS_EARTH =
  4.5;

const V1_RUNAWAY_CORE_FULL_MASS_EARTH =
  9;

const V1_RUNAWAY_ENVELOPE_POTENTIAL_ONSET =
  0.35;

const V1_RUNAWAY_ENVELOPE_POTENTIAL_FULL =
  0.75;

const V1_RUNAWAY_CAPACITY_MULTIPLIER =
  7;

const V1_DISK_RUNAWAY_ACCESS_ONSET =
  0.02;

const V1_DISK_RUNAWAY_ACCESS_FULL =
  0.45;

const V1_DISK_RUNAWAY_ACCESS_MAX_FRACTION =
  0.09;

const V1_DISK_CAPTURE_FRACTION_MAX =
  0.10;

/**
 * Shared V1 gas-envelope capacity law used by points 17.7 and 19.2.
 *
 * The original continuous core-limited law is preserved as the baseline.
 * A bounded, smooth core-accretion runaway branch is added only when BOTH a
 * critical solid core and a sustained inherited gas-accretion opportunity are
 * present. The transition deliberately starts before the old near-extreme
 * 5 Mearth / 0.55 corner because the candidate and maturation stages already
 * attenuate gas opportunity. Keeping that old double gate made runaway almost
 * unreachable in real generated populations and trapped physically favourable
 * cores in the mini-Neptune regime. Ordinary low-mass/low-opportunity bodies
 * remain on the unchanged baseline. No planet type is selected here.
 */
export function gasEnvelopeAccretionCapacityEarthV1(
  solidCoreMassEarth:
    number,

  envelopeAcquisitionPotential01:
    number,
): number {

  if (
    solidCoreMassEarth <= 0 ||
    envelopeAcquisitionPotential01 <= 0
  ) {
    return 0;
  }

  const potential =
    clamp01(
      envelopeAcquisitionPotential01,
    );

  const baselineCapacityEarth =
    solidCoreMassEarth *
    potential *
    (
      4 +
      45 *
        potential
    );

  const runawayReadiness01 =
    gasEnvelopeRunawayReadinessV1(
      solidCoreMassEarth,
      potential,
    );

  return (
    baselineCapacityEarth *
    (
      1 +
      V1_RUNAWAY_CAPACITY_MULTIPLIER *
        runawayReadiness01 *
        runawayReadiness01
    )
  );
}


/**
 * Bounded fraction of the finite primordial gas reservoir that point 17.7 may
 * expose to mature planets. The ordinary branch remains mean-opportunity based;
 * a genuinely runaway-ready core may unlock an additional local supply without
 * manufacturing gas beyond the source disk.
 */
export function gasEnvelopeDiskCaptureFractionV1(
  giantPlanetFormationPropensity01:
    number,

  meanEnvelopePotential01:
    number,

  strongestRunawayReadiness01:
    number,

  diskAvailability01:
    number,
): number {

  const giantPropensity =
    clamp01(
      giantPlanetFormationPropensity01,
    );

  const meanPotential =
    clamp01(
      meanEnvelopePotential01,
    );

  const runawayReadiness =
    clamp01(
      strongestRunawayReadiness01,
    );

  const availability =
    clamp01(
      diskAvailability01,
    );

  const ordinaryCaptureFraction =
    0.0002 +
    0.030 *
      giantPropensity *
      meanPotential *
      availability;

  /*
   * B3 — runaway-only disk access.
   *
   * The ordinary branch above is intentionally unchanged. The previous
   * runaway term remained linear in the already-small readiness score, so
   * real critical cores were still limited to roughly 0.2–1.0 % of a disk
   * containing thousands of Earth masses of primordial gas. Re-map only the
   * genuinely runaway-ready tail into a bounded access support:
   *
   *   readiness <= 0.02  -> no extra access
   *   readiness ~ 0.1    -> modest extra access
   *   readiness ~ 0.4    -> several percent may become accessible
   *   readiness >= 0.45  -> full runaway access support
   *
   * No gas is created here: maxGasCaptureBudgetEarth remains bounded by the
   * frozen source reservoir, the summed core capacity, and the unchanged
   * absolute 10 % disk-capture cap.
   */
  const runawayAccessSupport01 =
    smoothstep01(
      V1_DISK_RUNAWAY_ACCESS_ONSET,
      V1_DISK_RUNAWAY_ACCESS_FULL,
      runawayReadiness,
    );

  const runawayCaptureFraction =
    V1_DISK_RUNAWAY_ACCESS_MAX_FRACTION *
    giantPropensity *
    runawayAccessSupport01 *
    availability;

  return clamp(
    ordinaryCaptureFraction +
      runawayCaptureFraction,
    0,
    V1_DISK_CAPTURE_FRACTION_MAX,
  );
}

/**
 * Smooth [0, 1] readiness for core-accretion runaway.
 *
 * Readiness is zero unless BOTH the core and gas-accretion opportunity have
 * crossed their onset ranges. No seed-specific branch and no hard discontinuity
 * is introduced.
 */
export function gasEnvelopeRunawayReadinessV1(
  solidCoreMassEarth:
    number,

  envelopeAcquisitionPotential01:
    number,
): number {

  const coreReadiness01 =
    smoothstep01(
      V1_RUNAWAY_CORE_ONSET_MASS_EARTH,
      V1_RUNAWAY_CORE_FULL_MASS_EARTH,
      solidCoreMassEarth,
    );

  const potentialReadiness01 =
    smoothstep01(
      V1_RUNAWAY_ENVELOPE_POTENTIAL_ONSET,
      V1_RUNAWAY_ENVELOPE_POTENTIAL_FULL,
      envelopeAcquisitionPotential01,
    );

  return (
    coreReadiness01 *
    potentialReadiness01
  );
}

function smoothstep01(
  lower:
    number,

  upper:
    number,

  value:
    number,
): number {

  if (
    value <= lower
  ) {
    return 0;
  }

  if (
    value >= upper
  ) {
    return 1;
  }

  const x =
    (
      value -
      lower
    ) /
    (
      upper -
      lower
    );

  return (
    x *
    x *
    (
      3 -
      2 *
        x
    )
  );
}

function clamp(
  value:
    number,

  min:
    number,

  max:
    number,
): number {

  return Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );
}

function clamp01(
  value:
    number,
): number {

  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
  );
}
