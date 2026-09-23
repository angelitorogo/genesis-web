import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  GalacticObjectScientificSubject,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

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

    // Point 12.6 intentionally preserves a reserved EXTREME_OBJECT complement.
    // 12.7 does not invent a physical classification for those locators.
    return null;
  }
}
