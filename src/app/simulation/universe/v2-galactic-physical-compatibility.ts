import { GeneratorVersion } from '../../domain/generation/generator-version';
import {
  GalacticObjectLocator,
  type SystemLocator,
} from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type InitialExplorationState } from '../../domain/exploration/initial-exploration-state';
import { GalaxySectorContent } from '../../domain/sector/galaxy-sector-content';
import { type GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { GalaxySectorGrid } from '../../domain/sector/galaxy-sector-grid';
import { type GalaxySectorObjectLocation } from '../../domain/sector/galaxy-sector-object-location';
import { type GalaxySectorStellarPopulationProperties } from '../../domain/sector/galaxy-sector-stellar-population-properties';
import { Galaxy } from '../../domain/universe/galaxy';
import { InitialExplorationStateGenerator } from '../exploration/initial-exploration-state-generator';
import { GalaxySectorContentGenerator } from '../sector/galaxy-sector-content-generator';
import { GalaxySectorGridGenerator } from '../sector/galaxy-sector-grid-generator';
import { GalaxySectorObjectLocationResolver } from '../sector/galaxy-sector-object-location-resolver';
import {
  GalaxySectorStellarPopulationPropertiesGenerator,
} from '../sector/galaxy-sector-stellar-population-properties-generator';
import { multihostPhysicalSourceKey } from '../stellar/stellar-multihost-physical-source-key';
import { GalaxyGenerator } from './galaxy-generator';

export interface V2GalacticSectorSource {
  readonly galaxy: Galaxy;
  readonly grid: GalaxySectorGrid;
  readonly content: GalaxySectorContent;
  readonly stellarPopulation: GalaxySectorStellarPopulationProperties;
}

/**
 * Stage 12: an EXPLICIT, read-only compatibility seam for the galactic inputs
 * needed by the stage-11 V2 stellar formation. It reuses the already-frozen
 * V1 physical galaxy/sector algorithms in PRIVATE scopes, and rebinds their
 * resulting domain objects to the actual V2 universe identity. The physical
 * seed lineage deliberately remains identical to the one used by
 * StellarMultihostFormation; do not independently derive a second V2 galaxy
 * seed here, or the environment and the stellar system will disagree.
 *
 * This bridge remains an explicit read-only compatibility entry point.
 * Stage 12.2 activates the normal V2 galactic resolver and universe bootstrap;
 * broader archive/discovery and body-level integration belongs to stage 13.
 */
export class V2GalacticPhysicalCompatibility {
  private constructor() {}

  static galaxy(key: UniverseGenerationKey, galaxyIndex: bigint): Galaxy {
    requireV2(key);
    // GalaxyGenerator is the canonical public V2 binding. Morphology and
    // baseline magnitudes still come from V1, while the nucleus follows the
    // intentional V2 distribution instead of leaking the private V1 nucleus.
    return GalaxyGenerator.generate(key, galaxyIndex);
  }

  static sector(
    key: UniverseGenerationKey,
    galaxyIndex: bigint,
    coordinates: GalaxySectorCoordinates,
  ): V2GalacticSectorSource {
    requireV2(key);
    const physicalGalaxy = GalaxyGenerator.generate(multihostPhysicalSourceKey(key), galaxyIndex);
    const physicalGrid = GalaxySectorGridGenerator.generate(physicalGalaxy);
    const physicalContent = GalaxySectorContentGenerator.generate(physicalGalaxy, coordinates);
    const stellarPopulation = GalaxySectorStellarPopulationPropertiesGenerator.generate(
      physicalGalaxy, physicalContent.stellarDensity,
    );

    const galaxy = this.galaxy(key, galaxyIndex);
    const grid = new GalaxySectorGrid(
      key, galaxyIndex, physicalGrid.sectorSizeLightYears, physicalGrid.halfExtentInSectors,
    );
    const content = new GalaxySectorContent(
      key,
      grid.locatorFor(coordinates),
      coordinates,
      physicalContent.seed,
      physicalContent.stellarDensity,
      physicalContent.systemLocators,
      physicalContent.galacticObjectLocators,
    );
    if (content.systemLocators.length !== physicalContent.systemLocators.length ||
        content.galacticObjectLocators.length !== physicalContent.galacticObjectLocators.length) {
      throw new Error('The V2 sector binding changed its physical content.');
    }
    return Object.freeze({ galaxy, grid, content, stellarPopulation });
  }

  static systemLocation(key: UniverseGenerationKey, locator: SystemLocator): GalaxySectorObjectLocation {
    requireV2(key);
    return GalaxySectorObjectLocationResolver.resolve(multihostPhysicalSourceKey(key), locator);
  }

  static galacticObjectLocation(
    key: UniverseGenerationKey, locator: GalacticObjectLocator,
  ): GalaxySectorObjectLocation {
    requireV2(key);
    return GalaxySectorObjectLocationResolver.resolve(multihostPhysicalSourceKey(key), locator);
  }

  static initialExplorationState(key: UniverseGenerationKey): InitialExplorationState {
    requireV2(key);
    // InitialExplorationState only contains versionless locators and knowledge;
    // no V1 UniverseGenerationKey or physical Ground Truth escapes this seam.
    return InitialExplorationStateGenerator.generate(multihostPhysicalSourceKey(key));
  }
}

function requireV2(key: UniverseGenerationKey): void {
  if (key.generatorVersion !== GeneratorVersion.V2) {
    throw new RangeError('V2 galactic compatibility requires the canonical V2 generation version.');
  }
}
