import {
  TestBed,
} from '@angular/core/testing';

import {
  provideRouter,
  ActivatedRoute,
  convertToParamMap,
} from '@angular/router';

import {
  vi,
} from 'vitest';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  ArchiveDiscoveryDetail,
} from './archive-discovery-detail';

import {
  ArchiveDiscoveryDetailFacade,
  ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailModel,
} from './archive-discovery-detail.facade';

describe(
  'ArchiveDiscoveryDetail',
  () => {
    const model:
      ArchiveDiscoveryDetailModel =
      Object.freeze({
        universeSeed:
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',

        generatorVersionCode:
          1,

        locatorKind:
          ArchiveDiscoveryLocatorKind.SYSTEM,

        locatorKindLabel:
          'SystemLocator',

        resultKind:
          ExplorationResultKind.SYSTEM,

        familyLabel:
          'Sistema',

        discoveryState:
          DiscoveryState.DETECTED,

        discoveryStateLabel:
          'Detectado',

        galaxyIndex:
          0n,

        sectorKey:
          0n,

        sectorX:
          0,

        sectorY:
          0,

        galacticObjectIndex:
          7n,

        proceduralIdentity:
          'G0 / S0 / O7',
      });

    let load:
      ReturnType<typeof vi.fn>;

    beforeEach(
      async () => {
        load =
          vi
            .fn()
            .mockResolvedValue(
              undefined,
            );

        await TestBed
          .configureTestingModule({
            imports: [
              ArchiveDiscoveryDetail,
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
                    data: {
                      archiveDiscoveryLocatorKind:
                        ArchiveDiscoveryLocatorKind.SYSTEM,
                    },

                    paramMap:
                      convertToParamMap({
                        galaxyIndex:
                          '0',
                        sectorKey:
                          '0',
                        galacticObjectIndex:
                          '7',
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
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should load the route identity and render the minimal point-10.6 Archive record',
      () => {
        const fixture =
          TestBed.createComponent(
            ArchiveDiscoveryDetail,
          );

        fixture.detectChanges();

        expect(
          load,
        ).toHaveBeenCalledWith({
          locatorKind:
            ArchiveDiscoveryLocatorKind.SYSTEM,
          galaxyIndex:
            '0',
          sectorKey:
            '0',
          galacticObjectIndex:
            '7',
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
            '[data-testid="archive-discovery-detail-page"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="archive-discovery-detail-record"]',
          )?.getAttribute(
            'data-result-kind',
          ),
        ).toBe(
          'SYSTEM',
        );

        expect(
          element.querySelector(
            '[data-testid="archive-discovery-detail-universe-seed"]',
          )?.textContent,
        ).toContain(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        );

        expect(
          element.querySelector(
            '[data-testid="archive-discovery-detail-generator-version"]',
          )?.textContent,
        ).toContain(
          'V1',
        );

        expect(
          element.querySelector(
            '[data-testid="archive-discovery-detail-family"]',
          )?.textContent,
        ).toContain(
          'Sistema',
        );

        expect(
          element.querySelector(
            '[data-testid="archive-discovery-detail-state"]',
          )?.textContent,
        ).toContain(
          'Detectado',
        );

        expect(
          element.querySelector(
            '[data-testid="archive-discovery-detail-sector"]',
          )?.textContent,
        ).toContain(
          '(0, 0)',
        );

        expect(
          element.querySelector(
            '[data-testid="archive-discovery-detail-identity"]',
          )?.textContent,
        ).toContain(
          'G0 / S0 / O7',
        );

        expect(
          element.querySelector(
            '[data-testid="archive-discovery-detail-map-link"]',
          )?.getAttribute(
            'href',
          ),
        ).toBe(
          '/galaxy-map',
        );

        expect(
          element.querySelector(
            '[data-testid="archive-discovery-detail-archive-link"]',
          )?.getAttribute(
            'href',
          ),
        ).toBe(
          '/archive',
        );

        expect(
          element.textContent,
        ).toContain(
          'No genera propiedades físicas nuevas',
        );
      },
    );
  },
);
