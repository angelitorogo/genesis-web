import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { type GalaxyKnowledgeSnapshotEntity } from '../../data/local/entity/galaxy-knowledge-snapshot.entity';
import { type GalaxyKnowledgeSnapshotRepository } from '../../data/local/repository/dexie-galaxy-knowledge-snapshot.repository';
import { CapturedExtrasolarObjectGenerator } from '../../simulation/planetary/captured-extrasolar-object-generator';
import { CometGenerator } from '../../simulation/planetary/comet-generator';
import { TransNeptunianObjectGenerator } from '../../simulation/planetary/trans-neptunian-object-generator';
import { StellarMultihostFormation, type GeneratedSingleHost } from '../../simulation/stellar/stellar-multihost-formation';
import { StellarDesignationGenerator } from '../../simulation/stellar/stellar-designation-generator';
import {
  buildGalaxyMinorBodyCatalogSnapshot,
  DexieGalaxyMinorBodyCatalogSnapshotRuntime,
  type GalaxyKnowledgeMinorBodyCatalogSnapshot,
} from './galaxy-minor-body-catalog-snapshot.runtime';
import { GALAXY_SCIENTIFIC_MODEL_VERSION, galaxyKnowledgeRevision, stringifyBigIntTree } from './galaxy-knowledge-snapshot.runtime';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V2,
);
const confirmed = new SystemLocator(0n, 0n, 1n);
const discovered = new SystemLocator(0n, 0n, 2n);

function emptySnapshot(): GalaxyKnowledgeMinorBodyCatalogSnapshot {
  return Object.freeze({
    galaxyIndex: 0n,
    asteroids: Object.freeze([]),
    comets: Object.freeze([]),
    transNeptunianObjects: Object.freeze([]),
    capturedObjects: Object.freeze([]),
  });
}

describe('26.1c.5 minor-body catalogue snapshot runtime', () => {
  it('reuses a warm minor-body fragment for the same knowledge revision', async () => {
    const discoveries = Object.freeze([
      new KnownDiscovery(key, confirmed, DiscoveryState.CONFIRMED),
    ]);
    const snapshot = emptySnapshot();
    let stored: GalaxyKnowledgeSnapshotEntity | undefined = {
      universeSeed: key.universeSeed.serialize(),
      generatorVersionCode: key.generatorVersionCode,
      galaxyIndex: '0',
      scientificModelVersion: GALAXY_SCIENTIFIC_MODEL_VERSION,
      knowledgeRevision: galaxyKnowledgeRevision(0n, discoveries),
      minorBodyCatalogJson: stringifyBigIntTree(snapshot),
      updatedAtEpochMs: 1,
    };
    const get = vi.fn(async () => stored);
    const put = vi.fn(async (entity: GalaxyKnowledgeSnapshotEntity) => { stored = entity; });
    const repository: GalaxyKnowledgeSnapshotRepository = { get, put };
    const builder = vi.fn(() => snapshot);
    const runtime = new DexieGalaxyMinorBodyCatalogSnapshotRuntime(repository, () => 2, builder);

    const first = await runtime.resolve(key, 0n, discoveries);
    const second = await runtime.resolve(key, 0n, discoveries);
    expect(first.asteroids).toHaveLength(0);
    expect(second).toBe(first);
    expect(builder).not.toHaveBeenCalled();
    expect(get).toHaveBeenCalledTimes(1);
    expect(put).not.toHaveBeenCalled();
  });

  it('materializes minor bodies only from CONFIRMED systems and preserves all four public families', () => {
    const planetarySystem = {};
    const asteroid = {
      proceduralId: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      localDesignation: 'AST-1',
      compositionRegime: 'METALLIC',
      structureRegime: 'COHERENT',
      multiplicityRegime: 'SINGLE',
      diameterKilometers: 100,
      orbit: {
        semiMajorAxisAu: 2, eccentricity: 0.1, inclinationDegrees: 5,
        periapsisAu: 1.8, apoapsisAu: 2.2,
      },
      taxonomy: {
        bulkDensityGramsPerCubicCentimeter: 4.1,
        geometricAlbedo01: 0.2,
        iceFraction01: 0,
      },
    };
    const host = {
      label: 'A',
      internalGenerationKey: key,
      planetarySystem,
      asteroidBelts: { relevantAsteroids: Object.freeze([asteroid]) },
    } as unknown as GeneratedSingleHost;

    const multipleSpy = vi.spyOn(StellarMultihostFormation, 'generateOrNull').mockReturnValue(null);
    const singleSpy = vi.spyOn(StellarMultihostFormation, 'generateSingleOrNull').mockImplementation(
      (_key, locator) => locator.galacticObjectIndex === confirmed.galacticObjectIndex ? host : null,
    );
    const designationSpy = vi.spyOn(StellarDesignationGenerator, 'generate').mockReturnValue(
      { name: 'Asterion' } as ReturnType<typeof StellarDesignationGenerator.generate>,
    );
    const cometSpy = vi.spyOn(CometGenerator, 'generate').mockReturnValue({
      relevantComets: Object.freeze([{
        proceduralId: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
        localDesignation: 'COM-1', periodRegime: 'SHORT_PERIOD', diameterKilometers: 11,
        orbit: { semiMajorAxisAu: 4, eccentricity: 0.5, inclinationDegrees: 10 },
        periapsisAu: 2, apoapsisAu: 6, orbitalPeriodYears: 8,
        nucleusProperties: {
          bulkDensityGramsPerCubicCentimeter: 0.6,
          geometricAlbedo: 0.04,
          volatileRichnessIndex01: 0.8,
        },
      }]),
    } as ReturnType<typeof CometGenerator.generate>);
    const tnoSpy = vi.spyOn(TransNeptunianObjectGenerator, 'generate').mockReturnValue({
      relevantObjects: Object.freeze([{
        proceduralId: 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
        localDesignation: 'TNO-1', dynamicalRegime: 'DETACHED', diameterKilometers: 900,
        properties: {
          isDwarfPlanetScaleCandidate: true,
          semiMajorAxisAu: 60, eccentricity: 0.3, inclinationDegrees: 20,
          periapsisAu: 42, apoapsisAu: 78, orbitalPeriodYears: 465,
          bulkDensityGramsPerCubicCentimeter: 1.7,
          geometricAlbedo: 0.12, iceFraction01: 0.7,
        },
      }]),
    } as ReturnType<typeof TransNeptunianObjectGenerator.generate>);
    const capturedSpy = vi.spyOn(CapturedExtrasolarObjectGenerator, 'generate').mockReturnValue({
      relevantObjects: Object.freeze([{
        proceduralId: 'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
        localDesignation: 'CAP-1', compositionRegime: 'VOLATILE_RICH',
        captureRegime: 'BINARY_EXCHANGE', diameterKilometers: 8,
        orbit: {
          semiMajorAxisAu: 5, eccentricity: 0.4, inclinationDegrees: 30,
          periapsisAu: 3, apoapsisAu: 7, periodYears: 11,
        },
        properties: {
          bulkDensityGramsPerCubicCentimeter: 1.1,
          geometricAlbedo: 0.08, volatileFraction01: 0.6,
          incomingHyperbolicExcessVelocityKmPerSecond: 22,
        },
      }]),
    } as ReturnType<typeof CapturedExtrasolarObjectGenerator.generate>);

    const result = buildGalaxyMinorBodyCatalogSnapshot(key, 0n, [
      new KnownDiscovery(key, confirmed, DiscoveryState.CONFIRMED),
      new KnownDiscovery(key, discovered, DiscoveryState.DISCOVERED),
    ]);

    expect(result.asteroids).toHaveLength(1);
    expect(result.comets).toHaveLength(1);
    expect(result.transNeptunianObjects).toHaveLength(1);
    expect(result.capturedObjects).toHaveLength(1);
    expect(result.capturedObjects[0]?.systemDesignation).toBe('Asterion');
    expect(singleSpy).toHaveBeenCalledTimes(1);

    multipleSpy.mockRestore();
    singleSpy.mockRestore();
    designationSpy.mockRestore();
    cometSpy.mockRestore();
    tnoSpy.mockRestore();
    capturedSpy.mockRestore();
  });

  it('26.1c.7 invalidates the hot minor-body snapshot when system knowledge changes', async () => {
    let stored: GalaxyKnowledgeSnapshotEntity | undefined;
    const get = vi.fn(async () => stored);
    const put = vi.fn(async (entity: GalaxyKnowledgeSnapshotEntity) => { stored = entity; });
    const repository: GalaxyKnowledgeSnapshotRepository = { get, put };
    const built = emptySnapshot();
    const builder = vi.fn(() => built);
    const runtime = new DexieGalaxyMinorBodyCatalogSnapshotRuntime(repository, () => 3, builder);

    await runtime.resolve(key, 0n, [
      new KnownDiscovery(key, confirmed, DiscoveryState.DISCOVERED),
    ]);
    await runtime.resolve(key, 0n, [
      new KnownDiscovery(key, confirmed, DiscoveryState.CONFIRMED),
    ]);

    expect(builder).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenCalledTimes(2);
    expect(put).toHaveBeenCalledTimes(2);
  });

});
