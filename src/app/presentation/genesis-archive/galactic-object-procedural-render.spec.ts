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
      'should namespace internal SVG definitions from the descriptor so parallel renderers cannot collide',
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

        const ids =
          Array.from(
            element.querySelectorAll(
              'svg defs [id]',
            ),
          ).map(
            node =>
              node.id,
          );

        expect(
          ids,
        ).toHaveLength(
          4,
        );

        expect(
          new Set(
            ids,
          ).size,
        ).toBe(
          4,
        );

        for (
          const id
          of ids
        ) {
          expect(
            id,
          ).toMatch(
            /^archive-object-[0-9a-f]+-/,
          );
        }

        const firstIds =
          [
            ...ids,
          ];

        fixture.componentRef.setInput(
          'descriptor',
          Object.freeze({
            ...descriptor,
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .CONFIRMED,
          }),
        );

        fixture.detectChanges();

        const confirmedIds =
          Array.from(
            element.querySelectorAll(
              'svg defs [id]',
            ),
          ).map(
            node =>
              node.id,
          );

        expect(
          confirmedIds,
        ).not.toEqual(
          firstIds,
        );
      },
    );

    it(
      'should route generic and EMISSION nebula descriptors through the high-fidelity WebGL renderer',
      () => {
        for (
          const variant
          of [
            null,
            'EMISSION',
          ] as const
        ) {
          const fixture =
            TestBed.createComponent(
              GalacticObjectProceduralRender,
            );

          fixture.componentRef.setInput(
            'descriptor',
            Object.freeze({
              ...descriptor,
              kind:
                ArchiveGalacticObjectRenderKind
                  .NEBULA,
              variant,
            }),
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
              'img',
            ),
          ).toBeNull();
        }
      },
    );

    it(
      'should route REFLECTION through its dedicated high-fidelity WebGL renderer',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticObjectProceduralRender,
          );

        fixture.componentRef.setInput(
          'descriptor',
          Object.freeze({
            ...descriptor,
            kind:
              ArchiveGalacticObjectRenderKind
                .NEBULA,
            variant:
              'REFLECTION',
          }),
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
            'img',
          ),
        ).toBeNull();
      },
    );

    it(
      'should keep DARK and PLANETARY on the frozen SVG renderer until their dedicated visual passes',
      () => {
        for (
          const variant
          of [
            'DARK',
            'PLANETARY',
          ] as const
        ) {
          const fixture =
            TestBed.createComponent(
              GalacticObjectProceduralRender,
            );

          fixture.componentRef.setInput(
            'descriptor',
            Object.freeze({
              ...descriptor,
              kind:
                ArchiveGalacticObjectRenderKind
                  .NEBULA,
              variant,
            }),
          );

          fixture.detectChanges();

          const element =
            fixture.nativeElement as
              HTMLElement;

          expect(
            element.querySelector(
              '[data-testid="emission-nebula-render"]',
            ),
          ).toBeNull();

          expect(
            element.querySelector(
              'svg',
            ),
          ).toBeTruthy();
        }
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
