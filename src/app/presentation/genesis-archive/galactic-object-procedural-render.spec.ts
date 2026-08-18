import {
  TestBed,
} from '@angular/core/testing';

import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

import {
  GalacticObjectProceduralRender,
} from './galactic-object-procedural-render';

describe(
  'GalacticObjectProceduralRender',
  () => {
    const descriptor:
      ArchiveGalacticObjectRenderDescriptor =
      Object.freeze({
        kind:
          ArchiveGalacticObjectRenderKind.SUPERNOVA_REMNANT,
        knowledgeLevel:
          ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
        seed:
          'GENESIS-12.8-COMPONENT-VECTOR',
        accessibleLabel:
          'Render procedural de remanente de supernova',
        variant:
          'SHELL',
        scale:
          0.62,
        density:
          0.44,
        energy:
          0.78,
        concentration:
          0.5,
      });

    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              GalacticObjectProceduralRender,
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should render one accessible deterministic SVG with point-12.8 knowledge metadata',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticObjectProceduralRender,
          );

        fixture.componentRef.setInput(
          'descriptor',
          descriptor,
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        const figure =
          element.querySelector(
            '[data-testid="galactic-object-procedural-render"]',
          );

        expect(
          figure?.getAttribute(
            'data-render-kind',
          ),
        ).toBe(
          'SUPERNOVA_REMNANT',
        );

        expect(
          figure?.getAttribute(
            'data-knowledge-level',
          ),
        ).toBe(
          'CATALOGUED',
        );

        expect(
          element.querySelector(
            'svg',
          )?.getAttribute(
            'aria-label',
          ),
        ).toBe(
          descriptor.accessibleLabel,
        );
      },
    );

    it(
      'should materialize real SVG primitives instead of a placeholder image',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticObjectProceduralRender,
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
          element.querySelectorAll(
            'svg circle',
          ).length,
        ).toBeGreaterThan(
          0,
        );

        expect(
          element.querySelectorAll(
            'svg path',
          ).length,
        ).toBeGreaterThan(
          0,
        );

        expect(
          element.querySelector(
            'img',
          ),
        ).toBeNull();
      },
    );
  },
);
