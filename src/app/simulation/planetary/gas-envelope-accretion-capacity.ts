const V1_RUNAWAY_CORE_ONSET_MASS_EARTH =
  5;

const V1_RUNAWAY_CORE_FULL_MASS_EARTH =
  10;

const V1_RUNAWAY_ENVELOPE_POTENTIAL_ONSET =
  0.55;

const V1_RUNAWAY_ENVELOPE_POTENTIAL_FULL =
  0.85;

const V1_RUNAWAY_CAPACITY_MULTIPLIER =
  5;

/**
 * Shared V1 gas-envelope capacity law used by points 17.7 and 19.2.
 *
 * The original continuous core-limited law is preserved as the baseline.
 * A bounded, smooth core-accretion runaway branch is added only when BOTH a
 * sufficiently massive solid core and a strong inherited gas-accretion
 * opportunity are present. This keeps ordinary sub-Neptune formation intact
 * while allowing a small number of favourable cores to dominate a finite disk
 * gas budget, as physical runaway accretion should.
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
