import {
  TestBed,
} from '@angular/core/testing';

import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  ArchiveGalacticObjectRenderProfile,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

import {
  GlobularClusterRender,
} from './globular-cluster-render';

describe(
  'GlobularClusterRender',
  () => {
    const descriptor:
      ArchiveGalacticObjectRenderDescriptor =
      Object.freeze({
        kind:
          ArchiveGalacticObjectRenderKind
            .GLOBULAR_CLUSTER,
        knowledgeLevel:
          ArchiveGalacticObjectKnowledgeLevel
            .CATALOGUED,
        seed:
          'GENESIS-GLOBULAR-CLUSTER-COMPONENT-V1',
        accessibleLabel:
          'Render procedural de cúmulo globular',
        variant:
          null,
        renderProfile:
          ArchiveGalacticObjectRenderProfile
            .GLOBULAR_CLUSTER_FIELD,
        scale:
          0.50,
        density:
          0.78,
        energy:
          0.32,
        concentration:
          0.84,
      });

    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              GlobularClusterRender,
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should expose one accessible procedural canvas without image assets',
      () => {
        const fixture =
          TestBed.createComponent(
            GlobularClusterRender,
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
            '[data-testid="globular-cluster-render"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector('canvas')
            ?.getAttribute('aria-label'),
        ).toBe(
          descriptor.accessibleLabel,
        );

        expect(
          element.querySelector('img'),
        ).toBeNull();
      },
    );

    it(
      'should keep GLOBULAR_CLUSTER hidden when driven only by the opaque early STAR_CLUSTER profile',
      () => {
        const fixture =
          TestBed.createComponent(
            GlobularClusterRender,
          );

        fixture.componentRef.setInput(
          'descriptor',
          Object.freeze({
            ...descriptor,
            kind:
              ArchiveGalacticObjectRenderKind
                .STAR_CLUSTER,
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .SIGNAL,
          }),
        );

        fixture.detectChanges();

        const root =
          (
            fixture.nativeElement as
              HTMLElement
          ).querySelector(
            '[data-testid="globular-cluster-render"]',
          );

        expect(
          root?.getAttribute(
            'data-render-profile',
          ),
        ).toBe(
          'GLOBULAR_CLUSTER_FIELD',
        );
      },
    );
  },
);
