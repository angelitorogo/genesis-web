import {
  PlanetType,
} from './planet-type';

import {
  GiantMoonArchitectureRegime,
  giantMoonArchitectureRegimeV1,
} from './giant-moon-architecture-regime';

import {
  isGiantPlanetTypeV1,
} from './giant-moon-state';

/**
 * Point-21.7 system-level specialization for gas/ice-giant moon populations.
 *
 * Relevant regular moons remain individually materialized; the large remaining
 * point-21.2 minor population is summarized as estimated regular vs irregular/
 * captured small satellites. These are integer bookkeeping estimates only, not
 * individually generated moons.
 */
export class GiantMoonSystemProfile {

  constructor(
    readonly hostPlanetOrdinal:
      number,

    readonly sourcePlanetType:
      PlanetType,

    readonly sourceMoonCount:
      number,

    readonly sourceRelevantMoonCount:
      number,

    readonly sourceUnmaterializedMinorMoonCount:
      number,

    readonly sourceSatelliteCapacityIndex01:
      number,

    readonly regularRelevantMoonCount:
      number,

    readonly largeRelevantMoonCount:
      number,

    readonly iceRichRelevantMoonCount:
      number,

    readonly oceanBearingRelevantMoonCount:
      number,

    readonly tidallyActiveRelevantMoonCount:
      number,

    readonly potentiallyHabitableRelevantMoonCount:
      number,

    readonly estimatedRegularMinorMoonCount:
      number,

    readonly estimatedIrregularMinorMoonCount:
      number,

    readonly richnessIndex01:
      number,

    readonly architectureRegime:
      GiantMoonArchitectureRegime,
  ) {
    assertPositiveInteger(
      hostPlanetOrdinal,
      'hostPlanetOrdinal',
    );

    for (
      const [
        label,
        value,
      ] of [
        ['sourceMoonCount', sourceMoonCount],
        ['sourceRelevantMoonCount', sourceRelevantMoonCount],
        ['sourceUnmaterializedMinorMoonCount', sourceUnmaterializedMinorMoonCount],
        ['regularRelevantMoonCount', regularRelevantMoonCount],
        ['largeRelevantMoonCount', largeRelevantMoonCount],
        ['iceRichRelevantMoonCount', iceRichRelevantMoonCount],
        ['oceanBearingRelevantMoonCount', oceanBearingRelevantMoonCount],
        ['tidallyActiveRelevantMoonCount', tidallyActiveRelevantMoonCount],
        ['potentiallyHabitableRelevantMoonCount', potentiallyHabitableRelevantMoonCount],
        ['estimatedRegularMinorMoonCount', estimatedRegularMinorMoonCount],
        ['estimatedIrregularMinorMoonCount', estimatedIrregularMinorMoonCount],
      ] as const
    ) {
      assertNonNegativeInteger(
        value,
        label,
      );
    }

    assertUnitInterval(
      sourceSatelliteCapacityIndex01,
      'sourceSatelliteCapacityIndex01',
    );

    assertUnitInterval(
      richnessIndex01,
      'richnessIndex01',
    );

    if (
      sourceRelevantMoonCount +
        sourceUnmaterializedMinorMoonCount !==
      sourceMoonCount
    ) {
      throw new RangeError(
        'GiantMoonSystemProfile source counts must preserve the point-21.2/21.3 population split.',
      );
    }

    const giantHost =
      isGiantPlanetTypeV1(
        sourcePlanetType,
      );

    if (
      giantHost &&
      estimatedRegularMinorMoonCount +
        estimatedIrregularMinorMoonCount !==
      sourceUnmaterializedMinorMoonCount
    ) {
      throw new RangeError(
        'GiantMoonSystemProfile estimated minor counts must sum to the unmaterialized point-21.2 minor population.',
      );
    }

    if (
      !giantHost &&
      (
        regularRelevantMoonCount !==
          0 ||
        largeRelevantMoonCount !==
          0 ||
        iceRichRelevantMoonCount !==
          0 ||
        oceanBearingRelevantMoonCount !==
          0 ||
        tidallyActiveRelevantMoonCount !==
          0 ||
        potentiallyHabitableRelevantMoonCount !==
          0 ||
        estimatedRegularMinorMoonCount !==
          0 ||
        estimatedIrregularMinorMoonCount !==
          0 ||
        richnessIndex01 !==
          0
      )
    ) {
      throw new RangeError(
        'Non-giant hosts cannot expose giant-moon specialization counts or richness.',
      );
    }

    if (
      giantHost &&
      regularRelevantMoonCount !==
      sourceRelevantMoonCount
    ) {
      throw new RangeError(
        'Point-21.7 relevant moons of giant hosts must remain the regular population materialized by point 21.3.',
      );
    }

    for (
      const specializedCount of [
        largeRelevantMoonCount,
        iceRichRelevantMoonCount,
        oceanBearingRelevantMoonCount,
        tidallyActiveRelevantMoonCount,
        potentiallyHabitableRelevantMoonCount,
      ]
    ) {
      if (
        specializedCount >
        regularRelevantMoonCount
      ) {
        throw new RangeError(
          'GiantMoonSystemProfile specialized relevant-moon counts cannot exceed regularRelevantMoonCount.',
        );
      }
    }

    if (
      architectureRegime !==
      giantMoonArchitectureRegimeV1(
        giantHost,
        sourceMoonCount,
        richnessIndex01,
      )
    ) {
      throw new RangeError(
        'GiantMoonSystemProfile architectureRegime must match the point-21.7 richness classifier.',
      );
    }
  }

  get isApplicable():
    boolean {

    return isGiantPlanetTypeV1(
      this
        .sourcePlanetType,
    );
  }

  get hasIrregularMinorPopulation():
    boolean {

    return this
      .estimatedIrregularMinorMoonCount >
      0;
  }
}

function assertPositiveInteger(
  value:
    number,

  label:
    string,
): void {
  if (
    !Number.isInteger(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${label} must be a positive integer.`,
    );
  }
}

function assertNonNegativeInteger(
  value:
    number,

  label:
    string,
): void {
  if (
    !Number.isInteger(
      value,
    ) ||
    value <
      0
  ) {
    throw new RangeError(
      `${label} must be a non-negative integer.`,
    );
  }
}

function assertUnitInterval(
  value:
    number,

  label:
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
      `${label} must be finite in [0, 1].`,
    );
  }
}
