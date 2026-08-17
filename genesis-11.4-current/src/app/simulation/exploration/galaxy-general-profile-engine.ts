import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  GalaxyGeneralProfile,
} from '../../domain/exploration/galaxy-general-profile';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ExternalGalaxyPreliminaryInformationGenerator,
} from '../observation/galaxy/external-galaxy-preliminary-information-generator';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  GalaxyKnownNameResolver,
} from './galaxy-known-name-resolver';

/**
 * Point-11.3 pure builder for one knowledge-safe galaxy general profile.
 *
 * It reuses existing deterministic generators but only returns fields already
 * allowed by the current knowledge state. The full Galaxy object is never
 * exposed by this API.
 */
export class GalaxyGeneralProfileEngine {

  private constructor() {}

  static build(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,

    discoveryState:
      DiscoveryStateValue,
  ): GalaxyGeneralProfile {

    const canonicalState =
      DiscoveryState
        .fromCode(
          discoveryState.code,
        );

    if (
      !DiscoveryState.isKnown(
        canonicalState,
      )
    ) {
      throw new RangeError(
        'GalaxyGeneralProfileEngine requires DiscoveryState >= DETECTED.',
      );
    }

    const preliminaryInformation =
      ExternalGalaxyPreliminaryInformationGenerator
        .generate(
          generationKey,
          galaxyIndex,
          canonicalState,
        );

    const knownName =
      GalaxyKnownNameResolver
        .resolve(
          generationKey,
          galaxyIndex,
          canonicalState,
        );

    const galaxyType =
      canonicalState.code >=
        DiscoveryState
          .DISCOVERED
          .code
        ? GalaxyGenerator
            .generate(
              generationKey,
              galaxyIndex,
            )
            .type
        : null;

    return new GalaxyGeneralProfile(
      preliminaryInformation,
      knownName,
      galaxyType,
    );
  }
}
