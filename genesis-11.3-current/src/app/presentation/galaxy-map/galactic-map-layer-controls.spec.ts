import {
  TestBed,
} from '@angular/core/testing';

import {
  GalacticMapLayerControls,
} from './galactic-map-layer-controls';

import {
  GalacticMapLayerId,
  INITIAL_GALACTIC_MAP_LAYER_VISIBILITY,
} from './galactic-map-layer-state';

describe(
  'GalacticMapLayerControls',
  () => {
    it(
      'should render all six 10.5 layer switches and emit only the requested change',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticMapLayerControls,
          );

        fixture.componentRef.setInput(
          'visibility',
          INITIAL_GALACTIC_MAP_LAYER_VISIBILITY,
        );

        fixture.componentRef.setInput(
          'hasHabitableZone',
          true,
        );

        const emitted:
          unknown[] =
          [];

        fixture.componentInstance
          .visibilityChange
          .subscribe(
            (
              value,
            ) => {
              emitted.push(
                value,
              );
            },
          );

        fixture.detectChanges();

        const root =
          fixture.nativeElement as
            HTMLElement;

        expect(
          root.querySelectorAll(
            '[data-testid^="galactic-map-layer-"]',
          ),
        ).toHaveLength(
          6,
        );

        (
          root.querySelector(
            '[data-testid="galactic-map-layer-nebulae"]',
          ) as HTMLButtonElement
        ).click();

        expect(
          emitted,
        ).toEqual([
          {
            layerId:
              GalacticMapLayerId.NEBULAE,
            visible:
              false,
          },
        ]);
      },
    );

    it(
      'should state explicitly whether the active galaxy has a favorable galactic habitability region',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticMapLayerControls,
          );

        fixture.componentRef.setInput(
          'visibility',
          INITIAL_GALACTIC_MAP_LAYER_VISIBILITY,
        );

        fixture.componentRef.setInput(
          'hasHabitableZone',
          false,
        );

        fixture.detectChanges();

        const root =
          fixture.nativeElement as
            HTMLElement;

        const status =
          root.querySelector(
            '[data-testid="galactic-map-habitability-status"]',
          ) as HTMLElement;

        expect(
          status.getAttribute(
            'data-has-habitable-zone',
          ),
        ).toBe(
          'false',
        );

        expect(
          status.textContent,
        ).toContain(
          'Sin región favorable identificada',
        );

        fixture.componentRef.setInput(
          'hasHabitableZone',
          true,
        );

        fixture.detectChanges();

        const updatedStatus =
          root.querySelector(
            '[data-testid="galactic-map-habitability-status"]',
          ) as HTMLElement;

        expect(
          updatedStatus.getAttribute(
            'data-has-habitable-zone',
          ),
        ).toBe(
          'true',
        );

        expect(
          updatedStatus.textContent,
        ).toContain(
          'Región favorable identificada',
        );
      },
    );
  },
);
