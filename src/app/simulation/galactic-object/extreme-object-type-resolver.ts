import { sha256 } from '@noble/hashes/sha2.js';
import { hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  ExtremeType,
  type ExtremeType as ExtremeTypeValue,
} from '../../domain/galactic-object/extreme-object-type';

import {
  SupernovaRemnantMorphology,
} from '../../domain/galactic-object/supernova-remnant-morphology';

import {
  frozenPhysicalSourceKey,
} from '../../domain/generation/frozen-physical-source-key';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  isGalacticNucleusLocator,
} from '../../domain/universe/galactic-center';

import {
  ExplorationSectorResultEngine,
} from '../exploration/exploration-sector-result-engine';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  GalaxySectorContentGenerator,
} from '../sector/galaxy-sector-content-generator';

import {
  GalaxySectorGridGenerator,
} from '../sector/galaxy-sector-grid-generator';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  IntermediateMassBlackHoleGenerator,
} from './intermediate-mass-black-hole-generator';

import {
  SupernovaRemnantGenerator,
} from './supernova-remnant-generator';

const DOMAIN =
  utf8ToBytes(
    'GENESIS-EXTREME-OBJECT-TYPE-V2',
  );

const COMPLEMENT_TYPE_LABEL =
  utf8ToBytes(
    'reserved-complement-type',
  );

const UINT32_SCALE =
  4_294_967_296;

interface WeightedExtremeType {
  readonly type:
    ExtremeTypeValue;

  /** Gameplay distribution inside the old non-SNR/non-IMBH complement. */
  readonly weight:
    number;
}

/**
 * 28.2G.1 — V2 deterministic specialization of the point-9.4
 * EXTREME_OBJECT family.
 *
 * This resolver deliberately leaves every already-frozen V2 generator alone:
 * - point 9.4 still decides NEBULA / STAR_CLUSTER / EXTREME_OBJECT;
 * - point 12.6 keeps the exact existing SNR membership;
 * - point 27.2 keeps the exact existing rare IMBH membership;
 * - sectors, locators, object counts and persistence identities do not move.
 *
 * The only new behavior is that the historical non-SNR/non-IMBH complement is
 * no longer physically anonymous. Every ACTUAL V2 EXTREME_OBJECT locator now
 * resolves to one canonical distributed ExtremeType.
 *
 * Ground Truth is still independent from observed knowledge. Callers must not
 * expose this value before the corresponding discovery state allows it.
 */
export class ExtremeObjectTypeResolver {

  private constructor() {}

  static resolve(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): ExtremeTypeValue | null {

    if (
      !(locator instanceof
        GalacticObjectLocator)
    ) {
      throw new TypeError(
        '28.2G.1 requires an existing GalacticObjectLocator.',
      );
    }

    if (
      generationKey
        .generatorVersion !==
      GeneratorVersion.V2
    ) {
      throw new RangeError(
        `28.2G.1 supports only GeneratorVersion V2, received ${generationKey.generatorVersion.code}.`,
      );
    }

    if (
      isGalacticNucleusLocator(
        locator,
      )
    ) {
      return null;
    }

    const physicalKey =
      frozenPhysicalSourceKey(
        generationKey,
      );

    if (
      ExplorationSectorResultEngine
        .resolveGalacticObjectKind(
          physicalKey,
          locator,
        ) !==
      ExplorationResultKind
        .EXTREME_OBJECT
    ) {
      return null;
    }

    if (
      !isPopulatedV2Locator(
        generationKey,
        locator,
      )
    ) {
      return null;
    }

    /*
     * Preserve the frozen point-12.6 membership exactly. Only a pure plerion
     * is promoted to the canonical PULSAR_WIND_NEBULA taxonomy entry; shell
     * and composite remnants remain SUPERNOVA_REMNANT.
     */
    if (
      SupernovaRemnantGenerator
        .isSupernovaRemnantLocator(
          physicalKey,
          locator,
        )
    ) {
      return SupernovaRemnantGenerator
        .resolveMorphology(
          physicalKey,
          locator,
        ) ===
        SupernovaRemnantMorphology
          .PLERION
        ? ExtremeType
          .PULSAR_WIND_NEBULA
        : ExtremeType
          .SUPERNOVA_REMNANT;
    }

    /* Preserve the already-populated 27.2 rare IMBH subset exactly. */
    if (
      IntermediateMassBlackHoleGenerator
        .isIntermediateMassBlackHoleLocator(
          generationKey,
          locator,
        )
    ) {
      return ExtremeType
        .INTERMEDIATE_MASS_BLACK_HOLE;
    }

    const targetSeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          physicalKey,
          locator,
        );

    return selectComplementType(
      unit(
        targetSeed.normalizedValue,
        COMPLEMENT_TYPE_LABEL,
      ),
    );
  }
}

/**
 * Gameplay weights for the historical reserved complement only.
 * They are deterministic design weights, not measured astrophysical rates.
 * Existing SNR and IMBH probabilities remain outside this table and therefore
 * retain their exact previous membership.
 */
const COMPLEMENT_TYPES:
  readonly WeightedExtremeType[] =
  Object.freeze([
    Object.freeze({
      type:
        ExtremeType.NEUTRON_STAR,
      weight:
        0.30,
    }),
    Object.freeze({
      type:
        ExtremeType.PULSAR,
      weight:
        0.20,
    }),
    Object.freeze({
      type:
        ExtremeType.MILLISECOND_PULSAR,
      weight:
        0.08,
    }),
    Object.freeze({
      type:
        ExtremeType.MAGNETAR,
      weight:
        0.04,
    }),
    Object.freeze({
      type:
        ExtremeType.STELLAR_MASS_BLACK_HOLE,
      weight:
        0.20,
    }),
    Object.freeze({
      type:
        ExtremeType.X_RAY_BINARY_NS,
      weight:
        0.08,
    }),
    Object.freeze({
      type:
        ExtremeType.X_RAY_BINARY_BH,
      weight:
        0.05,
    }),
    Object.freeze({
      type:
        ExtremeType.MICROQUASAR,
      weight:
        0.03,
    }),
    Object.freeze({
      type:
        ExtremeType.ULX,
      weight:
        0.02,
    }),
  ]);

function selectComplementType(
  draw:
    number,
): ExtremeTypeValue {

  let cumulative =
    0;

  for (
    const candidate
    of COMPLEMENT_TYPES
  ) {
    cumulative +=
      candidate.weight;

    if (
      draw <
      cumulative
    ) {
      return candidate.type;
    }
  }

  /*
   * Floating-point accumulation can end infinitesimally below 1.0. The final
   * bucket owns that harmless rounding tail, so an EXTREME_OBJECT can never
   * fall through to null.
   */
  return ExtremeType.ULX;
}

function isPopulatedV2Locator(
  generationKey:
    UniverseGenerationKey,

  locator:
    GalacticObjectLocator,
): boolean {

  const galaxy =
    GalaxyGenerator.generate(
      generationKey,
      locator.galaxyIndex,
    );

  const grid =
    GalaxySectorGridGenerator
      .generate(
        galaxy,
      );

  const coordinates =
    grid.coordinatesFor(
      locator.sectorKey,
    );

  return GalaxySectorContentGenerator
    .generate(
      galaxy,
      coordinates,
    )
    .galacticObjectLocators
    .some(
      candidate =>
        candidate.galacticObjectIndex ===
        locator.galacticObjectIndex,
    );
}

function unit(
  targetSeedHex:
    string,

  label:
    Uint8Array,
): number {

  const digest =
    sha256
      .create()
      .update(
        DOMAIN,
      )
      .update(
        hexToBytes(
          targetSeedHex,
        ),
      )
      .update(
        label,
      )
      .digest();

  const value =
    (
      digest[0]! *
        0x1000000 +
      digest[1]! *
        0x10000 +
      digest[2]! *
        0x100 +
      digest[3]!
    ) >>>
    0;

  return value /
    UINT32_SCALE;
}
