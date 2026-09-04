import {
  InjectionToken,
} from '@angular/core';

import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  DetectedToDiscoveredScientificDimension,
} from '../../domain/discovery/detected-to-discovered-scientific-profile';

import {
  type DiscoveredToVisitedEntryKindValue,
} from '../../domain/discovery/discovered-to-visited-entry';

import {
  type KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  type ScientificCompleteness,
  evaluateScientificCompleteness,
} from '../../domain/discovery/scientific-completeness';

import {
  type ScientificEvidence,
} from '../../domain/discovery/scientific-evidence';

import {
  STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1,
  StellarSystemScientificDimension,
} from '../../domain/discovery/stellar-system-scientific-profile';

import {
  type ProceduralLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

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
  Observatory,
} from '../../domain/observation/observatory';

import {
  type DiscoveryPointsRepository,
  type DiscoveryRepository,
} from '../../domain/repository/genesis-repositories';

import {
  type ScientificEvidenceRepository,
} from '../../domain/repository/scientific-evidence-repository';

import {
  GenesisIndexedDb,
} from '../../data/local/indexed-db/genesis-indexed-db';

import {
  DexieDiscoveryPointsRepository,
} from '../../data/local/repository/dexie-discovery-points.repository';

import {
  DexieDiscoveryRepository,
  type ProceduralTargetSeedResolver,
} from '../../data/local/repository/dexie-discovery.repository';

import {
  DexieScientificEvidenceRepository,
} from '../../data/local/repository/dexie-scientific-evidence.repository';

import {
  CataloguedToConfirmedScientificProgressionEngine,
} from '../../simulation/exploration/catalogued-to-confirmed-scientific-progression-engine';

import {
  DetectedToDiscoveredScientificProgressionEngine,
} from '../../simulation/exploration/detected-to-discovered-scientific-progression-engine';

import {
  DiscoveredToVisitedProgressionEngine,
} from '../../simulation/exploration/discovered-to-visited-progression-engine';

import {
  StellarSystemScientificRewardPolicyV1,
} from '../../simulation/exploration/stellar-system-scientific-reward-policy';

import {
  VisitedToCataloguedScientificProgressionEngine,
} from '../../simulation/exploration/visited-to-catalogued-scientific-progression-engine';

import {
  ObservationEngine,
} from '../../simulation/observation/observation-engine';

import {
  ObservationInstrumentCapabilityCatalogV1,
} from '../../simulation/observation/observation-instrument-capability-catalog';

import {
  ScientificEvidenceAcquisitionEngine,
  type ScientificEvidenceAcquisitionAvailability,
} from '../../simulation/observation/scientific-evidence-acquisition-engine';

import {
  StellarSystemScientificObservationCatalogV1,
  StellarSystemScientificObservationRuleCode,
  type StellarSystemScientificObservationRuleCode as StellarSystemScientificObservationRuleCodeValue,
} from '../../simulation/observation/stellar-system-scientific-observation-catalog';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

const DISCOVERY_DIMENSIONS =
  new Set<string>([
    DetectedToDiscoveredScientificDimension.NATURE,
    DetectedToDiscoveredScientificDimension.IDENTITY,
    DetectedToDiscoveredScientificDimension.BASIC_ARCHITECTURE,
  ]);

const CATALOGUING_DIMENSIONS =
  new Set<string>([
    StellarSystemScientificDimension.STELLAR_CLASSIFICATION,
    StellarSystemScientificDimension.STELLAR_PHYSICAL_PROPERTIES,
    StellarSystemScientificDimension.ORBITAL_ARCHITECTURE,
  ]);

const CONFIRMATION_RULE_CODES =
  new Set<StellarSystemScientificObservationRuleCodeValue>([
    StellarSystemScientificObservationRuleCode.CLASSIFICATION_SPECTROSCOPY,
    StellarSystemScientificObservationRuleCode.PHYSICAL_PROPERTIES_INFRARED,
    StellarSystemScientificObservationRuleCode.ORBITAL_ARCHITECTURE_SPECTROSCOPIC_DYNAMICS,
  ]);

export interface StellarSystemScientificRuleAvailability {
  readonly ruleCode:
    StellarSystemScientificObservationRuleCodeValue;

  readonly dimensionCode:
    string;

  readonly instrumentType:
    ObservationInstrumentType;

  readonly selectedLevel:
    ObservationInstrumentLevel;

  readonly minimumLevel:
    ObservationInstrumentLevel;

  readonly isAvailable:
    boolean;

  readonly missingGlobalDiscoveryPoints:
    bigint;

  readonly missingMilestones:
    readonly ObservationProgressMilestone[];
}

export class StellarSystemScientificProgressionSnapshot {

  readonly evidence:
    readonly ScientificEvidence[];

  readonly rules:
    readonly StellarSystemScientificRuleAvailability[];

  constructor(
    readonly discoveryState:
      DiscoveryStateValue,

    evidence:
      readonly ScientificEvidence[],

    readonly completeness:
      ScientificCompleteness,

    readonly globalDiscoveryPoints:
      bigint,

    readonly galaxyDiscoveryPoints:
      bigint,

    rules:
      readonly StellarSystemScientificRuleAvailability[],
  ) {

    this.evidence =
      Object.freeze([
        ...evidence,
      ]);

    this.rules =
      Object.freeze([
        ...rules,
      ]);

    Object.freeze(
      this,
    );
  }
}

export class CommittedStellarSystemScientificProgression {

  constructor(
    readonly snapshot:
      StellarSystemScientificProgressionSnapshot,

    readonly stateBefore:
      DiscoveryStateValue,

    readonly stateAfter:
      DiscoveryStateValue,

    readonly awardedDiscoveryPoints:
      number,

    readonly persistedEvidence:
      ScientificEvidence | null,
  ) {

    if (
      awardedDiscoveryPoints <
      0
    ) {
      throw new RangeError(
        'Point 26.A.9 awarded Discovery Points cannot be negative.',
      );
    }

    Object.freeze(
      this,
    );
  }
}

export interface StellarSystemScientificProgressionRuntime {
  snapshot(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,
  ): Promise<StellarSystemScientificProgressionSnapshot>;

  recordEntry(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,

    entryKind:
      DiscoveredToVisitedEntryKindValue,
  ): Promise<CommittedStellarSystemScientificProgression>;

  performObservation(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,

    ruleCode:
      StellarSystemScientificObservationRuleCodeValue,

    observedAtEpochMs?:
      number,
  ): Promise<CommittedStellarSystemScientificProgression>;
}

/**
 * Point-26.A.9 authoritative stellar-system progression runtime.
 *
 * Archive, SystemPage and Observatory all consume this one persistence boundary.
 * Every write re-reads the persisted DiscoveryState/evidence/PD snapshot inside
 * one Dexie transaction. ObservationEngine validates the real observatory target
 * and globally unlocked instrument session; the A8 bridge then creates only
 * observed ScientificEvidence. State transitions remain delegated to A3/A4/A5/A6
 * and PD rewards remain delegated to the A8 reward policy.
 */
export class DexieStellarSystemScientificProgressionRuntime
  implements StellarSystemScientificProgressionRuntime {

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly pointsRepository:
      DiscoveryPointsRepository,

    private readonly discoveryRepository:
      DiscoveryRepository,

    private readonly evidenceRepository:
      ScientificEvidenceRepository,

    private readonly clock:
      () => number =
        Date.now,
  ) {}

  async snapshot(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,
  ): Promise<StellarSystemScientificProgressionSnapshot> {

    await this.database
      .openDatabase();

    return this.buildSnapshot(
      generationKey,
      locator,
    );
  }

  async recordEntry(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,

    entryKind:
      DiscoveredToVisitedEntryKindValue,
  ): Promise<CommittedStellarSystemScientificProgression> {

    await this.database
      .openDatabase();

    return this.database
      .transaction(
        'rw',
        this.database.universes,
        this.database.discoveries,
        this.database.observations,
        this.database.progress,
        async () => {
          const stateBefore =
            await this.currentState(
              generationKey,
              locator,
            );

          const assessment =
            DiscoveredToVisitedProgressionEngine
              .evaluate(
                stateBefore,
                entryKind,
              );

          let awardedDiscoveryPoints =
            0;

          if (
            assessment.didAdvance
          ) {
            awardedDiscoveryPoints =
              await this.persistTransitionAndReward(
                generationKey,
                locator,
                assessment.stateBefore,
                assessment.stateAfter,
              );
          }

          return new CommittedStellarSystemScientificProgression(
            await this.buildSnapshot(
              generationKey,
              locator,
            ),
            assessment.stateBefore,
            assessment.stateAfter,
            awardedDiscoveryPoints,
            null,
          );
        },
      );
  }

  async performObservation(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,

    ruleCode:
      StellarSystemScientificObservationRuleCodeValue,

    observedAtEpochMs:
      number =
        this.clock(),
  ): Promise<CommittedStellarSystemScientificProgression> {

    await this.database
      .openDatabase();

    return this.database
      .transaction(
        'rw',
        this.database.universes,
        this.database.discoveries,
        this.database.observations,
        this.database.progress,
        async () => {
          const stateBefore =
            await this.currentState(
              generationKey,
              locator,
            );

          if (
            stateBefore ===
            DiscoveryState.DISCOVERED
          ) {
            throw new RangeError(
              'Point 26.A.9 requires the first detailed entry before cataloguing observations can begin.',
            );
          }

          if (
            stateBefore.code <
            DiscoveryState.DETECTED.code
          ) {
            throw new RangeError(
              'Point 26.A.9 cannot observe an UNKNOWN stellar system.',
            );
          }

          const rule =
            StellarSystemScientificObservationCatalogV1
              .rule(
                ruleCode,
              );

          if (
            !ruleAllowedForState(
              ruleCode,
              rule.dimensionCode,
              stateBefore,
            )
          ) {
            throw new RangeError(
              `Scientific observation ${ruleCode} is outside the current DiscoveryState code ${stateBefore.code} campaign stage.`,
            );
          }

          const [
            globalDiscoveryPoints,
            knownDiscoveries,
          ] =
            await Promise.all([
              this.pointsRepository
                .getGlobalDiscoveryPoints(
                  generationKey,
                ),
              this.discoveryRepository
                .getKnownDiscoveries(
                  generationKey,
                ),
            ]);

          const selection =
            bestRuleAvailability(
              generationKey,
              globalDiscoveryPoints,
              knownDiscoveries,
              ruleCode,
              stateBefore,
            );

          if (
            !selection.isAvailable
          ) {
            throw new RangeError(
              `Scientific observation ${ruleCode} is blocked by the current PD/milestone instrument progression.`,
            );
          }

          const observatory =
            new Observatory(
              generationKey,
            );

          // Real point-8 ObservationEngine gate. This is intentionally not
          // replaced by a hand-built ObservationSession in 26.A.9.
          ObservationEngine
            .prepareUnlockedInstrumentObservationAtLevel(
              observatory,
              locator,
              knownDiscoveries,
              globalDiscoveryPoints,
              selection.instrumentType,
              selection.selectedLevel,
            );

          const acquired =
            ScientificEvidenceAcquisitionEngine
              .acquire(
                generationKey,
                globalDiscoveryPoints,
                knownDiscoveries,
                rule,
                selection.instrumentType,
                selection.selectedLevel,
                observedAtEpochMs,
              );

          const persistedEvidence =
            await this.evidenceRepository
              .recordEvidence(
                generationKey,
                locator,
                acquired.evidence,
              );

          const allEvidence =
            await this.evidenceRepository
              .getEvidence(
                generationKey,
                locator,
              );

          const stateAfter =
            progressionStateAfter(
              stateBefore,
              allEvidence,
            );

          let awardedDiscoveryPoints =
            0;

          if (
            stateAfter.code !==
            stateBefore.code
          ) {
            awardedDiscoveryPoints =
              await this.persistTransitionAndReward(
                generationKey,
                locator,
                stateBefore,
                stateAfter,
              );
          }

          return new CommittedStellarSystemScientificProgression(
            await this.buildSnapshot(
              generationKey,
              locator,
            ),
            stateBefore,
            stateAfter,
            awardedDiscoveryPoints,
            persistedEvidence,
          );
        },
      );
  }

  private async buildSnapshot(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,
  ): Promise<StellarSystemScientificProgressionSnapshot> {

    const [
      discoveryState,
      evidence,
      globalDiscoveryPoints,
      galaxyDiscoveryPoints,
      knownDiscoveries,
    ] =
      await Promise.all([
        this.currentState(
          generationKey,
          locator,
        ),
        this.evidenceRepository
          .getEvidence(
            generationKey,
            locator,
          ),
        this.pointsRepository
          .getGlobalDiscoveryPoints(
            generationKey,
          ),
        this.pointsRepository
          .getGalaxyDiscoveryPoints(
            generationKey,
            locator.galaxyIndex,
          ),
        this.discoveryRepository
          .getKnownDiscoveries(
            generationKey,
          ),
      ]);

    if (
      discoveryState ===
      DiscoveryState.UNKNOWN
    ) {
      throw new RangeError(
        'Point 26.A.9 cannot build a scientific campaign for an UNKNOWN stellar system.',
      );
    }

    const completeness =
      completenessForState(
        discoveryState,
        evidence,
      );

    const rules =
      StellarSystemScientificObservationCatalogV1
        .rules
        .filter(
          rule =>
            ruleAllowedForState(
              rule.ruleCode as StellarSystemScientificObservationRuleCodeValue,
              rule.dimensionCode,
              discoveryState,
            ),
        )
        .map(
          rule =>
            bestRuleAvailability(
              generationKey,
              globalDiscoveryPoints,
              knownDiscoveries,
              rule.ruleCode as StellarSystemScientificObservationRuleCodeValue,
              discoveryState,
            ),
        );

    return new StellarSystemScientificProgressionSnapshot(
      discoveryState,
      evidence,
      completeness,
      globalDiscoveryPoints,
      galaxyDiscoveryPoints,
      rules,
    );
  }

  private async currentState(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,
  ): Promise<DiscoveryStateValue> {

    return DiscoveryState
      .fromCode(
        (
          await this.discoveryRepository
            .getState(
              generationKey,
              locator,
            )
        ).code,
      );
  }

  private async persistTransitionAndReward(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,

    stateBefore:
      DiscoveryStateValue,

    stateAfter:
      DiscoveryStateValue,
  ): Promise<number> {

    const reward =
      StellarSystemScientificRewardPolicyV1
        .evaluate(
          generationKey,
          stateBefore,
          stateAfter,
        );

    const awarded =
      reward.totalAwardedDiscoveryPoints;

    const [
      globalBefore,
      galaxyBefore,
    ] =
      await Promise.all([
        this.pointsRepository
          .getGlobalDiscoveryPoints(
            generationKey,
          ),
        this.pointsRepository
          .getGalaxyDiscoveryPoints(
            generationKey,
            locator.galaxyIndex,
          ),
      ]);

    const delta =
      BigInt(
        awarded,
      );

    const globalAfter =
      globalBefore +
      delta;

    const galaxyAfter =
      galaxyBefore +
      delta;

    if (
      globalAfter >
        SIGNED_LONG_MAX ||
      galaxyAfter >
        SIGNED_LONG_MAX
    ) {
      throw new RangeError(
        'Point 26.A.9 Discovery Point reward exceeds the signed-Long range.',
      );
    }

    await this.discoveryRepository
      .setState(
        generationKey,
        locator,
        stateAfter,
      );

    if (
      awarded >
      0
    ) {
      await this.pointsRepository
        .setGlobalDiscoveryPoints(
          generationKey,
          globalAfter,
        );

      await this.pointsRepository
        .setGalaxyDiscoveryPoints(
          generationKey,
          locator.galaxyIndex,
          galaxyAfter,
        );
    }

    return awarded;
  }
}

function progressionStateAfter(
  stateBefore:
    DiscoveryStateValue,

  evidence:
    readonly ScientificEvidence[],
): DiscoveryStateValue {

  if (
    stateBefore ===
    DiscoveryState.DETECTED
  ) {
    return DetectedToDiscoveredScientificProgressionEngine
      .evaluate(
        stateBefore,
        STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1.discoveryProfile,
        evidence,
      )
      .stateAfter;
  }

  if (
    stateBefore ===
    DiscoveryState.VISITED
  ) {
    return VisitedToCataloguedScientificProgressionEngine
      .evaluate(
        stateBefore,
        STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1.cataloguingProfile,
        evidence,
      )
      .stateAfter;
  }

  if (
    stateBefore.code >=
    DiscoveryState.CATALOGUED.code
  ) {
    return CataloguedToConfirmedScientificProgressionEngine
      .evaluate(
        stateBefore,
        STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1.confirmationProfile,
        evidence,
      )
      .stateAfter;
  }

  return stateBefore;
}

function completenessForState(
  state:
    DiscoveryStateValue,

  evidence:
    readonly ScientificEvidence[],
): ScientificCompleteness {

  if (
    state.code <=
    DiscoveryState.DISCOVERED.code
  ) {
    return evaluateScientificCompleteness(
      STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1
        .discoveryProfile
        .requirements,
      evidence,
    );
  }

  if (
    state ===
    DiscoveryState.VISITED
  ) {
    return evaluateScientificCompleteness(
      STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1
        .cataloguingProfile
        .requirements,
      evidence,
    );
  }

  return evaluateScientificCompleteness(
    STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1
      .confirmationProfile
      .confirmationRequirements,
    evidence,
  );
}

function ruleAllowedForState(
  ruleCode:
    StellarSystemScientificObservationRuleCodeValue,

  dimensionCode:
    string,

  state:
    DiscoveryStateValue,
): boolean {

  if (
    state ===
    DiscoveryState.DETECTED
  ) {
    return DISCOVERY_DIMENSIONS
      .has(
        dimensionCode,
      );
  }

  if (
    state ===
    DiscoveryState.DISCOVERED ||
    state ===
    DiscoveryState.CONFIRMED
  ) {
    return false;
  }

  if (
    state ===
    DiscoveryState.VISITED
  ) {
    return CATALOGUING_DIMENSIONS
      .has(
        dimensionCode,
      ) &&
      !CONFIRMATION_RULE_CODES
        .has(
          ruleCode,
        );
  }

  return state ===
    DiscoveryState.CATALOGUED &&
    CATALOGUING_DIMENSIONS
      .has(
        dimensionCode,
      );
}

function bestRuleAvailability(
  generationKey:
    UniverseGenerationKey,

  globalDiscoveryPoints:
    bigint,

  knownDiscoveries:
    readonly KnownDiscovery[],

  ruleCode:
    StellarSystemScientificObservationRuleCodeValue,

  discoveryState:
    DiscoveryStateValue,
): StellarSystemScientificRuleAvailability {

  const rule =
    StellarSystemScientificObservationCatalogV1
      .rule(
        ruleCode,
      );

  const minimumLevel =
    discoveryState ===
      DiscoveryState.CATALOGUED
      ? ObservationInstrumentLevel.LEVEL_4
      : rule.minimumInstrumentLevel;

  const instrumentType =
    rule.compatibleInstrumentTypes[0];

  if (
    instrumentType ===
    undefined
  ) {
    throw new RangeError(
      `Scientific observation ${ruleCode} has no compatible instrument.`,
    );
  }

  const supportedLevels =
    ObservationInstrumentCapabilityCatalogV1
      .supportedLevels;

  let selectedAvailability:
    ScientificEvidenceAcquisitionAvailability | null =
    null;

  for (
    let index =
      supportedLevels.length -
      1;
    index >=
      0;
    index -=
      1
  ) {
    const level =
      supportedLevels[index];

    if (
      level ===
        undefined ||
      level.rank <
        minimumLevel.rank
    ) {
      continue;
    }

    const availability =
      ScientificEvidenceAcquisitionEngine
        .availability(
          generationKey,
          globalDiscoveryPoints,
          knownDiscoveries,
          rule,
          instrumentType,
          level,
        );

    if (
      availability.isAvailable
    ) {
      selectedAvailability =
        availability;
      break;
    }
  }

  if (
    selectedAvailability ===
    null
  ) {
    selectedAvailability =
      ScientificEvidenceAcquisitionEngine
        .availability(
          generationKey,
          globalDiscoveryPoints,
          knownDiscoveries,
          rule,
          instrumentType,
          minimumLevel,
        );
  }

  return Object.freeze({
    ruleCode,
    dimensionCode:
      rule.dimensionCode,
    instrumentType,
    selectedLevel:
      selectedAvailability.level,
    minimumLevel,
    isAvailable:
      selectedAvailability.isAvailable,
    missingGlobalDiscoveryPoints:
      selectedAvailability.missingGlobalDiscoveryPoints,
    missingMilestones:
      Object.freeze([
        ...selectedAvailability.missingMilestones,
      ]),
  });
}

const TARGET_SEED_RESOLVER:
  ProceduralTargetSeedResolver =
  Object.freeze({
    resolveTargetSeedNormalized(
      generationKey:
        UniverseGenerationKey,

      locator:
        ProceduralLocator,
    ): string {

      return ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        )
        .normalizedValue;
    },
  });

export const STELLAR_SYSTEM_SCIENTIFIC_PROGRESSION_RUNTIME =
  new InjectionToken<StellarSystemScientificProgressionRuntime>(
    'STELLAR_SYSTEM_SCIENTIFIC_PROGRESSION_RUNTIME',
    {
      providedIn:
        'root',

      factory:
        createStellarSystemScientificProgressionRuntime,
    },
  );

function createStellarSystemScientificProgressionRuntime():
  StellarSystemScientificProgressionRuntime {

  const database =
    new GenesisIndexedDb();

  const discoveryRepository =
    new DexieDiscoveryRepository(
      database,
      TARGET_SEED_RESOLVER,
    );

  return new DexieStellarSystemScientificProgressionRuntime(
    database,
    new DexieDiscoveryPointsRepository(
      database,
    ),
    discoveryRepository,
    new DexieScientificEvidenceRepository(
      database,
      TARGET_SEED_RESOLVER,
    ),
  );
}
