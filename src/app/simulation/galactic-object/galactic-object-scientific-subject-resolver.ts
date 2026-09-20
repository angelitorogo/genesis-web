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

import { frozenPhysicalSourceKey } from '../../domain/generation/frozen-physical-source-key';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

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

    // Point 12.6 intentionally preserves a reserved EXTREME_OBJECT complement.
    // 12.7 does not invent a physical classification for those locators.
    return null;
  }
}
