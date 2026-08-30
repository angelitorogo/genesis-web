import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  type AtmosphereGreenhouseGasContribution,
} from './atmosphere-greenhouse-gas-contribution';

import {
  AtmosphereGreenhouseRegime,
  atmosphereGreenhouseRegimeForOpticalDepthProxy,
} from './atmosphere-greenhouse-regime';

import {
  AtmospherePressureRegime,
} from './atmosphere-pressure-regime';

import {
  AtmosphereRetentionRegime,
} from './atmosphere-retention-regime';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-20.4 approximate retained-atmosphere greenhouse state.
 *
 * This is intentionally not a climate temperature. infraredOpticalDepthProxy,
 * longwaveTrappingFraction01 and temperatureAmplificationFactor are dimensionless
 * handoff quantities for point 20.5. The latter is null for deep-envelope worlds
 * because phase 19 defines no solid surface whose temperature could be amplified.
 */
export class AtmosphereGreenhouseEffect {

  readonly greenhouseGasContributions:
    readonly AtmosphereGreenhouseGasContribution[];

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly sourceRetentionRegime:
      AtmosphereRetentionRegime,

    readonly sourceRetainedPressureRegime:
      AtmospherePressureRegime,

    readonly sourceRetainedSurfacePressurePascal:
      number | null,

    readonly sourceRetainedMoleInventoryFraction01:
      number,

    readonly sourceReferenceMeanInsolationEarth:
      number,

    readonly sourceReferenceBondAlbedo01:
      number,

    readonly greenhouseActiveMoleFraction01:
      number,

    readonly weightedGreenhouseMoleFraction:
      number,

    readonly pressureBroadeningFactor:
      number,

    readonly weightedGreenhouseColumnPascal:
      number | null,

    readonly infraredOpticalDepthProxy:
      number,

    readonly longwaveTrappingFraction01:
      number,

    readonly temperatureAmplificationFactor:
      number | null,

    readonly regime:
      AtmosphereGreenhouseRegime,

    greenhouseGasContributions:
      readonly AtmosphereGreenhouseGasContribution[],
  ) {
    if (
      !Number.isInteger(
        planetOrdinal,
      ) ||
      planetOrdinal <=
        0
    ) {
      throw new RangeError(
        'planetOrdinal must be a positive integer.',
      );
    }

    if (
      bodyLocator.bodyIndex !==
      BigInt(
        planetOrdinal -
          1,
      )
    ) {
      throw new RangeError(
        'Point-20.4 greenhouse effect must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'AtmosphereGreenhouseEffect requires a BodySeed.',
      );
    }

    if (
      !Object.values(
        AtmosphereRetentionRegime,
      ).includes(
        sourceRetentionRegime,
      )
    ) {
      throw new RangeError(
        'sourceRetentionRegime must be a known AtmosphereRetentionRegime.',
      );
    }

    if (
      !Object.values(
        AtmospherePressureRegime,
      ).includes(
        sourceRetainedPressureRegime,
      )
    ) {
      throw new RangeError(
        'sourceRetainedPressureRegime must be a known AtmospherePressureRegime.',
      );
    }

    assertNormalized(
      sourceRetainedMoleInventoryFraction01,
      'sourceRetainedMoleInventoryFraction01',
    );

    assertPositiveFinite(
      sourceReferenceMeanInsolationEarth,
      'sourceReferenceMeanInsolationEarth',
    );

    assertNormalized(
      sourceReferenceBondAlbedo01,
      'sourceReferenceBondAlbedo01',
    );

    assertNormalized(
      greenhouseActiveMoleFraction01,
      'greenhouseActiveMoleFraction01',
    );

    assertNonNegativeFinite(
      weightedGreenhouseMoleFraction,
      'weightedGreenhouseMoleFraction',
    );

    assertNonNegativeFinite(
      pressureBroadeningFactor,
      'pressureBroadeningFactor',
    );

    assertNonNegativeFinite(
      infraredOpticalDepthProxy,
      'infraredOpticalDepthProxy',
    );

    assertNormalized(
      longwaveTrappingFraction01,
      'longwaveTrappingFraction01',
    );

    validateUniqueContributions(
      greenhouseGasContributions,
    );

    const contributionMoleFraction =
      greenhouseGasContributions.reduce(
        (
          total,
          contribution,
        ) =>
          total +
          contribution.retainedMoleFraction01,
        0,
      );

    const contributionWeightedFraction =
      greenhouseGasContributions.reduce(
        (
          total,
          contribution,
        ) =>
          total +
          contribution.weightedMoleFraction,
        0,
      );

    if (
      !approximatelyEqual(
        greenhouseActiveMoleFraction01,
        contributionMoleFraction,
      ) ||
      !approximatelyEqual(
        weightedGreenhouseMoleFraction,
        contributionWeightedFraction,
      )
    ) {
      throw new RangeError(
        'Point-20.4 greenhouse totals must match greenhouseGasContributions.',
      );
    }

    const expectedTrappingFraction =
      greenhouseLongwaveTrappingFraction01(
        infraredOpticalDepthProxy,
      );

    if (
      !approximatelyEqual(
        longwaveTrappingFraction01,
        expectedTrappingFraction,
      )
    ) {
      throw new RangeError(
        'longwaveTrappingFraction01 must match the frozen V1 optical-depth proxy relation.',
      );
    }

    const isVacuum =
      sourceRetentionRegime ===
        AtmosphereRetentionRegime.VACUUM;

    const isDeepEnvelope =
      sourceRetentionRegime ===
        AtmosphereRetentionRegime.DEEP_ENVELOPE;

    if (
      isVacuum
    ) {
      validateVacuumGreenhouseState(
        sourceRetainedPressureRegime,
        sourceRetainedSurfacePressurePascal,
        sourceRetainedMoleInventoryFraction01,
        greenhouseActiveMoleFraction01,
        weightedGreenhouseMoleFraction,
        pressureBroadeningFactor,
        weightedGreenhouseColumnPascal,
        infraredOpticalDepthProxy,
        longwaveTrappingFraction01,
        temperatureAmplificationFactor,
        regime,
        greenhouseGasContributions,
      );
    } else if (
      isDeepEnvelope
    ) {
      validateDeepEnvelopeGreenhouseState(
        sourceRetainedPressureRegime,
        sourceRetainedSurfacePressurePascal,
        sourceRetainedMoleInventoryFraction01,
        weightedGreenhouseColumnPascal,
        infraredOpticalDepthProxy,
        temperatureAmplificationFactor,
        regime,
      );
    } else {
      validateSolidSurfaceGreenhouseState(
        sourceRetainedPressureRegime,
        sourceRetainedSurfacePressurePascal,
        sourceRetainedMoleInventoryFraction01,
        weightedGreenhouseMoleFraction,
        pressureBroadeningFactor,
        weightedGreenhouseColumnPascal,
        infraredOpticalDepthProxy,
        temperatureAmplificationFactor,
        regime,
      );
    }

    this.greenhouseGasContributions =
      Object.freeze([
        ...greenhouseGasContributions,
      ]);
  }

  get hasGreenhouseActiveGas():
    boolean {

    return this
      .greenhouseGasContributions
      .length >
      0;
  }

  get isDeepEnvelopeBlanketing():
    boolean {

    return this
      .regime ===
      AtmosphereGreenhouseRegime.DEEP_ENVELOPE;
  }
}

export function greenhouseLongwaveTrappingFraction01(
  opticalDepthProxy:
    number,
): number {

  assertNonNegativeFinite(
    opticalDepthProxy,
    'opticalDepthProxy',
  );

  return opticalDepthProxy /
    (
      1 +
      opticalDepthProxy
    );
}

export function greenhouseTemperatureAmplificationFactor(
  opticalDepthProxy:
    number,
): number {

  assertNonNegativeFinite(
    opticalDepthProxy,
    'opticalDepthProxy',
  );

  return Math.pow(
    1 +
      0.75 *
        opticalDepthProxy,
    0.25,
  );
}

function validateVacuumGreenhouseState(
  sourceRetainedPressureRegime:
    AtmospherePressureRegime,
  sourceRetainedSurfacePressurePascal:
    number | null,
  sourceRetainedMoleInventoryFraction01:
    number,
  greenhouseActiveMoleFraction01:
    number,
  weightedGreenhouseMoleFraction:
    number,
  pressureBroadeningFactor:
    number,
  weightedGreenhouseColumnPascal:
    number | null,
  infraredOpticalDepthProxy:
    number,
  longwaveTrappingFraction01:
    number,
  temperatureAmplificationFactor:
    number | null,
  regime:
    AtmosphereGreenhouseRegime,
  contributions:
    readonly AtmosphereGreenhouseGasContribution[],
): void {

  if (
    sourceRetainedPressureRegime !==
      AtmospherePressureRegime.VACUUM ||
    sourceRetainedSurfacePressurePascal !==
      0 ||
    sourceRetainedMoleInventoryFraction01 !==
      0 ||
    greenhouseActiveMoleFraction01 !==
      0 ||
    weightedGreenhouseMoleFraction !==
      0 ||
    pressureBroadeningFactor !==
      0 ||
    weightedGreenhouseColumnPascal !==
      0 ||
    infraredOpticalDepthProxy !==
      0 ||
    longwaveTrappingFraction01 !==
      0 ||
    temperatureAmplificationFactor !==
      1 ||
    regime !==
      AtmosphereGreenhouseRegime.NONE ||
    contributions.length !==
      0
  ) {
    throw new RangeError(
      'A point-20.4 vacuum requires a zero greenhouse state and temperatureAmplificationFactor = 1.',
    );
  }
}

function validateDeepEnvelopeGreenhouseState(
  sourceRetainedPressureRegime:
    AtmospherePressureRegime,
  sourceRetainedSurfacePressurePascal:
    number | null,
  sourceRetainedMoleInventoryFraction01:
    number,
  weightedGreenhouseColumnPascal:
    number | null,
  infraredOpticalDepthProxy:
    number,
  temperatureAmplificationFactor:
    number | null,
  regime:
    AtmosphereGreenhouseRegime,
): void {

  if (
    sourceRetainedPressureRegime !==
      AtmospherePressureRegime.DEEP_ENVELOPE ||
    sourceRetainedSurfacePressurePascal !==
      null ||
    sourceRetainedMoleInventoryFraction01 <=
      0 ||
    weightedGreenhouseColumnPascal !==
      null ||
    infraredOpticalDepthProxy <
      4 ||
    temperatureAmplificationFactor !==
      null ||
    regime !==
      AtmosphereGreenhouseRegime.DEEP_ENVELOPE
  ) {
    throw new RangeError(
      'Point-20.4 deep-envelope worlds require strong blanketing semantics without a solid-surface temperature amplification.',
    );
  }
}

function validateSolidSurfaceGreenhouseState(
  sourceRetainedPressureRegime:
    AtmospherePressureRegime,
  sourceRetainedSurfacePressurePascal:
    number | null,
  sourceRetainedMoleInventoryFraction01:
    number,
  weightedGreenhouseMoleFraction:
    number,
  pressureBroadeningFactor:
    number,
  weightedGreenhouseColumnPascal:
    number | null,
  infraredOpticalDepthProxy:
    number,
  temperatureAmplificationFactor:
    number | null,
  regime:
    AtmosphereGreenhouseRegime,
): void {

  if (
    sourceRetainedPressureRegime ===
      AtmospherePressureRegime.VACUUM ||
    sourceRetainedPressureRegime ===
      AtmospherePressureRegime.DEEP_ENVELOPE ||
    sourceRetainedSurfacePressurePascal ===
      null ||
    sourceRetainedSurfacePressurePascal <=
      0 ||
    sourceRetainedMoleInventoryFraction01 <=
      0 ||
    weightedGreenhouseColumnPascal ===
      null ||
    temperatureAmplificationFactor ===
      null
  ) {
    throw new RangeError(
      'Point-20.4 solid-surface greenhouse states require retained surface pressure and a finite amplification factor.',
    );
  }

  const expectedColumn =
    sourceRetainedSurfacePressurePascal *
    weightedGreenhouseMoleFraction;

  if (
    !approximatelyEqual(
      weightedGreenhouseColumnPascal,
      expectedColumn,
    )
  ) {
    throw new RangeError(
      'weightedGreenhouseColumnPascal must preserve the retained pressure times weighted greenhouse mole fraction.',
    );
  }

  if (
    pressureBroadeningFactor <=
      0
  ) {
    throw new RangeError(
      'A non-vacuum solid-surface atmosphere requires a positive pressureBroadeningFactor.',
    );
  }

  const expectedAmplification =
    greenhouseTemperatureAmplificationFactor(
      infraredOpticalDepthProxy,
    );

  if (
    !approximatelyEqual(
      temperatureAmplificationFactor,
      expectedAmplification,
    )
  ) {
    throw new RangeError(
      'temperatureAmplificationFactor must match the frozen V1 grey-atmosphere proxy relation.',
    );
  }

  const expectedRegime =
    atmosphereGreenhouseRegimeForOpticalDepthProxy(
      infraredOpticalDepthProxy,
      false,
    );

  if (
    regime !==
      expectedRegime
  ) {
    throw new RangeError(
      'Point-20.4 greenhouse regime must match infraredOpticalDepthProxy.',
    );
  }
}

function validateUniqueContributions(
  contributions:
    readonly AtmosphereGreenhouseGasContribution[],
): void {

  const unique =
    new Set(
      contributions.map(
        contribution =>
          contribution.gas,
      ),
    );

  if (
    unique.size !==
    contributions.length
  ) {
    throw new RangeError(
      'Point-20.4 greenhouse gas contributions cannot contain duplicate species.',
    );
  }
}

function assertNormalized(
  value:
    number,
  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${propertyName} must be finite and in [0, 1]: ${value}.`,
    );
  }
}

function assertPositiveFinite(
  value:
    number,
  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and greater than 0: ${value}.`,
    );
  }
}

function assertNonNegativeFinite(
  value:
    number,
  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and non-negative: ${value}.`,
    );
  }
}

function approximatelyEqual(
  left:
    number,
  right:
    number,
): boolean {

  const scale =
    Math.max(
      1,
      Math.abs(
        left,
      ),
      Math.abs(
        right,
      ),
    );

  return (
    Math.abs(
      left -
      right,
    ) <=
    CONSISTENCY_TOLERANCE *
      scale
  );
}
