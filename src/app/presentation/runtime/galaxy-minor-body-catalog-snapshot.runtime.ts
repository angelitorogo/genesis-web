import { InjectionToken } from '@angular/core';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { type KnownDiscovery } from '../../domain/discovery/known-discovery';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type GalaxyKnowledgeSnapshotEntity } from '../../data/local/entity/galaxy-knowledge-snapshot.entity';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import {
  DexieGalaxyKnowledgeSnapshotRepository,
  type GalaxyKnowledgeSnapshotRepository,
} from '../../data/local/repository/dexie-galaxy-knowledge-snapshot.repository';
import { CapturedExtrasolarObjectGenerator } from '../../simulation/planetary/captured-extrasolar-object-generator';
import { CometGenerator } from '../../simulation/planetary/comet-generator';
import { TransNeptunianObjectGenerator } from '../../simulation/planetary/trans-neptunian-object-generator';
import {
  StellarMultihostFormation,
  type GeneratedSingleHost,
} from '../../simulation/stellar/stellar-multihost-formation';
import { multihostPhysicalSourceKey } from '../../simulation/stellar/stellar-multihost-physical-source-key';
import { StellarDesignationGenerator } from '../../simulation/stellar/stellar-designation-generator';
import {
  GALAXY_SCIENTIFIC_MODEL_VERSION,
  galaxyKnowledgeRevision,
  parseBigIntTree,
  stringifyBigIntTree,
} from './galaxy-knowledge-snapshot.runtime';

export type GalaxyKnowledgeMinorBodyKind = 'ASTEROID' | 'COMET' | 'TNO' | 'CAPTURED';

export interface GalaxyKnowledgeMinorBodyCatalogEntry {
  readonly id: string;
  readonly kind: GalaxyKnowledgeMinorBodyKind;
  readonly proceduralId: string;
  readonly designation: string;
  readonly parentSystemLocator: SystemLocator;
  readonly systemDesignation: string;
  readonly hostLabel: string;
  readonly subtype: string;
  readonly secondarySubtype: string | null;
  readonly tertiarySubtype: string | null;
  readonly diameterKilometers: number;
  readonly semiMajorAxisAu: number;
  readonly eccentricity: number;
  readonly inclinationDegrees: number;
  readonly periapsisAu: number;
  readonly apoapsisAu: number;
  readonly orbitalPeriodYears: number | null;
  readonly densityGramsPerCubicCentimeter: number | null;
  readonly albedo01: number | null;
  readonly volatileOrIceFraction01: number | null;
  readonly incomingVelocityKmPerSecond: number | null;
}

export interface GalaxyKnowledgeMinorBodyCatalogSnapshot {
  readonly galaxyIndex: bigint;
  readonly asteroids: readonly GalaxyKnowledgeMinorBodyCatalogEntry[];
  readonly comets: readonly GalaxyKnowledgeMinorBodyCatalogEntry[];
  readonly transNeptunianObjects: readonly GalaxyKnowledgeMinorBodyCatalogEntry[];
  readonly capturedObjects: readonly GalaxyKnowledgeMinorBodyCatalogEntry[];
}

export interface GalaxyMinorBodyCatalogSnapshotRuntime {
  resolve(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    knownDiscoveries: readonly KnownDiscovery[],
  ): Promise<GalaxyKnowledgeMinorBodyCatalogSnapshot>;
}

export const GALAXY_MINOR_BODY_CATALOG_SNAPSHOT_RUNTIME =
  new InjectionToken<GalaxyMinorBodyCatalogSnapshotRuntime>(
    'GALAXY_MINOR_BODY_CATALOG_SNAPSHOT_RUNTIME',
    {
      providedIn: 'root',
      factory: () => new DexieGalaxyMinorBodyCatalogSnapshotRuntime(
        new DexieGalaxyKnowledgeSnapshotRepository(new GenesisIndexedDb()),
      ),
    },
  );

interface GalaxyMinorBodyHotSnapshot {
  readonly generationKey: UniverseGenerationKey;
  readonly galaxyIndex: bigint;
  readonly knowledgeRevision: string;
  readonly snapshot: GalaxyKnowledgeMinorBodyCatalogSnapshot;
}

/**
 * 26.1c.5 derived read-model for individually materialized minor bodies.
 *
 * Knowledge boundary: only persisted CONFIRMED systems may expose their phase-22
 * individually addressable inventory. This mirrors the expanded galaxy knowledge
 * counters and never scans undiscovered systems to complete the catalogue.
 */
export class DexieGalaxyMinorBodyCatalogSnapshotRuntime
  implements GalaxyMinorBodyCatalogSnapshotRuntime {

  private hotSnapshot: GalaxyMinorBodyHotSnapshot | null = null;

  constructor(
    private readonly repository: GalaxyKnowledgeSnapshotRepository,
    private readonly clock: () => number = Date.now,
    private readonly builder: typeof buildGalaxyMinorBodyCatalogSnapshot =
      buildGalaxyMinorBodyCatalogSnapshot,
  ) {}

  async resolve(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    knownDiscoveries: readonly KnownDiscovery[],
  ): Promise<GalaxyKnowledgeMinorBodyCatalogSnapshot> {
    const knowledgeRevision = galaxyKnowledgeRevision(galaxyIndex, knownDiscoveries);
    if (
      this.hotSnapshot !== null &&
      this.hotSnapshot.galaxyIndex === galaxyIndex &&
      this.hotSnapshot.knowledgeRevision === knowledgeRevision &&
      this.hotSnapshot.generationKey.equals(generationKey)
    ) {
      return this.hotSnapshot.snapshot;
    }

    const existing = await this.repository.get(
      generationKey,
      galaxyIndex,
      GALAXY_SCIENTIFIC_MODEL_VERSION,
    );

    if (
      existing !== undefined &&
      existing.knowledgeRevision === knowledgeRevision &&
      existing.minorBodyCatalogJson !== undefined
    ) {
      const snapshot = restoreSnapshot(existing.minorBodyCatalogJson);
      this.hotSnapshot = Object.freeze({
        generationKey: generationKey.copy(),
        galaxyIndex,
        knowledgeRevision,
        snapshot,
      });
      return snapshot;
    }

    const snapshot = this.builder(generationKey, galaxyIndex, knownDiscoveries);
    const reusableExisting =
      existing !== undefined && existing.knowledgeRevision === knowledgeRevision
        ? existing
        : undefined;

    await this.repository.put({
      ...reusableExisting,
      universeSeed: generationKey.universeSeed.serialize(),
      generatorVersionCode: generationKey.generatorVersionCode,
      galaxyIndex: galaxyIndex.toString(10),
      scientificModelVersion: GALAXY_SCIENTIFIC_MODEL_VERSION,
      knowledgeRevision,
      minorBodyCatalogJson: stringifyBigIntTree(snapshot),
      updatedAtEpochMs: this.clock(),
    });

    this.hotSnapshot = Object.freeze({
      generationKey: generationKey.copy(),
      galaxyIndex,
      knowledgeRevision,
      snapshot,
    });
    return snapshot;
  }
}

export function buildGalaxyMinorBodyCatalogSnapshot(
  generationKey: UniverseGenerationKey,
  galaxyIndex: bigint,
  knownDiscoveries: readonly KnownDiscovery[],
): GalaxyKnowledgeMinorBodyCatalogSnapshot {
  const asteroids: GalaxyKnowledgeMinorBodyCatalogEntry[] = [];
  const comets: GalaxyKnowledgeMinorBodyCatalogEntry[] = [];
  const transNeptunianObjects: GalaxyKnowledgeMinorBodyCatalogEntry[] = [];
  const capturedObjects: GalaxyKnowledgeMinorBodyCatalogEntry[] = [];

  for (const discovery of knownDiscoveries) {
    if (
      !(discovery.locator instanceof SystemLocator) ||
      discovery.locator.galaxyIndex !== galaxyIndex ||
      discovery.state.code < DiscoveryState.CONFIRMED.code
    ) {
      continue;
    }

    const locator = discovery.locator;
    const systemDesignation = safeSystemDesignation(generationKey, locator);
    const multiple = StellarMultihostFormation.generateOrNull(generationKey, locator);
    const hosts = multiple?.components ?? [StellarMultihostFormation.generateSingleOrNull(generationKey, locator)];

    for (const host of hosts) {
      if (host === null || host.planetarySystem === null) continue;
      projectHost(
        locator,
        systemDesignation,
        host,
        asteroids,
        comets,
        transNeptunianObjects,
        capturedObjects,
      );
    }
  }

  const compare = (left: GalaxyKnowledgeMinorBodyCatalogEntry, right: GalaxyKnowledgeMinorBodyCatalogEntry) =>
    compareSystemThenBody(left.parentSystemLocator, left.id, right.parentSystemLocator, right.id);
  asteroids.sort(compare);
  comets.sort(compare);
  transNeptunianObjects.sort(compare);
  capturedObjects.sort(compare);

  return Object.freeze({
    galaxyIndex,
    asteroids: Object.freeze(asteroids),
    comets: Object.freeze(comets),
    transNeptunianObjects: Object.freeze(transNeptunianObjects),
    capturedObjects: Object.freeze(capturedObjects),
  });
}

function projectHost(
  parentSystemLocator: SystemLocator,
  systemDesignation: string,
  host: GeneratedSingleHost,
  asteroids: GalaxyKnowledgeMinorBodyCatalogEntry[],
  comets: GalaxyKnowledgeMinorBodyCatalogEntry[],
  transNeptunianObjects: GalaxyKnowledgeMinorBodyCatalogEntry[],
  capturedObjects: GalaxyKnowledgeMinorBodyCatalogEntry[],
): void {
  const planetarySystem = host.planetarySystem;
  if (planetarySystem === null) return;

  if (host.asteroidBelts !== null) {
    for (const body of host.asteroidBelts.relevantAsteroids) {
      asteroids.push(Object.freeze({
        id: minorBodyId(parentSystemLocator, 'ASTEROID', body.proceduralId),
        kind: 'ASTEROID' as const,
        proceduralId: body.proceduralId,
        designation: body.localDesignation,
        parentSystemLocator,
        systemDesignation,
        hostLabel: host.label,
        subtype: body.compositionRegime,
        secondarySubtype: body.structureRegime,
        tertiarySubtype: body.multiplicityRegime,
        diameterKilometers: body.diameterKilometers,
        semiMajorAxisAu: body.orbit.semiMajorAxisAu,
        eccentricity: body.orbit.eccentricity,
        inclinationDegrees: body.orbit.inclinationDegrees,
        periapsisAu: body.orbit.periapsisAu,
        apoapsisAu: body.orbit.apoapsisAu,
        orbitalPeriodYears: null,
        densityGramsPerCubicCentimeter: body.taxonomy.bulkDensityGramsPerCubicCentimeter,
        albedo01: body.taxonomy.geometricAlbedo01,
        volatileOrIceFraction01: body.taxonomy.iceFraction01,
        incomingVelocityKmPerSecond: null,
      }));
    }
  }

  const cometSystem = CometGenerator.generate(host.internalGenerationKey, planetarySystem);
  for (const body of cometSystem.relevantComets) {
    comets.push(Object.freeze({
      id: minorBodyId(parentSystemLocator, 'COMET', body.proceduralId),
      kind: 'COMET' as const,
      proceduralId: body.proceduralId,
      designation: body.localDesignation,
      parentSystemLocator,
      systemDesignation,
      hostLabel: host.label,
      subtype: body.periodRegime,
      secondarySubtype: null,
      tertiarySubtype: null,
      diameterKilometers: body.diameterKilometers,
      semiMajorAxisAu: body.orbit.semiMajorAxisAu,
      eccentricity: body.orbit.eccentricity,
      inclinationDegrees: body.orbit.inclinationDegrees,
      periapsisAu: body.periapsisAu,
      apoapsisAu: body.apoapsisAu,
      orbitalPeriodYears: body.orbitalPeriodYears,
      densityGramsPerCubicCentimeter: body.nucleusProperties.bulkDensityGramsPerCubicCentimeter,
      albedo01: body.nucleusProperties.geometricAlbedo,
      volatileOrIceFraction01: body.nucleusProperties.volatileRichnessIndex01,
      incomingVelocityKmPerSecond: null,
    }));
  }

  const tnoSystem = TransNeptunianObjectGenerator.generate(host.internalGenerationKey, planetarySystem);
  for (const body of tnoSystem.relevantObjects) {
    transNeptunianObjects.push(Object.freeze({
      id: minorBodyId(parentSystemLocator, 'TNO', body.proceduralId),
      kind: 'TNO' as const,
      proceduralId: body.proceduralId,
      designation: body.localDesignation,
      parentSystemLocator,
      systemDesignation,
      hostLabel: host.label,
      subtype: body.dynamicalRegime,
      secondarySubtype: body.properties.isDwarfPlanetScaleCandidate ? 'DWARF_PLANET_SCALE' : null,
      tertiarySubtype: null,
      diameterKilometers: body.diameterKilometers,
      semiMajorAxisAu: body.properties.semiMajorAxisAu,
      eccentricity: body.properties.eccentricity,
      inclinationDegrees: body.properties.inclinationDegrees,
      periapsisAu: body.properties.periapsisAu,
      apoapsisAu: body.properties.apoapsisAu,
      orbitalPeriodYears: body.properties.orbitalPeriodYears,
      densityGramsPerCubicCentimeter: body.properties.bulkDensityGramsPerCubicCentimeter,
      albedo01: body.properties.geometricAlbedo,
      volatileOrIceFraction01: body.properties.iceFraction01,
      incomingVelocityKmPerSecond: null,
    }));
  }

  const capturedSystem = CapturedExtrasolarObjectGenerator.generate(host.internalGenerationKey, planetarySystem);
  for (const body of capturedSystem.relevantObjects) {
    capturedObjects.push(Object.freeze({
      id: minorBodyId(parentSystemLocator, 'CAPTURED', body.proceduralId),
      kind: 'CAPTURED' as const,
      proceduralId: body.proceduralId,
      designation: body.localDesignation,
      parentSystemLocator,
      systemDesignation,
      hostLabel: host.label,
      subtype: body.compositionRegime,
      secondarySubtype: body.captureRegime,
      tertiarySubtype: null,
      diameterKilometers: body.diameterKilometers,
      semiMajorAxisAu: body.orbit.semiMajorAxisAu,
      eccentricity: body.orbit.eccentricity,
      inclinationDegrees: body.orbit.inclinationDegrees,
      periapsisAu: body.orbit.periapsisAu,
      apoapsisAu: body.orbit.apoapsisAu,
      orbitalPeriodYears: body.orbit.periodYears,
      densityGramsPerCubicCentimeter: body.properties.bulkDensityGramsPerCubicCentimeter,
      albedo01: body.properties.geometricAlbedo,
      volatileOrIceFraction01: body.properties.volatileFraction01,
      incomingVelocityKmPerSecond: body.properties.incomingHyperbolicExcessVelocityKmPerSecond,
    }));
  }
}

function safeSystemDesignation(
  generationKey: UniverseGenerationKey,
  locator: SystemLocator,
): string {
  return StellarDesignationGenerator.generate(
    multihostPhysicalSourceKey(generationKey),
    locator,
  ).name;
}

function minorBodyId(
  locator: SystemLocator,
  kind: GalaxyKnowledgeMinorBodyKind,
  proceduralId: string,
): string {
  return `${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}:${kind}:${proceduralId}`;
}

function compareSystemThenBody(
  leftSystem: SystemLocator,
  leftId: string,
  rightSystem: SystemLocator,
  rightId: string,
): number {
  if (leftSystem.sectorKey !== rightSystem.sectorKey) {
    return leftSystem.sectorKey < rightSystem.sectorKey ? -1 : 1;
  }
  if (leftSystem.galacticObjectIndex !== rightSystem.galacticObjectIndex) {
    return leftSystem.galacticObjectIndex < rightSystem.galacticObjectIndex ? -1 : 1;
  }
  return leftId.localeCompare(rightId, 'en');
}

function restoreSnapshot(json: string): GalaxyKnowledgeMinorBodyCatalogSnapshot {
  const raw = parseBigIntTree(json) as RawSnapshot;
  return Object.freeze({
    galaxyIndex: raw.galaxyIndex,
    asteroids: Object.freeze(raw.asteroids.map(restoreEntry)),
    comets: Object.freeze(raw.comets.map(restoreEntry)),
    transNeptunianObjects: Object.freeze(raw.transNeptunianObjects.map(restoreEntry)),
    capturedObjects: Object.freeze(raw.capturedObjects.map(restoreEntry)),
  });
}

interface RawSystemLocator {
  readonly galaxyIndex: bigint;
  readonly sectorKey: bigint;
  readonly galacticObjectIndex: bigint;
}

interface RawEntry extends Omit<GalaxyKnowledgeMinorBodyCatalogEntry, 'parentSystemLocator'> {
  readonly parentSystemLocator: RawSystemLocator;
}

interface RawSnapshot {
  readonly galaxyIndex: bigint;
  readonly asteroids: readonly RawEntry[];
  readonly comets: readonly RawEntry[];
  readonly transNeptunianObjects: readonly RawEntry[];
  readonly capturedObjects: readonly RawEntry[];
}

function restoreEntry(raw: RawEntry): GalaxyKnowledgeMinorBodyCatalogEntry {
  return Object.freeze({
    ...raw,
    parentSystemLocator: new SystemLocator(
      raw.parentSystemLocator.galaxyIndex,
      raw.parentSystemLocator.sectorKey,
      raw.parentSystemLocator.galacticObjectIndex,
    ),
  });
}
