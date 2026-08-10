import {
  DiscoveryState,
  type DiscoveryStateValue,
  type KnownDiscoveryState,
} from './discovery-state';

import {
  type ProceduralLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

export class KnownDiscovery {
  readonly state:
    KnownDiscoveryState;

  constructor(
    readonly generationKey:
      UniverseGenerationKey,

    readonly locator:
      ProceduralLocator,

    state:
      DiscoveryStateValue,
  ) {
    if (
      !DiscoveryState.isKnown(
        state,
      )
    ) {
      throw new RangeError(
        'KnownDiscovery cannot have DiscoveryState.UNKNOWN.',
      );
    }

    this.state =
      state;
  }
}