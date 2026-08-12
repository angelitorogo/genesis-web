import {
  type KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  type ProceduralLocator,
  SectorLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  InstrumentObservationSession,
  type ObservationInstrument,
  type ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  ObservationActionAvailability,
  type ObservationActionContext,
  type ObservationActionType,
  PreparedObservationAction,
} from '../../domain/observation/observation-action';

import {
  type ObservationClassificationAssessment,
  ObservationTransientCandidateId,
} from '../../domain/observation/observation-classification';

import {
  ObservationCertainty,
  ObservationCertaintyAssessment,
  ObservationCertaintyTransition,
} from '../../domain/observation/observation-certainty';

import {
  InstrumentCapabilityProfile,
  LeveledInstrumentObservationSession,
  type ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  type UncertainScalarMeasurement,
} from '../../domain/observation/observation-measurement-uncertainty';

import {
  type ObjectScientificCompleteness,
  type ObservationScientificCompletenessContext,
} from '../../domain/observation/observation-scientific-completeness';

import {
  ObservationInstrumentProgressionOverview,
} from '../../domain/observation/observation-instrument-progression';

import {
  ObservationSession,
  Observatory,
} from '../../domain/observation/observatory';

import {
  ObservationActionEngine,
} from './observation-action-engine';

import {
  ObservationClassificationEngine,
} from './observation-classification-engine';

import {
  ObservationCertaintyEngine,
} from './observation-certainty-engine';

import {
  ObservationInstrumentCapabilityCatalogV1,
} from './observation-instrument-capability-catalog';

import {
  ObservationInstrumentCatalogV1,
} from './observation-instrument-catalog';

import {
  ObservationInstrumentProgressionEngine,
} from './observation-instrument-progression-engine';

import {
  ObservationMeasurementUncertaintyEngine,
} from './observation-measurement-uncertainty-engine';

import {
  ObservationScientificCompletenessEngine,
} from './observation-scientific-completeness-engine';

/**
 * Pure deterministic observation-session preparation engine.
 *
 * Point 8.1:
 * - prepareObservation(...) validates that a target is already known.
 *
 * Point 8.2:
 * - supportedInstruments(...) exposes the frozen V1 seven-family catalog;
 * - prepareInstrumentObservation(...) composes the base 8.1 session with one
 *   selected instrument family.
 *
 * Point 8.3:
 * - supportedInstrumentLevels(...) exposes the five frozen V1 maturity levels;
 * - instrumentCapabilityProfile(...) exposes normalized relative capability;
 * - prepareInstrumentObservationAtLevel(...) composes 8.1 + 8.2 + 8.3.
 *
 * Point 8.4:
 * - instrumentProgressionOverview(...) derives current gameplay accessibility;
 * - prepareUnlockedInstrumentObservationAtLevel(...) is the gated gameplay API;
 * - prepareInstrumentObservationAtLevel(...) intentionally remains ungated as
 *   the technical 8.3 composition API.
 *
 * Point 8.5:
 * - initialObservationCertainty(...) creates CANDIDATE;
 * - evaluateObservationCertaintyTransition(...) validates one monotonic stage
 *   transition;
 * - advanceObservationCertainty(...) advances exactly one stage, keeping
 *   terminal CONFIRMED idempotent.
 *
 * Point 8.6:
 * - estimateScalarWithUncertainty(...) converts one exact Ground Truth scalar
 *   into a deterministic observable half-open interval;
 * - the exact value and reference scale remain private engine inputs.
 *
 * Point 8.7:
 * - observationActionAvailabilities(...) evaluates all seven canonical V1
 *   action intentions for one already-prepared leveled instrument session;
 * - prepareObservationAction(...) validates availability and prepares one
 *   action intention without executing it.
 *
 * Point 8.8:
 * - scientificCompletenessForObject(...) derives finite observational
 *   checklist coverage for one procedural object;
 * - completeness is derived from caller-provided completed-action facts and
 *   the optional periodicity-candidate obligation.
 *
 * Point 8.9:
 * - unclassifiedObject(...) creates an explicit Unclassified assessment for a
 *   procedural-locator-backed observational object;
 * - unclassifiedTransient(...) creates an explicit Unclassified assessment for
 *   a transient candidate that deliberately has no ProceduralLocator.
 *
 * Point 8.9 still performs:
 *
 * - 0 scientific measurements;
 * - 0 Ground Truth generator calls;
 * - 0 PRNG draws;
 * - 0 seed derivations or hashing;
 * - 0 DiscoveryState mutations;
 * - 0 Discovery Point grants/spending;
 * - 0 persistence writes;
 * - 0 persisted unlock state or instrument purchases;
 * - 0 Discovery Point spending;
 * - 0 certainty/uncertainty/noise logic;
 * - 0 physical wavelength/resolution/distance modeling;
 * - 0 UI changes.
 */
export class ObservationEngine {

  private constructor() {}

  static prepareObservation(
    observatory:
      Observatory,

    targetLocator:
      ProceduralLocator,

    knownDiscoveries:
      readonly KnownDiscovery[],
  ): ObservationSession {

    if (
      observatory
        .generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.prepareV1(
        observatory,
        targetLocator,
        knownDiscoveries,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${observatory.generationKey.generatorVersion.code}.`,
    );
  }

  static supportedInstruments(
    observatory:
      Observatory,
  ): readonly ObservationInstrument[] {

    if (
      observatory
        .generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return ObservationInstrumentCatalogV1
        .supportedInstruments;
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${observatory.generationKey.generatorVersion.code}.`,
    );
  }

  static prepareInstrumentObservation(
    observatory:
      Observatory,

    targetLocator:
      ProceduralLocator,

    knownDiscoveries:
      readonly KnownDiscovery[],

    instrumentType:
      ObservationInstrumentType,
  ): InstrumentObservationSession {

    if (
      observatory
        .generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      const baseSession =
        this.prepareObservation(
          observatory,
          targetLocator,
          knownDiscoveries,
        );

      const instrument =
        ObservationInstrumentCatalogV1
          .instrument(
            instrumentType,
          );

      return new InstrumentObservationSession(
        baseSession,
        instrument,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${observatory.generationKey.generatorVersion.code}.`,
    );
  }

  static supportedInstrumentLevels(
    observatory:
      Observatory,

    instrumentType:
      ObservationInstrumentType,
  ): readonly ObservationInstrumentLevel[] {

    if (
      observatory
        .generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      ObservationInstrumentCatalogV1
        .instrument(
          instrumentType,
        );

      return ObservationInstrumentCapabilityCatalogV1
        .supportedLevels;
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${observatory.generationKey.generatorVersion.code}.`,
    );
  }

  static instrumentCapabilityProfile(
    observatory:
      Observatory,

    instrumentType:
      ObservationInstrumentType,

    level:
      ObservationInstrumentLevel,
  ): InstrumentCapabilityProfile {

    if (
      observatory
        .generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return ObservationInstrumentCapabilityCatalogV1
        .profile(
          instrumentType,
          level,
        );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${observatory.generationKey.generatorVersion.code}.`,
    );
  }

  static prepareInstrumentObservationAtLevel(
    observatory:
      Observatory,

    targetLocator:
      ProceduralLocator,

    knownDiscoveries:
      readonly KnownDiscovery[],

    instrumentType:
      ObservationInstrumentType,

    level:
      ObservationInstrumentLevel,
  ): LeveledInstrumentObservationSession {

    if (
      observatory
        .generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      const instrumentSession =
        this.prepareInstrumentObservation(
          observatory,
          targetLocator,
          knownDiscoveries,
          instrumentType,
        );

      const capabilityProfile =
        this.instrumentCapabilityProfile(
          observatory,
          instrumentType,
          level,
        );

      return new LeveledInstrumentObservationSession(
        instrumentSession,
        capabilityProfile,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${observatory.generationKey.generatorVersion.code}.`,
    );
  }

  static instrumentProgressionOverview(
    observatory:
      Observatory,

    globalDiscoveryPoints:
      bigint,

    knownDiscoveries:
      readonly KnownDiscovery[],
  ): ObservationInstrumentProgressionOverview {

    return ObservationInstrumentProgressionEngine
      .evaluate(
        observatory
          .generationKey,
        globalDiscoveryPoints,
        knownDiscoveries,
      );
  }

  static prepareUnlockedInstrumentObservationAtLevel(
    observatory:
      Observatory,

    targetLocator:
      ProceduralLocator,

    knownDiscoveries:
      readonly KnownDiscovery[],

    globalDiscoveryPoints:
      bigint,

    instrumentType:
      ObservationInstrumentType,

    level:
      ObservationInstrumentLevel,
  ): LeveledInstrumentObservationSession {

    const progression =
      this.instrumentProgressionOverview(
        observatory,
        globalDiscoveryPoints,
        knownDiscoveries,
      );

    const status =
      progression.status(
        instrumentType,
        level,
      );

    if (
      !status.isUnlocked
    ) {
      const missingMilestones =
        status
          .missingMilestones
          .length ===
          0
          ? 'none'
          : status
              .missingMilestones
              .join(
                ', ',
              );

      throw new RangeError(
        [
          `${instrumentType} ${level.name} is locked.`,
          `Missing global Discovery Points: ${status.missingGlobalDiscoveryPoints}.`,
          `Missing milestones: ${missingMilestones}.`,
        ].join(
          ' ',
        ),
      );
    }

    return this
      .prepareInstrumentObservationAtLevel(
        observatory,
        targetLocator,
        knownDiscoveries,
        instrumentType,
        level,
      );
  }

  static initialObservationCertainty(
    observatory:
      Observatory,
  ): ObservationCertaintyAssessment {

    return ObservationCertaintyEngine
      .createCandidate(
        observatory
          .generationKey,
      );
  }

  static evaluateObservationCertaintyTransition(
    observatory:
      Observatory,

    previousCertainty:
      ObservationCertainty,

    newCertainty:
      ObservationCertainty,
  ): ObservationCertaintyTransition {

    return ObservationCertaintyEngine
      .evaluateTransition(
        observatory
          .generationKey,
        previousCertainty,
        newCertainty,
      );
  }

  static advanceObservationCertainty(
    observatory:
      Observatory,

    currentAssessment:
      ObservationCertaintyAssessment,
  ): ObservationCertaintyAssessment {

    return ObservationCertaintyEngine
      .advance(
        observatory
          .generationKey,
        currentAssessment,
      );
  }

  static estimateScalarWithUncertainty(
    observationSession:
      LeveledInstrumentObservationSession,

    exactValue:
      number,

    referenceScale:
      number,
  ): UncertainScalarMeasurement {

    return ObservationMeasurementUncertaintyEngine
      .estimateScalar(
        observationSession
          .generationKey,
        observationSession,
        exactValue,
        referenceScale,
      );
  }

  static observationActionAvailabilities(
    observationSession:
      LeveledInstrumentObservationSession,

    context:
      ObservationActionContext,
  ): readonly ObservationActionAvailability[] {

    return ObservationActionEngine
      .actionAvailabilities(
        observationSession
          .generationKey,
        observationSession,
        context,
      );
  }

  static prepareObservationAction(
    observationSession:
      LeveledInstrumentObservationSession,

    actionType:
      ObservationActionType,

    context:
      ObservationActionContext,
  ): PreparedObservationAction {

    return ObservationActionEngine
      .prepareAction(
        observationSession
          .generationKey,
        observationSession,
        actionType,
        context,
      );
  }

  static scientificCompletenessForObject(
    observatory:
      Observatory,

    targetLocator:
      ProceduralLocator,

    context:
      ObservationScientificCompletenessContext,
  ): ObjectScientificCompleteness {

    return ObservationScientificCompletenessEngine
      .evaluate(
        observatory
          .generationKey,
        targetLocator,
        context,
      );
  }

  static unclassifiedObject(
    observatory:
      Observatory,

    targetLocator:
      ProceduralLocator,
  ): ObservationClassificationAssessment {

    return ObservationClassificationEngine
      .createUnclassifiedObject(
        observatory
          .generationKey,
        targetLocator,
      );
  }

  static unclassifiedTransient(
    observatory:
      Observatory,

    candidateId:
      ObservationTransientCandidateId,
  ): ObservationClassificationAssessment {

    return ObservationClassificationEngine
      .createUnclassifiedTransient(
        observatory
          .generationKey,
        candidateId,
      );
  }

  private static prepareV1(
    observatory:
      Observatory,

    targetLocator:
      ProceduralLocator,

    knownDiscoveries:
      readonly KnownDiscovery[],
  ): ObservationSession {

    for (
      const discovery
      of knownDiscoveries
    ) {
      const stateCode:
        number =
        discovery
          .state
          .code;

      if (
        stateCode ===
        DiscoveryState.UNKNOWN.code
      ) {
        throw new RangeError(
          'knownDiscoveries cannot contain DiscoveryState.UNKNOWN.',
        );
      }
    }

    const targetDiscovery =
      knownDiscoveries
        .find(
          (
            discovery,
          ) =>
            sameProceduralLocator(
              discovery.locator,
              targetLocator,
            ),
        );

    if (
      targetDiscovery ===
      undefined
    ) {
      throw new RangeError(
        'targetLocator is not present in knownDiscoveries.',
      );
    }

    if (
      targetDiscovery
        .state
        .code <
      DiscoveryState.DETECTED.code
    ) {
      throw new RangeError(
        'targetLocator must have DiscoveryState >= DETECTED.',
      );
    }

    return new ObservationSession(
      observatory,
      targetLocator,
      targetDiscovery.state,
    );
  }
}

function sameProceduralLocator(
  left:
    ProceduralLocator,

  right:
    ProceduralLocator,
): boolean {

  if (
    left instanceof
      GalaxyLocator &&
    right instanceof
      GalaxyLocator
  ) {
    return left.galaxyIndex ===
      right.galaxyIndex;
  }

  if (
    left instanceof
      SectorLocator &&
    right instanceof
      SectorLocator
  ) {
    return (
      left.galaxyIndex ===
        right.galaxyIndex &&
      left.sectorKey ===
        right.sectorKey
    );
  }

  if (
    left instanceof
      GalacticObjectLocator &&
    right instanceof
      GalacticObjectLocator
  ) {
    return (
      left.galaxyIndex ===
        right.galaxyIndex &&
      left.sectorKey ===
        right.sectorKey &&
      left.galacticObjectIndex ===
        right.galacticObjectIndex
    );
  }

  if (
    left instanceof
      SystemLocator &&
    right instanceof
      SystemLocator
  ) {
    return (
      left.galaxyIndex ===
        right.galaxyIndex &&
      left.sectorKey ===
        right.sectorKey &&
      left.galacticObjectIndex ===
        right.galacticObjectIndex
    );
  }

  if (
    left instanceof
      BodyLocator &&
    right instanceof
      BodyLocator
  ) {
    return (
      left.galaxyIndex ===
        right.galaxyIndex &&
      left.sectorKey ===
        right.sectorKey &&
      left.galacticObjectIndex ===
        right.galacticObjectIndex &&
      left.bodyIndex ===
        right.bodyIndex
    );
  }

  if (
    left instanceof
      CivilizationLocator &&
    right instanceof
      CivilizationLocator
  ) {
    return (
      left.galaxyIndex ===
        right.galaxyIndex &&
      left.sectorKey ===
        right.sectorKey &&
      left.galacticObjectIndex ===
        right.galacticObjectIndex &&
      left.bodyIndex ===
        right.bodyIndex &&
      left.civilizationIndex ===
        right.civilizationIndex
    );
  }

  return false;
}
