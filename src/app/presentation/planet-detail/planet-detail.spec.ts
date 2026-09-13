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
  PlanetDetailPage,
} from './planet-detail';

describe(
  'PlanetDetailPage point 26.3',
  () => {

    it(
      'should keep a direct planet URL locked while the persisted host system is only CATALOGUED',
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
              PlanetDetailPage,
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
            PlanetDetailPage,
          );

        fixture.detectChanges();

        expect(load).toHaveBeenCalledTimes(1);
        expect(
          (
            fixture.nativeElement as
              HTMLElement
          ).querySelector(
            '[data-testid="planet-detail-locked"]',
          ),
        ).toBeTruthy();
        expect(
          (
            fixture.nativeElement as
              HTMLElement
          ).querySelector(
            '[data-testid="planet-scientific-card"]',
          ),
        ).toBeNull();
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
