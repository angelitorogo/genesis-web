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
  GalacticObjectScientificActionType,
} from '../../domain/galactic-object/galactic-object-scientific-action';

import {
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  GalacticObjectScientificSubject,
  GalacticObjectScientificSurveyFamily,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

import {
  ArchiveDiscoveryDetail,
} from './archive-discovery-detail';

import {
  ArchiveDiscoveryDetailFacade,
  ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailModel,
} from './archive-discovery-detail.facade';

import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  type ArchiveGalacticObjectCardModel,
} from './archive-galactic-object-card';

import {
  ArchiveStellarSystemKnowledgeLevel,
  type ArchiveStellarSystemCardModel,
} from './archive-stellar-system-card';

describe(
  'ArchiveDiscoveryDetail',
  () => {
    const stellarSystemCard:
      ArchiveStellarSystemCardModel =
      Object.freeze({
        knowledgeLevel:
          ArchiveStellarSystemKnowledgeLevel.DETECTED,
        knowledgeLevelLabel:
          'Señal estelar detectada',
        title:
          'Sistema estelar sin resolver',
        summary:
          'La multiplicidad todavía no está resuelta.',
        nextScientificStep:
          'Descubrir el sistema.',
        multiplicityLabel:
          null,
        componentCount:
          null,
        systemFacts:
          Object.freeze([]),
        components:
          Object.freeze([]),
        orbits:
          Object.freeze([]),
        circumbinaryFacts:
          Object.freeze([]),
        habitabilityFacts:
          Object.freeze([]),
        render:
          Object.freeze({
            accessibleLabel:
              'Sistema estelar todavía no resuelto',
            knowledgeLevel:
              ArchiveStellarSystemKnowledgeLevel.DETECTED,
            multiplicity:
              null,
            components:
              Object.freeze([
                Object.freeze({
                  label:
                    'A' as const,
                  colorHex:
                    '#68808D',
                  radiusScale:
                    1,
                  massSolar:
                    null,
                }),
              ]),
            innerOrbitEccentricity:
              null,
            outerOrbitEccentricity:
              null,
            stableHabitableZoneFraction:
              null,
            hasStableHabitableZone:
              false,
          }),
      });

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

        galacticObjectCard:
          null,

        stellarSystemCard,

        scientificAction:
          null,
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
      'should preserve the point-10.6 System Archive route while point 16.7 adds a state-safe procedural system card',
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
            '[data-testid="archive-stellar-system-card"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="stellar-system-procedural-render"]',
          )?.getAttribute(
            'data-multiplicity',
          ),
        ).toBe(
          'UNRESOLVED',
        );

        expect(
          element.querySelector(
            '[data-testid="archive-stellar-system-multiplicity"]',
          )?.textContent,
        ).toContain(
          'No resuelta',
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
          '12.8 conserva la identidad persistida',
        );
      },
    );

    it(
      'should render the point-12.8 procedural GalacticObject card and only its authorized physical facts',
      async () => {
        TestBed.resetTestingModule();

        const galacticObjectCard:
          ArchiveGalacticObjectCardModel =
          Object.freeze({
            coarseFamily:
              GalacticObjectScientificSurveyFamily.EXTREME_OBJECT,

            scientificSubject:
              GalacticObjectScientificSubject.SUPERNOVA_REMNANT,

            knowledgeLevel:
              ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,

            knowledgeLevelLabel:
              'Caracterización catalogada',

            title:
              'Remanente de supernova',

            summary:
              'La onda de choque está caracterizada.',

            nextScientificStep:
              'Confirmación evolutiva del remanente',

            facts:
              Object.freeze([
                Object.freeze({
                  label:
                    'Radio',
                  value:
                    '12,4 pc',
                }),
              ]),

            render:
              Object.freeze({
                kind:
                  ArchiveGalacticObjectRenderKind.SUPERNOVA_REMNANT,
                knowledgeLevel:
                  ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
                seed:
                  'GENESIS-12.8-ARCHIVE-COMPONENT',
                accessibleLabel:
                  'Render procedural de Remanente de supernova',
                variant:
                  'SHELL',
                scale:
                  0.5,
                density:
                  0.5,
                energy:
                  0.7,
                concentration:
                  0.5,
              }),
          });

        const performScientificAction =
          vi.fn()
            .mockResolvedValue(
              undefined,
            );

        const galacticModel:
          ArchiveDiscoveryDetailModel =
          Object.freeze({
            ...model,
            locatorKind:
              ArchiveDiscoveryLocatorKind.GALACTIC_OBJECT,
            locatorKindLabel:
              'GalacticObjectLocator',
            resultKind:
              ExplorationResultKind.EXTREME_OBJECT,
            familyLabel:
              'Objeto extremo',
            discoveryState:
              DiscoveryState.CATALOGUED,
            discoveryStateLabel:
              'Catalogado',
            galacticObjectIndex:
              0n,
            proceduralIdentity:
              'G0 / S0 / O0',
            galacticObjectCard,

            stellarSystemCard:
              null,

            scientificAction:
              Object.freeze({
                actionType:
                  GalacticObjectScientificActionType.SUPERNOVA_REMNANT_EVOLUTION_CONFIRMATION,
                label:
                  'Confirmación evolutiva del remanente',
                targetDiscoveryStateLabel:
                  'Confirmado',
                awardedDiscoveryPoints:
                  96,
                minimumInstrumentLevelRank:
                  4,
                instrumentOptions:
                  Object.freeze([
                    Object.freeze({
                      instrumentType:
                        ObservationInstrumentType.RADIO,
                      label:
                        'Radio',
                      minimumLevelRank:
                        4,
                      highestUnlockedLevelRank:
                        4,
                      isAvailable:
                        true,
                      statusLabel:
                        'Disponible',
                    }),
                  ]),
                selectedInstrumentType:
                  ObservationInstrumentType.RADIO,
                selectedInstrumentLabel:
                  'Radio',
                canExecute:
                  true,
                pendingRequirements:
                  null,
                buttonLabel:
                  'Realizar confirmación',
              }),
          });

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
                        ArchiveDiscoveryLocatorKind.GALACTIC_OBJECT,
                    },

                    paramMap:
                      convertToParamMap({
                        galaxyIndex:
                          '0',
                        sectorKey:
                          '0',
                        galacticObjectIndex:
                          '0',
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
                    model:
                      galacticModel,
                  }),

                  model: () =>
                    galacticModel,

                  errorMessage: () =>
                    '',

                  actionPending: () =>
                    false,

                  actionFeedback: () =>
                    null,

                  actionError: () =>
                    null,

                  performScientificAction,

                  load:
                    vi.fn()
                      .mockResolvedValue(
                        undefined,
                      ),
                },
              },
            ],
          })
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            ArchiveDiscoveryDetail,
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="archive-galactic-object-card"]',
          )?.getAttribute(
            'data-scientific-subject',
          ),
        ).toBe(
          'SUPERNOVA_REMNANT',
        );

        expect(
          element.querySelector(
            '[data-testid="galactic-object-procedural-render"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="archive-galactic-object-title"]',
          )?.textContent,
        ).toContain(
          'Remanente de supernova',
        );

        expect(
          element.querySelector(
            '[data-testid="archive-galactic-object-physical-facts"]',
          )?.textContent,
        ).toContain(
          '12,4 pc',
        );

        expect(
          element.querySelector(
            '[data-testid="archive-galactic-object-physical-restricted"]',
          ),
        ).toBeNull();

        const actionButton =
          element.querySelector<HTMLButtonElement>(
            '[data-testid="archive-galactic-object-action-button"]',
          );

        expect(
          element.querySelector(
            '[data-testid="archive-galactic-object-action-reward"]',
          )?.textContent,
        ).toContain(
          '+96 PD',
        );

        actionButton?.click();

        expect(
          performScientificAction,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      'should render explicit pending Discovery Point and milestone requirements for a blocked scientific action',
      async () => {
        TestBed.resetTestingModule();

        const blockedModel:
          ArchiveDiscoveryDetailModel =
          Object.freeze({
            ...model,
            locatorKind:
              ArchiveDiscoveryLocatorKind.GALACTIC_OBJECT,
            locatorKindLabel:
              'GalacticObjectLocator',
            resultKind:
              ExplorationResultKind.NEBULA,
            familyLabel:
              'Nebulosa',
            discoveryState:
              DiscoveryState.DISCOVERED,
            discoveryStateLabel:
              'Descubierto',
            stellarSystemCard:
              null,
            galacticObjectCard:
              Object.freeze({
                coarseFamily:
                  GalacticObjectScientificSurveyFamily.NEBULA,
                scientificSubject:
                  GalacticObjectScientificSubject.NEBULA,
                knowledgeLevel:
                  ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED,
                knowledgeLevelLabel:
                  'Identidad científica',
                title:
                  'Nebulosa',
                summary:
                  'La identidad nebular ya está establecida.',
                nextScientificStep:
                  'Caracterización espectroscópica de nebulosa',
                facts:
                  Object.freeze([]),
                render:
                  Object.freeze({
                    kind:
                      ArchiveGalacticObjectRenderKind.NEBULA,
                    knowledgeLevel:
                      ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED,
                    seed:
                      'GENESIS-12.8-PENDING-REQUIREMENTS',
                    accessibleLabel:
                      'Render procedural de Nebulosa',
                    variant:
                      'GENERIC',
                    scale:
                      0.5,
                    density:
                      0.5,
                    energy:
                      0.5,
                    concentration:
                      0.5,
                  }),
              }),
            scientificAction:
              Object.freeze({
                actionType:
                  GalacticObjectScientificActionType.NEBULA_SPECTROSCOPIC_CHARACTERIZATION,
                label:
                  'Caracterización espectroscópica de nebulosa',
                targetDiscoveryStateLabel:
                  'Catalogado',
                awardedDiscoveryPoints:
                  96,
                minimumInstrumentLevelRank:
                  2,
                instrumentOptions:
                  Object.freeze([]),
                selectedInstrumentType:
                  null,
                selectedInstrumentLabel:
                  null,
                canExecute:
                  false,
                pendingRequirements:
                  Object.freeze({
                    instrumentLabel:
                      'Espectroscopía',
                    minimumLevelRank:
                      2,
                    items:
                      Object.freeze([
                        '1898 PD adicionales',
                        'Descubrir el primer sistema',
                        'Descubrir el primer cuerpo',
                      ]),
                  }),
                buttonLabel:
                  'Realizar caracterización',
              }),
          });

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
                        ArchiveDiscoveryLocatorKind.GALACTIC_OBJECT,
                    },
                    paramMap:
                      convertToParamMap({
                        galaxyIndex:
                          '0',
                        sectorKey:
                          '0',
                        galacticObjectIndex:
                          '0',
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
                    model:
                      blockedModel,
                  }),
                  model: () =>
                    blockedModel,
                  errorMessage: () =>
                    '',
                  actionPending: () =>
                    false,
                  actionFeedback: () =>
                    null,
                  actionError: () =>
                    null,
                  performScientificAction:
                    vi.fn(),
                  load:
                    vi.fn()
                      .mockResolvedValue(
                        undefined,
                      ),
                },
              },
            ],
          })
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            ArchiveDiscoveryDetail,
          );

        fixture.detectChanges();

        const requirements =
          (fixture.nativeElement as HTMLElement)
            .querySelector(
              '[data-testid="archive-galactic-object-pending-requirements"]',
            );

        expect(
          requirements?.textContent,
        ).toContain(
          'REQUISITOS PENDIENTES',
        );

        expect(
          requirements?.textContent,
        ).toContain(
          '1898 PD adicionales',
        );

        expect(
          requirements?.textContent,
        ).toContain(
          'Descubrir el primer sistema',
        );

        expect(
          requirements?.textContent,
        ).toContain(
          'Descubrir el primer cuerpo',
        );
      },
    );
  },
);
