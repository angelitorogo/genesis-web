import {
  type ExplorationEntryModel,
} from './exploration-entry-model';

export type ExplorationUiState =
  | {
    readonly kind:
      'loading';
  }
  | {
    readonly kind:
      'content';

    readonly entry:
      ExplorationEntryModel;
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

export const INITIAL_EXPLORATION_UI_STATE =
  Object.freeze({
    kind:
      'loading',
  }) satisfies ExplorationUiState;
