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
  'MinorBodyDetailPage point 26.8',
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
                        u:
                          '96F17ABD83F31EF747FC750C996EB1C2',
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
              'risk',
            ),
        ).toBe(
          '/system/3/-17/8/minor-body/comet/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB?u=96F17ABD83F31EF747FC750C996EB1C2#minor-body-section-risk',
        );
      },
    );
    it(
      'should accept a stable TNO route and preserve it in section anchors',
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
                  load:
                    vi.fn(
                      async () => {},
                    ),
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
                          'tno',
                        proceduralId:
                          'cccccccccccccccccccccccccccccccc',
                      }),
                    queryParamMap:
                      convertToParamMap({
                        u:
                          '96F17ABD83F31EF747FC750C996EB1C2',
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

        expect(
          fixture
            .componentInstance
            .minorBodySectionHref(
              'composition',
            ),
        ).toBe(
          '/system/3/-17/8/minor-body/tno/CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC?u=96F17ABD83F31EF747FC750C996EB1C2#minor-body-section-composition',
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
    routeUniverseRef:
      '96F17ABD83F31EF747FC750C996EB1C2',
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
