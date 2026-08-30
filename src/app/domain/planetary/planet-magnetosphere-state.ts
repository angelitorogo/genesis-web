import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetGeologyRegime,
} from './planet-geology-regime';

import {
  PlanetMagneticFieldRegime,
  planetMagneticFieldRegimeForIndex01,
} from './planet-magnetic-field-regime';

import {
  PlanetMagnetosphereRegime,
  planetMagnetosphereRegimeForState,
} from './planet-magnetosphere-regime';

import {
  PlanetType,
} from './planet-type';

const SUSTAINED_DYNAMO_THRESHOLD =
  0.35;

/**
 * Point-20.9 deterministic planetary magnetic-field / magnetosphere state.
 *
 * V1 keeps dimensionless, auditable proxies rather than inventing gauss/tesla,
 * exact dipole moments, magnetic-axis tilts or magnetopause distances. The
 * output distinguishes an intrinsic sustained dynamo from an induced
 * wind/ionosphere obstacle. Surface particle dose remains point 20.10.
 */
export class PlanetMagnetosphereState {

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly sourcePlanetType:
      PlanetType,

    readonly sourceMassEarth:
      number,

    readonly sourceRadiusEarth:
      number,

    readonly sourceRotationPeriodHours:
      number,

    readonly sourceIsTidallySynchronized:
      boolean,

    readonly sourceMetallicCoreMassFraction01:
      number,

    readonly sourceGaseousEnvelopeMassFraction01:
      number,

    readonly sourceIceBearingInteriorFraction01:
      number,

    readonly sourceReferenceMeanInsolationEarth:
      number,

    readonly sourceRetainedSurfacePressurePascal:
      number | null,

    readonly sourceGeologyRegime:
      PlanetGeologyRegime,

    readonly sourceInternalHeatRetentionIndex01:
      number | null,

    readonly sourceGeologicalActivityIndex01:
      number | null,

    readonly sourceTidalHeatingIndex01:
      number | null,

    readonly conductiveDynamoMaterialIndex01:
      number,

    readonly convectivePowerIndex01:
      number,

    readonly rotationDynamoEfficiency01:
      number,

    readonly dynamoPotentialIndex01:
      number,

    readonly intrinsicMagneticFieldIndex01:
      number,

    readonly stellarWindPressureProxyEarth:
      number,

    readonly inducedMagnetospherePotentialIndex01:
      number,

    readonly magnetosphericProtectionIndex01:
      number,

    readonly magneticFieldRegime:
      PlanetMagneticFieldRegime,

    readonly magnetosphereRegime:
      PlanetMagnetosphereRegime,

    readonly hasSustainedDynamo:
      boolean,
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
        'Point-20.9 magnetosphere must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'PlanetMagnetosphereState requires a BodySeed.',
      );
    }

    if (
      !Object.values(
        PlanetType,
      ).includes(
        sourcePlanetType,
      )
    ) {
      throw new RangeError(
        'sourcePlanetType must be a known PlanetType.',
      );
    }

    assertPositiveFinite(
      sourceMassEarth,
      'sourceMassEarth',
    );

    assertPositiveFinite(
      sourceRadiusEarth,
      'sourceRadiusEarth',
    );

    assertPositiveFinite(
      sourceRotationPeriodHours,
      'sourceRotationPeriodHours',
    );

    assertNormalized(
      sourceMetallicCoreMassFraction01,
      'sourceMetallicCoreMassFraction01',
    );

    assertNormalized(
      sourceGaseousEnvelopeMassFraction01,
      'sourceGaseousEnvelopeMassFraction01',
    );

    assertNormalized(
      sourceIceBearingInteriorFraction01,
      'sourceIceBearingInteriorFraction01',
    );

    assertPositiveFinite(
      sourceReferenceMeanInsolationEarth,
      'sourceReferenceMeanInsolationEarth',
    );

    if (
      sourceRetainedSurfacePressurePascal !==
      null
    ) {
      assertNonNegativeFinite(
        sourceRetainedSurfacePressurePascal,
        'sourceRetainedSurfacePressurePascal',
      );
    }

    const isDeepEnvelope =
      sourcePlanetType ===
        PlanetType.MINI_NEPTUNE ||
      sourcePlanetType ===
        PlanetType.GAS_GIANT ||
      sourcePlanetType ===
        PlanetType.ICE_GIANT;

    if (
      isDeepEnvelope !==
      (
        sourceGeologyRegime ===
        PlanetGeologyRegime.DEEP_ENVELOPE
      )
    ) {
      throw new RangeError(
        'Point-20.9 must preserve the point-20.8 deep-envelope geology boundary.',
      );
    }

    if (
      isDeepEnvelope
    ) {
      if (
        sourceInternalHeatRetentionIndex01 !==
          null ||
        sourceGeologicalActivityIndex01 !==
          null ||
        sourceTidalHeatingIndex01 !==
          null
      ) {
        throw new RangeError(
          'Deep-envelope point-20.9 sources must preserve null point-20.8 solid-surface geology indices.',
        );
      }
    } else {
      for (
        const [
          propertyName,
          value,
        ]
        of [
          [
            'sourceInternalHeatRetentionIndex01',
            sourceInternalHeatRetentionIndex01,
          ],
          [
            'sourceGeologicalActivityIndex01',
            sourceGeologicalActivityIndex01,
          ],
          [
            'sourceTidalHeatingIndex01',
            sourceTidalHeatingIndex01,
          ],
        ] as const
      ) {
        if (
          value ===
          null
        ) {
          throw new RangeError(
            `${propertyName} must be defined for solid-surface point-20.9 worlds.`,
          );
        }

        assertNormalized(
          value,
          propertyName,
        );
      }
    }

    for (
      const [
        propertyName,
        value,
      ]
      of [
        [
          'conductiveDynamoMaterialIndex01',
          conductiveDynamoMaterialIndex01,
        ],
        [
          'convectivePowerIndex01',
          convectivePowerIndex01,
        ],
        [
          'rotationDynamoEfficiency01',
          rotationDynamoEfficiency01,
        ],
        [
          'dynamoPotentialIndex01',
          dynamoPotentialIndex01,
        ],
        [
          'intrinsicMagneticFieldIndex01',
          intrinsicMagneticFieldIndex01,
        ],
        [
          'inducedMagnetospherePotentialIndex01',
          inducedMagnetospherePotentialIndex01,
        ],
        [
          'magnetosphericProtectionIndex01',
          magnetosphericProtectionIndex01,
        ],
      ] as const
    ) {
      assertNormalized(
        value,
        propertyName,
      );
    }

    if (
      !Number.isFinite(
        stellarWindPressureProxyEarth,
      ) ||
      stellarWindPressureProxyEarth <
        0.01 ||
      stellarWindPressureProxyEarth >
        100
    ) {
      throw new RangeError(
        'stellarWindPressureProxyEarth must be finite and in [0.01, 100].',
      );
    }

    if (
      magneticFieldRegime !==
      planetMagneticFieldRegimeForIndex01(
        intrinsicMagneticFieldIndex01,
      )
    ) {
      throw new RangeError(
        'magneticFieldRegime must match intrinsicMagneticFieldIndex01.',
      );
    }

    const expectedSustainedDynamo =
      dynamoPotentialIndex01 >=
        SUSTAINED_DYNAMO_THRESHOLD &&
      intrinsicMagneticFieldIndex01 >=
        SUSTAINED_DYNAMO_THRESHOLD;

    if (
      hasSustainedDynamo !==
      expectedSustainedDynamo
    ) {
      throw new RangeError(
        'hasSustainedDynamo must match the frozen point-20.9 dynamo/field threshold.',
      );
    }

    const expectedMagnetosphereRegime =
      planetMagnetosphereRegimeForState(
        magnetosphericProtectionIndex01,
        hasSustainedDynamo,
        inducedMagnetospherePotentialIndex01,
      );

    if (
      magnetosphereRegime !==
      expectedMagnetosphereRegime
    ) {
      throw new RangeError(
        'magnetosphereRegime must match the point-20.9 intrinsic/induced protection state.',
      );
    }

    if (
      magnetosphereRegime ===
        PlanetMagnetosphereRegime.NONE &&
      magnetosphericProtectionIndex01 !==
        0
    ) {
      throw new RangeError(
        'A NONE magnetosphere must have zero V1 magnetospheric protection.',
      );
    }

    if (
      magnetosphereRegime ===
        PlanetMagnetosphereRegime.INDUCED &&
      magnetosphericProtectionIndex01 >
        0.22
    ) {
      throw new RangeError(
        'The V1 induced-magnetosphere protection proxy is intentionally capped at 0.22.',
      );
    }
  }

  get hasIntrinsicMagnetosphere():
    boolean {

    return this
      .hasSustainedDynamo;
  }

  get hasInducedMagnetosphere():
    boolean {

    return this
      .magnetosphereRegime ===
      PlanetMagnetosphereRegime
        .INDUCED;
  }

  get hasAnyMagnetosphere():
    boolean {

    return this
      .magnetosphereRegime !==
      PlanetMagnetosphereRegime
        .NONE;
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
