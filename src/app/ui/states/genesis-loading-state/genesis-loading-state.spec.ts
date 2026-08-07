import { TestBed } from '@angular/core/testing';

import {
  GenesisLoadingState,
} from './genesis-loading-state';

describe('GenesisLoadingState', () => {
  it('should create', () => {
    const fixture =
      TestBed.createComponent(
        GenesisLoadingState,
      );

    fixture.detectChanges();

    expect(
      fixture.componentInstance,
    ).toBeTruthy();
  });

  it('should render the default loading state', () => {
    const fixture =
      TestBed.createComponent(
        GenesisLoadingState,
      );

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="loading-state"]',
      ),
    ).toBeTruthy();

    expect(
      element.querySelector(
        '[data-testid="loading-title"]',
      )?.textContent,
    ).toContain('Cargando información');
  });

  it('should render custom loading content', () => {
    const fixture =
      TestBed.createComponent(
        GenesisLoadingState,
      );

    fixture.componentRef.setInput(
      'title',
      'Analizando sector',
    );

    fixture.componentRef.setInput(
      'message',
      'Procesando señales detectadas.',
    );

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      'Analizando sector',
    );

    expect(element.textContent).toContain(
      'Procesando señales detectadas.',
    );
  });
});