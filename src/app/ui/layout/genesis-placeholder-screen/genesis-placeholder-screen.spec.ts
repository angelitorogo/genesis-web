import { TestBed } from '@angular/core/testing';

import {
  GenesisPlaceholderScreen,
} from './genesis-placeholder-screen';

describe('GenesisPlaceholderScreen', () => {
  function createFixture() {
    const fixture =
      TestBed.createComponent(
        GenesisPlaceholderScreen,
      );

    fixture.componentRef.setInput(
      'testId',
      'test-page',
    );

    fixture.componentRef.setInput(
      'eyebrow',
      'TEST',
    );

    fixture.componentRef.setInput(
      'title',
      'Pantalla de prueba',
    );

    fixture.componentRef.setInput(
      'description',
      'Descripción de prueba.',
    );

    fixture.componentRef.setInput(
      'status',
      'Módulo pendiente de implementación.',
    );

    fixture.detectChanges();

    return fixture;
  }

  it('should create', () => {
    const fixture = createFixture();

    expect(
      fixture.componentInstance,
    ).toBeTruthy();
  });

  it('should render the supplied title', () => {
    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.textContent,
    ).toContain('Pantalla de prueba');
  });

  it('should expose the supplied test id and status', () => {
    const fixture = createFixture();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="test-page"]',
      ),
    ).toBeTruthy();

    expect(
      element.querySelector(
        '[data-testid="placeholder-status"]',
      )?.textContent,
    ).toContain(
      'Módulo pendiente de implementación.',
    );
  });
});