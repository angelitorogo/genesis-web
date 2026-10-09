import { type StellarActivityProfile } from '../stellar/stellar-activity-profile';

export const GreatStellarFlareSourceKind = Object.freeze({
  ORDINARY_STAR: 'ORDINARY_STAR',
  BROWN_DWARF: 'BROWN_DWARF',
  COMPACT_REMNANT_BOUNDARY: 'COMPACT_REMNANT_BOUNDARY',
} as const);

export type GreatStellarFlareSourceKind =
  typeof GreatStellarFlareSourceKind[keyof typeof GreatStellarFlareSourceKind];

export const GreatStellarFlareEventState = Object.freeze({
  EXPLICIT_LARGE_FLARE: 'EXPLICIT_LARGE_FLARE',
  STATISTICAL_ACTIVITY_ONLY: 'STATISTICAL_ACTIVITY_ONLY',
  ORDINARY_FLARE_MODEL_NOT_APPLICABLE: 'ORDINARY_FLARE_MODEL_NOT_APPLICABLE',
} as const);

export type GreatStellarFlareEventState =
  typeof GreatStellarFlareEventState[keyof typeof GreatStellarFlareEventState];

/**
 * 29.9 explicit source-frame input for an individual large ordinary stellar flare.
 *
 * Point 15.4 remains the source of statistical magnetic-activity context. Its
 * average rate and typical/maximum energies are not an event schedule. 29.9 only
 * materializes an event when energy and duration are supplied explicitly.
 * Compact remnants remain outside this ordinary photospheric/chromospheric flare
 * contract; magnetar bursts and accretion phenomena keep their dedicated models.
 */
export class GreatStellarFlareSourceProfile {
  constructor(
    readonly sourceKind: GreatStellarFlareSourceKind,
    readonly sourceLabel: string,
    readonly stellarRadiusSolar: number | null,
    readonly stellarLuminositySolar: number | null,
    readonly activityProfile: StellarActivityProfile,
    readonly eventState: GreatStellarFlareEventState,
    readonly flareEnergyJoules: number | null,
    readonly sourceFrameDurationSeconds: number | null,
  ) {
    if (!Object.values(GreatStellarFlareSourceKind).includes(sourceKind)) {
      throw new RangeError('Unsupported 29.9 stellar-flare source kind.');
    }
    if (!Object.values(GreatStellarFlareEventState).includes(eventState)) {
      throw new RangeError('Unsupported 29.9 stellar-flare event state.');
    }
    if (sourceLabel.trim().length === 0) {
      throw new RangeError('sourceLabel must not be blank.');
    }

    const applicable = activityProfile.ordinaryFlareModelApplicable;
    const compactBoundary = sourceKind === GreatStellarFlareSourceKind.COMPACT_REMNANT_BOUNDARY;
    const notApplicable =
      eventState === GreatStellarFlareEventState.ORDINARY_FLARE_MODEL_NOT_APPLICABLE;

    if (compactBoundary !== notApplicable) {
      throw new RangeError(
        'Compact-remnant boundaries must use ORDINARY_FLARE_MODEL_NOT_APPLICABLE and vice versa.',
      );
    }

    if (notApplicable) {
      if (applicable) {
        throw new RangeError('A non-applicable 29.9 source requires a non-applicable point-15.4 profile.');
      }
      if (
        stellarRadiusSolar !== null ||
        stellarLuminositySolar !== null ||
        flareEnergyJoules !== null ||
        sourceFrameDurationSeconds !== null
      ) {
        throw new RangeError(
          'A compact-remnant boundary cannot leak ordinary stellar-flare event quantities.',
        );
      }
      Object.freeze(this);
      return;
    }

    if (!applicable) {
      throw new RangeError('An ordinary 29.9 stellar flare requires an applicable point-15.4 profile.');
    }

    assertPositive(stellarRadiusSolar, 'stellarRadiusSolar');
    assertPositive(stellarLuminositySolar, 'stellarLuminositySolar');

    if (eventState === GreatStellarFlareEventState.STATISTICAL_ACTIVITY_ONLY) {
      if (flareEnergyJoules !== null || sourceFrameDurationSeconds !== null) {
        throw new RangeError('Statistical activity alone must not fabricate an individual flare event.');
      }
      Object.freeze(this);
      return;
    }

    assertPositive(flareEnergyJoules, 'flareEnergyJoules');
    assertPositive(sourceFrameDurationSeconds, 'sourceFrameDurationSeconds');

    const typical = activityProfile.typicalFlareEnergyJoules;
    const maximum = activityProfile.maximumFlareEnergyJoules;
    if (typical === null || maximum === null) {
      throw new RangeError('An explicit 29.9 flare requires point-15.4 energy statistics.');
    }
    if (flareEnergyJoules < typical) {
      throw new RangeError('A 29.9 large flare must be at least as energetic as the point-15.4 typical flare.');
    }
    if (flareEnergyJoules > maximum) {
      throw new RangeError('An explicit 29.9 flare cannot exceed the source point-15.4 maximum flare energy.');
    }

    Object.freeze(this);
  }
}

function assertPositive(
  value: number | null,
  propertyName: string,
): asserts value is number {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${propertyName} must be finite and greater than 0.`);
  }
}
