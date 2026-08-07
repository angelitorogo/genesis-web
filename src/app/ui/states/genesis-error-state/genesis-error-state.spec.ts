import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  GenesisErrorState,
} from './genesis-error-state';

@Component({
  standalone: true,
  imports: [
    GenesisErrorState,
  ],
  template: `
    <genesis-error-state
      title="Error de observación"
      message="No se ha podido recuperar la observación."
    >
      <button
        genesis-state-action
        type="button"
      >
        Reintentar
      </button>
    </genesis-error-state>
  `,
})
class TestHost {}

describe('GenesisErrorState', () => {
  it('should create', () => {
    const fixture =
      TestBed.createComponent(
        GenesisErrorState,
      );

    fixture.detectChanges();

    expect(
      fixture.componentInstance,
    ).toBeTruthy();
  });

  it('should render the error information', () => {
    const fixture =
      TestBed.createComponent(TestHost);

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="error-state"]',
      ),
    ).toBeTruthy();

    expect(element.textContent).toContain(
      'Error de observación',
    );

    expect(element.textContent).toContain(
      'No se ha podido recuperar la observación.',
    );
  });

  it('should project a recovery action', () => {
    const fixture =
      TestBed.createComponent(TestHost);

    fixture.detectChanges();

    const button =
      fixture.nativeElement.querySelector(
        'button',
      ) as HTMLButtonElement;

    expect(button).toBeTruthy();

    expect(button.textContent).toContain(
      'Reintentar',
    );
  });
});