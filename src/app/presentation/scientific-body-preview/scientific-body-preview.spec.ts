import {
  TestBed,
} from '@angular/core/testing';

import {
  vi,
} from 'vitest';

import {
  type ScientificBodyPreviewModel,
  ScientificBodyPreviewKind,
} from '../scientific/scientific-body-preview';

import {
  scientificBodyPreviewAnimationStepV1,
  scientificBodyPreviewMoonSelectionHaloV1,
  scientificCometPreviewCameraDistanceV1,
  ScientificBodyPreview,
} from './scientific-body-preview';

describe(
  'ScientificBodyPreview Phase 26 visual fiche extension',
  () => {

    it(
      'should expose one optional local-context control for a planet with materialized relevant moons',
      async () => {
        const getContext =
          vi.spyOn(
            HTMLCanvasElement.prototype,
            'getContext',
          )
            .mockReturnValue(
              null,
            );

        await TestBed
          .configureTestingModule({
            imports: [
              ScientificBodyPreview,
            ],
          })
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            ScientificBodyPreview,
          );

        fixture.componentRef
          .setInput(
            'model',
            planetPreviewModel(),
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        const contextAction =
          element.querySelector(
            '[data-testid="scientific-body-preview-context-toggle"]',
          ) as HTMLButtonElement | null;

        expect(
          contextAction?.textContent,
        ).toContain(
          'MOSTRAR LUNAS',
        );

        contextAction?.click();
        fixture.detectChanges();

        expect(
          fixture.componentInstance.contextEnabled(),
        ).toBe(true);
        expect(
          contextAction?.textContent,
        ).toContain(
          'MOSTRAR SOLO PLANETA',
        );
        expect(
          element.textContent,
        ).toContain(
          'Órbitas keplerianas a escala relativa',
        );

        getContext.mockRestore();
      },
    );

    it(
      'should expose host planet and sibling-moon context from an individual moon fiche',
      async () => {
        const getContext =
          vi.spyOn(
            HTMLCanvasElement.prototype,
            'getContext',
          )
            .mockReturnValue(
              null,
            );

        await TestBed
          .configureTestingModule({
            imports: [
              ScientificBodyPreview,
            ],
          })
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            ScientificBodyPreview,
          );

        fixture.componentRef
          .setInput(
            'model',
            moonPreviewModel(),
          );

        fixture.detectChanges();

        const action =
          (
            fixture.nativeElement as
              HTMLElement
          ).querySelector(
            '[data-testid="scientific-body-preview-context-toggle"]',
          ) as HTMLButtonElement | null;

        expect(
          action?.textContent,
        ).toContain(
          'MOSTRAR SISTEMA LOCAL',
        );

        action?.click();
        fixture.detectChanges();

        expect(
          fixture.componentInstance.contextEnabled(),
        ).toBe(true);
        expect(
          action?.textContent,
        ).toContain(
          'MOSTRAR SOLO LUNA',
        );

        getContext.mockRestore();
      },
    );

    it(
      'should keep asteroids isolated without a planetary-context action',
      async () => {
        const getContext =
          vi.spyOn(
            HTMLCanvasElement.prototype,
            'getContext',
          )
            .mockReturnValue(
              null,
            );

        await TestBed
          .configureTestingModule({
            imports: [
              ScientificBodyPreview,
            ],
          })
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            ScientificBodyPreview,
          );

        fixture.componentRef
          .setInput(
            'model',
            asteroidPreviewModel(),
          );

        fixture.detectChanges();

        expect(
          (
            fixture.nativeElement as
              HTMLElement
          ).querySelector(
            '[data-testid="scientific-body-preview-context-toggle"]',
          ),
        ).toBeNull();

        getContext.mockRestore();
      },
    );

    it(
      'should reserve the cyan moon halo for the selected moon inside local-system context only',
      () => {
        expect(
          scientificBodyPreviewMoonSelectionHaloV1(
            null,
            2,
          ),
        ).toBe(false);
        expect(
          scientificBodyPreviewMoonSelectionHaloV1(
            2,
            1,
          ),
        ).toBe(false);
        expect(
          scientificBodyPreviewMoonSelectionHaloV1(
            2,
            2,
          ),
        ).toBe(true);
      },
    );

    it(
      'should keep comet framing nucleus-centred instead of fitting the full tail bounds',
      () => {
        const distance =
          scientificCometPreviewCameraDistanceV1({
            activityRegime: 'STRONG',
            hasComa: true,
            hasDustTail: true,
            hasIonTail: true,
            presentationComaRadiusScale: 4,
            presentationComaOpacity01: 0.4,
            presentationDustTailOpacity01: 0.5,
            presentationIonTailOpacity01: 0.5,
            presentationComaRadiusScene: 1.2,
            presentationDustTailLengthScene: 18,
            presentationDustTailWidthScene: 0.8,
            presentationIonTailLengthScene: 24,
            presentationIonTailWidthScene: 0.3,
          });

        expect(distance).toBeLessThanOrEqual(
          4.95,
        );
        expect(distance).toBeGreaterThanOrEqual(
          3.05,
        );
      },
    );

    it(
      'should keep trans-Neptunian objects isolated without a planetary-context action',
      async () => {
        const getContext =
          vi.spyOn(
            HTMLCanvasElement.prototype,
            'getContext',
          )
            .mockReturnValue(
              null,
            );

        await TestBed
          .configureTestingModule({
            imports: [
              ScientificBodyPreview,
            ],
          })
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            ScientificBodyPreview,
          );

        fixture.componentRef
          .setInput(
            'model',
            transNeptunianPreviewModel(),
          );

        fixture.detectChanges();

        expect(
          (
            fixture.nativeElement as
              HTMLElement
          ).querySelector(
            '[data-testid="scientific-body-preview-context-toggle"]',
          ),
        ).toBeNull();

        getContext.mockRestore();
      },
    );

    it(
      'should keep local orbits and body spins advancing while the pointer is dragging the scientific view',
      () => {
        const step =
          scientificBodyPreviewAnimationStepV1({
            autoAnimate:
              true,
            pointerActive:
              true,
            elapsedRealSeconds:
              2,
            hasLocalOrbits:
              true,
            hasBodySpin:
              true,
            orbitalDaysPerRealSecond:
              3,
            spinDaysPerRealSecond:
              0.5,
          });

        expect(
          step.orbitalDayDelta,
        ).toBe(6);
        expect(
          step.spinDayDelta,
        ).toBe(1);
        expect(
          step.rootYawDeltaRadians,
        ).toBe(0);
      },
    );

    it(
      'should keep readable body-spin time independent from the faster local orbital inspection clock',
      () => {
        const step =
          scientificBodyPreviewAnimationStepV1({
            autoAnimate:
              true,
            pointerActive:
              false,
            elapsedRealSeconds:
              1,
            hasLocalOrbits:
              true,
            hasBodySpin:
              true,
            orbitalDaysPerRealSecond:
              12,
            spinDaysPerRealSecond:
              0.25,
          });

        expect(
          step.orbitalDayDelta,
        ).toBe(12);
        expect(
          step.spinDayDelta,
        ).toBe(0.25);
      },
    );
  },
);

function planetPreviewModel():
  ScientificBodyPreviewModel {

  return {
    kind:
      ScientificBodyPreviewKind.PLANET,
    accessibleLabel:
      'Jotheria b. Representación tridimensional.',
    primary:
      {} as never,
    moons: [
      {} as never,
    ],
    epochSimulationDay:
      0,
    spinPlaybackDaysPerRealSecond:
      0.5,
  };
}

function moonPreviewModel():
  ScientificBodyPreviewModel {

  return {
    kind:
      ScientificBodyPreviewKind.MOON,
    accessibleLabel:
      'Jotheria b I. Representación tridimensional.',
    primary:
      {} as never,
    hostPlanet:
      {} as never,
    moons: [
      {} as never,
      {} as never,
    ],
    epochSimulationDay:
      0,
    spinPlaybackDaysPerRealSecond:
      0.5,
  };
}

function asteroidPreviewModel():
  ScientificBodyPreviewModel {

  return {
    kind:
      ScientificBodyPreviewKind.ASTEROID,
    accessibleLabel:
      'AST-IN-001. Representación tridimensional.',
    title:
      'AST-IN-001',
    primary:
      {} as never,
  };
}

function transNeptunianPreviewModel():
  ScientificBodyPreviewModel {

  return {
    kind:
      ScientificBodyPreviewKind.TRANS_NEPTUNIAN_OBJECT,
    accessibleLabel:
      'TNO-003. Representación tridimensional.',
    title:
      'TNO-003',
    primary:
      {
        title:
          'Objeto transneptuniano TNO-003',
        colorHex:
          '#75A9D2',
        sourceRadiusScene:
          0.014,
      },
  };
}
