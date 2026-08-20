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
  HiiRegionLowRender,
} from './hii-region-low-render';

describe(
  'HiiRegionLowRender',
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
          'GENESIS-HII-LOW-COMPONENT-V1',
        accessibleLabel:
          'Render procedural de región H II baja',
        variant:
          null,
        renderProfile:
          ArchiveGalacticObjectRenderProfile
            .HII_LOW_VOLUME,
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
              HiiRegionLowRender,
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
            HiiRegionLowRender,
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
            '[data-testid="hii-region-low-render"]',
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
      'should keep LOW hidden when the renderer is driven only by the opaque early profile',
      () => {
        const fixture =
          TestBed.createComponent(
            HiiRegionLowRender,
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
            '[data-testid="hii-region-low-render"]',
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
          'HII_LOW_VOLUME',
        );
      },
    );
  },
);
