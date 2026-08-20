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
  HiiRegionHighRender,
} from './hii-region-high-render';

describe(
  'HiiRegionHighRender',
  () => {
    const descriptor:
      ArchiveGalacticObjectRenderDescriptor =
      Object.freeze({
        kind:
          ArchiveGalacticObjectRenderKind
            .HII_REGION,
        knowledgeLevel:
          ArchiveGalacticObjectKnowledgeLevel
            .CATALOGUED,
        seed:
          'GENESIS-HII-HIGH-COMPONENT-V1',
        accessibleLabel:
          'Render procedural de región H II alta',
        variant:
          null,
        renderProfile:
          ArchiveGalacticObjectRenderProfile
            .HII_HIGH_VOLUME,
        scale:
          0.50,
        density:
          0.52,
        energy:
          0.48,
        concentration:
          0.55,
      });

    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              HiiRegionHighRender,
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
            HiiRegionHighRender,
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
            '[data-testid="hii-region-high-render"]',
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
          descriptor.accessibleLabel,
        );

        expect(
          element.querySelector(
            'img',
          ),
        ).toBeNull();
      },
    );

    it(
      'should keep HIGH hidden when the renderer is driven only by the opaque early profile',
      () => {
        const fixture =
          TestBed.createComponent(
            HiiRegionHighRender,
          );

        fixture.componentRef.setInput(
          'descriptor',
          Object.freeze({
            ...descriptor,
            kind:
              ArchiveGalacticObjectRenderKind
                .NEBULA,
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .SIGNAL,
            variant:
              null,
          }),
        );

        fixture.detectChanges();

        const root =
          (
            fixture.nativeElement as
              HTMLElement
          ).querySelector(
            '[data-testid="hii-region-high-render"]',
          );

        expect(
          root?.getAttribute(
            'data-hii-variant',
          ),
        ).toBe(
          'GENERIC',
        );

        expect(
          root?.getAttribute(
            'data-render-profile',
          ),
        ).toBe(
          'HII_HIGH_VOLUME',
        );
      },
    );
  },
);
