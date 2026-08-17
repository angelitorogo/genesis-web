import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  ExplorationDetectionKind,
  ExplorationSectorScanResult,
  ExplorationSectorSelection,
} from '../../domain/exploration/exploration-sector-scan';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorCoordinates,
} from '../../domain/sector/galaxy-sector-coordinates';

import {
  ObservationClassificationCatalogV1,
} from '../observation/observation-classification-catalog';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  GalaxySectorGridGenerator,
} from '../sector/galaxy-sector-grid-generator';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

const V1_SCAN_DOMAIN =
  utf8ToBytes(
    'GENESIS-EXPLORATION-SECTOR-SCAN-V1',
  );

const V1_DETECTION_KIND_LABEL =
  utf8ToBytes(
    'detection-kind',
  );

/**
 * Pure point-9.3 sector-scan flow engine.
 *
 * Responsibilities:
 * - resolve the active galaxy's already-defined sector grid;
 * - validate one selected coordinate pair through that canonical grid;
 * - derive a deterministic SIGNAL/ANOMALY observation cue from an isolated
 *   SHA-256 branch of the existing SectorSeed;
 * - attach the point-8.9 initial scientific classification (Unclassified).
 *
 * Deliberate limits:
 * - does not call GalaxySectorContentGenerator;
 * - reveals no systems, galactic objects, nebulae, clusters, extreme objects
 *   or events (9.4);
 * - awards or persists no PD/progress (9.5);
 * - mutates no DiscoveryState;
 * - performs no repository writes;
 * - consumes no GenesisRandom/SFC64 draws;
 * - does not perturb any frozen procedural stream.
 */
export class ExplorationSectorScanEngine {

  private constructor() {}

  static prepareSector(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,

    sectorX:
      number,

    sectorY:
      number,
  ): ExplorationSectorSelection {

    if (
      generationKey
        .generatorVersion !==
      GeneratorVersion.V1
    ) {
      throw new RangeError(
        `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
      );
    }

    const galaxy =
      GalaxyGenerator
        .generate(
          generationKey,
          galaxyIndex,
        );

    const grid =
      GalaxySectorGridGenerator
        .generate(
          galaxy,
        );

    const coordinates =
      new GalaxySectorCoordinates(
        sectorX,
        sectorY,
      );

    const locator =
      grid
        .locatorFor(
          coordinates,
        );

    return new ExplorationSectorSelection(
      generationKey,
      galaxyIndex,
      sectorX,
      sectorY,
      grid.minCoordinate,
      grid.maxCoordinate,
      locator,
    );
  }

  static scan(
    selection:
      ExplorationSectorSelection,
  ): ExplorationSectorScanResult {

    const canonicalSelection =
      this
        .prepareSector(
          selection
            .generationKey,
          selection
            .galaxyIndex,
          selection
            .sectorX,
          selection
            .sectorY,
        );

    if (
      canonicalSelection
        .sectorLocator
        .sectorKey !==
      selection
        .sectorLocator
        .sectorKey
    ) {
      throw new RangeError(
        'selection must resolve to the canonical active-galaxy sector identity.',
      );
    }

    const sectorSeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          canonicalSelection
            .generationKey,
          canonicalSelection
            .sectorLocator,
        );

    const digest =
      sha256
        .create()
        .update(
          V1_SCAN_DOMAIN,
        )
        .update(
          hexToBytes(
            sectorSeed
              .normalizedValue,
          ),
        )
        .update(
          V1_DETECTION_KIND_LABEL,
        )
        .digest();

    const detectionKind =
      (
        digest[0] &
        0x01
      ) ===
      0
        ? ExplorationDetectionKind
            .SIGNAL
        : ExplorationDetectionKind
            .ANOMALY;

    return new ExplorationSectorScanResult(
      canonicalSelection,
      detectionKind,
      ObservationClassificationCatalogV1
        .initialClassification,
    );
  }
}
