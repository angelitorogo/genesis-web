import { TestBed } from '@angular/core/testing';

import {
  GenesisArchive,
} from './genesis-archive';

describe('GenesisArchive', () => {
  it('should render the empty archive state', () => {
    const fixture =
      TestBed.createComponent(
        GenesisArchive,
      );

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      fixture.componentInstance,
    ).toBeTruthy();

    expect(
      element.querySelector(
        '[data-testid="genesis-archive-page"]',
      ),
    ).toBeTruthy();

    expect(
      element.querySelector(
        '[data-testid="empty-state"]',
      ),
    ).toBeTruthy();

    expect(element.textContent).toContain(
      'Archivo vacío',
    );
  });
});