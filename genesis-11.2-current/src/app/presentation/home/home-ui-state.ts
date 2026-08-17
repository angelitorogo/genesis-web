import {
  type HomeDashboardModel,
} from './home-dashboard-model';

export type HomeUiState =
  | {
    readonly kind:
      'loading';
  }
  | {
    readonly kind:
      'content';

    readonly dashboard:
      HomeDashboardModel;
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

export const INITIAL_HOME_UI_STATE =
  Object.freeze({
    kind:
      'loading',
  }) satisfies HomeUiState;
