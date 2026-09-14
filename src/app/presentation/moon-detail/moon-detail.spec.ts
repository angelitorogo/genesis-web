import {
  signal,
} from '@angular/core';

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
  type ArchiveDiscoveryDetailUiState,
} from '../genesis-archive/archive-discovery-detail.facade';

import {
  MoonDetailPage,
} from './moon-detail';

describe(
  'MoonDetailPage point 26.5',
  () => {

    it(
      'should preserve the full lunar route when building section anchors and keep direct access locked before CONFIRMED',
      async () => {
        const model =
          systemModel();

        const state =
          signal<ArchiveDiscoveryDetailUiState>({
            kind:
              'content',
            model,
          });

        const modelSignal =
          signal<ArchiveDiscoveryDetailModel | null>(
            model,
          );

        const load =
          vi.fn(
            async () => {},
          );

        await TestBed
          .configureTestingModule({
            imports: [
              MoonDetailPage,
            ],
            providers: [
              provideRouter(
                [],
              ),
              {
                provide:
                  ArchiveDiscoveryDetailFacade,
                useValue: {
                  state,
                  model:
                    modelSignal,
                  errorMessage:
                    signal<string | null>(
                      null,
                    ),
                  load,
                },
              },
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
                        bodyIndex:
                          '0',
                        moonIndex:
                          '0',
                      }),
                    queryParamMap:
                      convertToParamMap({
                        seed:
                          model.universeSeed,
                        version:
                          String(
                            model.generatorVersionCode,
                          ),
                      }),
                  },
                },
              },
            ],
          })
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            MoonDetailPage,
          );

        fixture.detectChanges();

        expect(load).toHaveBeenCalledTimes(1);
        expect(
          (
            fixture.nativeElement as
              HTMLElement
          ).querySelector(
            '[data-testid="moon-detail-locked"]',
          ),
        ).toBeTruthy();
        expect(
          fixture
            .componentInstance
            .moonSectionHref(
              'habitability',
            ),
        ).toBe(
          '/system/3/-17/8/planet/0/moon/0?seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1&version=1#moon-section-habitability',
        );
        expect(
          fixture
            .componentInstance
            .moonSectionHref(
              'comparison',
            ),
        ).toBe(
          '/system/3/-17/8/planet/0/moon/0?seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1&version=1#moon-section-comparison',
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
    stellarSystemCard: {
      title:
        'Jotheria',
    },
  } as unknown as ArchiveDiscoveryDetailModel;
}
