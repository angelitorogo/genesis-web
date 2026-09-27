import { TestBed } from '@angular/core/testing';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import {
  GalaxyLocator,
  SectorLocator,
} from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ExplorationSectorResultEngine } from '../../simulation/exploration/exploration-sector-result-engine';
import { ExplorationSectorScanEngine } from '../../simulation/exploration/exploration-sector-scan-engine';
import { GalaxySectorGridGenerator } from '../../simulation/sector/galaxy-sector-grid-generator';
import { GalaxyGenerator } from '../../simulation/universe/galaxy-generator';
import { GalaxyVisualStructureGenerator } from '../../simulation/universe/galaxy-visual-structure-generator';
import { ExternalGalaxyPreliminaryInformationGenerator } from '../../simulation/observation/galaxy/external-galaxy-preliminary-information-generator';
import { EXPLORATION_SECTOR_PROGRESS_RUNTIME } from '../runtime/exploration-sector-progress.runtime';
import { GENESIS_LOCAL_REPOSITORIES } from '../runtime/genesis-local-repositories';
import { UniverseSeedFacade } from '../universe/universe-seed.facade';
import { CODES_REDEMPTION_RUNTIME } from '../codes/codes-redemption.runtime';
import { GalacticMapDiscoveryMarkers } from './galactic-map-discovery-markers';
import { GalacticMapExplorationCoverage } from './galactic-map-exploration-coverage';
import { GalacticMapFacade } from './galactic-map.facade';
import { GalacticMapModel } from './galactic-map-model';

describe('GalacticMapFacade step 3 incremental exploration refresh', () => {
  const generationKey = new UniverseGenerationKey(
    UniverseSeed.parse('B10C-0000-0000-0000-0000-0000-0000-0003'),
    GeneratorVersion.V2,
  );

  it('extends coverage and markers in memory without a repository-wide refresh', async () => {
    const repositories = {
      discoveryRepository: {
        getKnownDiscoveries: vi.fn(),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        GalacticMapFacade,
        {
          provide: GENESIS_LOCAL_REPOSITORIES,
          useValue: repositories,
        },
        {
          provide: UniverseSeedFacade,
          useValue: {},
        },
        {
          provide: CODES_REDEMPTION_RUNTIME,
          useValue: {},
        },
        {
          provide: EXPLORATION_SECTOR_PROGRESS_RUNTIME,
          useValue: {
            commitResolvedResult: vi.fn().mockResolvedValue({
              awardedDiscoveryPoints: 0,
            }),
          },
        },
      ],
    });

    const facade = TestBed.inject(GalacticMapFacade);
    const galaxy = GalaxyGenerator.generate(generationKey, 0n);
    const prepared = ExplorationSectorScanEngine.prepareSector(
      generationKey,
      0n,
      1,
      0,
    );
    const grid = GalaxySectorGridGenerator.generate(
      galaxy,
    );

    const preliminary = ExternalGalaxyPreliminaryInformationGenerator.generate(
      generationKey,
      0n,
      DiscoveryState.CONFIRMED,
    );

    const initialModel = new GalacticMapModel(
      generationKey,
      0n,
      preliminary,
      GalaxyVisualStructureGenerator.generate(galaxy),
      galaxy.type,
      new GalacticMapExplorationCoverage(
        generationKey,
        0n,
        grid,
        [],
      ),
      new GalacticMapDiscoveryMarkers(
        generationKey,
        0n,
        grid,
        [],
      ),
      null,
      null,
    );

    (
      facade as unknown as {
        stateSignal: { set(value: unknown): void };
      }
    ).stateSignal.set({
      kind: 'content',
      model: initialModel,
    });

    const result = ExplorationSectorResultEngine.resolve(
      ExplorationSectorScanEngine.scan(prepared),
    );

    const refresh = vi.spyOn(facade, 'refresh').mockResolvedValue(undefined);

    const applied = (
      facade as unknown as {
        applyExplorationResultsIncrementally(
          results: readonly typeof result[],
        ): boolean;
      }
    ).applyExplorationResultsIncrementally([result]);

    expect(applied).toBe(true);
    expect(refresh).not.toHaveBeenCalled();
    expect(repositories.discoveryRepository.getKnownDiscoveries).not.toHaveBeenCalled();

    const model = facade.model();
    expect(model?.explorationCoverage?.exploredSectorCount).toBe(1);
    expect(model?.discoveryMarkers?.markerCount).toBe(result.locatedTargetCount);

    const identities = model?.discoveryMarkers?.markers.map(marker => [
      marker.locator.sectorKey,
      marker.locator.galacticObjectIndex,
      marker.resultKind,
      marker.state.code,
    ]);

    expect(identities).toEqual(
      result.locatedTargets.map(target => [
        target.locator.sectorKey,
        target.locator.galacticObjectIndex,
        target.kind,
        DiscoveryState.DETECTED.code,
      ]),
    );
  });
});
