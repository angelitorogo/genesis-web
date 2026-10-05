import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';

import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  ExtremeType,
  type ExtremeType as ExtremeTypeValue,
} from '../../domain/galactic-object/extreme-object-type';

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
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

import {
  GalacticCenterNucleusResolver,
} from '../nuclear/galactic-center-nucleus-resolver';

import {
  GalacticSupermassiveBlackHoleGenerator,
} from '../nuclear/galactic-supermassive-black-hole-generator';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  ExtremeObjectTypeResolver,
} from './extreme-object-type-resolver';

import {
  IntermediateMassBlackHoleGenerator,
} from './intermediate-mass-black-hole-generator';

export type GravitationalLensingLensClass =
  | 'INTERMEDIATE_MASS_BLACK_HOLE'
  | 'SUPERMASSIVE_BLACK_HOLE';

export interface GravitationalLensingReconstructionProfile {
  readonly sourceType:
    | typeof ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE
    | typeof ExtremeType.AGN
    | typeof ExtremeType.QUASAR;

  readonly lensClass:
    GravitationalLensingLensClass;

  /** Canonical pre-existing lens mass; never inferred from renderer geometry. */
  readonly lensMassSolarMasses:
    number;

  /** Schwarzschild reference already owned by the canonical compact model. */
  readonly schwarzschildRadiusKm:
    number;

  /** Outcome of this 28.6 high-resolution imaging campaign. */
  readonly reconstructableLensingSignatureDetected:
    boolean;

  /** Reconstructed source-plane displacement beta/theta_E. */
  readonly reconstructedSourceOffsetEinsteinRadii:
    number | null;

  /** Positive-parity image coordinate theta+/theta_E. */
  readonly primaryImagePositionEinsteinRadii:
    number | null;

  /** Negative-parity image coordinate theta-/theta_E (signed). */
  readonly secondaryImagePositionEinsteinRadii:
    number | null;

  readonly imageSeparationEinsteinRadii:
    number | null;

  readonly primaryAbsoluteMagnification:
    number | null;

  readonly secondaryAbsoluteMagnification:
    number | null;

  readonly totalAbsoluteMagnification:
    number | null;

  readonly primaryToSecondaryFluxRatio:
    number | null;

  /** F_source / F_observed after de-lensing the compact source. */
  readonly reconstructedIntrinsicFluxFractionOfObserved:
    number | null;

  /** Astrometric centroid shift delta-theta/theta_E for a point lens. */
  readonly centroidShiftEinsteinRadii:
    number | null;

  /** Geometric+Shapiro differential delay for the point-mass model. */
  readonly differentialTimeDelaySeconds:
    number | null;

  /** Closure residual after inverting the two reconstructed image positions. */
  readonly sourcePlaneClosureResidualEinsteinRadii:
    number | null;
}

const DOMAIN =
  'GENESIS-GRAVITATIONAL-LENSING-RECONSTRUCTION-28.6-V1';

const UINT32_SCALE =
  4_294_967_296;

const SPEED_OF_LIGHT_KM_S =
  299_792.458;

/**
 * Gameplay sampling envelope for finding one reconstructable compact background
 * source in the monitored field. This is deliberately NOT an empirical lensing
 * occurrence rate and does not alter generated object membership.
 */
const RECONSTRUCTABLE_FIELD_FRACTION =
  0.68;

/**
 * 28.6 — deterministic point-mass gravitational-lensing reconstruction.
 *
 * Scientific boundaries:
 * - Only targets with a canonical scientific mass already present in GENESIS
 *   are eligible: an existing IMBH or the existing SMBH of an AGN/QUASAR.
 * - The renderer is never consulted for mass, alignment or lensing outcome.
 * - Reconstruction is expressed in Einstein-radius units because the current
 *   world model has no authoritative observer-lens-source distance triangle.
 * - The lens is Schwarzschild/point-mass only. Kerr spin, host-galaxy shear,
 *   extended source morphology and cosmological redshift are not invented.
 * - The campaign may return a non-detection; that does not imply zero weak
 *   lensing, only that no strong/reconstructable compact-source configuration
 *   was recovered by this campaign.
 */
export class GravitationalLensingReconstructionProfileEngine {

  private constructor() {}

  static resolveConfirmed(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,

    knowledgeState:
      DiscoveryStateValue,
  ): GravitationalLensingReconstructionProfile | null {

    if (
      !(locator instanceof
        GalacticObjectLocator)
    ) {
      throw new TypeError(
        '28.6 requires a GalacticObjectLocator.',
      );
    }

    if (
      generationKey.generatorVersion !==
        GeneratorVersion.V2
    ) {
      return null;
    }

    if (
      DiscoveryState
        .fromCode(
          knowledgeState.code,
        )
        .code <
      DiscoveryState.CONFIRMED.code
    ) {
      return null;
    }

    const lens =
      resolveEligibleLens(
        generationKey,
        locator,
      );

    if (
      lens ===
        null
    ) {
      return null;
    }

    const draws =
      independentDraws(
        generationKey,
        locator,
        lens.sourceType,
      );

    const reconstructableLensingSignatureDetected =
      draws[0]! <
        RECONSTRUCTABLE_FIELD_FRACTION;

    if (
      !reconstructableLensingSignatureDetected
    ) {
      return Object.freeze({
        ...lens,
        reconstructableLensingSignatureDetected:
          false,
        reconstructedSourceOffsetEinsteinRadii:
          null,
        primaryImagePositionEinsteinRadii:
          null,
        secondaryImagePositionEinsteinRadii:
          null,
        imageSeparationEinsteinRadii:
          null,
        primaryAbsoluteMagnification:
          null,
        secondaryAbsoluteMagnification:
          null,
        totalAbsoluteMagnification:
          null,
        primaryToSecondaryFluxRatio:
          null,
        reconstructedIntrinsicFluxFractionOfObserved:
          null,
        centroidShiftEinsteinRadii:
          null,
        differentialTimeDelaySeconds:
          null,
        sourcePlaneClosureResidualEinsteinRadii:
          null,
      });
    }

    // Select one compact background-source candidate inside the strong-lensing
    // reconstruction window. beta/theta_E is dimensionless and therefore does
    // not fabricate an absolute angular scale.
    const sourceOffset =
      roundScientific(
        0.08 +
          1.12 *
            draws[1]!,
      );

    const discriminant =
      Math.sqrt(
        sourceOffset **
          2 +
        4,
      );

    const primaryImagePosition =
      roundScientific(
        (
          sourceOffset +
          discriminant
        ) /
          2,
      );

    const secondaryImagePosition =
      roundScientific(
        (
          sourceOffset -
          discriminant
        ) /
          2,
      );

    const magnificationTerm =
      (
        sourceOffset **
          2 +
        2
      ) /
      (
        2 *
        sourceOffset *
        discriminant
      );

    const primaryAbsoluteMagnification =
      roundScientific(
        0.5 +
          magnificationTerm,
      );

    const secondaryAbsoluteMagnification =
      roundScientific(
        magnificationTerm -
          0.5,
      );

    const totalAbsoluteMagnification =
      roundScientific(
        primaryAbsoluteMagnification +
          secondaryAbsoluteMagnification,
      );

    const primaryToSecondaryFluxRatio =
      roundScientific(
        primaryAbsoluteMagnification /
          secondaryAbsoluteMagnification,
      );

    const centroidShiftEinsteinRadii =
      roundScientific(
        sourceOffset /
          (
            sourceOffset **
              2 +
            2
          ),
      );

    const delayKernel =
      0.5 *
        sourceOffset *
        discriminant +
      Math.log(
        (
          discriminant +
          sourceOffset
        ) /
        (
          discriminant -
          sourceOffset
        ),
      );

    // 4GM/c^3 = 2 Rs / c. Reuse the canonical Schwarzschild radius rather
    // than introducing a second mass-to-delay constant path.
    const differentialTimeDelaySeconds =
      roundScientific(
        2 *
          lens.schwarzschildRadiusKm /
          SPEED_OF_LIGHT_KM_S *
          delayKernel,
      );

    const reconstructedSourceOffset =
      roundScientific(
        primaryImagePosition +
          secondaryImagePosition,
      );

    const closureResidual =
      roundScientific(
        Math.abs(
          reconstructedSourceOffset -
            sourceOffset,
        ),
      );

    return Object.freeze({
      ...lens,
      reconstructableLensingSignatureDetected:
        true,
      reconstructedSourceOffsetEinsteinRadii:
        reconstructedSourceOffset,
      primaryImagePositionEinsteinRadii:
        primaryImagePosition,
      secondaryImagePositionEinsteinRadii:
        secondaryImagePosition,
      imageSeparationEinsteinRadii:
        roundScientific(
          primaryImagePosition -
            secondaryImagePosition,
        ),
      primaryAbsoluteMagnification,
      secondaryAbsoluteMagnification,
      totalAbsoluteMagnification,
      primaryToSecondaryFluxRatio,
      reconstructedIntrinsicFluxFractionOfObserved:
        roundScientific(
          1 /
            totalAbsoluteMagnification,
        ),
      centroidShiftEinsteinRadii,
      differentialTimeDelaySeconds,
      sourcePlaneClosureResidualEinsteinRadii:
        closureResidual,
    });
  }
}

interface EligibleLens {
  readonly sourceType:
    GravitationalLensingReconstructionProfile['sourceType'];

  readonly lensClass:
    GravitationalLensingLensClass;

  readonly lensMassSolarMasses:
    number;

  readonly schwarzschildRadiusKm:
    number;
}

function resolveEligibleLens(
  generationKey:
    UniverseGenerationKey,

  locator:
    GalacticObjectLocator,
): EligibleLens | null {

  if (
    isGalacticNucleusLocator(
      locator,
    )
  ) {
    const galaxy =
      GalaxyGenerator.generate(
        generationKey,
        locator.galaxyIndex,
      );

    const nucleusState =
      GalacticCenterNucleusResolver
        .resolveState(
          galaxy,
        );

    const sourceType =
      nucleusState ===
        GalacticNucleusState.AGN
        ? ExtremeType.AGN
        : nucleusState ===
            GalacticNucleusState.QUASAR
          ? ExtremeType.QUASAR
          : null;

    if (
      sourceType ===
        null
    ) {
      return null;
    }

    const blackHole =
      GalacticSupermassiveBlackHoleGenerator
        .fromGalaxy(
          galaxy,
        );

    if (
      blackHole ===
        null
    ) {
      return null;
    }

    return Object.freeze({
      sourceType,
      lensClass:
        'SUPERMASSIVE_BLACK_HOLE' as const,
      lensMassSolarMasses:
        blackHole.physicalProfile
          .massSolarMasses,
      schwarzschildRadiusKm:
        blackHole.physicalProfile
          .schwarzschildRadiusKm,
    });
  }

  if (
    ExtremeObjectTypeResolver
      .resolve(
        generationKey,
        locator,
      ) !==
    ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE
  ) {
    return null;
  }

  const intermediate =
    IntermediateMassBlackHoleGenerator
      .generate(
        generationKey,
        locator,
      );

  if (
    intermediate ===
      null
  ) {
    return null;
  }

  return Object.freeze({
    sourceType:
      ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
    lensClass:
      'INTERMEDIATE_MASS_BLACK_HOLE' as const,
    lensMassSolarMasses:
      intermediate.physicalProperties
        .massSolar,
    schwarzschildRadiusKm:
      intermediate.physicalProperties
        .schwarzschildRadiusKm,
  });
}

function independentDraws(
  generationKey:
    UniverseGenerationKey,

  locator:
    GalacticObjectLocator,

  sourceType:
    ExtremeTypeValue,
): readonly number[] {

  const physicalKey =
    isGalacticNucleusLocator(
      locator,
    )
      ? generationKey
      : frozenPhysicalSourceKey(
          generationKey,
        );

  const targetSeed =
    ProceduralTargetResolver
      .resolveTargetSeed(
        physicalKey,
        locator,
      );

  const bytes =
    sha256(
      utf8ToBytes(
        [
          DOMAIN,
          targetSeed.normalizedValue,
          sourceType,
        ].join(
          ':',
        ),
      ),
    );

  const view =
    new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    );

  return Object.freeze([
    view.getUint32(
      0,
      false,
    ) /
      UINT32_SCALE,
    view.getUint32(
      4,
      false,
    ) /
      UINT32_SCALE,
  ]);
}

function roundScientific(
  value:
    number,
): number {

  if (
    value ===
      0
  ) {
    return 0;
  }

  return Number(
    value.toPrecision(
      12,
    ),
  );
}
