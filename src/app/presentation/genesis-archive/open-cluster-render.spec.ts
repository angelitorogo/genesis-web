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
  OpenClusterRender,
} from './open-cluster-render';

describe(
  'OpenClusterRender',
  () => {
    const descriptor:
      ArchiveGalacticObjectRenderDescriptor =
      Object.freeze({
        kind:
          ArchiveGalacticObjectRenderKind.OPEN_CLUSTER,
        knowledgeLevel:
          ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
        seed:
          'GENESIS-OPEN-CLUSTER-COMPONENT-V1',
        accessibleLabel:
          'Render procedural de cúmulo abierto',
        variant:
          null,
        renderProfile:
          ArchiveGalacticObjectRenderProfile.OPEN_CLUSTER_FIELD,
        scale:
          0.50,
        density:
          0.58,
        energy:
          0.70,
        concentration:
          0.42,
      });

    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              OpenClusterRender,
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
            OpenClusterRender,
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
            '[data-testid="open-cluster-render"]',
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
      'should keep OPEN_CLUSTER hidden when driven only by the opaque early STAR_CLUSTER profile',
      () => {
        const fixture =
          TestBed.createComponent(
            OpenClusterRender,
          );

        fixture.componentRef.setInput(
          'descriptor',
          Object.freeze({
            ...descriptor,
            kind:
              ArchiveGalacticObjectRenderKind.STAR_CLUSTER,
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
          }),
        );

        fixture.detectChanges();

        const root =
          (
            fixture.nativeElement as
              HTMLElement
          ).querySelector(
            '[data-testid="open-cluster-render"]',
          );

        expect(
          root?.getAttribute(
            'data-render-profile',
          ),
        ).toBe(
          'OPEN_CLUSTER_FIELD',
        );
      },
    );
  },
);
