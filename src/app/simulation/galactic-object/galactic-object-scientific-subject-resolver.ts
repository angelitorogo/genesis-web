import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  GalacticObjectScientificSubject,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

import {
  ExtremeType,
} from '../../domain/galactic-object/extreme-object-type';

import {
  type GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import { frozenPhysicalSourceKey } from '../../domain/generation/frozen-physical-source-key';

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
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  ExtremeObjectTypeResolver,
} from './extreme-object-type-resolver';

import {
  GlobularClusterGenerator,
} from './globular-cluster-generator';

import {
  HiiRegionGenerator,
} from './hii-region-generator';

import {
  NebulaGenerator,
} from './nebula-generator';

import {
  OpenClusterGenerator,
} from './open-cluster-generator';

import {
  SupernovaRemnantGenerator,
} from './supernova-remnant-generator';
import { IntermediateMassBlackHoleGenerator } from './intermediate-mass-black-hole-generator';

/**
 * Point-12.7 Ground-Truth-to-scientific-action routing boundary.
 *
 * The resolver refuses DETECTED targets. This prevents the dedicated action
 * layer from becoming a side channel that reveals point-12.x physical
 * specialization immediately after the coarse point-9.4 scan.
 */
export class GalacticObjectScientificSubjectResolver {

  private constructor() {}

  static resolve(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,

    observedState:
      DiscoveryStateValue,
  ): GalacticObjectScientificSubject | null {

    // Frozen galactic subtype physics is shared with V2; never persist this key.
    const physicalKey = frozenPhysicalSourceKey(generationKey);

    const canonicalState =
      DiscoveryState
        .fromCode(
          observedState.code,
        );

    if (
      canonicalState.code <
      DiscoveryState.DISCOVERED.code
    ) {
      throw new RangeError(
        'Point-12.7 physical scientific subject cannot be resolved before DiscoveryState.DISCOVERED.',
      );
    }

    /*
     * The central address is version-owned Ground Truth, unlike the ordinary
     * galactic-object families below. A V2 QUIESCENT centre keeps the existing
     * globular-cluster scientific path. Only V2 AGN/QUASAR centres enter the
     * additive active-nucleus route; V1 keeps its frozen private routing.
     */
    if (
      isGalacticNucleusLocator(
        locator,
      )
    ) {
      const nucleusState =
        GalacticCenterNucleusResolver.resolveState(
          GalaxyGenerator.generate(
            generationKey,
            locator.galaxyIndex,
          ),
        );

      if (
        nucleusState ===
        GalacticNucleusState.QUIESCENT
      ) {
        return GalacticObjectScientificSubject.GLOBULAR_CLUSTER;
      }

      return generationKey.generatorVersion ===
        GeneratorVersion.V2
        ? GalacticObjectScientificSubject.ACTIVE_GALACTIC_NUCLEUS
        : null;
    }

    if (
      HiiRegionGenerator
        .isHiiRegionLocator(
          physicalKey,
          locator,
        )
    ) {
      return GalacticObjectScientificSubject
        .HII_REGION;
    }

    if (
      NebulaGenerator
        .isNebulaLocator(
          physicalKey,
          locator,
        )
    ) {
      return GalacticObjectScientificSubject
        .NEBULA;
    }

    if (
      OpenClusterGenerator
        .isOpenClusterLocator(
          physicalKey,
          locator,
        )
    ) {
      return GalacticObjectScientificSubject
        .OPEN_CLUSTER;
    }

    if (
      GlobularClusterGenerator
        .isGlobularClusterLocator(
          physicalKey,
          locator,
        )
    ) {
      return GalacticObjectScientificSubject
        .GLOBULAR_CLUSTER;
    }

    /*
     * Frozen pre-28.2G scientific routes stay authoritative for the physical
     * families that already existed in gameplay. In particular, SNR and IMBH
     * must resolve identically in V1 and V2 even for golden compatibility
     * locators that are queried directly rather than reached through the
     * current sector-content enumerator. The new V2 resolver below owns only
     * the formerly anonymous distributed EXTREME_OBJECT complement.
     */
    if (
      SupernovaRemnantGenerator
        .isSupernovaRemnantLocator(
          physicalKey,
          locator,
        )
    ) {
      return GalacticObjectScientificSubject
        .SUPERNOVA_REMNANT;
    }

    if (
      IntermediateMassBlackHoleGenerator
        .isIntermediateMassBlackHoleLocator(
          generationKey,
          locator,
        )
    ) {
      return GalacticObjectScientificSubject
        .INTERMEDIATE_MASS_BLACK_HOLE;
    }

    /*
     * 28.2G.1/28.2G.3: V2 has one canonical Ground-Truth resolver for the
     * complete distributed EXTREME_OBJECT population. Exact ExtremeType stays
     * hidden at DISCOVERED. The action layer receives only a broad scientific
     * subject so every real extreme can advance to CATALOGUED/CONFIRMED
     * without leaking whether it is a pulsar, magnetar, stellar BH, XRB, etc.
     */
    if (
      generationKey.generatorVersion ===
      GeneratorVersion.V2
    ) {
      const extremeType =
        ExtremeObjectTypeResolver.resolve(
          generationKey,
          locator,
        );

      if (
        extremeType ===
          ExtremeType.SUPERNOVA_REMNANT ||
        extremeType ===
          ExtremeType.PULSAR_WIND_NEBULA
      ) {
        return GalacticObjectScientificSubject
          .SUPERNOVA_REMNANT;
      }

      if (
        extremeType ===
        ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE
      ) {
        return GalacticObjectScientificSubject
          .INTERMEDIATE_MASS_BLACK_HOLE;
      }

      switch (extremeType) {
        case ExtremeType.NEUTRON_STAR:
        case ExtremeType.PULSAR:
        case ExtremeType.MILLISECOND_PULSAR:
        case ExtremeType.MAGNETAR:
        case ExtremeType.STELLAR_MASS_BLACK_HOLE:
        case ExtremeType.X_RAY_BINARY_NS:
        case ExtremeType.X_RAY_BINARY_BH:
        case ExtremeType.MICROQUASAR:
        case ExtremeType.ULX:
          return GalacticObjectScientificSubject
            .DISTRIBUTED_EXTREME_OBJECT;

        case ExtremeType.SMBH:
        case ExtremeType.AGN:
        case ExtremeType.QUASAR:
          // Nuclear-only ExtremeTypes never belong to a distributed locator.
          return null;
      }

      return null;
    }

    /* Frozen V1 routing remains byte-for-byte equivalent in behavior. */
    if (
      SupernovaRemnantGenerator
        .isSupernovaRemnantLocator(
          physicalKey,
          locator,
        )
    ) {
      return GalacticObjectScientificSubject
        .SUPERNOVA_REMNANT;
    }

    // Check only the 27.2 rare, actually populated, non-nuclear complement.
    // No branch is queried before DISCOVERED: DETECTED remains strictly coarse.
    if (IntermediateMassBlackHoleGenerator.isIntermediateMassBlackHoleLocator(generationKey, locator)) {
      return GalacticObjectScientificSubject.INTERMEDIATE_MASS_BLACK_HOLE;
    }

    return null;
  }
}
