import {
  PLATFORM_ID,
} from '@angular/core';

import {
  TestBed,
} from '@angular/core/testing';

import {
  By,
} from '@angular/platform-browser';

import {
  ExtremeType,
} from '../../../domain/galactic-object/extreme-object-type';

import {
  QuiescentNucleusVisualFamily,
  type QuiescentNucleusRenderModel,
} from './quiescent-nucleus-render-model';

import {
  blackHoleLaboratoryModel,
} from './black-hole-laboratory-render-model';

import {
  BlackHoleLaboratoryRender,
} from './black-hole-laboratory-render';

import {
  QuiescentNucleusRender,
  quiescentNucleusAnimationTime,
  quiescentNucleusVisibleMotionPhase,
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


    it(
      'should derive deterministic elapsed animation time in seconds',
      () => {
        expect(
          quiescentNucleusAnimationTime(
            1_000,
            3_500,
          ),
        ).toBeCloseTo(
          2.5,
        );

        expect(
          quiescentNucleusAnimationTime(
            3_500,
            1_000,
          ),
        ).toBe(
          0,
        );
      },
    );

    it(
      'should keep the quiescent gas-ring and dust animation visibly time-driven',
      () => {
        const phase =
          quiescentNucleusVisibleMotionPhase(
            10,
          );

        expect(
          phase.dustRadians,
        ).toBeCloseTo(
          0.60,
        );

        expect(
          phase.orbitalRadians,
        ).toBeCloseTo(
          9.20,
        );
      },
    );

    it(
      'should drive the embedded canonical SMBH core in quiescent mode rather than as an active accretion scene',
      () => {
        const fixture =
          TestBed.createComponent(
            QuiescentNucleusRender,
          );

        fixture.componentRef.setInput(
          'model',
          MODEL,
        );
        fixture.componentRef.setInput(
          'blackHoleCoreModel',
          blackHoleLaboratoryModel(
            ExtremeType.SMBH,
            0,
          ),
        );

        fixture.detectChanges();

        const embeddedCore =
          fixture.debugElement.query(
            By.directive(
              BlackHoleLaboratoryRender,
            ),
          )?.componentInstance as
            BlackHoleLaboratoryRender | undefined;

        expect(
          embeddedCore,
        ).toBeTruthy();

        expect(
          embeddedCore?.embedded,
        ).toBe(true);

        expect(
          embeddedCore?.quiescentMode,
        ).toBe(true);
      },
    );
  },
);
