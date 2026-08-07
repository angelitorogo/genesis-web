import {
  Component,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  GenesisPrimaryButton,
} from './genesis-primary-button';

@Component({
  standalone: true,
  imports: [
    GenesisPrimaryButton,
  ],
  template: `
    <button
      genesis-primary-button
      type="button"
      [disabled]="disabled()"
    >
      Explorar
    </button>
  `,
})
class TestHost {
  readonly disabled =
    signal(false);
}

describe('GenesisPrimaryButton', () => {
  it('should create', () => {
    const fixture =
      TestBed.createComponent(
        GenesisPrimaryButton,
      );

    expect(
      fixture.componentInstance,
    ).toBeTruthy();
  });

  it('should preserve native button semantics', () => {
    const fixture =
      TestBed.createComponent(TestHost);

    fixture.detectChanges();

    const button =
      fixture.nativeElement.querySelector(
        'button',
      ) as HTMLButtonElement;

    expect(button).toBeTruthy();

    expect(button.type).toBe('button');

    expect(button.textContent).toContain(
      'Explorar',
    );
  });

  it('should preserve the native disabled state', () => {
    const fixture =
      TestBed.createComponent(TestHost);

    fixture.componentInstance.disabled.set(
      true,
    );

    fixture.detectChanges();

    const button =
      fixture.nativeElement.querySelector(
        'button',
      ) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
  });
});