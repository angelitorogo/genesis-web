import { TestBed } from '@angular/core/testing';

import { HomeFacade } from './home.facade';

describe('HomeFacade', () => {
  let facade: HomeFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HomeFacade,
      ],
    });

    facade = TestBed.inject(HomeFacade);
  });

  it('should expose the initial Home state', () => {
    expect(facade.state()).toEqual({
      title: 'GENESIS',
      subtitle:
        'Exploración procedural de un universo científicamente inspirado.',
      initialized: false,
    });
  });

  it('should expose derived title and subtitle signals', () => {
    expect(facade.title()).toBe('GENESIS');

    expect(facade.subtitle()).toBe(
      'Exploración procedural de un universo científicamente inspirado.',
    );
  });

  it('should become initialized', () => {
    expect(facade.state().initialized).toBe(false);

    facade.initialize();

    expect(facade.state().initialized).toBe(true);

    expect(facade.navigationStatus()).toBe(
      'Navegación Angular inicializada correctamente.',
    );
  });

  it('should keep initialization idempotent', () => {
    facade.initialize();

    const initializedState = facade.state();

    facade.initialize();

    expect(facade.state()).toBe(initializedState);
  });
});