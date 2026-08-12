import {
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  ObservationInstrumentFamilyUnlockRule,
  ObservationInstrumentLevelUnlockRule,
  ObservationProgressMilestone,
  ObservationUnlockRequirement,
} from '../../domain/observation/observation-instrument-progression';

import {
  ObservationInstrumentCapabilityCatalogV1,
} from './observation-instrument-capability-catalog';

import {
  ObservationInstrumentCatalogV1,
} from './observation-instrument-catalog';

const MILESTONES_IN_CANONICAL_ORDER:
  readonly ObservationProgressMilestone[] =
  Object.freeze([
    ObservationProgressMilestone
      .FIRST_SYSTEM_DISCOVERED,

    ObservationProgressMilestone
      .FIRST_BODY_DISCOVERED,

    ObservationProgressMilestone
      .FIRST_GALACTIC_OBJECT_CATALOGUED,

    ObservationProgressMilestone
      .FIRST_TARGET_CONFIRMED,

    ObservationProgressMilestone
      .FIRST_EXTERNAL_GALAXY_DETECTED,
  ]);

const FAMILY_UNLOCK_RULES:
  readonly ObservationInstrumentFamilyUnlockRule[] =
  Object.freeze([
    new ObservationInstrumentFamilyUnlockRule(
      ObservationInstrumentType
        .OPTICAL,
      requirement(
        0n,
      ),
    ),

    new ObservationInstrumentFamilyUnlockRule(
      ObservationInstrumentType
        .INFRARED,
      requirement(
        500n,
        ObservationProgressMilestone
          .FIRST_SYSTEM_DISCOVERED,
      ),
    ),

    new ObservationInstrumentFamilyUnlockRule(
      ObservationInstrumentType
        .RADIO,
      requirement(
        1_000n,
        ObservationProgressMilestone
          .FIRST_SYSTEM_DISCOVERED,
      ),
    ),

    new ObservationInstrumentFamilyUnlockRule(
      ObservationInstrumentType
        .SPECTROSCOPY,
      requirement(
        2_500n,
        ObservationProgressMilestone
          .FIRST_SYSTEM_DISCOVERED,
        ObservationProgressMilestone
          .FIRST_BODY_DISCOVERED,
      ),
    ),

    new ObservationInstrumentFamilyUnlockRule(
      ObservationInstrumentType
        .X_RAY,
      requirement(
        5_000n,
        ObservationProgressMilestone
          .FIRST_SYSTEM_DISCOVERED,
        ObservationProgressMilestone
          .FIRST_BODY_DISCOVERED,
        ObservationProgressMilestone
          .FIRST_GALACTIC_OBJECT_CATALOGUED,
      ),
    ),

    new ObservationInstrumentFamilyUnlockRule(
      ObservationInstrumentType
        .GAMMA_RAY,
      requirement(
        7_500n,
        ObservationProgressMilestone
          .FIRST_SYSTEM_DISCOVERED,
        ObservationProgressMilestone
          .FIRST_BODY_DISCOVERED,
        ObservationProgressMilestone
          .FIRST_GALACTIC_OBJECT_CATALOGUED,
        ObservationProgressMilestone
          .FIRST_TARGET_CONFIRMED,
      ),
    ),

    new ObservationInstrumentFamilyUnlockRule(
      ObservationInstrumentType
        .GRAVITATIONAL_WAVE,
      requirement(
        10_000n,
        ObservationProgressMilestone
          .FIRST_SYSTEM_DISCOVERED,
        ObservationProgressMilestone
          .FIRST_BODY_DISCOVERED,
        ObservationProgressMilestone
          .FIRST_GALACTIC_OBJECT_CATALOGUED,
        ObservationProgressMilestone
          .FIRST_TARGET_CONFIRMED,
        ObservationProgressMilestone
          .FIRST_EXTERNAL_GALAXY_DETECTED,
      ),
    ),
  ]);

const LEVEL_UNLOCK_RULES:
  readonly ObservationInstrumentLevelUnlockRule[] =
  Object.freeze([
    new ObservationInstrumentLevelUnlockRule(
      ObservationInstrumentLevel
        .LEVEL_1,
      requirement(
        0n,
      ),
    ),

    new ObservationInstrumentLevelUnlockRule(
      ObservationInstrumentLevel
        .LEVEL_2,
      requirement(
        1_000n,
        ObservationProgressMilestone
          .FIRST_SYSTEM_DISCOVERED,
      ),
    ),

    new ObservationInstrumentLevelUnlockRule(
      ObservationInstrumentLevel
        .LEVEL_3,
      requirement(
        2_500n,
        ObservationProgressMilestone
          .FIRST_SYSTEM_DISCOVERED,
        ObservationProgressMilestone
          .FIRST_BODY_DISCOVERED,
      ),
    ),

    new ObservationInstrumentLevelUnlockRule(
      ObservationInstrumentLevel
        .LEVEL_4,
      requirement(
        5_000n,
        ObservationProgressMilestone
          .FIRST_SYSTEM_DISCOVERED,
        ObservationProgressMilestone
          .FIRST_BODY_DISCOVERED,
        ObservationProgressMilestone
          .FIRST_GALACTIC_OBJECT_CATALOGUED,
      ),
    ),

    new ObservationInstrumentLevelUnlockRule(
      ObservationInstrumentLevel
        .LEVEL_5,
      requirement(
        10_000n,
        ObservationProgressMilestone
          .FIRST_SYSTEM_DISCOVERED,
        ObservationProgressMilestone
          .FIRST_BODY_DISCOVERED,
        ObservationProgressMilestone
          .FIRST_GALACTIC_OBJECT_CATALOGUED,
        ObservationProgressMilestone
          .FIRST_TARGET_CONFIRMED,
      ),
    ),
  ]);

validateV1ProgressionCatalog();

/**
 * Frozen, pure V1 progression catalog for observation instruments.
 *
 * Global Discovery Points are thresholds, never prices:
 * - family and level thresholds are combined with max(...), never addition;
 * - milestone requirements are unioned in canonical order;
 * - no unlock state is persisted.
 */
export class ObservationInstrumentProgressionCatalogV1 {

  private constructor() {}

  static readonly milestonesInCanonicalOrder =
    MILESTONES_IN_CANONICAL_ORDER;

  static readonly familyUnlockRules =
    FAMILY_UNLOCK_RULES;

  static readonly levelUnlockRules =
    LEVEL_UNLOCK_RULES;

  static familyRule(
    instrumentType:
      ObservationInstrumentType,
  ): ObservationInstrumentFamilyUnlockRule {

    ObservationInstrumentCatalogV1
      .instrument(
        instrumentType,
      );

    const rule =
      FAMILY_UNLOCK_RULES
        .find(
          (
            candidate,
          ) =>
            candidate.instrumentType ===
            instrumentType,
        );

    if (
      rule ===
      undefined
    ) {
      throw new RangeError(
        `No V1 family unlock rule for ${String(instrumentType)}.`,
      );
    }

    return rule;
  }

  static levelRule(
    level:
      ObservationInstrumentLevel,
  ): ObservationInstrumentLevelUnlockRule {

    const rule =
      LEVEL_UNLOCK_RULES
        .find(
          (
            candidate,
          ) =>
            candidate.level ===
            level,
        );

    if (
      rule ===
      undefined
    ) {
      throw new RangeError(
        'No V1 level unlock rule for the supplied level.',
      );
    }

    return rule;
  }

  static combinedRequirement(
    instrumentType:
      ObservationInstrumentType,

    level:
      ObservationInstrumentLevel,
  ): ObservationUnlockRequirement {

    const familyRequirement =
      this.familyRule(
        instrumentType,
      )
      .requirement;

    const levelRequirement =
      this.levelRule(
        level,
      )
      .requirement;

    const minimumGlobalDiscoveryPoints =
      familyRequirement
        .minimumGlobalDiscoveryPoints >
      levelRequirement
        .minimumGlobalDiscoveryPoints
        ? familyRequirement
            .minimumGlobalDiscoveryPoints
        : levelRequirement
            .minimumGlobalDiscoveryPoints;

    const requiredSet =
      new Set<
        ObservationProgressMilestone
      >([
        ...familyRequirement
          .requiredMilestones,
        ...levelRequirement
          .requiredMilestones,
      ]);

    const requiredMilestones =
      MILESTONES_IN_CANONICAL_ORDER
        .filter(
          (
            milestone,
          ) =>
            requiredSet.has(
              milestone,
            ),
        );

    return new ObservationUnlockRequirement(
      minimumGlobalDiscoveryPoints,
      requiredMilestones,
    );
  }
}

function requirement(
  minimumGlobalDiscoveryPoints:
    bigint,

  ...requiredMilestones:
    ObservationProgressMilestone[]
): ObservationUnlockRequirement {

  return new ObservationUnlockRequirement(
    minimumGlobalDiscoveryPoints,
    requiredMilestones,
  );
}

function validateV1ProgressionCatalog():
  void {

  const supportedInstrumentTypes =
    ObservationInstrumentCatalogV1
      .supportedInstrumentTypes;

  const supportedLevels =
    ObservationInstrumentCapabilityCatalogV1
      .supportedLevels;

  if (
    FAMILY_UNLOCK_RULES.length !==
      7 ||
    FAMILY_UNLOCK_RULES.length !==
      supportedInstrumentTypes.length
  ) {
    throw new Error(
      'V1 progression catalog must contain exactly seven family rules.',
    );
  }

  if (
    LEVEL_UNLOCK_RULES.length !==
      5 ||
    LEVEL_UNLOCK_RULES.length !==
      supportedLevels.length
  ) {
    throw new Error(
      'V1 progression catalog must contain exactly five level rules.',
    );
  }

  for (
    let index =
      0;
    index <
      FAMILY_UNLOCK_RULES.length;
    index +=
      1
  ) {
    const current =
      FAMILY_UNLOCK_RULES[
        index
      ];

    if (
      current.instrumentType !==
      supportedInstrumentTypes[
        index
      ]
    ) {
      throw new Error(
        'V1 family unlock rules must follow the canonical 8.2 instrument order.',
      );
    }

    validateCanonicalMilestoneOrder(
      current.requirement
        .requiredMilestones,
    );

    if (
      index >
      0
    ) {
      const previous =
        FAMILY_UNLOCK_RULES[
          index -
            1
        ];

      if (
        current.requirement
          .minimumGlobalDiscoveryPoints <
        previous.requirement
          .minimumGlobalDiscoveryPoints
      ) {
        throw new Error(
          'V1 family Discovery Point thresholds must be non-decreasing.',
        );
      }

      if (
        !isMilestoneSuperset(
          current.requirement
            .requiredMilestones,
          previous.requirement
            .requiredMilestones,
        )
      ) {
        throw new Error(
          'V1 family milestone requirements must be cumulative.',
        );
      }
    }
  }

  for (
    let index =
      0;
    index <
      LEVEL_UNLOCK_RULES.length;
    index +=
      1
  ) {
    const current =
      LEVEL_UNLOCK_RULES[
        index
      ];

    if (
      current.level !==
      supportedLevels[
        index
      ]
    ) {
      throw new Error(
        'V1 level unlock rules must follow the canonical 8.3 level order.',
      );
    }

    validateCanonicalMilestoneOrder(
      current.requirement
        .requiredMilestones,
    );

    if (
      index >
      0
    ) {
      const previous =
        LEVEL_UNLOCK_RULES[
          index -
            1
        ];

      if (
        current.requirement
          .minimumGlobalDiscoveryPoints <=
        previous.requirement
          .minimumGlobalDiscoveryPoints
      ) {
        throw new Error(
          'V1 level Discovery Point thresholds must increase strictly.',
        );
      }

      if (
        !isMilestoneSuperset(
          current.requirement
            .requiredMilestones,
          previous.requirement
            .requiredMilestones,
        )
      ) {
        throw new Error(
          'V1 level milestone requirements must be cumulative.',
        );
      }
    }
  }
}

function validateCanonicalMilestoneOrder(
  milestones:
    readonly ObservationProgressMilestone[],
): void {

  let previousIndex =
    -1;

  for (
    const milestone
    of milestones
  ) {
    const currentIndex =
      MILESTONES_IN_CANONICAL_ORDER
        .indexOf(
          milestone,
        );

    if (
      currentIndex <
        0 ||
      currentIndex <=
        previousIndex
    ) {
      throw new Error(
        'V1 milestone requirements must follow canonical order without duplicates.',
      );
    }

    previousIndex =
      currentIndex;
  }
}

function isMilestoneSuperset(
  current:
    readonly ObservationProgressMilestone[],

  previous:
    readonly ObservationProgressMilestone[],
): boolean {

  return previous
    .every(
      (
        milestone,
      ) =>
        current.includes(
          milestone,
        ),
    );
}
