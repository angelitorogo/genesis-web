import {
  AsteroidBeltRegion,
} from './asteroid-belt-region';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-22.2 statistical description of one candidate minor-body belt.
 *
 * The profile deliberately remains population-level only. No asteroid identity,
 * seed, composition class or discoverability state exists here; points 22.3,
 * 22.4 and 22.10 own those products.
 */
export class AsteroidBeltPopulationProfile {

  constructor(
    readonly region:
      AsteroidBeltRegion,

    readonly sourceResidualDustMassEarth:
      number,

    readonly exists:
      boolean,

    readonly innerEdgeAu:
      number | null,

    readonly outerEdgeAu:
      number | null,

    readonly peakAu:
      number | null,

    readonly widthAu:
      number | null,

    readonly retainedMassEarth:
      number,

    readonly populationIndex01:
      number,
  ) {
    if (
      !Object.values(
        AsteroidBeltRegion,
      ).includes(
        region,
      )
    ) {
      throw new RangeError(
        'region must be a known AsteroidBeltRegion.',
      );
    }

    assertNonNegativeFinite(
      sourceResidualDustMassEarth,
      'sourceResidualDustMassEarth',
    );

    assertNonNegativeFinite(
      retainedMassEarth,
      'retainedMassEarth',
    );

    assertUnitInterval(
      populationIndex01,
      'populationIndex01',
    );

    if (
      retainedMassEarth -
        sourceResidualDustMassEarth >
      CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'retainedMassEarth cannot exceed the inherited residual-dust reservoir.',
      );
    }

    if (
      !exists
    ) {
      if (
        innerEdgeAu !==
          null ||
        outerEdgeAu !==
          null ||
        peakAu !==
          null ||
        widthAu !==
          null ||
        retainedMassEarth !==
          0 ||
        populationIndex01 !==
          0
      ) {
        throw new RangeError(
          'A non-existent point-22.2 belt must expose null radial geometry and zero population.',
        );
      }

      return;
    }

    if (
      innerEdgeAu ===
        null ||
      outerEdgeAu ===
        null ||
      peakAu ===
        null ||
      widthAu ===
        null
    ) {
      throw new RangeError(
        'An existing point-22.2 belt requires complete radial geometry.',
      );
    }

    assertPositiveFinite(
      innerEdgeAu,
      'innerEdgeAu',
    );

    assertPositiveFinite(
      outerEdgeAu,
      'outerEdgeAu',
    );

    assertPositiveFinite(
      peakAu,
      'peakAu',
    );

    assertPositiveFinite(
      widthAu,
      'widthAu',
    );

    if (
      innerEdgeAu >=
      outerEdgeAu
    ) {
      throw new RangeError(
        'innerEdgeAu must be below outerEdgeAu.',
      );
    }

    if (
      peakAu <
        innerEdgeAu ||
      peakAu >
        outerEdgeAu
    ) {
      throw new RangeError(
        'peakAu must lie inside the belt radial interval.',
      );
    }

    if (
      Math.abs(
        widthAu -
          (
            outerEdgeAu -
            innerEdgeAu
          ),
      ) >
      CONSISTENCY_TOLERANCE *
        Math.max(
          1,
          Math.abs(
            widthAu,
          ),
        )
    ) {
      throw new RangeError(
        'widthAu must equal outerEdgeAu - innerEdgeAu.',
      );
    }

    if (
      retainedMassEarth <=
        0 ||
      populationIndex01 <=
        0
    ) {
      throw new RangeError(
        'An existing point-22.2 belt requires positive retained mass and population index.',
      );
    }
  }
}

function assertPositiveFinite(
  value:
    number,

  name:
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
      `${name} must be positive and finite.`,
    );
  }
}

function assertNonNegativeFinite(
  value:
    number,

  name:
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
      `${name} must be non-negative and finite.`,
    );
  }
}

function assertUnitInterval(
  value:
    number,

  name:
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
      `${name} must be finite and belong to [0, 1].`,
    );
  }
}
