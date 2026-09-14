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
  MinorBodyDetailPage,
} from './minor-body-detail';

describe(
  'MinorBodyDetailPage point 26.6',
  () => {

    it(
      'should preserve the full minor-body route in section anchors and keep direct access locked before CONFIRMED',
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
              MinorBodyDetailPage,
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
                        minorBodyKind:
                          'comet',
                        proceduralId:
                          'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
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
            MinorBodyDetailPage,
          );

        fixture.detectChanges();

        expect(load).toHaveBeenCalledTimes(1);
        expect(
          (
            fixture.nativeElement as
              HTMLElement
          ).querySelector(
            '[data-testid="minor-body-detail-locked"]',
          ),
        ).toBeTruthy();
        expect(
          fixture
            .componentInstance
            .minorBodySectionHref(
              'activity',
            ),
        ).toBe(
          '/system/3/-17/8/minor-body/comet/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB?seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1&version=1#minor-body-section-activity',
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
