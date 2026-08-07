import { TestBed } from '@angular/core/testing';

import { GalaxyMap } from './galaxy-map';

describe('GalaxyMap', () => {
  it('should create and render the galaxy map placeholder', () => {
    const fixture =
      TestBed.createComponent(GalaxyMap);

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      fixture.componentInstance,
    ).toBeTruthy();

    expect(
      element.querySelector(
        '[data-testid="galaxy-map-page"]',
      ),
    ).toBeTruthy();

    expect(element.textContent).toContain(
      'Mapa galáctico',
    );
  });
});