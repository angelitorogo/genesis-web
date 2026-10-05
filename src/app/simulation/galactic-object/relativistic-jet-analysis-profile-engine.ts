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
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  CompactAccretionEngine,
} from '../stellar/compact-accretion-engine';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  ExtremeObjectTypeResolver,
} from './extreme-object-type-resolver';

export interface GalacticRelativisticJetAnalysisProfile {
  readonly sourceType:
    | typeof ExtremeType.AGN
    | typeof ExtremeType.QUASAR
    | typeof ExtremeType.MICROQUASAR;

  /** Observation outcome for the 28.5 campaign, not a renderer flag. */
  readonly jetSignatureDetected:
    boolean;

  /** Intrinsic bulk Lorentz factor of the characterized flow. */
  readonly bulkLorentzFactor:
    number | null;

  /** Relativistic bulk speed as beta=v/c. */
  readonly bulkVelocityFractionC:
    number | null;

  /** Bipolar axis angle to the observer, folded to 0..90 degrees. */
  readonly observerAxisAngleDegrees:
    number | null;

  readonly approachingDopplerFactor:
    number | null;

  readonly recedingDopplerFactor:
    number | null;

  /** Apparent sky-plane speed; may exceed c without superluminal matter. */
  readonly apparentApproachingSpeedC:
    number | null;

  /** Purely kinematic delta_app/delta_rec contrast, with no flux law assumed. */
  readonly dopplerAsymmetryRatio:
    number | null;

  /** Available only where 27.7 already has a canonical accretion model. */
  readonly totalBipolarKineticPowerWatts:
    number | null;

  readonly powerPerJetWatts:
    number | null;
}

const DOMAIN =
  'GENESIS-RELATIVISTIC-JET-ANALYSIS-28.5-V1';

const UINT32_SCALE =
  4_294_967_296;

/**
 * 28.5 — deterministic relativistic-jet analysis reference for CONFIRMED V2
 * targets with an already-justified jet-observing context.
 *
 * Deliberate boundaries:
 * - AGN/QUASAR may return a non-detection; their historical jet render is only
 *   illustrative and is NEVER used as Ground Truth.
 * - MICROQUASAR is the only distributed type whose classification itself
 *   establishes a jet-launching regime. Bare stellar/IMBH black holes are not
 *   promoted to accreting/jetting systems here even though their taxonomy says
 *   a future jet model is physically possible.
 * - Nuclear kinetic power is derived only through the existing 27.7 canonical
 *   accretion model. No power is invented for a distributed microquasar until
 *   it has an equivalent scientific accretion-rate model.
 * - No seed, DiscoveryState, PD, renderer parameter or generation membership
 *   is modified by this analysis.
 */
export class GalacticRelativisticJetAnalysisProfileEngine {

  private constructor() {}

  static resolveConfirmed(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,

    knowledgeState:
      DiscoveryStateValue,
  ): GalacticRelativisticJetAnalysisProfile | null {

    if (
      !(locator instanceof
        GalacticObjectLocator)
    ) {
      throw new TypeError(
        '28.5 requires a GalacticObjectLocator.',
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

    const sourceType =
      resolveEligibleSourceType(
        generationKey,
        locator,
      );

    if (
      sourceType ===
        null
    ) {
      return null;
    }

    const draws =
      independentDraws(
        generationKey,
        locator,
        sourceType,
      );

    const jetSignatureDetected =
      sourceType ===
        ExtremeType.MICROQUASAR ||
      draws[0]! <
        nuclearJetDetectionFraction(
          sourceType,
        );

    if (
      !jetSignatureDetected
    ) {
      return Object.freeze({
        sourceType,
        jetSignatureDetected:
          false,
        bulkLorentzFactor:
          null,
        bulkVelocityFractionC:
          null,
        observerAxisAngleDegrees:
          null,
        approachingDopplerFactor:
          null,
        recedingDopplerFactor:
          null,
        apparentApproachingSpeedC:
          null,
        dopplerAsymmetryRatio:
          null,
        totalBipolarKineticPowerWatts:
          null,
        powerPerJetWatts:
          null,
      });
    }

    const [minimumGamma, maximumGamma] =
      lorentzEnvelope(
        sourceType,
      );

    const bulkLorentzFactor =
      round(
        logLerp(
          minimumGamma,
          maximumGamma,
          draws[1]!,
        ),
        8,
      );

    const beta =
      Math.sqrt(
        1 -
        1 /
          bulkLorentzFactor **
            2,
      );

    // Isotropic bipolar-axis orientation after folding the physically
    // equivalent 90..180 degree half into 0..90 degrees.
    const observerAxisAngleDegrees =
      round(
        Math.acos(
          draws[2]!,
        ) *
          180 /
          Math.PI,
        6,
      );

    const theta =
      observerAxisAngleDegrees *
      Math.PI /
      180;

    const cosine =
      Math.cos(
        theta,
      );

    const sine =
      Math.sin(
        theta,
      );

    const approachingDopplerFactor =
      roundScientific(
        1 /
          (
            bulkLorentzFactor *
            (
              1 -
              beta *
                cosine
            )
          ),
      );

    const recedingDopplerFactor =
      roundScientific(
        1 /
          (
            bulkLorentzFactor *
            (
              1 +
              beta *
                cosine
            )
          ),
      );

    const apparentApproachingSpeedC =
      roundScientific(
        beta *
          sine /
          (
            1 -
            beta *
              cosine
          ),
      );

    const dopplerAsymmetryRatio =
      roundScientific(
        approachingDopplerFactor /
          recedingDopplerFactor,
      );

    let totalBipolarKineticPowerWatts:
      number | null =
      null;

    let powerPerJetWatts:
      number | null =
      null;

    if (
      sourceType ===
        ExtremeType.AGN ||
      sourceType ===
        ExtremeType.QUASAR
    ) {
      const galaxy =
        GalaxyGenerator.generate(
          generationKey,
          locator.galaxyIndex,
        );

      const accretion =
        CompactAccretionEngine
          .fromExistingGalaxy(
            galaxy,
            {
              launchingEstablished:
                true,
              sourceIdentity:
                `jet28_5_g${locator.galaxyIndex.toString(10)}`,
              bulkLorentzFactor,
              observerAxisAngleDegrees,
              kineticEnergyFraction:
                round(
                  0.025 +
                    0.225 *
                      draws[3]!,
                  8,
                ),
            },
          );

      if (
        accretion?.jet ===
          null ||
        accretion?.jet ===
          undefined
      ) {
        throw new Error(
          '28.5 active nuclear jet analysis requires the existing 27.7 accretion context.',
        );
      }

      totalBipolarKineticPowerWatts =
        roundScientific(
          accretion.jet
            .totalBipolarKineticPowerWatts,
        );

      powerPerJetWatts =
        roundScientific(
          accretion.jet
            .powerPerJetWatts,
        );
    }

    return Object.freeze({
      sourceType,
      jetSignatureDetected:
        true,
      bulkLorentzFactor,
      bulkVelocityFractionC:
        roundScientific(
          beta,
        ),
      observerAxisAngleDegrees,
      approachingDopplerFactor,
      recedingDopplerFactor,
      apparentApproachingSpeedC,
      dopplerAsymmetryRatio,
      totalBipolarKineticPowerWatts,
      powerPerJetWatts,
    });
  }
}

function resolveEligibleSourceType(
  generationKey:
    UniverseGenerationKey,

  locator:
    GalacticObjectLocator,
): GalacticRelativisticJetAnalysisProfile['sourceType'] | null {

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

    if (
      nucleusState ===
        GalacticNucleusState.AGN
    ) {
      return ExtremeType.AGN;
    }

    if (
      nucleusState ===
        GalacticNucleusState.QUASAR
    ) {
      return ExtremeType.QUASAR;
    }

    return null;
  }

  return ExtremeObjectTypeResolver
    .resolve(
      generationKey,
      locator,
    ) ===
    ExtremeType.MICROQUASAR
      ? ExtremeType.MICROQUASAR
      : null;
}

function nuclearJetDetectionFraction(
  sourceType:
    GalacticRelativisticJetAnalysisProfile['sourceType'],
): number {

  switch (
    sourceType
  ) {
    case ExtremeType.QUASAR:
      return 0.24;

    case ExtremeType.AGN:
      return 0.30;

    case ExtremeType.MICROQUASAR:
      return 1;
  }
}

function lorentzEnvelope(
  sourceType:
    GalacticRelativisticJetAnalysisProfile['sourceType'],
): readonly [number, number] {

  switch (
    sourceType
  ) {
    case ExtremeType.QUASAR:
      return [4, 20];

    case ExtremeType.AGN:
      return [2, 12];

    case ExtremeType.MICROQUASAR:
      return [1.4, 6];
  }
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

  return Object.freeze(
    Array.from(
      {
        length:
          4,
      },
      (
        _,
        index,
      ) =>
        view.getUint32(
          index *
            4,
          false,
        ) /
        UINT32_SCALE,
    ),
  );
}

function logLerp(
  minimum:
    number,

  maximum:
    number,

  fraction:
    number,
): number {

  return Math.exp(
    Math.log(
      minimum,
    ) +
      (
        Math.log(
          maximum,
        ) -
        Math.log(
          minimum,
        )
      ) *
        fraction,
  );
}

function round(
  value:
    number,

  digits:
    number,
): number {

  const factor =
    10 **
    digits;

  return Math.round(
    value *
      factor,
  ) /
    factor;
}

function roundScientific(
  value:
    number,
): number {

  return Number(
    value.toPrecision(
      12,
    ),
  );
}
