import {
  TestBed,
} from '@angular/core/testing';

import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

import {
  ReflectionNebulaRender,
} from './reflection-nebula-render';

describe(
  'ReflectionNebulaRender',
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
          'GENESIS-REFLECTION-NEBULA-COMPONENT-V1',
        accessibleLabel:
          'Render procedural de nebulosa de reflexión',
        variant:
          'REFLECTION',
        scale:
          0.58,
        density:
          0.48,
        energy:
          0.52,
        concentration:
          0.45,
      });

    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              ReflectionNebulaRender,
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should expose one accessible code-rendered canvas without external image assets',
      () => {
        const fixture =
          TestBed.createComponent(
            ReflectionNebulaRender,
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
            '[data-testid="reflection-nebula-render"]',
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
      'should expose REFLECTION only as renderer metadata already authorized by the card descriptor',
      () => {
        const fixture =
          TestBed.createComponent(
            ReflectionNebulaRender,
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
            '[data-testid="reflection-nebula-render"]',
          );

        expect(
          root?.getAttribute(
            'data-nebula-variant',
          ),
        ).toBe(
          'REFLECTION',
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
