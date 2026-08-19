import {
  TestBed,
} from '@angular/core/testing';

import {
  SpectroscopyValidationPage,
} from './spectroscopy-validation';

describe(
  'SpectroscopyValidationPage',
  () => {
    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              SpectroscopyValidationPage,
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should render the temporary phase-13 visual-validation laboratory',
      () => {
        const fixture =
          TestBed
            .createComponent(
              SpectroscopyValidationPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        expect(
          element
            .querySelector(
              '[data-testid="spectroscopy-validation-page"]',
            ),
        ).toBeTruthy();

        expect(
          element.textContent,
        ).toContain(
          'Laboratorio espectroscópico',
        );
      },
    );

    it(
      'should expose all six spectral families and all five instrument levels',
      () => {
        const fixture =
          TestBed
            .createComponent(
              SpectroscopyValidationPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        expect(
          element
            .querySelectorAll(
              '[data-testid="spectroscopy-case-button"]',
            ),
        ).toHaveLength(6);

        expect(
          element
            .querySelectorAll(
              '[data-testid="spectroscopy-level-button"]',
            ),
        ).toHaveLength(5);
      },
    );

    it(
      'should render idealized, selected-instrumental, LEVEL_1 and LEVEL_5 real plots',
      () => {
        const fixture =
          TestBed
            .createComponent(
              SpectroscopyValidationPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        expect(
          element
            .querySelector(
              '[data-testid="spectroscopy-idealized-plot"]',
            ),
        ).toBeTruthy();

        expect(
          element
            .querySelector(
              '[data-testid="spectroscopy-instrumental-plot"]',
            ),
        ).toBeTruthy();

        expect(
          element
            .querySelector(
              '[data-testid="spectroscopy-level1-plot"]',
            ),
        ).toBeTruthy();

        expect(
          element
            .querySelector(
              '[data-testid="spectroscopy-level5-plot"]',
            ),
        ).toBeTruthy();
      },
    );

    it(
      'should switch to the real atmospheric fixture from the visible controls',
      () => {
        const fixture =
          TestBed
            .createComponent(
              SpectroscopyValidationPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        const atmosphere =
          element
            .querySelector(
              '[data-testid="spectroscopy-case-button"][data-case="ATMOSPHERE"]',
            ) as
              HTMLButtonElement;

        atmosphere.click();

        fixture.detectChanges();

        expect(
          atmosphere
            .getAttribute(
              'aria-pressed',
            ),
        ).toBe('true');

        expect(
          element.textContent,
        ).toContain(
          'Bandas anchas de H₂O, O₂, CO₂ y CH₄.',
        );
      },
    );

    it(
      'should switch the selected instrumental view to LEVEL_5 without changing the permanent L1/L5 comparison',
      () => {
        const fixture =
          TestBed
            .createComponent(
              SpectroscopyValidationPage,
            );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        const level5 =
          element
            .querySelector(
              '[data-testid="spectroscopy-level-button"][data-level="L5"]',
            ) as
              HTMLButtonElement;

        level5.click();

        fixture.detectChanges();

        expect(
          level5
            .getAttribute(
              'aria-pressed',
            ),
        ).toBe('true');

        expect(
          element.textContent,
        ).toContain(
          'Idealizado vs instrumental · L5',
        );

        expect(
          element
            .querySelector(
              '[data-testid="spectroscopy-level1-plot"]',
            ),
        ).toBeTruthy();

        expect(
          element
            .querySelector(
              '[data-testid="spectroscopy-level5-plot"]',
            ),
        ).toBeTruthy();
      },
    );
  },
);
