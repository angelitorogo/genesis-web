import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { GenesisCard } from './genesis-card';

@Component({
  standalone: true,
  imports: [
    GenesisCard,
  ],
  template: `
    <genesis-card>
      <span data-testid="card-content">
        Dato científico
      </span>
    </genesis-card>
  `,
})
class TestHost {}

describe('GenesisCard', () => {
  it('should create', () => {
    const fixture =
      TestBed.createComponent(GenesisCard);

    expect(
      fixture.componentInstance,
    ).toBeTruthy();
  });

  it('should project card content', () => {
    const fixture =
      TestBed.createComponent(TestHost);

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="card-content"]',
      )?.textContent,
    ).toContain('Dato científico');
  });
});