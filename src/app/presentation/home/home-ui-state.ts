export interface HomeUiState {
  readonly title: string;
  readonly subtitle: string;
  readonly initialized: boolean;
}

export const INITIAL_HOME_UI_STATE = {
  title: 'GENESIS',
  subtitle:
    'Exploración procedural de un universo científicamente inspirado.',
  initialized: false,
} as const satisfies HomeUiState;