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
  StellarSystemScientificObservationRuleCode,
} from '../../simulation/observation/stellar-system-scientific-observation-catalog';

import {
  ArchiveDiscoveryDetailFacade,
  type ArchiveDiscoveryDetailModel,
} from '../genesis-archive/archive-discovery-detail.facade';

import {
  Observatory,
} from './observatory';

describe(
  'Observatory point 26.A.9 shared stellar-system campaign',
  () => {
    it(
      'should keep the generic /observatory route operational without inventing a hidden target',
      async () => {
        const facade =
          facadeStub(
            null,
          );

        await TestBed
          .configureTestingModule({
            imports: [
              Observatory,
            ],
            providers: [
              provideRouter([]),
              {
                provide:
                  ActivatedRoute,
                useValue:
                  routeStub(
                    false,
                  ),
              },
              {
                provide:
                  ArchiveDiscoveryDetailFacade,
                useValue:
                  facade,
              },
            ],
          })
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            Observatory,
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="observatory-page"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="observatory-no-target"]',
          )?.textContent,
        ).toContain(
          'Selecciona un objetivo científico',
        );

        expect(
          facade.load,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'should load the targeted system without recording VISITED and execute one coordinated stage campaign through the shared facade',
      async () => {
        const model =
          stellarModel();

        const facade =
          facadeStub(
            model,
          );

        await TestBed
          .configureTestingModule({
            imports: [
              Observatory,
            ],
            providers: [
              provideRouter([]),
              {
                provide:
                  ActivatedRoute,
                useValue:
                  routeStub(
                    true,
                  ),
              },
              {
                provide:
                  ArchiveDiscoveryDetailFacade,
                useValue:
                  facade,
              },
            ],
          })
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            Observatory,
          );

        fixture.detectChanges();

        expect(
          facade.load,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            locatorKind:
              'system',
            includeStellarSystemScientificProgression:
              true,
            stellarSystemEntryKind:
              null,
          }),
        );

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="observatory-discovery-state"]',
          )?.textContent,
        ).toContain(
          'Detectado',
        );

        const button =
          element.querySelector<HTMLButtonElement>(
            '[data-testid="observatory-stage-action-button"]',
          );

        expect(button).toBeTruthy();
        expect(button?.disabled).toBe(false);

        const systemHref =
          element.querySelector<HTMLAnchorElement>(
            '[data-testid="observatory-system-target-link"]',
          )?.getAttribute(
            'href',
          ) ??
          '';

        expect(
          systemHref,
        ).toContain(
          'u=96F17ABD83F31EF747FC750C996EB1C2',
        );
        expect(
          systemHref,
        ).not.toContain(
          'seed=',
        );

        button?.click();

        expect(
          facade.performStellarSystemStageObservation,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      'should render a qualifying persisted observation as already applied and prevent a no-op retry',
      async () => {
        const base =
          stellarModel();

        const action =
          base
            .stellarSystemScientificCampaign
            ?.actions[0];

        if (
          action ===
          undefined
        ) {
          throw new Error(
            'Expected one stellar campaign action fixture.',
          );
        }

        const model:
          ArchiveDiscoveryDetailModel =
          Object.freeze({
            ...base,
            stellarSystemScientificCampaign:
              Object.freeze({
                ...base.stellarSystemScientificCampaign!,
                actions:
                  Object.freeze([
                    Object.freeze({
                      ...action,
                      isCompleted:
                        true,
                    }),
                  ]),
                stageAction:
                  Object.freeze({
                    ...base.stellarSystemScientificCampaign!.stageAction!,
                    pendingObservationCount:
                      0,
                    completedObservationCount:
                      1,
                    isAvailable:
                      false,
                    isComplete:
                      true,
                  }),
              }),
          });

        const facade =
          facadeStub(
            model,
          );

        await TestBed
          .configureTestingModule({
            imports: [
              Observatory,
            ],
            providers: [
              provideRouter([]),
              {
                provide:
                  ActivatedRoute,
                useValue:
                  routeStub(
                    true,
                  ),
              },
              {
                provide:
                  ArchiveDiscoveryDetailFacade,
                useValue:
                  facade,
              },
            ],
          })
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            Observatory,
          );

        fixture.detectChanges();

        const button =
          (
            fixture.nativeElement as
              HTMLElement
          )
            .querySelector<HTMLButtonElement>(
              '[data-testid="observatory-stage-action-button"]',
            );

        expect(
          button?.disabled,
        ).toBe(true);

        expect(
          button?.textContent,
        ).toContain(
          'Etapa completada',
        );

        button?.click();

        expect(
          facade.performStellarSystemStageObservation,
        ).not.toHaveBeenCalled();
      },
    );
  },
);

function routeStub(
  targeted:
    boolean,
) {

  return {
    snapshot: {
      data:
        targeted
          ? {
              observatoryTargetKind:
                'system',
            }
          : {},

      paramMap:
        convertToParamMap(
          targeted
            ? {
                galaxyIndex:
                  '0',
                sectorKey:
                  '10',
                galacticObjectIndex:
                  '7',
              }
            : {},
        ),

      queryParamMap:
        convertToParamMap(
          targeted
            ? {
                u:
                  '96F17ABD83F31EF747FC750C996EB1C2',
              }
            : {},
        ),
    },
  };
}

function facadeStub(
  model:
    ArchiveDiscoveryDetailModel | null,
) {

  return {
    state:
      signal(
        model ===
          null
          ? {
              kind:
                'loading',
            }
          : {
              kind:
                'content',
              model,
            },
      ),

    model:
      signal(
        model,
      ),

    errorMessage:
      signal<string | null>(
        null,
      ),

    actionPending:
      signal(
        false,
      ),

    actionFeedback:
      signal<string | null>(
        null,
      ),

    actionError:
      signal<string | null>(
        null,
      ),

    load:
      vi
        .fn()
        .mockResolvedValue(
          undefined,
        ),

    performStellarSystemObservation:
      vi
        .fn()
        .mockResolvedValue(
          undefined,
        ),

    performStellarSystemStageObservation:
      vi
        .fn()
        .mockResolvedValue(
          undefined,
        ),
  };
}

function stellarModel():
  ArchiveDiscoveryDetailModel {

  return {
    universeSeed:
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    generatorVersionCode:
      1,
    routeUniverseRef:
      '96F17ABD83F31EF747FC750C996EB1C2',
    locatorKind:
      'system',
    locatorKindLabel:
      'SystemLocator',
    resultKind:
      'SYSTEM' as never,
    familyLabel:
      'Sistema estelar',
    discoveryState:
      DiscoveryState.DETECTED,
    discoveryStateLabel:
      'Detectado',
    galaxyIndex:
      0n,
    sectorKey:
      10n,
    sectorX:
      1,
    sectorY:
      2,
    galacticObjectIndex:
      7n,
    proceduralIdentity:
      'G0 / S10 / O7',
    galacticObjectCard:
      null,
    stellarSystemCard:
      {
        title:
          'Sistema estelar sin resolver',
      } as never,
    scientificAction:
      null,
    stellarSystemScientificCampaign:
      Object.freeze({
        discoveryState:
          DiscoveryState.DETECTED,
        discoveryStateLabel:
          'Detectado',
        stageLabel:
          'Resolución de descubrimiento',
        completionPercent:
          0,
        satisfiedRequirementCount:
          0,
        totalRequirementCount:
          3,
        evidenceCount:
          0,
        globalDiscoveryPoints:
          0n,
        galaxyDiscoveryPoints:
          0n,
        dimensions:
          Object.freeze([]),
        actions:
          Object.freeze([
            Object.freeze({
              ruleCode:
                StellarSystemScientificObservationRuleCode.RESOLVE_NATURE_OPTICAL,
              label:
                'Resolver naturaleza estelar',
              dimensionLabel:
                'Naturaleza',
              instrumentLabel:
                'Óptico',
              selectedLevelRank:
                1,
              minimumLevelRank:
                1,
              isAvailable:
                true,
              isCompleted:
                false,
              pendingRequirements:
                Object.freeze([]),
            }),
          ]),
        stageAction:
          Object.freeze({
            label:
              'Resolver descubrimiento del sistema',
            description:
              'Integra la etapa en una sola campaña.',
            buttonLabel:
              'RESOLVER DESCUBRIMIENTO',
            pendingObservationCount:
              1,
            completedObservationCount:
              0,
            totalObservationCount:
              1,
            instrumentSummary:
              'Óptico · L1',
            isAvailable:
              true,
            isComplete:
              false,
            pendingRequirements:
              Object.freeze([]),
          }),
      }),
    stellarSystemScientificAction:
      null,
    protoplanetaryDiskAnalysis:
      null,
  };
}
