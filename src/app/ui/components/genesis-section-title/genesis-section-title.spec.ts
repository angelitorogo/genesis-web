import { TestBed } from '@angular/core/testing';

import {
  GenesisSectionTitle,
} from './genesis-section-title';

describe('GenesisSectionTitle', () => {
  it('should create', () => {
    const fixture =
      TestBed.createComponent(
        GenesisSectionTitle,
      );

    fixture.componentRef.setInput(
      'title',
      'Observatorio',
    );

    fixture.detectChanges();

    expect(
      fixture.componentInstance,
    ).toBeTruthy();
  });

  it('should render the required title', () => {
    const fixture =
      TestBed.createComponent(
        GenesisSectionTitle,
      );

    fixture.componentRef.setInput(
      'title',
      'Observatorio',
    );

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="section-title"]',
      )?.textContent,
    ).toContain('Observatorio');
  });

  it('should render optional eyebrow and description', () => {
    const fixture =
      TestBed.createComponent(
        GenesisSectionTitle,
      );

    fixture.componentRef.setInput(
      'title',
      'Galaxia activa',
    );

    fixture.componentRef.setInput(
      'eyebrow',
      'Exploración',
    );

    fixture.componentRef.setInput(
      'description',
      'Estado científico de la galaxia.',
    );

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="section-eyebrow"]',
      )?.textContent,
    ).toContain('Exploración');

    expect(
      element.querySelector(
        '[data-testid="section-description"]',
      )?.textContent,
    ).toContain(
      'Estado científico de la galaxia.',
    );
  });

  it('should omit optional content when absent', () => {
    const fixture =
      TestBed.createComponent(
        GenesisSectionTitle,
      );

    fixture.componentRef.setInput(
      'title',
      'Archivo',
    );

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="section-eyebrow"]',
      ),
    ).toBeNull();

    expect(
      element.querySelector(
        '[data-testid="section-description"]',
      ),
    ).toBeNull();
  });
});