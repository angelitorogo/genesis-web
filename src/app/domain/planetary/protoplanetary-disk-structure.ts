import {
  ProtoplanetaryCondensationRegion,
} from './protoplanetary-condensation-region';

import {
  ProtoplanetaryCondensationRegionKind,
} from './protoplanetary-condensation-region-kind';

import {
  ProtoplanetaryDiskGap,
} from './protoplanetary-disk-gap';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-17.3 internal radial/compositional structure derived from the frozen
 * point-17.2 bulk disk envelope.
 *
 * The structure partitions the total primordial reservoir into gas and dust,
 * records non-planetary annular depletions and tiles the complete radial disk
 * into coarse condensation regimes. It does not materialize protoplanets.
 */
export class ProtoplanetaryDiskStructure {

  readonly gaps:
    readonly ProtoplanetaryDiskGap[];

  readonly condensationRegions:
    readonly ProtoplanetaryCondensationRegion[];

  constructor(
    readonly sourceDiskMassSolar:
      number,

    readonly sourceInnerRadiusAu:
      number,

    readonly sourceOuterRadiusAu:
      number,

    readonly gasMassSolar:
      number,

    readonly dustMassSolar:
      number,

    readonly gasMassFraction01:
      number,

    readonly dustMassFraction01:
      number,

    readonly dustToGasMassRatio:
      number,

    readonly gasDepletionIndex01:
      number,

    readonly dustSettlingIndex01:
      number,

    readonly temperaturePowerLawExponent:
      number,

    gaps:
      readonly ProtoplanetaryDiskGap[],

    condensationRegions:
      readonly ProtoplanetaryCondensationRegion[],
  ) {
    assertPositiveFinite(
      sourceDiskMassSolar,
      'sourceDiskMassSolar',
    );

    assertPositiveFinite(
      sourceInnerRadiusAu,
      'sourceInnerRadiusAu',
    );

    assertPositiveFinite(
      sourceOuterRadiusAu,
      'sourceOuterRadiusAu',
    );

    if (
      sourceInnerRadiusAu >=
      sourceOuterRadiusAu
    ) {
      throw new RangeError(
        'sourceInnerRadiusAu must be below sourceOuterRadiusAu.',
      );
    }

    assertNonNegativeFinite(
      gasMassSolar,
      'gasMassSolar',
    );

    assertNonNegativeFinite(
      dustMassSolar,
      'dustMassSolar',
    );

    if (
      !approximatelyEqual(
        gasMassSolar +
          dustMassSolar,
        sourceDiskMassSolar,
      )
    ) {
      throw new RangeError(
        'gasMassSolar + dustMassSolar must equal sourceDiskMassSolar.',
      );
    }

    assertNormalized(
      gasMassFraction01,
      'gasMassFraction01',
    );

    assertNormalized(
      dustMassFraction01,
      'dustMassFraction01',
    );

    if (
      !approximatelyEqual(
        gasMassFraction01 +
          dustMassFraction01,
        1,
      )
    ) {
      throw new RangeError(
        'gasMassFraction01 + dustMassFraction01 must equal 1.',
      );
    }

    if (
      !approximatelyEqual(
        gasMassFraction01,
        gasMassSolar /
          sourceDiskMassSolar,
      ) ||
      !approximatelyEqual(
        dustMassFraction01,
        dustMassSolar /
          sourceDiskMassSolar,
      )
    ) {
      throw new RangeError(
        'Gas/dust mass fractions must match the corresponding component masses.',
      );
    }

    assertNonNegativeFinite(
      dustToGasMassRatio,
      'dustToGasMassRatio',
    );

    const expectedDustToGas =
      gasMassSolar ===
        0
        ? 0
        : dustMassSolar /
          gasMassSolar;

    if (
      !approximatelyEqual(
        dustToGasMassRatio,
        expectedDustToGas,
      )
    ) {
      throw new RangeError(
        'dustToGasMassRatio must match dustMassSolar / gasMassSolar.',
      );
    }

    assertNormalized(
      gasDepletionIndex01,
      'gasDepletionIndex01',
    );

    assertNormalized(
      dustSettlingIndex01,
      'dustSettlingIndex01',
    );

    if (
      !Number.isFinite(
        temperaturePowerLawExponent,
      ) ||
      temperaturePowerLawExponent <
        0.35 ||
      temperaturePowerLawExponent >
        0.75
    ) {
      throw new RangeError(
        'temperaturePowerLawExponent must be finite and in [0.35, 0.75].',
      );
    }

    validateGaps(
      gaps,
      sourceInnerRadiusAu,
      sourceOuterRadiusAu,
    );

    validateCondensationRegions(
      condensationRegions,
      sourceInnerRadiusAu,
      sourceOuterRadiusAu,
    );

    this.gaps =
      Object.freeze([
        ...gaps,
      ]);

    this.condensationRegions =
      Object.freeze([
        ...condensationRegions,
      ]);
  }

  get hasGaps():
    boolean {

    return (
      this.gaps.length >
      0
    );
  }

  get isGasDominated():
    boolean {

    return (
      this.gasMassFraction01 >
      0.5
    );
  }

  get waterSnowLineRadiusAuOrNull():
    number | null {

    const waterIceRegion =
      this.condensationRegions
        .find(
          region =>
            region.kind ===
            ProtoplanetaryCondensationRegionKind.WATER_ICE_RICH_SOLIDS,
        );

    return (
      waterIceRegion
        ?.innerRadiusAu ??
      null
    );
  }
}

function validateGaps(
  gaps:
    readonly ProtoplanetaryDiskGap[],

  innerRadiusAu:
    number,

  outerRadiusAu:
    number,
): void {

  let previousOuterRadiusAu =
    innerRadiusAu;

  for (
    const gap
    of gaps
  ) {
    if (
      gap.innerRadiusAu <
        innerRadiusAu -
          CONSISTENCY_TOLERANCE ||
      gap.outerRadiusAu >
        outerRadiusAu +
          CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'Every protoplanetary-disk gap must remain inside the source disk envelope.',
      );
    }

    if (
      gap.innerRadiusAu <
      previousOuterRadiusAu -
        CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'Protoplanetary-disk gaps must be sorted and non-overlapping.',
      );
    }

    previousOuterRadiusAu =
      gap.outerRadiusAu;
  }
}

function validateCondensationRegions(
  regions:
    readonly ProtoplanetaryCondensationRegion[],

  innerRadiusAu:
    number,

  outerRadiusAu:
    number,
): void {

  if (
    regions.length ===
    0
  ) {
    throw new RangeError(
      'At least one condensation region must tile the source disk.',
    );
  }

  if (
    !approximatelyEqual(
      regions[0]
        .innerRadiusAu,
      innerRadiusAu,
    ) ||
    !approximatelyEqual(
      regions[
        regions.length -
        1
      ].outerRadiusAu,
      outerRadiusAu,
    )
  ) {
    throw new RangeError(
      'Condensation regions must cover the complete source disk envelope.',
    );
  }

  for (
    let index = 0;
    index < regions.length;
    index += 1
  ) {
    const region =
      regions[index];

    if (
      region.innerRadiusAu <
        innerRadiusAu -
          CONSISTENCY_TOLERANCE ||
      region.outerRadiusAu >
        outerRadiusAu +
          CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'Every condensation region must remain inside the source disk envelope.',
      );
    }

    if (
      index >
      0
    ) {
      const previous =
        regions[
          index -
          1
        ];

      if (
        !approximatelyEqual(
          previous.outerRadiusAu,
          region.innerRadiusAu,
        )
      ) {
        throw new RangeError(
          'Condensation regions must be contiguous and ordered radially.',
        );
      }

      if (
        region
          .kind
          .condensableSolidFraction01 <
        previous
          .kind
          .condensableSolidFraction01
      ) {
        throw new RangeError(
          'Condensable-solid availability must not decrease radially outward in V1.',
        );
      }
    }
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
      `${propertyName} must be finite and in range [0, 1]: ${value}.`,
    );
  }
}

function approximatelyEqual(
  first:
    number,

  second:
    number,
): boolean {

  const scale =
    Math.max(
      1,
      Math.abs(
        first,
      ),
      Math.abs(
        second,
      ),
    );

  return (
    Math.abs(
      first -
      second,
    ) <=
    CONSISTENCY_TOLERANCE *
      scale
  );
}
