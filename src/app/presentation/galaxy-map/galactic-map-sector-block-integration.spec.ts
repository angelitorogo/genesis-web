import { TestBed } from '@angular/core/testing';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GalaxySectorGrid } from '../../domain/sector/galaxy-sector-grid';
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { EXPLORATION_SECTOR_PROGRESS_RUNTIME } from '../runtime/exploration-sector-progress.runtime';
import { GENESIS_LOCAL_REPOSITORIES } from '../runtime/genesis-local-repositories';
import { UniverseSeedFacade } from '../universe/universe-seed.facade';
import { CODES_REDEMPTION_RUNTIME } from '../codes/codes-redemption.runtime';
import { GalacticMapExplorationCoverage } from './galactic-map-exploration-coverage';
import { GalacticMapDiscoveryMarkers } from './galactic-map-discovery-markers';
import { GalacticMapFacade } from './galactic-map.facade';
import { type GalacticMapModel } from './galactic-map-model';

const seed = UniverseSeed.parse('B10C-0000-0000-0000-0000-0000-0000-0002');
const key = new UniverseGenerationKey(seed, GeneratorVersion.V2);
const grid = new GalaxySectorGrid(key, 0n, 1, 10);
function selected(x: number, y: number, explored: boolean) {
  const coordinates = new GalaxySectorCoordinates(x, y);
  return { coordinates, explored, sectorKey: grid.sectorKeyFor(coordinates) };
}

describe('Mapa V2: exploración en lotes con canje real exigido', () => {
  let facade: GalacticMapFacade;
  let limit: ReturnType<typeof vi.fn>;
  let commit: ReturnType<typeof vi.fn>;
  let commitBatch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    limit = vi.fn().mockResolvedValue(2);
    commit = vi.fn().mockResolvedValue({ awardedDiscoveryPoints: 7 });
    commitBatch = vi.fn().mockImplementation(async (results: readonly unknown[]) => ({
      processedSectors: results.length,
      awardedDiscoveryPoints: results.length * 7,
      globalDiscoveryPointsBefore: 0n,
      globalDiscoveryPointsAfter: BigInt(results.length * 7),
      galaxyProgressUnitsBefore: 0n,
      galaxyProgressUnitsAfter: BigInt(results.length),
    }));
    TestBed.configureTestingModule({ providers: [
      GalacticMapFacade,
      { provide: CODES_REDEMPTION_RUNTIME, useValue: { getMaxSectorBlockSize: limit } },
      { provide: EXPLORATION_SECTOR_PROGRESS_RUNTIME, useValue: { commitResolvedResult: commit, commitResolvedResults: commitBatch } },
      { provide: GENESIS_LOCAL_REPOSITORIES, useValue: {} },
      { provide: UniverseSeedFacade, useValue: {} },
    ] });
    facade = TestBed.inject(GalacticMapFacade);
    const coverage = new GalacticMapExplorationCoverage(
      key, 0n, grid, [new GalaxySectorCoordinates(0, 0)],
    );
    const discoveryMarkers = new GalacticMapDiscoveryMarkers(
      key, 0n, grid, [],
    );

    /*
     * Keep this integration fixture deliberately lightweight while exposing
     * the complete detailed-map snapshots required by the step-3 incremental
     * path. The facade will replace its internal content state after commit.
     */
    Object.defineProperty(facade, 'model', { configurable: true, value: () => ({
      generationKey: key,
      galaxyIndex: 0n,
      explorationCoverage: coverage,
      discoveryMarkers,
      canExploreSectors: true,
    } as unknown as GalacticMapModel) });
    vi.spyOn(facade, 'refresh').mockResolvedValue(undefined);
    vi.spyOn(
      facade as unknown as { applyExplorationResultsIncrementally(results: readonly unknown[]): boolean },
      'applyExplorationResultsIncrementally',
    ).mockReturnValue(true);
  });

  it('procesa solo los 3 sectores pendientes, suma PD reales y actualiza el mapa sin refresh global', async () => {
    await facade.exploreBlock(selected(0, 0, true), 2);
    expect(limit).toHaveBeenCalledWith(key);
    expect(commit).not.toHaveBeenCalled();
    expect(commitBatch).toHaveBeenCalledTimes(1);
    expect(commitBatch.mock.calls[0][0]).toHaveLength(3);
    expect(facade.blockProgress()).toEqual({ size: 2, total: 4, skipped: 1, processed: 3, awarded: 21 });
    expect(facade.inlineExplorationPending()).toBe(false);
    expect(facade.refresh).not.toHaveBeenCalled();
  });

  it('un tamaño no canjeado no genera ni persiste sectores', async () => {
    await facade.exploreBlock(selected(0, 0, true), 10);
    expect(commit).not.toHaveBeenCalled();
    expect(commitBatch).not.toHaveBeenCalled();
    expect(facade.inlineExplorationErrorMessage()).toContain('no está desbloqueado');
    expect(facade.inlineExplorationPending()).toBe(false);
  });

  it('un fallo del batch no deja progreso parcial ni refresca el mapa', async () => {
    commitBatch.mockRejectedValueOnce(new Error('fallo de IndexedDB'));
    await facade.exploreBlock(selected(0, 0, true), 2);
    expect(commit).not.toHaveBeenCalled();
    expect(commitBatch).toHaveBeenCalledTimes(1);
    expect(facade.blockProgress()?.processed).toBe(0);
    expect(facade.inlineExplorationErrorMessage()).toContain('Sectores registrados: 0');
    expect(facade.refresh).not.toHaveBeenCalled();
  });
});
