import {
  TestBed,
} from '@angular/core/testing';

import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

import {
  DarkNebulaRender,
} from './dark-nebula-render';

describe(
  'DarkNebulaRender',
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
          'GENESIS-DARK-NEBULA-COMPONENT-V1',
        accessibleLabel:
          'Render procedural de nebulosa oscura',
        variant:
          'DARK',
        scale:
          0.61,
        density:
          0.77,
        energy:
          0.14,
        concentration:
          0.08,
      });

    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              DarkNebulaRender,
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should expose one accessible procedural canvas with no image asset',
      () => {
        const fixture =
          TestBed.createComponent(
            DarkNebulaRender,
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
            '[data-testid="dark-nebula-render"]',
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
      'should expose DARK only as already-authorized renderer metadata',
      () => {
        const fixture =
          TestBed.createComponent(
            DarkNebulaRender,
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
            '[data-testid="dark-nebula-render"]',
          );

        expect(
          root?.getAttribute(
            'data-nebula-variant',
          ),
        ).toBe(
          'DARK',
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
