import {
  TestBed,
} from '@angular/core/testing';

import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

import {
  SupernovaRemnantRender,
} from './supernova-remnant-render';

describe(
  'SupernovaRemnantRender',
  () => {
    const descriptor:
      ArchiveGalacticObjectRenderDescriptor =
      Object.freeze({
        kind:
          ArchiveGalacticObjectRenderKind.SUPERNOVA_REMNANT,
        knowledgeLevel:
          ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
        seed:
          'GENESIS-SNR-COMPONENT-V1',
        accessibleLabel:
          'Render procedural de remanente de supernova',
        variant:
          'COMPOSITE',
        scale:
          0.54,
        density:
          0.44,
        energy:
          0.78,
        concentration:
          0.61,
      });

    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              SupernovaRemnantRender,
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
            SupernovaRemnantRender,
          );

        fixture.componentRef.setInput(
          'descriptor',
          descriptor,
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="supernova-remnant-render"]',
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
      'should preserve the scientific morphology string on the host metadata for early and late knowledge levels',
      () => {
        const fixture =
          TestBed.createComponent(
            SupernovaRemnantRender,
          );

        fixture.componentRef.setInput(
          'descriptor',
          Object.freeze({
            ...descriptor,
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
            variant:
              'SHELL',
          }),
        );

        fixture.detectChanges();

        const root =
          (
            fixture.nativeElement as HTMLElement
          ).querySelector(
            '[data-testid="supernova-remnant-render"]',
          );

        expect(
          root?.getAttribute(
            'data-snr-variant',
          ),
        ).toBe(
          'SHELL',
        );

        fixture.componentRef.setInput(
          'descriptor',
          Object.freeze({
            ...descriptor,
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
            variant:
              'PLERION',
          }),
        );

        fixture.detectChanges();

        expect(
          root?.getAttribute(
            'data-snr-variant',
          ),
        ).toBe(
          'PLERION',
        );
      },
    );
  },
);
