import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  GenesisEmptyState,
} from './genesis-empty-state';

@Component({
  standalone: true,
  imports: [
    GenesisEmptyState,
  ],
  template: `
    <genesis-empty-state
      title="Archivo vacío"
      message="Todavía no existen descubrimientos."
    >
      <button
        genesis-state-action
        type="button"
      >
        Explorar
      </button>
    </genesis-empty-state>
  `,
})
class TestHost {}

describe('GenesisEmptyState', () => {
  it('should create', () => {
    const fixture =
      TestBed.createComponent(
        GenesisEmptyState,
      );

    fixture.detectChanges();

    expect(
      fixture.componentInstance,
    ).toBeTruthy();
  });

  it('should render custom empty content', () => {
    const fixture =
      TestBed.createComponent(TestHost);

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      'Archivo vacío',
    );

    expect(element.textContent).toContain(
      'Todavía no existen descubrimientos.',
    );
  });

  it('should project an optional action', () => {
    const fixture =
      TestBed.createComponent(TestHost);

    fixture.detectChanges();

    const button =
      fixture.nativeElement.querySelector(
        'button',
      ) as HTMLButtonElement;

    expect(button).toBeTruthy();

    expect(button.textContent).toContain(
      'Explorar',
    );
  });
});