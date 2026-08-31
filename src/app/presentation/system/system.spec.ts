import {
  TestBed,
} from '@angular/core/testing';

import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';

import {
  vi,
} from 'vitest';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ArchiveDiscoveryDetailFacade,
  ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailModel,
} from '../genesis-archive/archive-discovery-detail.facade';

import {
  ArchiveStellarSystemKnowledgeLevel,
} from '../genesis-archive/archive-stellar-system-card';

import {
  SYSTEM_SCENE_RUNTIME_FACTORY,
  type SystemSceneRuntime,
} from './system-scene';

import {
  SystemPage,
} from './system';

describe(
  'SystemPage point 24.2',
  () => {

    let load:
      ReturnType<typeof vi.fn>;

    beforeEach(
      async () => {

        const model =
          systemModel();

        load =
          vi
            .fn()
            .mockResolvedValue(
              undefined,
            );

        const runtime:
          SystemSceneRuntime =
          {
            resize:
              vi.fn(),

            render:
              vi
                .fn()
                .mockReturnValue(
                  Object.freeze({
                    renderer:
                      'WEBGL2' as const,
                    physicalBodyCount:
                      0,
                    sceneObjectCount:
                      0,
                  }),
                ),

            dispose:
              vi.fn(),
          };

        await TestBed
          .configureTestingModule({
            imports: [
              SystemPage,
            ],

            providers: [
              provideRouter(
                [],
              ),

              {
                provide:
                  ActivatedRoute,

                useValue: {
                  snapshot: {
                    paramMap:
                      convertToParamMap({
                        galaxyIndex:
                          '3',
                        sectorKey:
                          '-17',
                        galacticObjectIndex:
                          '8',
                      }),

                    queryParamMap:
                      convertToParamMap({
                        seed:
                          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
                        version:
                          '1',
                      }),
                  },
                },
              },

              {
                provide:
                  ArchiveDiscoveryDetailFacade,

                useValue: {
                  state: () => ({
                    kind:
                      'content',
                    model,
                  }),

                  model: () =>
                    model,

                  errorMessage: () =>
                    '',

                  load,
                },
              },

              {
                provide:
                  SYSTEM_SCENE_RUNTIME_FACTORY,

                useValue: () =>
                  runtime,
              },
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should resolve the SystemLocator route through the state-safe Archive boundary and host SystemScene',
      () => {

        const fixture =
          TestBed.createComponent(
            SystemPage,
          );

        fixture.detectChanges();

        expect(
          load,
        ).toHaveBeenCalledWith({
          locatorKind:
            ArchiveDiscoveryLocatorKind.SYSTEM,
          galaxyIndex:
            '3',
          sectorKey:
            '-17',
          galacticObjectIndex:
            '8',
          universeSeed:
            '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
          generatorVersionCode:
            '1',
        });

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="system-page"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="system-scene"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="system-page-system-title"]',
          )?.textContent,
        ).toContain(
          'Jotheria',
        );

        expect(
          element.querySelector(
            '[data-testid="system-page-multiplicity"]',
          )?.textContent,
        ).toContain(
          'Binario',
        );

        expect(
          element.querySelector(
            '[data-testid="system-page-archive-link"]',
          )?.getAttribute(
            'href',
          ),
        ).toContain(
          '/archive/system/3/-17/8',
        );

        expect(
          element.querySelector(
            '[data-testid="system-page-render-contract"]',
          )?.textContent,
        ).toContain(
          'Three.js recibe únicamente estado de presentación',
        );
      },
    );
  },
);

function systemModel():
  ArchiveDiscoveryDetailModel {

  return {
    universeSeed:
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',

    generatorVersionCode:
      1,

    locatorKind:
      ArchiveDiscoveryLocatorKind.SYSTEM,

    discoveryState:
      DiscoveryState.CATALOGUED,

    discoveryStateLabel:
      'Catalogado',

    galaxyIndex:
      3n,

    sectorKey:
      -17n,

    galacticObjectIndex:
      8n,

    proceduralIdentity:
      'G3 / S-17 / O8',

    stellarSystemCard: {
      knowledgeLevel:
        ArchiveStellarSystemKnowledgeLevel
          .CATALOGUED,

      title:
        'Jotheria',

      multiplicityLabel:
        'Binario',

      componentCount:
        2,

      render: {
        multiplicity: {
          name:
            'BINARY',
        },
      },
    },
  } as unknown as ArchiveDiscoveryDetailModel;
}
