export interface LoadingUiState {
  readonly status: 'loading';
  readonly message: string;
}

export interface EmptyUiState {
  readonly status: 'empty';
  readonly message: string;
}

export interface ErrorUiState {
  readonly status: 'error';
  readonly message: string;
}

export interface ContentUiState<T> {
  readonly status: 'content';
  readonly data: T;
}

export type LoadableUiState<T> =
  | LoadingUiState
  | EmptyUiState
  | ErrorUiState
  | ContentUiState<T>;

export function createLoadingUiState(
  message = 'Cargando datos...',
): LoadingUiState {
  return {
    status: 'loading',
    message,
  };
}

export function createEmptyUiState(
  message = 'No hay datos disponibles.',
): EmptyUiState {
  return {
    status: 'empty',
    message,
  };
}

export function createErrorUiState(
  message = 'No se ha podido cargar la información.',
): ErrorUiState {
  return {
    status: 'error',
    message,
  };
}

export function createContentUiState<T>(
  data: T,
): ContentUiState<T> {
  return {
    status: 'content',
    data,
  };
}