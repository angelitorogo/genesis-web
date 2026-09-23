import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { InitialExplorationState } from '../../domain/exploration/initial-exploration-state';
import { GalaxySectorContent } from '../../domain/sector/galaxy-sector-content';
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { GalaxySectorGrid } from '../../domain/sector/galaxy-sector-grid';
import { Galaxy } from '../../domain/universe/galaxy';
import { InitialExplorationStateGenerator } from '../exploration/initial-exploration-state-generator';
import { GalaxySectorContentGenerator } from '../sector/galaxy-sector-content-generator';
import { GalaxySectorGridGenerator } from '../sector/galaxy-sector-grid-generator';
import { multihostPhysicalSourceKey } from '../stellar/stellar-multihost-physical-source-key';
import { GalaxyGenerator } from './galaxy-generator';

/**
 * Stage 12: read-only bridge for V2's initial galaxy and sector catalogue.
 *
 * V2 retains the validated V1 morphology, dimensions and sector lineage while
 * owning its explicit nuclear distribution. Generate only the unchanged
 * galactic/sector inputs in a PRIVATE V1 scope, then obtain the public galaxy
 * from GalaxyGenerator so its V2 nucleus is not overwritten. Neither the V1
 * key nor V1 domain objects leave this boundary. This read-only bridge does
 * not persist data.
 */
export interface V2GalacticSource {
  readonly generationKey: UniverseGenerationKey;
  readonly initialExploration: InitialExplorationState;
  readonly galaxy: Galaxy;
  readonly grid: GalaxySectorGrid;
}

export interface V2SectorSource extends V2GalacticSource {
  readonly sector: GalaxySectorContent;
}

export class V2GalacticSourceBuilder {
  private constructor() {}

  private static materialize(key: UniverseGenerationKey, galaxyIndex: bigint) {
    if (key.generatorVersion !== GeneratorVersion.V2) {
      throw new RangeError('V2GalacticSourceBuilder requires a canonical V2 generation key.');
    }
    const physicalKey = multihostPhysicalSourceKey(key);
    const physicalGalaxy = GalaxyGenerator.generate(physicalKey, galaxyIndex);
    const physicalGrid = GalaxySectorGridGenerator.generate(physicalGalaxy);
    const galaxy = GalaxyGenerator.generate(key, galaxyIndex);
    if (galaxy.seed.normalizedValue !== physicalGalaxy.seed.normalizedValue ||
        galaxy.type !== physicalGalaxy.type) {
      throw new Error('V2 galactic source changed its frozen morphology or baseline physics.');
    }
    const grid = new GalaxySectorGrid(key, physicalGrid.galaxyIndex,
      physicalGrid.sectorSizeLightYears, physicalGrid.halfExtentInSectors);
    const source: V2GalacticSource = Object.freeze({ generationKey: key,
      initialExploration: InitialExplorationStateGenerator.generate(key), galaxy, grid });
    return { source, physicalGalaxy };
  }

  static galaxy(key: UniverseGenerationKey, galaxyIndex: bigint): V2GalacticSource {
    return this.materialize(key, galaxyIndex).source;
  }

  static sector(key: UniverseGenerationKey, galaxyIndex: bigint,
    coordinates: GalaxySectorCoordinates): V2SectorSource {
    const { source, physicalGalaxy } = this.materialize(key, galaxyIndex);
    // Generate solely within the private V1 scope. The public V2 sector is
    // constructed anew; it contains only addresses, density and physical seed.
    const physicalSector = GalaxySectorContentGenerator.generate(physicalGalaxy, coordinates);
    const locator = source.grid.locatorFor(coordinates);
    if (locator.galaxyIndex !== physicalSector.locator.galaxyIndex ||
        locator.sectorKey !== physicalSector.locator.sectorKey) {
      throw new Error('V2 and physical V1 sector addressing disagree.');
    }
    const sector = new GalaxySectorContent(key, locator, coordinates, physicalSector.seed,
      physicalSector.stellarDensity, physicalSector.systemLocators,
      physicalSector.galacticObjectLocators);
    return Object.freeze({ ...source, sector });
  }
}
