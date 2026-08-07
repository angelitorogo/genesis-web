import {
  computed,
  Injectable,
  signal,
} from '@angular/core';

import {
  HomeUiState,
  INITIAL_HOME_UI_STATE,
} from './home-ui-state';

@Injectable()
export class HomeFacade {
  private readonly stateSignal =
    signal<HomeUiState>(INITIAL_HOME_UI_STATE);

  readonly state = this.stateSignal.asReadonly();

  readonly title = computed(
    () => this.state().title,
  );

  readonly subtitle = computed(
    () => this.state().subtitle,
  );

  readonly navigationStatus = computed(() =>
    this.state().initialized
      ? 'Navegación Angular inicializada correctamente.'
      : 'Inicializando GENESIS...',
  );

  initialize(): void {
    this.stateSignal.update((state) => {
      if (state.initialized) {
        return state;
      }

      return {
        ...state,
        initialized: true,
      };
    });
  }
}