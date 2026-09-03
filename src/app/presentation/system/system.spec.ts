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
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  StellarSystemScientificActionType,
} from '../../domain/planetary/stellar-system-scientific-action';

import {
  ArchiveDiscoveryDetailFacade,
  ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailModel,
} from '../genesis-archive/archive-discovery-detail.facade';

import {
  ArchiveStellarSystemKnowledgeLevel,
  type ArchiveStellarSystemCardModel,
} from '../genesis-archive/archive-stellar-system-card';

import {
  SYSTEM_SCENE_RUNTIME_FACTORY,
  type SystemSceneRuntime,
} from './system-scene';

import {
  SystemPage,
} from './system';

describe(
  'SystemPage point 26.2 scientific star/system fiche',
  () => {

    let load:
      ReturnType<typeof vi.fn>;

    let performScientificAction:
      ReturnType<typeof vi.fn>;

    let currentModel:
      ArchiveDiscoveryDetailModel;

    beforeEach(
      async () => {

        currentModel =
          systemModel(
            ArchiveStellarSystemKnowledgeLevel.CATALOGUED,
          );

        load =
          vi
            .fn()
            .mockResolvedValue(
              undefined,
            );

        performScientificAction =
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
                    model:
                      currentModel,
                  }),

                  model: () =>
                    currentModel,

                  errorMessage: () =>
                    '',

                  actionPending: () =>
                    false,

                  actionFeedback: () =>
                    null,

                  actionError: () =>
                    null,

                  performScientificAction,

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
      'should reuse the stable SystemLocator route and expose the catalogued scientific fiche without leaking confirmed knowledge',
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
            '[data-testid="system-page-star-A"]',
          )?.textContent,
        ).toContain(
          '5772 K',
        );

        expect(
          element.querySelector(
            '[data-testid="system-page-star-B"]',
          )?.textContent,
        ).toContain(
          '0.62 M☉',
        );

        expect(
          element.querySelector(
            '[data-testid="system-page-orbital-architecture"]',
          )?.textContent,
        ).toContain(
          'Órbita interior A–B',
        );

        expect(
          element.querySelector(
            '[data-testid="system-page-habitability-locked"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="system-page-disk-analysis"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="system-page-system-profile"]',
          )?.textContent,
        ).not.toContain(
          'SystemSeed',
        );

        expect(
          element.querySelector(
            '[data-testid="system-page-render-contract"]',
          )?.textContent,
        ).toContain(
          '26.2',
        );
      },
    );

    it(
      'should keep stellar physics and orbital geometry locked at the identified DISCOVERED/VISITED layer',
      () => {

        currentModel =
          systemModel(
            ArchiveStellarSystemKnowledgeLevel.IDENTIFIED,
          );

        const fixture =
          TestBed.createComponent(
            SystemPage,
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="system-page-star-A"]',
          )?.textContent,
        ).toContain(
          'Pendiente de catalogación',
        );

        expect(
          element.querySelector(
            '[data-testid="system-page-star-A"]',
          )?.textContent,
        ).not.toContain(
          '5772 K',
        );

        expect(
          element.querySelector(
            '[data-testid="system-page-orbits-locked"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="system-page-dynamics-locked"]',
          ),
        ).toBeTruthy();
      },
    );

    it(
      'should expose confirmed habitability and the already-authorized protoplanetary disk analysis only at CONFIRMED',
      () => {

        currentModel =
          systemModel(
            ArchiveStellarSystemKnowledgeLevel.CONFIRMED,
          );

        const fixture =
          TestBed.createComponent(
            SystemPage,
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="system-page-habitability"]',
          )?.textContent,
        ).toContain(
          'HZ dinámicamente estable',
        );

        expect(
          element.querySelector(
            '[data-testid="system-page-disk-analysis"]',
          )?.textContent,
        ).toContain(
          'Disco protoplanetario',
        );

        expect(
          element.querySelector(
            '[data-testid="system-page-disk-analysis"]',
          )?.textContent,
        ).toContain(
          'Masa residual',
        );

        expect(
          element.querySelector(
            '[data-testid="system-page-habitability-locked"]',
          ),
        ).toBeNull();
      },
    );

    it(
      'should reuse ANALYZE DISK from point 17.6 without adding the galaxy 250/500 PD spend model to systems',
      () => {

        const fixture =
          TestBed.createComponent(
            SystemPage,
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        const action =
          element.querySelector<HTMLButtonElement>(
            '[data-testid="system-page-scientific-action-button"]',
          );

        expect(action).toBeTruthy();
        expect(action?.textContent).toContain(
          'Analizar disco',
        );
        expect(action?.textContent).toContain(
          '+48 PD',
        );

        action?.click();

        expect(
          performScientificAction,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          element.querySelector(
            '[data-testid="system-page-scientific-action"]',
          )?.textContent,
        ).not.toContain(
          '250 PD',
        );

        expect(
          element.querySelector(
            '[data-testid="system-page-scientific-action"]',
          )?.textContent,
        ).not.toContain(
          '500 PD',
        );
      },
    );
  },
);

function systemModel(
  knowledgeLevel:
    ArchiveStellarSystemKnowledgeLevel,
): ArchiveDiscoveryDetailModel {

  const identified =
    knowledgeLevel !==
      ArchiveStellarSystemKnowledgeLevel.DETECTED;

  const catalogued =
    knowledgeLevel ===
      ArchiveStellarSystemKnowledgeLevel.CATALOGUED ||
    knowledgeLevel ===
      ArchiveStellarSystemKnowledgeLevel.CONFIRMED;

  const confirmed =
    knowledgeLevel ===
      ArchiveStellarSystemKnowledgeLevel.CONFIRMED;

  const systemCard:
    ArchiveStellarSystemCardModel =
    Object.freeze({
      knowledgeLevel,
      knowledgeLevelLabel:
        confirmed
          ? 'Arquitectura confirmada'
          : catalogued
            ? 'Caracterización catalogada'
            : identified
              ? 'Arquitectura identificada'
              : 'Señal estelar detectada',
      title:
        identified
          ? 'Jotheria'
          : 'Sistema estelar sin resolver',
      summary:
        catalogued
          ? 'Jotheria es un sistema binario de 2 componentes.'
          : 'La arquitectura permanece limitada por el estado científico.',
      nextScientificStep:
        confirmed
          ? 'Sistema confirmado.'
          : 'Avanzar el conocimiento científico.',
      multiplicityLabel:
        identified
          ? 'Binario'
          : null,
      componentCount:
        identified
          ? 2
          : null,
      systemFacts:
        identified
          ? Object.freeze([
              Object.freeze({
                label:
                  'Designación procedural',
                value:
                  'GEN-V1-JOTHERIA',
              }),
              ...(catalogued
                ? [
                    Object.freeze({
                      label:
                        'Componentes',
                      value:
                        '2',
                    }),
                    Object.freeze({
                      label:
                        'SystemSeed',
                      value:
                        'HIDDEN-IN-26.2',
                    }),
                  ]
                : []),
            ])
          : Object.freeze([]),
      components:
        identified
          ? Object.freeze([
              component(
                'A',
                catalogued,
                '5772 K',
                '1 M☉',
              ),
              component(
                'B',
                catalogued,
                '4300 K',
                '0.62 M☉',
              ),
            ])
          : Object.freeze([]),
      orbits:
        catalogued
          ? Object.freeze([
              Object.freeze({
                label:
                  'Órbita interior A–B',
                roleLabel:
                  'Órbita relativa del par interior',
                facts:
                  Object.freeze([
                    Object.freeze({
                      label:
                        'Semieje mayor',
                      value:
                        '0.8 AU',
                    }),
                    Object.freeze({
                      label:
                        'Excentricidad',
                      value:
                        '0.12',
                    }),
                  ]),
              }),
            ])
          : Object.freeze([]),
      circumbinaryFacts:
        catalogued
          ? Object.freeze([
              Object.freeze({
                label:
                  'Compatibilidad planetaria',
                value:
                  'Compatible con órbitas P-type',
              }),
            ])
          : Object.freeze([]),
      habitabilityFacts:
        confirmed
          ? Object.freeze([
              Object.freeze({
                label:
                  'HZ dinámicamente estable',
                value:
                  '1.4 – 2.1 AU',
              }),
              Object.freeze({
                label:
                  'Candidato persistente',
                value:
                  'Sí',
              }),
            ])
          : Object.freeze([]),
      render:
        Object.freeze({
          accessibleLabel:
            'Sistema Jotheria',
          knowledgeLevel,
          multiplicity:
            identified
              ? StellarSystemMultiplicity.BINARY
              : null,
          components:
            Object.freeze([]),
          innerOrbitEccentricity:
            catalogued
              ? 0.12
              : null,
          outerOrbitEccentricity:
            null,
          stableHabitableZoneFraction:
            confirmed
              ? 0.72
              : null,
          hasStableHabitableZone:
            confirmed,
        }),
    });

  const state =
    confirmed
      ? DiscoveryState.CONFIRMED
      : catalogued
        ? DiscoveryState.CATALOGUED
        : identified
          ? DiscoveryState.DISCOVERED
          : DiscoveryState.DETECTED;

  return {
    universeSeed:
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    generatorVersionCode:
      1,
    locatorKind:
      ArchiveDiscoveryLocatorKind.SYSTEM,
    locatorKindLabel:
      'SystemLocator',
    resultKind:
      'SYSTEM' as never,
    familyLabel:
      'Sistema estelar',
    discoveryState:
      state,
    discoveryStateLabel:
      confirmed
        ? 'Confirmado'
        : catalogued
          ? 'Catalogado'
          : identified
            ? 'Descubierto'
            : 'Detectado',
    galaxyIndex:
      3n,
    sectorKey:
      -17n,
    sectorX:
      -2,
    sectorY:
      4,
    galacticObjectIndex:
      8n,
    proceduralIdentity:
      'G3 / S-17 / O8',
    galacticObjectCard:
      null,
    stellarSystemCard:
      systemCard,
    scientificAction:
      null,
    stellarSystemScientificAction:
      catalogued &&
      !confirmed
        ? Object.freeze({
            actionType:
              StellarSystemScientificActionType.ANALYZE_DISK,
            label:
              'ANALIZAR DISCO',
            targetDiscoveryStateLabel:
              'Confirmado',
            awardedDiscoveryPoints:
              48,
            minimumInstrumentLevelRank:
              2,
            instrumentOptions:
              Object.freeze([
                Object.freeze({
                  instrumentType:
                    ObservationInstrumentType.INFRARED,
                  label:
                    'Infrarrojo',
                  minimumLevelRank:
                    2,
                  highestUnlockedLevelRank:
                    2,
                  isAvailable:
                    true,
                  statusLabel:
                    'Disponible',
                }),
              ]),
            selectedInstrumentType:
              ObservationInstrumentType.INFRARED,
            selectedInstrumentLabel:
              'Infrarrojo',
            canExecute:
              true,
            pendingRequirements:
              null,
            buttonLabel:
              'Analizar disco',
          })
        : null,
    protoplanetaryDiskAnalysis:
      confirmed
        ? Object.freeze({
            summary:
              'El análisis confirma la estructura residual del disco.',
            diskFacts:
              Object.freeze([
                Object.freeze({
                  label:
                    'Masa residual',
                  value:
                    '0.018 M☉',
                }),
              ]),
            formationFacts:
              Object.freeze([
                Object.freeze({
                  label:
                    'Línea de nieve',
                  value:
                    '2.7 AU',
                }),
              ]),
          })
        : null,
  } as ArchiveDiscoveryDetailModel;
}

function component(
  label:
    'A' | 'B',
  catalogued:
    boolean,
  temperature:
    string,
  mass:
    string,
) {

  return Object.freeze({
    componentLabel:
      label,
    designation:
      `Jotheria ${label}`,
    proceduralCode:
      catalogued
        ? `GEN-JOTHERIA-${label}`
        : null,
    spectralType:
      catalogued
        ? label === 'A'
          ? 'G2 V'
          : 'K5 V'
        : null,
    evolutionStateLabel:
      catalogued
        ? 'Secuencia principal'
        : null,
    colorHex:
      catalogued
        ? label === 'A'
          ? '#FFF4D6'
          : '#FFD0A0'
        : '#9DB9C8',
    facts:
      catalogued
        ? Object.freeze([
            Object.freeze({
              label:
                'Masa de referencia',
              value:
                mass,
            }),
            Object.freeze({
              label:
                'Temperatura efectiva',
              value:
                temperature,
            }),
          ])
        : Object.freeze([]),
  });
}
