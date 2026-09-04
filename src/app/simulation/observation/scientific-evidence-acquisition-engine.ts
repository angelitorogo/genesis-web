import {
  ScientificEvidence,
} from '../../domain/discovery/scientific-evidence';

import {
  type ScientificObservationEvidenceRule,
} from '../../domain/discovery/scientific-observation-evidence-rule';

import {
  type KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  type ObservationProgressMilestone,
} from '../../domain/observation/observation-instrument-progression';

import {
  ObservationActionCatalogV1,
} from './observation-action-catalog';

import {
  ObservationInstrumentCapabilityCatalogV1,
} from './observation-instrument-capability-catalog';

import {
  ObservationInstrumentProgressionEngine,
} from './observation-instrument-progression-engine';

export class ScientificEvidenceAcquisitionAvailability {

  readonly missingMilestones:
    readonly ObservationProgressMilestone[];

  constructor(
    readonly rule:
      ScientificObservationEvidenceRule,

    readonly instrumentType:
      ObservationInstrumentType,

    readonly level:
      ObservationInstrumentLevel,

    readonly isRuleInstrumentCompatible:
      boolean,

    readonly isObservationActionInstrumentCompatible:
      boolean,

    readonly meetsMinimumInstrumentLevel:
      boolean,

    readonly isGloballyUnlocked:
      boolean,

    readonly missingGlobalDiscoveryPoints:
      bigint,

    missingMilestones:
      readonly ObservationProgressMilestone[],
  ) {

    this.missingMilestones =
      Object.freeze([
        ...missingMilestones,
      ]);

    Object.freeze(
      this,
    );
  }

  get isAvailable():
    boolean {

    return (
      this.isRuleInstrumentCompatible &&
      this.isObservationActionInstrumentCompatible &&
      this.meetsMinimumInstrumentLevel &&
      this.isGloballyUnlocked
    );
  }
}

export class AcquiredScientificEvidence {

  constructor(
    readonly availability:
      ScientificEvidenceAcquisitionAvailability,

    readonly evidence:
      ScientificEvidence,
  ) {
    if (
      !availability.isAvailable
    ) {
      throw new RangeError(
        'AcquiredScientificEvidence requires an available scientific observation.',
      );
    }

    Object.freeze(
      this,
    );
  }
}

/**
 * Point-26.A.8 pure bridge from the existing global instrument progression
 * (PD + persisted milestones) to per-object ScientificEvidence.
 *
 * Important boundaries:
 * - global PD is read-only input and is never spent;
 * - instrument unlocks are delegated to the existing point-8.4 engine;
 * - capability is delegated to the existing point-8.3 catalog;
 * - the returned evidence contains observed-knowledge quality/uncertainty only;
 * - no Ground Truth generator, repository, persistence or DiscoveryState write
 *   exists here. Point 26.A.9 owns orchestration/persistence.
 */
export class ScientificEvidenceAcquisitionEngine {

  private constructor() {}

  static availability(
    generationKey:
      UniverseGenerationKey,

    globalDiscoveryPoints:
      bigint,

    knownDiscoveries:
      readonly KnownDiscovery[],

    rule:
      ScientificObservationEvidenceRule,

    instrumentType:
      ObservationInstrumentType,

    level:
      ObservationInstrumentLevel,
  ): ScientificEvidenceAcquisitionAvailability {

    const progression =
      ObservationInstrumentProgressionEngine
        .evaluate(
          generationKey,
          globalDiscoveryPoints,
          knownDiscoveries,
        );

    const unlockStatus =
      progression.status(
        instrumentType,
        level,
      );

    const actionRule =
      ObservationActionCatalogV1
        .rule(
          rule.observationActionType,
        );

    return new ScientificEvidenceAcquisitionAvailability(
      rule,
      instrumentType,
      level,
      rule.compatibleInstrumentTypes
        .includes(
          instrumentType,
        ),
      actionRule.compatibleInstrumentTypes
        .includes(
          instrumentType,
        ),
      level.rank >=
        rule.minimumInstrumentLevel.rank,
      unlockStatus.isUnlocked,
      unlockStatus.missingGlobalDiscoveryPoints,
      unlockStatus.missingMilestones,
    );
  }

  static acquire(
    generationKey:
      UniverseGenerationKey,

    globalDiscoveryPoints:
      bigint,

    knownDiscoveries:
      readonly KnownDiscovery[],

    rule:
      ScientificObservationEvidenceRule,

    instrumentType:
      ObservationInstrumentType,

    level:
      ObservationInstrumentLevel,

    observedAtEpochMs:
      number,
  ): AcquiredScientificEvidence {

    if (
      !Number.isSafeInteger(
        observedAtEpochMs,
      ) ||
      observedAtEpochMs <
        0
    ) {
      throw new RangeError(
        'observedAtEpochMs must be a non-negative safe integer.',
      );
    }

    const availability =
      this.availability(
        generationKey,
        globalDiscoveryPoints,
        knownDiscoveries,
        rule,
        instrumentType,
        level,
      );

    if (
      !availability.isAvailable
    ) {
      throw new RangeError(
        `Scientific observation ${rule.ruleCode} is not available with ${instrumentType} L${level.rank}.`,
      );
    }

    const capability =
      ObservationInstrumentCapabilityCatalogV1
        .profile(
          instrumentType,
          level,
        );

    const quality01 =
      round01(
        Math.min(
          1,
          0.55 +
            0.60 *
              capability.normalizedPrecision,
        ),
      );

    const uncertainty01 =
      round01(
        0.40 *
          (
            1 -
            capability.normalizedPrecision
          ),
      );

    return new AcquiredScientificEvidence(
      availability,
      new ScientificEvidence({
        dimensionCode:
          rule.dimensionCode,
        evidenceCode:
          rule.evidenceCode,
        sourceKey:
          `${rule.sourceKey}:${instrumentType}`,
        independenceKey:
          rule.independenceKey,
        quality01,
        uncertainty01,
        observedAtEpochMs,
      }),
    );
  }
}

function round01(
  value:
    number,
): number {

  return Math.round(
    Math.max(
      0,
      Math.min(
        1,
        value,
      ),
    ) *
      1_000_000_000_000,
  ) /
    1_000_000_000_000;
}
