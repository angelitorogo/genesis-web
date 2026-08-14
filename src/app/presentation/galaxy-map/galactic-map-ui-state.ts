import {
  type GalacticMapModel,
} from './galactic-map-model';

export type GalacticMapUiState =
  | {
    readonly kind:
      'loading';
  }
  | {
    readonly kind:
      'content';

    readonly model:
      GalacticMapModel;
  }
  | {
    readonly kind:
      'empty';
  }
  | {
    readonly kind:
      'error';

    readonly message:
      string;
  };

export const INITIAL_GALACTIC_MAP_UI_STATE =
  Object.freeze({
    kind:
      'loading',
  }) satisfies GalacticMapUiState;
