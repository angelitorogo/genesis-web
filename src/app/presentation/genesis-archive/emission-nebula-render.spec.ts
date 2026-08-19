import {
  TestBed,
} from '@angular/core/testing';

import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

import {
  EmissionNebulaRender,
} from './emission-nebula-render';

describe(
  'EmissionNebulaRender',
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
          'GENESIS-EMISSION-NEBULA-COMPONENT-V1',
        accessibleLabel:
          'Render procedural de nebulosa de emisión',
        variant:
          'EMISSION',
        scale:
          0.7,
        density:
          0.66,
        energy:
          0.72,
        concentration:
          0.84,
      });

    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              EmissionNebulaRender,
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should expose one accessible code-rendered canvas without an image asset',
      () => {
        const fixture =
          TestBed.createComponent(
            EmissionNebulaRender,
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
            '[data-testid="emission-nebula-render"]',
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
      'should expose knowledge and authorized variant only as renderer metadata',
      () => {
        const fixture =
          TestBed.createComponent(
            EmissionNebulaRender,
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
            '[data-testid="emission-nebula-render"]',
          );

        expect(
          root?.getAttribute(
            'data-knowledge-level',
          ),
        ).toBe(
          'CONFIRMED',
        );

        expect(
          root?.getAttribute(
            'data-nebula-variant',
          ),
        ).toBe(
          'EMISSION',
        );
      },
    );
  },
);
