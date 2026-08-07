import { TestBed } from '@angular/core/testing';

import {
  Observatory,
} from './observatory';

describe('Observatory', () => {
  it('should create and render the observatory placeholder', () => {
    const fixture =
      TestBed.createComponent(
        Observatory,
      );

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      fixture.componentInstance,
    ).toBeTruthy();

    expect(
      element.querySelector(
        '[data-testid="observatory-page"]',
      ),
    ).toBeTruthy();

    expect(element.textContent).toContain(
      'Observatorio',
    );
  });
});