/**
 * One persisted piece of observed scientific evidence for a single target.
 *
 * Point 26.A.2 deliberately keeps this model free of Ground Truth values. It
 * records only the provenance/quality needed to decide whether observed
 * knowledge is scientifically complete enough for later DiscoveryState
 * transitions. Physical measurements remain observation data and procedural
 * Ground Truth remains regenerated from the target seed.
 */
export class ScientificEvidence {

  readonly dimensionCode:
    string;

  readonly evidenceCode:
    string;

  readonly sourceKey:
    string;

  readonly independenceKey:
    string;

  readonly quality01:
    number;

  readonly uncertainty01:
    number;

  readonly observedAtEpochMs:
    number;

  constructor(
    input:
      ScientificEvidenceInput,
  ) {

    this.dimensionCode =
      requireCode(
        input.dimensionCode,
        'dimensionCode',
      );

    this.evidenceCode =
      requireCode(
        input.evidenceCode,
        'evidenceCode',
      );

    this.sourceKey =
      requireCode(
        input.sourceKey,
        'sourceKey',
      );

    this.independenceKey =
      requireCode(
        input.independenceKey,
        'independenceKey',
      );

    this.quality01 =
      requireUnitInterval(
        input.quality01,
        'quality01',
      );

    this.uncertainty01 =
      requireUnitInterval(
        input.uncertainty01,
        'uncertainty01',
      );

    this.observedAtEpochMs =
      requireEpochMs(
        input.observedAtEpochMs,
      );

    Object.freeze(
      this,
    );
  }

  /**
   * Stable per-target evidence identity. The independence key is deliberately
   * excluded: changing scientific independence for the same source/evidence
   * would be contradictory persisted knowledge rather than a new observation.
   */
  get identityKey():
    string {

    return JSON.stringify([
      this.dimensionCode,
      this.evidenceCode,
      this.sourceKey,
    ]);
  }
}

export interface ScientificEvidenceInput {
  readonly dimensionCode:
    string;

  readonly evidenceCode:
    string;

  readonly sourceKey:
    string;

  readonly independenceKey:
    string;

  readonly quality01:
    number;

  readonly uncertainty01:
    number;

  readonly observedAtEpochMs:
    number;
}

/**
 * Monotonic merge used by persistence when the same evidence/source is
 * recorded more than once. Scientific knowledge never becomes worse because a
 * stale or noisier retry arrives later.
 */
export function mergeScientificEvidence(
  current:
    ScientificEvidence,

  incoming:
    ScientificEvidence,
): ScientificEvidence {

  if (
    current.identityKey !==
    incoming.identityKey
  ) {
    throw new RangeError(
      'ScientificEvidence can only be merged with the same evidence identity.',
    );
  }

  if (
    current.independenceKey !==
    incoming.independenceKey
  ) {
    throw new RangeError(
      'ScientificEvidence independenceKey cannot change for the same evidence source.',
    );
  }

  const quality01 =
    Math.max(
      current.quality01,
      incoming.quality01,
    );

  const uncertainty01 =
    Math.min(
      current.uncertainty01,
      incoming.uncertainty01,
    );

  const improved =
    quality01 >
      current.quality01 ||
    uncertainty01 <
      current.uncertainty01;

  if (
    !improved
  ) {
    return current;
  }

  return new ScientificEvidence({
    dimensionCode:
      current.dimensionCode,

    evidenceCode:
      current.evidenceCode,

    sourceKey:
      current.sourceKey,

    independenceKey:
      current.independenceKey,

    quality01,
    uncertainty01,

    observedAtEpochMs:
      incoming.observedAtEpochMs,
  });
}

function requireCode(
  value:
    string,

  name:
    string,
): string {

  if (
    typeof value !==
      'string' ||
    value.trim().length ===
      0
  ) {
    throw new RangeError(
      `${name} must be a non-blank string.`,
    );
  }

  if (
    value !==
    value.trim()
  ) {
    throw new RangeError(
      `${name} must not contain leading or trailing whitespace.`,
    );
  }

  return value;
}

function requireUnitInterval(
  value:
    number,

  name:
    string,
): number {

  if (
    !Number.isFinite(
      value,
    ) ||
    value < 0 ||
    value > 1
  ) {
    throw new RangeError(
      `${name} must be finite and inside [0, 1].`,
    );
  }

  return value;
}

function requireEpochMs(
  value:
    number,
): number {

  if (
    !Number.isSafeInteger(
      value,
    ) ||
    value < 0
  ) {
    throw new RangeError(
      'observedAtEpochMs must be a non-negative safe integer.',
    );
  }

  return value;
}
