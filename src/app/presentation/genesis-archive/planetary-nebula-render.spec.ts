import {
  TestBed,
} from '@angular/core/testing';

import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

import {
  PlanetaryNebulaRender,
} from './planetary-nebula-render';

describe(
  'PlanetaryNebulaRender',
  () => {
    const descriptor:
      ArchiveGalacticObjectRenderDescriptor =
      Object.freeze({
        kind:
          ArchiveGalacticObjectRenderKind
            .NEBULA,
        knowledgeLevel:
          ArchiveGalacticObjectKnowledgeLevel
            .CONFIRMED,
        seed:
          'GENESIS-PLANETARY-NEBULA-COMPONENT-V1',
        accessibleLabel:
          'Render procedural de nebulosa planetaria',
        variant:
          'PLANETARY',
        scale:
          0.58,
        density:
          0.46,
        energy:
          0.81,
        concentration:
          0.72,
      });

    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              PlanetaryNebulaRender,
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should expose one accessible procedural canvas without an image asset',
      () => {
        const fixture =
          TestBed.createComponent(
            PlanetaryNebulaRender,
          );

        fixture.componentRef.setInput(
          'descriptor',
          descriptor,
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="planetary-nebula-render"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            'canvas',
          )
          ?.getAttribute(
            'aria-label',
          ),
        ).toBe(
          descriptor
            .accessibleLabel,
        );

        expect(
          element.querySelector(
            'img',
          ),
        ).toBeNull();
      },
    );

    it(
      'should expose PLANETARY only as renderer metadata already authorized by the descriptor',
      () => {
        const fixture =
          TestBed.createComponent(
            PlanetaryNebulaRender,
          );

        fixture.componentRef.setInput(
          'descriptor',
          descriptor,
        );

        fixture.detectChanges();

        const root =
          (
            fixture.nativeElement as
              HTMLElement
          ).querySelector(
            '[data-testid="planetary-nebula-render"]',
          );

        expect(
          root?.getAttribute(
            'data-nebula-variant',
          ),
        ).toBe(
          'PLANETARY',
        );

        expect(
          root?.getAttribute(
            'data-knowledge-level',
          ),
        ).toBe(
          'CONFIRMED',
        );
      },
    );
  },
);
