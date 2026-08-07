import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { GenesisScreen } from './genesis-screen';

@Component({
  standalone: true,
  imports: [
    GenesisScreen,
  ],
  template: `
    <genesis-screen>
      <p data-testid="projected-content">
        Contenido GENESIS
      </p>
    </genesis-screen>
  `,
})
class TestHost {}

describe('GenesisScreen', () => {
  it('should create', () => {
    const fixture =
      TestBed.createComponent(GenesisScreen);

    expect(
      fixture.componentInstance,
    ).toBeTruthy();
  });

  it('should project screen content', () => {
    const fixture =
      TestBed.createComponent(TestHost);

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="projected-content"]',
      )?.textContent,
    ).toContain('Contenido GENESIS');
  });
});