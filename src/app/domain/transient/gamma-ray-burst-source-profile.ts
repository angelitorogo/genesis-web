export const GammaRayBurstProgenitorKind = Object.freeze({
  COMPACT_MERGER_NS_NS: 'COMPACT_MERGER_NS_NS',
  COMPACT_MERGER_NS_BH: 'COMPACT_MERGER_NS_BH',
  COLLAPSAR_STRIPPED_STAR: 'COLLAPSAR_STRIPPED_STAR',
} as const);

export type GammaRayBurstProgenitorKind =
  typeof GammaRayBurstProgenitorKind[keyof typeof GammaRayBurstProgenitorKind];

export const GammaRayBurstJetState = Object.freeze({
  RELATIVISTIC_JET_CONFIRMED: 'RELATIVISTIC_JET_CONFIRMED',
  JET_LAUNCH_UNRESOLVED: 'JET_LAUNCH_UNRESOLVED',
  CHOKED_JET_CONFIRMED: 'CHOKED_JET_CONFIRMED',
} as const);

export type GammaRayBurstJetState =
  typeof GammaRayBurstJetState[keyof typeof GammaRayBurstJetState];

/**
 * 29.7 explicit source-frame input for a possible gamma-ray burst.
 *
 * This object is deliberately stricter than "a merger/supernova happened".
 * A GRB requires jet physics that is not contained in the canonical 29.1/29.4
 * events. Therefore GENESIS only derives a GRB when the jet state is supplied
 * explicitly by a future canonical jet model or by this read-only laboratory.
 */
export class GammaRayBurstSourceProfile {
  constructor(
    readonly progenitorKind: GammaRayBurstProgenitorKind,
    readonly jetState: GammaRayBurstJetState,
    readonly engineActivityDurationSeconds: number | null,
    readonly jetHalfOpeningAngleDegrees: number | null,
    readonly bulkLorentzFactor: number | null,
    readonly observerAngleToNearestJetAxisDegrees: number | null,
    readonly stellarRadiusSolar: number | null,
    readonly jetHeadVelocityFractionC: number | null,
  ) {
    if (!Object.values(GammaRayBurstProgenitorKind).includes(progenitorKind)) {
      throw new RangeError('Unsupported 29.7 GRB progenitor kind.');
    }
    if (!Object.values(GammaRayBurstJetState).includes(jetState)) {
      throw new RangeError('Unsupported 29.7 GRB jet state.');
    }

    assertNullableRange(
      engineActivityDurationSeconds,
      1e-4,
      1e5,
      'engineActivityDurationSeconds',
    );
    assertNullableRange(
      jetHalfOpeningAngleDegrees,
      0.1,
      45,
      'jetHalfOpeningAngleDegrees',
    );
    assertNullableRange(
      bulkLorentzFactor,
      2,
      5_000,
      'bulkLorentzFactor',
    );
    assertNullableRange(
      observerAngleToNearestJetAxisDegrees,
      0,
      90,
      'observerAngleToNearestJetAxisDegrees',
    );

    const isCollapsar =
      progenitorKind === GammaRayBurstProgenitorKind.COLLAPSAR_STRIPPED_STAR;

    if (isCollapsar) {
      assertNullableRange(stellarRadiusSolar, 0.1, 100, 'stellarRadiusSolar');
      assertNullableRange(
        jetHeadVelocityFractionC,
        0.01,
        0.99,
        'jetHeadVelocityFractionC',
      );
      if (stellarRadiusSolar === null || jetHeadVelocityFractionC === null) {
        throw new RangeError(
          'A 29.7 collapsar requires an explicit stellar radius and jet-head velocity.',
        );
      }
    } else if (stellarRadiusSolar !== null || jetHeadVelocityFractionC !== null) {
      throw new RangeError(
        'Compact-merger GRB sources cannot carry a stellar-envelope breakout geometry.',
      );
    }

    if (jetState === GammaRayBurstJetState.RELATIVISTIC_JET_CONFIRMED) {
      if (
        engineActivityDurationSeconds === null ||
        jetHalfOpeningAngleDegrees === null ||
        bulkLorentzFactor === null
      ) {
        throw new RangeError(
          'A confirmed relativistic GRB jet requires duration, opening angle and Lorentz factor.',
        );
      }
    }

    if (jetState === GammaRayBurstJetState.JET_LAUNCH_UNRESOLVED) {
      if (jetHalfOpeningAngleDegrees !== null || bulkLorentzFactor !== null) {
        throw new RangeError(
          'An unresolved GRB jet cannot fabricate opening angle or Lorentz factor.',
        );
      }
    }

    if (jetState === GammaRayBurstJetState.CHOKED_JET_CONFIRMED) {
      if (!isCollapsar) {
        throw new RangeError(
          '29.7 uses CHOKED_JET_CONFIRMED only for an explicitly modeled collapsar envelope.',
        );
      }
      if (engineActivityDurationSeconds === null || jetHalfOpeningAngleDegrees === null) {
        throw new RangeError(
          'A choked collapsar reference requires engine duration and jet opening angle.',
        );
      }
      if (bulkLorentzFactor !== null) {
        throw new RangeError(
          'A choked jet cannot expose an external ultra-relativistic Lorentz factor.',
        );
      }
    }
  }
}

function assertNullableRange(
  value: number | null,
  min: number,
  max: number,
  name: string,
): void {
  if (value === null) return;
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name} must be finite and in [${min}, ${max}].`);
  }
}
