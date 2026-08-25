import {
  TestBed,
} from '@angular/core/testing';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ArchiveGalacticObjectCardAssembler,
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  ArchiveGalacticObjectRenderProfile,
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
      'should route supernova remnants through the dedicated high-fidelity renderer with point-12.8 knowledge metadata',
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
          fixture.nativeElement as HTMLElement;

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
            '[data-testid="supernova-remnant-render"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            'canvas',
          )?.getAttribute(
            'aria-label',
          ),
        ).toBe(
          descriptor.accessibleLabel,
        );
      },
    );

    it(
      'should route an opaque DETECTED SHELL profile through the same SNR renderer without exposing the scientific variant',
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
                .EXTREME_OBJECT,
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .SIGNAL,
            variant:
              null,
            renderProfile:
              ArchiveGalacticObjectRenderProfile
                .SUPERNOVA_REMNANT_SHELL,
          }),
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
          element
            .querySelector(
              '[data-testid="supernova-remnant-render"]',
            )
            ?.getAttribute(
              'data-snr-variant',
            ),
        ).toBe(
          'GENERIC',
        );

        expect(
          element.querySelector(
            'svg',
          ),
        ).toBeNull();
      },
    );

    it(
      'should preserve the scientific SNR morphology string inside the dedicated renderer metadata',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticObjectProceduralRender,
          );

        fixture.componentRef.setInput(
          'descriptor',
          Object.freeze({
            ...descriptor,
            variant:
              'PLERION',
          }),
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as HTMLElement;

        expect(
          element
            .querySelector(
              '[data-testid="supernova-remnant-render"]',
            )
            ?.getAttribute(
              'data-snr-variant',
            ),
        ).toBe(
          'PLERION',
        );
      },
    );

    it(
      'should route an explored AGN galactic centre through the dedicated black-hole renderer',
      () => {
        const generationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
            ),
            GeneratorVersion.V1,
          );

        const card =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                20n,
                0n,
                0n,
              ),
              ExplorationResultKind.EXTREME_OBJECT,
              DiscoveryState.DETECTED,
            );

        const fixture =
          TestBed.createComponent(
            GalacticObjectProceduralRender,
          );

        fixture.componentRef.setInput(
          'descriptor',
          card.render,
        );
        fixture.detectChanges();

        const element =
          fixture.nativeElement as HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="agn-nucleus-render"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="quasar-nucleus-render"]',
          ),
        ).toBeNull();
      },
    );

    it(
      'should route an explored QUASAR galactic centre through the dedicated QUASAR renderer',
      () => {
        const generationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
            ),
            GeneratorVersion.V1,
          );

        const card =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                331n,
                0n,
                0n,
              ),
              ExplorationResultKind.EXTREME_OBJECT,
              DiscoveryState.DETECTED,
            );

        const fixture =
          TestBed.createComponent(
            GalacticObjectProceduralRender,
          );

        fixture.componentRef.setInput(
          'descriptor',
          card.render,
        );
        fixture.detectChanges();

        const element =
          fixture.nativeElement as HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="quasar-nucleus-render"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="agn-nucleus-render"]',
          ),
        ).toBeNull();
      },
    );

    it(
      'should keep the generic SVG fallback available for unsupported render families so internal SVG ids remain namespaced',
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
                .EXTREME_OBJECT,
            variant:
              null,
          }),
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as HTMLElement;

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
      'should route DARK through its dedicated extinction-based WebGL renderer',
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
              'DARK',
          }),
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
            'img',
          ),
        ).toBeNull();
      },
    );

    it(
      'should route an unclassified LOW H II observation profile through its dedicated renderer without exposing activity',
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
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .SIGNAL,
            variant:
              null,
            renderProfile:
              ArchiveGalacticObjectRenderProfile
                .HII_LOW_VOLUME,
          }),
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
          element
            .querySelector(
              '[data-testid="hii-region-low-render"]',
            )
            ?.getAttribute(
              'data-hii-variant',
            ),
        ).toBe(
          'GENERIC',
        );

        expect(
          element.querySelector(
            '[data-testid="emission-nebula-render"]',
          ),
        ).toBeNull();
      },
    );

    it(
      'should route confirmed LOW H II through the same dedicated renderer',
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
                .HII_REGION,
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .CONFIRMED,
            variant:
              'LOW',
            renderProfile:
              ArchiveGalacticObjectRenderProfile
                .HII_LOW_VOLUME,
          }),
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
          element
            .querySelector(
              '[data-testid="hii-region-low-render"]',
            )
            ?.getAttribute(
              'data-hii-variant',
            ),
        ).toBe(
          'LOW',
        );
      },
    );

    it(
      'should route an unclassified MODERATE H II observation profile through its dedicated renderer without exposing activity',
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
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .SIGNAL,
            variant:
              null,
            renderProfile:
              ArchiveGalacticObjectRenderProfile
                .HII_MODERATE_VOLUME,
          }),
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="hii-region-moderate-render"]',
          ),
        ).toBeTruthy();

        expect(
          element
            .querySelector(
              '[data-testid="hii-region-moderate-render"]',
            )
            ?.getAttribute(
              'data-hii-variant',
            ),
        ).toBe(
          'GENERIC',
        );

        expect(
          element.querySelector(
            '[data-testid="hii-region-low-render"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="emission-nebula-render"]',
          ),
        ).toBeNull();
      },
    );

    it(
      'should route confirmed MODERATE H II through the same dedicated renderer',
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
                .HII_REGION,
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .CONFIRMED,
            variant:
              'MODERATE',
            renderProfile:
              ArchiveGalacticObjectRenderProfile
                .HII_MODERATE_VOLUME,
          }),
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="hii-region-moderate-render"]',
          ),
        ).toBeTruthy();

        expect(
          element
            .querySelector(
              '[data-testid="hii-region-moderate-render"]',
            )
            ?.getAttribute(
              'data-hii-variant',
            ),
        ).toBe(
          'MODERATE',
        );
      },
    );

    it(
      'should route an unclassified HIGH H II observation profile through its dedicated renderer without exposing activity',
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
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .SIGNAL,
            variant:
              null,
            renderProfile:
              ArchiveGalacticObjectRenderProfile
                .HII_HIGH_VOLUME,
          }),
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
          element
            .querySelector(
              '[data-testid="hii-region-high-render"]',
            )
            ?.getAttribute(
              'data-hii-variant',
            ),
        ).toBe(
          'GENERIC',
        );

        expect(
          element.querySelector(
            '[data-testid="hii-region-low-render"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="emission-nebula-render"]',
          ),
        ).toBeNull();
      },
    );

    it(
      'should route confirmed HIGH H II through the same dedicated renderer',
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
                .HII_REGION,
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .CONFIRMED,
            variant:
              'HIGH',
            renderProfile:
              ArchiveGalacticObjectRenderProfile
                .HII_HIGH_VOLUME,
          }),
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
          element
            .querySelector(
              '[data-testid="hii-region-high-render"]',
            )
            ?.getAttribute(
              'data-hii-variant',
            ),
        ).toBe(
          'HIGH',
        );
      },
    );

    it(
      'should route an unclassified INTENSE H II observation profile through its dedicated renderer without exposing activity',
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
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .SIGNAL,
            variant:
              null,
            renderProfile:
              ArchiveGalacticObjectRenderProfile
                .HII_INTENSE_VOLUME,
          }),
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="hii-region-intense-render"]',
          ),
        ).toBeTruthy();

        expect(
          element
            .querySelector(
              '[data-testid="hii-region-intense-render"]',
            )
            ?.getAttribute(
              'data-hii-variant',
            ),
        ).toBe(
          'GENERIC',
        );

        expect(
          element.querySelector(
            '[data-testid="hii-region-low-render"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="emission-nebula-render"]',
          ),
        ).toBeNull();
      },
    );

    it(
      'should route confirmed INTENSE H II through the same dedicated renderer',
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
                .HII_REGION,
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .CONFIRMED,
            variant:
              'INTENSE',
            renderProfile:
              ArchiveGalacticObjectRenderProfile
                .HII_INTENSE_VOLUME,
          }),
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="hii-region-intense-render"]',
          ),
        ).toBeTruthy();

        expect(
          element
            .querySelector(
              '[data-testid="hii-region-intense-render"]',
            )
            ?.getAttribute(
              'data-hii-variant',
            ),
        ).toBe(
          'INTENSE',
        );
      },
    );

    it(
      'should route an unclassified STAR_CLUSTER with OPEN_CLUSTER_FIELD through the dedicated open-cluster renderer',
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
                .STAR_CLUSTER,
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .SIGNAL,
            variant:
              null,
            renderProfile:
              ArchiveGalacticObjectRenderProfile
                .OPEN_CLUSTER_FIELD,
          }),
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
          element.querySelector(
            'svg',
          ),
        ).toBeNull();
      },
    );

    it(
      'should route scientific OPEN_CLUSTER descriptors through the same dedicated renderer',
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
                .OPEN_CLUSTER,
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .CONFIRMED,
            variant:
              null,
            renderProfile:
              ArchiveGalacticObjectRenderProfile
                .OPEN_CLUSTER_FIELD,
          }),
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
      },
    );

    it(
      'should route an unclassified STAR_CLUSTER with GLOBULAR_CLUSTER_FIELD through the dedicated globular-cluster renderer',
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
                .STAR_CLUSTER,
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .SIGNAL,
            variant:
              null,
            renderProfile:
              ArchiveGalacticObjectRenderProfile
                .GLOBULAR_CLUSTER_FIELD,
          }),
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
          element.querySelector(
            '[data-testid="open-cluster-render"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector('svg'),
        ).toBeNull();
      },
    );

    it(
      'should route scientific GLOBULAR_CLUSTER descriptors through the same dedicated renderer',
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
                .GLOBULAR_CLUSTER,
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .CONFIRMED,
            variant:
              null,
            renderProfile:
              ArchiveGalacticObjectRenderProfile
                .GLOBULAR_CLUSTER_FIELD,
          }),
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
      },
    );

    it(
      'should route an unclassified nebula with PLANETARY_VOLUME profile through the same planetary renderer without exposing the subtype',
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
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .SIGNAL,
            variant:
              null,
            renderProfile:
              ArchiveGalacticObjectRenderProfile
                .PLANETARY_VOLUME,
          }),
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="planetary-nebula-render"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="emission-nebula-render"]',
          ),
        ).toBeNull();

        expect(
          element
            .querySelector(
              '[data-testid="planetary-nebula-render"]',
            )
            ?.getAttribute(
              'data-nebula-variant',
            ),
        ).toBe(
          'GENERIC',
        );
      },
    );

    it(
      'should route PLANETARY through its dedicated central-star shell WebGL renderer',
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
              'PLANETARY',
          }),
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="planetary-nebula-render"]',
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
      'should materialize real SVG primitives instead of a placeholder image for the generic fallback renderer',
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
                .EXTREME_OBJECT,
            variant:
              null,
          }),
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

    it(
      'should route an opaque DETECTED PLERION signal to the dedicated WebGL remnant renderer instead of the generic SVG fallback',
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
                .EXTREME_OBJECT,
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .SIGNAL,
            variant:
              null,
            renderProfile:
              ArchiveGalacticObjectRenderProfile
                .SUPERNOVA_REMNANT_PLERION,
          }),
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
          element.querySelector(
            '.galactic-object-render__svg',
          ),
        ).toBeNull();
      },
    );

    it(
      'should route an opaque DETECTED COMPOSITE signal to the dedicated WebGL remnant renderer instead of the generic SVG fallback',
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
                .EXTREME_OBJECT,
            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel
                .SIGNAL,
            variant:
              null,
            renderProfile:
              ArchiveGalacticObjectRenderProfile
                .SUPERNOVA_REMNANT_COMPOSITE,
          }),
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
          element.querySelector(
            '.galactic-object-render__svg',
          ),
        ).toBeNull();
      },
    );

  },
);
