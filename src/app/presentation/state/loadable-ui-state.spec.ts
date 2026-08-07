import {
  createContentUiState,
  createEmptyUiState,
  createErrorUiState,
  createLoadingUiState,
} from './loadable-ui-state';

describe('LoadableUiState', () => {
  it('should create a loading state', () => {
    expect(
      createLoadingUiState(),
    ).toEqual({
      status: 'loading',
      message: 'Cargando datos...',
    });
  });

  it('should create an empty state', () => {
    expect(
      createEmptyUiState(),
    ).toEqual({
      status: 'empty',
      message: 'No hay datos disponibles.',
    });
  });

  it('should create an error state', () => {
    expect(
      createErrorUiState(),
    ).toEqual({
      status: 'error',
      message:
        'No se ha podido cargar la información.',
    });
  });

  it('should preserve content data', () => {
    const data = {
      galaxyCount: 3,
    };

    expect(
      createContentUiState(data),
    ).toEqual({
      status: 'content',
      data,
    });
  });
});