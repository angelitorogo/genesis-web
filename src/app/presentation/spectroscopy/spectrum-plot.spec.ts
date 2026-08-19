import {
  TestBed,
} from '@angular/core/testing';

import {
  SpectrumPlot,
} from './spectrum-plot';

import {
  SpectrumPlotRenderKind,
  type SpectrumPlotSource,
} from './spectrum-plot-model';

describe(
  'SpectrumPlot point 13.8',
  () => {
    const idealized:
      SpectrumPlotSource =
      Object.freeze({
        minimumWavelengthNanometers:
          400,

        maximumWavelengthNanometers:
          700,

        sampleCount:
          4,

        samples:
          Object.freeze([
            Object.freeze({
              wavelengthNanometers:
                400,
              normalizedFlux:
                0.35,
            }),
            Object.freeze({
              wavelengthNanometers:
                500,
              normalizedFlux:
                0.72,
            }),
            Object.freeze({
              wavelengthNanometers:
                600,
              normalizedFlux:
                0.48,
            }),
            Object.freeze({
              wavelengthNanometers:
                700,
              normalizedFlux:
                0.86,
            }),
          ]),
      });

    const instrumental:
      SpectrumPlotSource =
      Object.freeze({
        minimumWavelengthNanometers:
          400,

        maximumWavelengthNanometers:
          700,

        sampleCount:
          4,

        samples:
          Object.freeze([
            Object.freeze({
              wavelengthNanometers:
                400,
              normalizedFlux:
                0.3,
              lowerBoundInclusive:
                0.2,
              upperBoundExclusive:
                0.4,
            }),
            Object.freeze({
              wavelengthNanometers:
                500,
              normalizedFlux:
                0.7,
              lowerBoundInclusive:
                0.6,
              upperBoundExclusive:
                0.8,
            }),
            Object.freeze({
              wavelengthNanometers:
                600,
              normalizedFlux:
                0.5,
              lowerBoundInclusive:
                0.4,
              upperBoundExclusive:
                0.6,
            }),
            Object.freeze({
              wavelengthNanometers:
                700,
              normalizedFlux:
                0.9,
              lowerBoundInclusive:
                0.8,
              upperBoundExclusive:
                1,
            }),
          ]),

        effectiveResolutionElementNanometers:
          2.5,

        minimumDetectableNormalizedContrast:
          0.05,

        quantizationFraction:
          0.02,
      });

    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              SpectrumPlot,
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should render one accessible real SVG spectrum without canvas, image or graphics-library wrapper',
      () => {
        const fixture =
          TestBed
            .createComponent(
              SpectrumPlot,
            );

        fixture
          .componentRef
          .setInput(
            'spectrum',
            idealized,
          );

        fixture
          .componentRef
          .setInput(
            'accessibleLabel',
            'Espectro de prueba accesible',
          );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        const svg =
          element
            .querySelector(
              '[data-testid="spectrum-plot-svg"]',
            );

        expect(
          svg,
        ).not.toBeNull();

        expect(
          svg
            ?.getAttribute(
              'aria-label',
            ),
        ).toBe(
          'Espectro de prueba accesible',
        );

        expect(
          element
            .querySelector(
              '[data-testid="spectrum-plot-line"]',
            )
            ?.getAttribute(
              'd',
            )
            ?.startsWith(
              'M ',
            ),
        ).toBe(true);

        expect(
          element
            .querySelector(
              'canvas',
            ),
        ).toBeNull();

        expect(
          element
            .querySelector(
              'img',
            ),
        ).toBeNull();
      },
    );

    it(
      'should distinguish the idealized point-13.1 frame without inventing uncertainty',
      () => {
        const fixture =
          TestBed
            .createComponent(
              SpectrumPlot,
            );

        fixture
          .componentRef
          .setInput(
            'spectrum',
            idealized,
          );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        expect(
          element
            .querySelector(
              '[data-testid="spectrum-plot"]',
            )
            ?.getAttribute(
              'data-render-kind',
            ),
        ).toBe(
          SpectrumPlotRenderKind
            .IDEALIZED,
        );

        expect(
          element
            .querySelector(
              '[data-testid="spectrum-plot-uncertainty"]',
            ),
        ).toBeNull();

        expect(
          element
            .textContent,
        ).toContain(
          'Señal idealizada',
        );
      },
    );

    it(
      'should render the point-13.7 uncertainty band and instrumental metadata when present',
      () => {
        const fixture =
          TestBed
            .createComponent(
              SpectrumPlot,
            );

        fixture
          .componentRef
          .setInput(
            'spectrum',
            instrumental,
          );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        expect(
          element
            .querySelector(
              '[data-testid="spectrum-plot"]',
            )
            ?.getAttribute(
              'data-render-kind',
            ),
        ).toBe(
          SpectrumPlotRenderKind
            .INSTRUMENTAL,
        );

        expect(
          element
            .querySelector(
              '[data-testid="spectrum-plot-uncertainty"]',
            ),
        ).not.toBeNull();

        expect(
          element
            .textContent,
        ).toContain(
          'Observación instrumental',
        );

        expect(
          element
            .textContent,
        ).toContain(
          'Resolución efectiva',
        );

        expect(
          element
            .textContent,
        ).toContain(
          '2.50 nm',
        );

        expect(
          element
            .textContent,
        ).toContain(
          'Δ 0.020',
        );

        expect(
          element
            .textContent,
        ).toContain(
          '≥ 0.050',
        );
      },
    );

    it(
      'should render fixed scientific axes and the complete wavelength range',
      () => {
        const fixture =
          TestBed
            .createComponent(
              SpectrumPlot,
            );

        fixture
          .componentRef
          .setInput(
            'spectrum',
            instrumental,
          );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
              HTMLElement;

        expect(
          element
            .textContent,
        ).toContain(
          'Longitud de onda (nm)',
        );

        expect(
          element
            .textContent,
        ).toContain(
          'Flujo normalizado',
        );

        expect(
          element
            .textContent,
        ).toContain(
          '400–700 nm',
        );

        expect(
          element
            .textContent,
        ).toContain(
          '4 muestras',
        );
      },
    );
  },
);
