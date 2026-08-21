import {
  PLATFORM_ID,
} from '@angular/core';

import {
  TestBed,
} from '@angular/core/testing';

import {
  QuiescentNucleusVisualFamily,
  type QuiescentNucleusRenderModel,
} from './quiescent-nucleus-render-model';

import {
  QuiescentNucleusRender,
} from './quiescent-nucleus-render';

const MODEL:
  QuiescentNucleusRenderModel =
  Object.freeze({
    seed:
      '00112233445566778899AABBCCDDEEFF',
    family:
      QuiescentNucleusVisualFamily.COMPACT_CUSP,
    familyIndex:
      0,
    orientationRadians:
      0.4,
    axisRatio:
      0.9,
    coreRadius:
      0.08,
    envelopeRadius:
      0.66,
    cuspExponent:
      2.1,
    centralIntensity:
      0.76,
    stellarDensity:
      0.88,
    granularity:
      0.58,
    dustOpacity:
      0.10,
    dustWidth:
      0.045,
    dustAngleRadians:
      1.2,
    dustWarp:
      0.07,
    secondaryDustLane:
      0.03,
    asymmetry:
      0.05,
    palette:
      Object.freeze({
        core:
          Object.freeze([1.0, 0.9, 0.7] as const),
        oldStars:
          Object.freeze([0.92, 0.62, 0.34] as const),
        redGiants:
          Object.freeze([0.82, 0.34, 0.20] as const),
        envelope:
          Object.freeze([0.38, 0.18, 0.09] as const),
      }),
  });

describe(
  'QuiescentNucleusRender',
  () => {
    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              QuiescentNucleusRender,
            ],
            providers: [
              {
                provide:
                  PLATFORM_ID,
                useValue:
                  'server',
              },
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should expose a dedicated procedural quiescent renderer without active-nucleus visual claims',
      () => {
        const fixture =
          TestBed.createComponent(
            QuiescentNucleusRender,
          );

        fixture.componentRef.setInput(
          'model',
          MODEL,
        );
        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="quiescent-nucleus-render"]',
          ),
        ).toBeTruthy();

        expect(
          element.textContent,
        ).toContain(
          'POBLACIÓN ESTELAR VIEJA',
        );

        expect(
          element.textContent,
        ).toContain(
          'SIN DISCO DE ACRECIÓN ACTIVO',
        );

        expect(
          element.textContent,
        ).toContain(
          'SIN JETS',
        );
      },
    );
  },
);
