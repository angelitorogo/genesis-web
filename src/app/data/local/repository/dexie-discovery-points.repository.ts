import {
  type UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  type DiscoveryPointsRepository,
} from '../../../domain/repository/genesis-repositories';

import {
  createGalaxyProgressEntity,
  createGlobalProgressEntity,
  GLOBAL_PROGRESS_SCOPE_KEY,
  ProgressScopeCode,
} from '../entity/progress.entity';

import {
  type GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';

import {
  assertNonNegativeLong,
  ensureUniverseExists,
  generationKeyStorageParts,
  parseNonNegativeLongDecimal,
} from './local-repository-support';

interface LifetimeEarnedGlobalProgressFields {
  readonly lifetimeEarnedDiscoveryPoints?:
    string;

  /**
   * Positive PD earned after this build first touches a legacy progress row,
   * but before the external-search runtime can reconcile that row with the
   * persisted earned-opportunity high-water mark.
   *
   * Presence of this field (including "0") marks the row as unreconciled.
   */
  readonly unreconciledLifetimeEarnedDiscoveryPoints?:
    string;
}

export class DexieDiscoveryPointsRepository
  implements DiscoveryPointsRepository {

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly clock:
      () => number =
        Date.now,
  ) {}

  async getGlobalDiscoveryPoints(
    generationKey:
      UniverseGenerationKey,
  ): Promise<bigint> {

    const entity =
      await this.getGlobalProgressEntity(
        generationKey,
      );

    return entity ===
      undefined
      ? 0n
      : parseNonNegativeLongDecimal(
          entity.discoveryPoints,
          'discoveryPoints',
        );
  }

  /**
   * Monotonic universe-wide total of every global PD ever earned.
   *
   * The spendable balance can decrease (for example point-26.1 galaxy science),
   * but this counter never does. Legacy rows created before this field existed
   * fall back to their current balance and are repaired by the external-search
   * runtime from its already-persisted opportunity high-water mark.
   */
  async getLifetimeEarnedGlobalDiscoveryPoints(
    generationKey:
      UniverseGenerationKey,
  ): Promise<bigint> {

    const entity =
      await this.getGlobalProgressEntity(
        generationKey,
      );

    if (
      entity ===
      undefined
    ) {
      return 0n;
    }

    const currentBalance =
      parseNonNegativeLongDecimal(
        entity.discoveryPoints,
        'discoveryPoints',
      );

    const persistedLifetime =
      (
        entity as
          typeof entity &
          LifetimeEarnedGlobalProgressFields
      )
        .lifetimeEarnedDiscoveryPoints;

    if (
      persistedLifetime ===
      undefined
    ) {
      return currentBalance;
    }

    return maxBigInt(
      currentBalance,
      parseNonNegativeLongDecimal(
        persistedLifetime,
        'lifetimeEarnedDiscoveryPoints',
      ),
    );
  }

  /**
   * Repairs legacy lifetime progress without inventing fractional history.
   * The caller supplies only a proven lower bound (for example complete
   * 100-PD opportunity blocks already persisted by the search high-water mark).
   */
  async ensureLifetimeEarnedGlobalDiscoveryPointsAtLeast(
    generationKey:
      UniverseGenerationKey,

    minimumHistoricalLifetimeEarnedDiscoveryPoints:
      bigint,
  ): Promise<bigint> {

    assertNonNegativeLong(
      minimumHistoricalLifetimeEarnedDiscoveryPoints,
      'minimumHistoricalLifetimeEarnedDiscoveryPoints',
    );

    await ensureUniverseExists(
      this.database,
      generationKey,
    );

    const {
      universeSeed,
      generatorVersionCode,
    } =
      generationKeyStorageParts(
        generationKey,
      );

    const entity =
      await this.database
        .progress
        .get([
          universeSeed,
          generatorVersionCode,
          ProgressScopeCode.GLOBAL,
          GLOBAL_PROGRESS_SCOPE_KEY,
        ]);

    if (
      entity ===
        undefined &&
      minimumHistoricalLifetimeEarnedDiscoveryPoints ===
        0n
    ) {
      return 0n;
    }

    const currentBalance =
      entity ===
        undefined
        ? 0n
        : parseNonNegativeLongDecimal(
            entity.discoveryPoints,
            'discoveryPoints',
          );

    const lifetimeFields =
      entity as
        (typeof entity &
          LifetimeEarnedGlobalProgressFields) |
        undefined;

    const persistedLifetimeValue =
      lifetimeFields
        ?.lifetimeEarnedDiscoveryPoints;

    const persistedLifetime =
      persistedLifetimeValue ===
        undefined
        ? currentBalance
        : parseNonNegativeLongDecimal(
            persistedLifetimeValue,
            'lifetimeEarnedDiscoveryPoints',
          );

    const unreconciledValue =
      lifetimeFields
        ?.unreconciledLifetimeEarnedDiscoveryPoints;

    const unreconciledEarnedDiscoveryPoints =
      unreconciledValue ===
        undefined
        ? 0n
        : parseNonNegativeLongDecimal(
            unreconciledValue,
            'unreconciledLifetimeEarnedDiscoveryPoints',
          );

    const historicalFloorWithPostUpgradeEarnings =
      addNonNegativeLong(
        minimumHistoricalLifetimeEarnedDiscoveryPoints,
        unreconciledEarnedDiscoveryPoints,
        'lifetimeEarnedDiscoveryPoints',
      );

    const repairedLifetime =
      maxBigInt(
        currentBalance,
        persistedLifetime,
        historicalFloorWithPostUpgradeEarnings,
      );

    assertNonNegativeLong(
      repairedLifetime,
      'lifetimeEarnedDiscoveryPoints',
    );

    if (
      entity !==
        undefined &&
      persistedLifetimeValue !==
        undefined &&
      unreconciledValue ===
        undefined &&
      persistedLifetime ===
        repairedLifetime
    ) {
      return repairedLifetime;
    }

    const repairedEntity =
      {
        ...createGlobalProgressEntity({
          universeSeed,
          generatorVersionCode,
          discoveryPoints:
            currentBalance,

          updatedAtEpochMs:
            this.clock(),
        }),

        lifetimeEarnedDiscoveryPoints:
          repairedLifetime
            .toString(
              10,
            ),
      };

    await this.database
      .progress
      .put(
        repairedEntity,
      );

    return repairedLifetime;
  }

  async setGlobalDiscoveryPoints(
    generationKey:
      UniverseGenerationKey,

    discoveryPoints:
      bigint,
  ): Promise<void> {

    assertNonNegativeLong(
      discoveryPoints,
      'discoveryPoints',
    );

    await ensureUniverseExists(
      this.database,
      generationKey,
    );

    const {
      universeSeed,
      generatorVersionCode,
    } =
      generationKeyStorageParts(
        generationKey,
      );

    const existing =
      await this.database
        .progress
        .get([
          universeSeed,
          generatorVersionCode,
          ProgressScopeCode.GLOBAL,
          GLOBAL_PROGRESS_SCOPE_KEY,
        ]);

    const previousBalance =
      existing ===
        undefined
        ? 0n
        : parseNonNegativeLongDecimal(
            existing.discoveryPoints,
            'discoveryPoints',
          );

    const lifetimeFields =
      existing as
        (typeof existing &
          LifetimeEarnedGlobalProgressFields) |
        undefined;

    const previousLifetimeValue =
      lifetimeFields
        ?.lifetimeEarnedDiscoveryPoints;

    const previousLifetime =
      maxBigInt(
        previousBalance,
        previousLifetimeValue ===
          undefined
          ? previousBalance
          : parseNonNegativeLongDecimal(
              previousLifetimeValue,
              'lifetimeEarnedDiscoveryPoints',
            ),
      );

    const previousUnreconciledValue =
      lifetimeFields
        ?.unreconciledLifetimeEarnedDiscoveryPoints;

    const previousUnreconciled =
      previousUnreconciledValue ===
        undefined
        ? 0n
        : parseNonNegativeLongDecimal(
            previousUnreconciledValue,
            'unreconciledLifetimeEarnedDiscoveryPoints',
          );

    const newlyEarnedDiscoveryPoints =
      discoveryPoints >
        previousBalance
        ? discoveryPoints -
          previousBalance
        : 0n;

    const lifetimeEarnedDiscoveryPoints =
      addNonNegativeLong(
        previousLifetime,
        newlyEarnedDiscoveryPoints,
        'lifetimeEarnedDiscoveryPoints',
      );

    /*
     * A row with no lifetime field is a legacy row whose exact pre-upgrade
     * fractional progress is unknowable. From this first post-upgrade write
     * onward we must still preserve every newly earned PD, even if /exploration
     * has not been opened yet. Presence of the unreconciled field records that
     * post-upgrade delta until the external-search high-water mark is applied.
     */
    const isLegacyUnreconciledRow =
      existing !==
        undefined &&
      (
        previousLifetimeValue ===
          undefined ||
        previousUnreconciledValue !==
          undefined
      );

    const unreconciledLifetimeEarnedDiscoveryPoints =
      isLegacyUnreconciledRow
        ? addNonNegativeLong(
            previousUnreconciled,
            newlyEarnedDiscoveryPoints,
            'unreconciledLifetimeEarnedDiscoveryPoints',
          )
        : null;

    const updatedEntity =
      {
        ...createGlobalProgressEntity({
          universeSeed,
          generatorVersionCode,
          discoveryPoints,

          updatedAtEpochMs:
            this.clock(),
        }),

        lifetimeEarnedDiscoveryPoints:
          lifetimeEarnedDiscoveryPoints
            .toString(
              10,
            ),

        ...(unreconciledLifetimeEarnedDiscoveryPoints ===
        null
          ? {}
          : {
              unreconciledLifetimeEarnedDiscoveryPoints:
                unreconciledLifetimeEarnedDiscoveryPoints
                  .toString(
                    10,
                  ),
            }),
      };

    await this.database
      .progress
      .put(
        updatedEntity,
      );
  }

  async getGalaxyDiscoveryPoints(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,
  ): Promise<bigint> {

    assertNonNegativeLong(
      galaxyIndex,
      'galaxyIndex',
    );

    await ensureUniverseExists(
      this.database,
      generationKey,
    );

    const {
      universeSeed,
      generatorVersionCode,
    } =
      generationKeyStorageParts(
        generationKey,
      );

    const galaxyKey =
      galaxyIndex
        .toString(
          10,
        );

    const entity =
      await this.database
        .progress
        .get([
          universeSeed,
          generatorVersionCode,
          ProgressScopeCode.GALAXY,
          galaxyKey,
        ]);

    if (
      entity ===
      undefined
    ) {
      return 0n;
    }

    return parseNonNegativeLongDecimal(
      entity.discoveryPoints,
      'discoveryPoints',
    );
  }

  async setGalaxyDiscoveryPoints(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,

    discoveryPoints:
      bigint,
  ): Promise<void> {

    assertNonNegativeLong(
      galaxyIndex,
      'galaxyIndex',
    );

    assertNonNegativeLong(
      discoveryPoints,
      'discoveryPoints',
    );

    await ensureUniverseExists(
      this.database,
      generationKey,
    );

    const {
      universeSeed,
      generatorVersionCode,
    } =
      generationKeyStorageParts(
        generationKey,
      );

    await this.database
      .progress
      .put(
        createGalaxyProgressEntity({
          universeSeed,
          generatorVersionCode,
          galaxyIndex,
          discoveryPoints,

          updatedAtEpochMs:
            this.clock(),
        }),
      );
  }

  private async getGlobalProgressEntity(
    generationKey:
      UniverseGenerationKey,
  ) {

    await ensureUniverseExists(
      this.database,
      generationKey,
    );

    const {
      universeSeed,
      generatorVersionCode,
    } =
      generationKeyStorageParts(
        generationKey,
      );

    return this.database
      .progress
      .get([
        universeSeed,
        generatorVersionCode,
        ProgressScopeCode.GLOBAL,
        GLOBAL_PROGRESS_SCOPE_KEY,
      ]);
  }
}

function addNonNegativeLong(
  left:
    bigint,

  right:
    bigint,

  propertyName:
    string,
): bigint {

  assertNonNegativeLong(
    left,
    `${propertyName}.left`,
  );

  assertNonNegativeLong(
    right,
    `${propertyName}.right`,
  );

  const result =
    left +
    right;

  assertNonNegativeLong(
    result,
    propertyName,
  );

  return result;
}

function maxBigInt(
  ...values:
    readonly bigint[]
): bigint {

  let maximum =
    0n;

  for (
    const value
    of values
  ) {
    if (
      value >
      maximum
    ) {
      maximum =
        value;
    }
  }

  return maximum;
}
