import * as THREE from 'three';

import {
  TestBed,
} from '@angular/core/testing';

import {
  provideRouter,
} from '@angular/router';

import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorCoordinates,
} from '../../domain/sector/galaxy-sector-coordinates';

import {
  GalaxySectorKeyCodec,
} from '../../domain/sector/galaxy-sector-key-codec';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ExternalGalaxyPreliminaryInformationGenerator,
} from '../../simulation/observation/galaxy/external-galaxy-preliminary-information-generator';

import {
  GalaxySectorGridGenerator,
} from '../../simulation/sector/galaxy-sector-grid-generator';

import {
  GalaxyGenerator,
} from '../../simulation/universe/galaxy-generator';

import {
  GalaxyVisualStructureGenerator,
} from '../../simulation/universe/galaxy-visual-structure-generator';

import {
  type GalacticMapCameraState,
  type GalacticMapVisualSelection,
} from './galactic-map-camera-controller';

import {
  GalacticMapDiscoveryMarker,
  GalacticMapDiscoveryMarkers,
} from './galactic-map-discovery-markers';

import {
  buildGalacticMapEnvironmentalLayers,
} from './galactic-map-environmental-layers';

import {
  GalacticMapExplorationCoverage,
} from './galactic-map-exploration-coverage';

import {
  type GalacticMapSectorSelection,
} from './galactic-map-sector-selection';

import {
  type GalacticMapLayerVisibility,
} from './galactic-map-layer-state';

import {
  GalacticMapModel,
} from './galactic-map-model';

import {
  applyGalaxyVisualRotation,
  galacticMapPointVisibilityProfile,
  galacticMapRendererParticleResidencyWindow,
  GALACTIC_MAP_SCENE_RUNTIME_FACTORY,
  GalacticMapScene,
  staticPresentationScaleMultiplier,
  staticPresentationTiltRadians,
  GalacticMapWorkerStatus,
  type GalacticMapLodState,
  type GalacticMapSceneRuntime,
  type GalacticMapWorkerState,
} from './galactic-map-scene';

import {
  GalacticMapLodLevel,
} from './galactic-map-visible-sector-lod';

import {
  galacticMapViewStorageKey,
  readGalacticMapView,
  saveGalacticMapView,
  type GalacticMapViewSnapshot,
} from './galactic-map-view-persistence';

describe(
  'GalacticMapScene',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    function model(
      galaxyIndex =
        0n,

      knowledgeState:
        DiscoveryStateValue =
        DiscoveryState.CONFIRMED,
    ): GalacticMapModel {

      const galaxy =
        GalaxyGenerator.generate(
          generationKey,
          galaxyIndex,
        );

      const grid =
        GalaxySectorGridGenerator
          .generate(
            galaxy,
          );

      const markerCoordinates =
        new GalaxySectorCoordinates(
          0,
          0,
        );

      const coverage =
        new GalacticMapExplorationCoverage(
          generationKey,
          galaxyIndex,
          grid,
          [
            markerCoordinates,
          ],
        );

      const discoveryMarkers =
        new GalacticMapDiscoveryMarkers(
          generationKey,
          galaxyIndex,
          grid,
          [
            new GalacticMapDiscoveryMarker(
              new SystemLocator(
                galaxyIndex,
                GalaxySectorKeyCodec
                  .encode(
                    markerCoordinates,
                  ),
                0n,
              ),
              ExplorationResultKind.SYSTEM,
              DiscoveryState.DETECTED,
              markerCoordinates,
              0.25,
              0.75,
            ),
          ],
        );

      return new GalacticMapModel(
        generationKey,
        galaxyIndex,
        ExternalGalaxyPreliminaryInformationGenerator
          .generate(
            generationKey,
            galaxyIndex,
            knowledgeState,
          ),
        GalaxyVisualStructureGenerator
          .generate(
            galaxy,
          ),
        galaxy.type,
        coverage,
        discoveryMarkers,
        buildGalacticMapEnvironmentalLayers(
          galaxy,
          grid,
          GalaxyVisualStructureGenerator
            .generate(
              galaxy,
            ),
        ),
      );
    }

    function pointerEvent(
      pointerId:
        number,

      clientX:
        number,

      clientY:
        number,
    ): PointerEvent {

      return {
        pointerId,
        clientX,
        clientY,
        pointerType:
          'mouse',
        button:
          0,
      } as PointerEvent;
    }

    let renderCalls:
      GalacticMapModel[];

    let resizeCalls:
      Array<readonly [
        number,
        number,
        number,
      ]>;

    let disposeCalls:
      number;

    let resetCalls:
      number;

    let restoreCalls: GalacticMapViewSnapshot[];

    let markerSelectCalls:
      Array<readonly [
        number,
        number,
      ]>;

    let selectCalls:
      Array<readonly [
        number,
        number,
      ]>;

    let sectorSelectCalls:
      Array<readonly [
        number,
        number,
      ]>;

    let previewCalls: Array<readonly [number, number, number]>;
    let previewClearCalls: number;

    let markerSelectionResult:
      GalacticMapDiscoveryMarker | null;

    let sectorSelectionResult:
      GalacticMapSectorSelection | null;

    let layerVisibilityCalls:
      GalacticMapLayerVisibility[];

    let cameraState:
      GalacticMapCameraState;

    let cameraStateListener:
      ((state: GalacticMapCameraState) => void) | null;

    let galaxySpinRadians:
      number;

    let galaxySpinStateListener:
      ((radians: number) => void) | null;

    let lodStateListener:
      ((state: GalacticMapLodState) => void) | null;

    let workerStateListener:
      ((state: GalacticMapWorkerState) => void) | null;

    const lodState:
      GalacticMapLodState =
      Object.freeze({
        sourceParticleCount:
          182_000,
        materializedParticleCount:
          12_000,
        visibleSectorCount:
          84,
        activeSectorCount:
          112,
        lodLevel:
          GalacticMapLodLevel.OVERVIEW,
        particleRetentionRatio:
          0.88,
        cacheEntryCount:
          1,
      });

    const workerState:
      GalacticMapWorkerState =
      Object.freeze({
        status:
          GalacticMapWorkerStatus.READY,
        runtime:
          'worker',
        requestRevision:
          4,
        appliedRevision:
          4,
        pending:
          false,
      });

    const selectedSample:
      GalacticMapVisualSelection =
      Object.freeze({
        sampleIndex:
          321,
        renderX:
          0.12,
        renderY:
          -0.34,
        renderZ:
          0.05,
        pixelDistance:
          2.1,
      });

    const selectedSector:
      GalacticMapSectorSelection =
      Object.freeze({
        coordinates:
          new GalaxySectorCoordinates(
            4,
            -3,
          ),

        sectorKey:
          GalaxySectorKeyCodec
            .encode(
              new GalaxySectorCoordinates(
                4,
                -3,
              ),
            ),

        explored:
          false,
      });

    const selectedMarker =
      new GalacticMapDiscoveryMarker(
        new SystemLocator(
          0n,
          0n,
          0n,
        ),
        ExplorationResultKind.SYSTEM,
        DiscoveryState.DETECTED,
        new GalaxySectorCoordinates(
          0,
          0,
        ),
        0.5,
        0.5,
      );

    beforeEach(
      async () => {
        renderCalls =
          [];

        resizeCalls =
          [];

        disposeCalls =
          0;

        resetCalls =
          0;
        restoreCalls = [];
        localStorage.removeItem(galacticMapViewStorageKey(model()));
        localStorage.removeItem(galacticMapViewStorageKey(model(1n)));

        markerSelectCalls =
          [];

        selectCalls =
          [];

        sectorSelectCalls =
          [];

        previewCalls = [];
        previewClearCalls = 0;

        markerSelectionResult =
          null;

        sectorSelectionResult =
          selectedSector;

        layerVisibilityCalls =
          [];

        cameraStateListener =
          null;

        galaxySpinRadians =
          0;

        galaxySpinStateListener =
          null;

        lodStateListener =
          null;

        workerStateListener =
          null;

        cameraState =
          Object.freeze({
            distance:
              3.5,
            azimuthRadians:
              0,
            polarRadians:
              0.9,
            targetX:
              0,
            targetY:
              0,
            targetZ:
              0,
            rotationEnabled:
              true,
          });

        const runtime:
          GalacticMapSceneRuntime =
          {
            resize(
              width,
              height,
              devicePixelRatio,
            ) {
              resizeCalls.push([
                width,
                height,
                devicePixelRatio,
              ]);
            },

            render(
              value,
            ) {
              renderCalls.push(
                value,
              );

              return {
                particleCount:
                  12_000,
              };
            },

            cameraState() {
              return cameraState;
            },

            galaxySpinRadians() {
              return galaxySpinRadians;
            },

            restoreView(snapshot) {
              restoreCalls.push(snapshot);
              cameraState = snapshot.camera;
              galaxySpinRadians = snapshot.galaxySpinRadians;
              cameraStateListener?.(cameraState);
              galaxySpinStateListener?.(galaxySpinRadians);
            },

            setCameraStateListener(
              listener,
            ) {
              cameraStateListener =
                listener;
            },

            setGalaxySpinStateListener(
              listener,
            ) {
              galaxySpinStateListener =
                listener;

              galaxySpinStateListener?.(
                galaxySpinRadians,
              );
            },

            setLodStateListener(
              listener,
            ) {
              lodStateListener =
                listener;

              lodStateListener?.(
                lodState,
              );
            },

            setWorkerStateListener(
              listener,
            ) {
              workerStateListener =
                listener;

              workerStateListener?.(
                workerState,
              );
            },

            setRotationEnabled(
              enabled,
            ) {
              cameraState =
                Object.freeze({
                  ...cameraState,
                  rotationEnabled:
                    enabled,
                });

              cameraStateListener?.(
                cameraState,
              );
            },

            setLayerVisibility(
              visibility,
            ) {
              layerVisibilityCalls.push(
                visibility,
              );
            },

            resetView() {
              resetCalls +=
                1;

              galaxySpinRadians =
                0;

              galaxySpinStateListener?.(
                galaxySpinRadians,
              );

              cameraState =
                Object.freeze({
                  distance:
                    3.5,
                  azimuthRadians:
                    0,
                  polarRadians:
                    0.9,
                  targetX:
                    0,
                  targetY:
                    0,
                  targetZ:
                    0,
                  rotationEnabled:
                    cameraState.rotationEnabled,
                });

              cameraStateListener?.(
                cameraState,
              );
            },

            selectDiscoveryMarkerAt(
              clientX,
              clientY,
            ) {
              markerSelectCalls.push([
                clientX,
                clientY,
              ]);

              return markerSelectionResult;
            },

            selectAt(
              clientX,
              clientY,
            ) {
              selectCalls.push([
                clientX,
                clientY,
              ]);

              return selectedSample;
            },

            selectSectorAt(
              clientX,
              clientY,
            ) {
              sectorSelectCalls.push([
                clientX,
                clientY,
              ]);

              return sectorSelectionResult;
            },

            clearSelection() {},

            clearSectorSelection() {},

            previewSectorAt(clientX, clientY, size) {
              previewCalls.push([clientX, clientY, size]);
              return { anchor: selectedSector, size, total: size * size,
                valid: true, skipped: 0, pending: size * size, cells: [] };
            },

            clearSectorPreview() { previewClearCalls++; },

            dispose() {
              disposeCalls +=
                1;
            },
          };

        await TestBed
          .configureTestingModule({
            imports: [
              GalacticMapScene,
            ],

            providers: [
              provideRouter(
                [],
              ),

              {
                provide:
                  GALACTIC_MAP_SCENE_RUNTIME_FACTORY,

                useValue: () =>
                  runtime,
              },
            ],
          })
          .compileComponents();
      },
    );

    afterEach(() => {
      localStorage.removeItem(galacticMapViewStorageKey(model()));
      localStorage.removeItem(galacticMapViewStorageKey(model(1n)));
    });

    it('restores the same galaxy view after navigation, preserving refreshes and isolating another galaxy', () => {
      const firstModel = model();
      const key = galacticMapViewStorageKey(firstModel);
      const snapshot: GalacticMapViewSnapshot = {
        version: 1,
        camera: {
          distance: 0.8, azimuthRadians: 0.5, polarRadians: 1.0,
          targetX: 0.2, targetY: -0.1, targetZ: 0, rotationEnabled: false,
        },
        galaxySpinRadians: 0.6,
        layers: { systems: true, nebulae: false, starClusters: true,
          extremeObjects: true, regions: true, habitableZone: true },
      };
      saveGalacticMapView(key, snapshot);
      const fixture = TestBed.createComponent(GalacticMapScene);
      fixture.componentRef.setInput('model', firstModel);
      fixture.detectChanges();
      expect(restoreCalls).toHaveLength(1);
      expect(restoreCalls[0]).toEqual(snapshot);
      expect(fixture.componentInstance.cameraState()?.distance).toBe(0.8);
      expect(fixture.componentInstance.galaxySpinRadians()).toBe(0.6);
      expect(fixture.componentInstance.layerVisibility().nebulae).toBe(false);
      // A new model of the SAME galaxy after exploration must keep the zoom/spin.
      fixture.componentRef.setInput('model', model());
      fixture.detectChanges();
      expect(restoreCalls).toHaveLength(2);
      expect(restoreCalls[1]).toEqual(snapshot);
      fixture.componentInstance.resetView();
      expect(readGalacticMapView(key)?.camera.distance).toBe(3.5);
      expect(readGalacticMapView(key)?.galaxySpinRadians).toBe(0);
      // Switching to a different galaxy must not import the old camera/layers.
      fixture.componentRef.setInput('model', model(1n));
      fixture.detectChanges();
      expect(restoreCalls).toHaveLength(2);
      expect(fixture.componentInstance.layerVisibility().nebulae).toBe(true);
      fixture.destroy();
    });

    it('previsualiza el bloque bajo el ratón sin seleccionar ni explorar y se borra al salir o arrastrar', () => {
      const fixture = TestBed.createComponent(GalacticMapScene);
      fixture.componentRef.setInput('model', model());
      fixture.componentRef.setInput('blockSize', 4);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      component.onCanvasPointerMove({ ...pointerEvent(1, 120, 140), buttons: 0 });
      fixture.detectChanges();
      expect(previewCalls.at(-1)).toEqual([120, 140, 4]);
      expect(fixture.nativeElement.querySelector('[data-testid="galactic-map-sector-block-preview"]')
        ?.getAttribute('data-preview-size')).toBe('4');
      expect(sectorSelectCalls).toHaveLength(0);
      component.onCanvasPointerLeave();
      fixture.detectChanges();
      expect(component.sectorPreview()).toBeNull();
      expect(previewClearCalls).toBeGreaterThan(0);
      component.onCanvasPointerMove({ ...pointerEvent(1, 120, 140), buttons: 0 });
      component.onCanvasPointerDown(pointerEvent(1, 120, 140));
      expect(component.sectorPreview()).toBeNull();
      const before = previewCalls.length;
      component.onCanvasPointerMove({ ...pointerEvent(1, 180, 190), buttons: 1 });
      expect(previewCalls).toHaveLength(before);
      component.onCanvasPointerUp(pointerEvent(1, 180, 190));
      expect(sectorSelectCalls).toHaveLength(0);
    });

    it(
      'should initialize the point-10.9 worker-backed renderer with visible-sector LOD, coverage, markers and six thematic layers',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticMapScene,
          );

        fixture.componentRef.setInput(
          'model',
          model(),
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="galactic-map-canvas"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-controls"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-exploration-coverage"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-markers"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-markers"]',
          )?.textContent,
        ).toContain(
          'Descubrimientos localizados',
        );

        expect(
          element.querySelector(
            '[data-testid="galactic-map-markers"]',
          )?.textContent,
        ).not.toContain(
          'Objetos localizados',
        );

        expect(
          element.querySelector(
            '.galactic-map-scene__marker-swatch',
          ),
        ).toBeNull();

        expect(
          element
            .querySelector(
              '[data-testid="galactic-map-scene"]',
            )
            ?.getAttribute(
              'data-explored-sector-count',
            ),
        ).toBe(
          '1',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-map-scene"]',
            )
            ?.getAttribute(
              'data-discovery-marker-count',
            ),
        ).toBe(
          '1',
        );

        expect(
          element.querySelector(
            '[data-testid="galactic-map-discovery-marker-count"]',
          )?.textContent,
        ).toContain(
          '1',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-map-scene"]',
            )
            ?.getAttribute(
              'data-sector-grid-side',
            ),
        ).toBe(
          '173',
        );

        expect(
          element.querySelector(
            '[data-testid="galactic-map-exploration-coverage"]',
          )?.textContent,
        ).toContain(
          'No explorado',
        );

        expect(
          element.querySelector(
            '[data-testid="galactic-map-lod-status"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-lod-level"]',
          )?.textContent,
        ).toContain(
          'OVERVIEW',
        );

        const scene =
          element.querySelector(
            '[data-testid="galactic-map-scene"]',
          );

        expect(
          scene?.getAttribute(
            'data-source-particle-count',
          ),
        ).toBe(
          '182000',
        );

        expect(
          scene?.getAttribute(
            'data-materialized-particle-count',
          ),
        ).toBe(
          '12000',
        );

        expect(
          scene?.getAttribute(
            'data-visible-sector-count',
          ),
        ).toBe(
          '84',
        );

        expect(
          scene?.getAttribute(
            'data-active-sector-count',
          ),
        ).toBe(
          '112',
        );

        expect(
          scene?.getAttribute(
            'data-worker-status',
          ),
        ).toBe(
          'READY',
        );

        expect(
          scene?.getAttribute(
            'data-worker-runtime',
          ),
        ).toBe(
          'worker',
        );

        expect(
          scene?.getAttribute(
            'data-worker-pending',
          ),
        ).toBe(
          'false',
        );

        expect(
          element.querySelector(
            '[data-testid="galactic-map-worker-status"]',
          )?.textContent,
        ).toContain(
          'READY',
        );

        expect(
          renderCalls,
        ).toHaveLength(
          1,
        );

        expect(
          resizeCalls.length,
        ).toBeGreaterThanOrEqual(
          1,
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-map-scene"]',
            )
            ?.getAttribute(
              'data-render-state',
            ),
        ).toBe(
          'ready',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-map-scene"]',
            )
            ?.getAttribute(
              'data-rotation-enabled',
            ),
        ).toBe(
          'true',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-map-scene"]',
            )
            ?.getAttribute(
              'data-galaxy-spin',
            ),
        ).toBe(
          '0',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-map-control-help"]',
            )
            ?.textContent,
        ).toContain(
          'Botón derecho + horizontal: girar la galaxia sobre sí misma',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-map-control-help"]',
            )
            ?.textContent,
        ).toContain(
          'Ctrl + arrastrar: desplazar',
        );

        expect(
          element.querySelector(
            '[data-testid="galactic-map-layers"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelectorAll(
            '[data-testid^="galactic-map-layer-"]',
          ),
        ).toHaveLength(
          6,
        );

        expect(
          layerVisibilityCalls.length,
        ).toBeGreaterThanOrEqual(
          2,
        );
      },30_000,
    );

    it(
      'should toggle one thematic layer without mutating the other five visibility flags',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticMapScene,
          );

        fixture.componentRef.setInput(
          'model',
          model(),
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        const nebulaButton =
          element.querySelector(
            '[data-testid="galactic-map-layer-nebulae"]',
          ) as HTMLButtonElement;

        expect(
          nebulaButton.getAttribute(
            'aria-pressed',
          ),
        ).toBe(
          'true',
        );

        nebulaButton.click();
        fixture.detectChanges();

        expect(
          nebulaButton.getAttribute(
            'aria-pressed',
          ),
        ).toBe(
          'false',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-map-scene"]',
            )
            ?.getAttribute(
              'data-layer-nebulae-visible',
            ),
        ).toBe(
          'false',
        );

        const latest =
          layerVisibilityCalls[
            layerVisibilityCalls.length -
            1
          ];

        expect(
          latest.nebulae,
        ).toBe(
          false,
        );

        expect(
          latest.systems &&
          latest.starClusters &&
          latest.extremeObjects &&
          latest.regions &&
          latest.habitableZone,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should rerender through the same runtime when the Angular input changes',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticMapScene,
          );

        fixture.componentRef.setInput(
          'model',
          model(
            0n,
          ),
        );

        fixture.detectChanges();

        fixture.componentRef.setInput(
          'model',
          model(
            1n,
          ),
        );

        fixture.detectChanges();

        expect(
          renderCalls,
        ).toHaveLength(
          2,
        );

        expect(
          renderCalls[
            1
          ]
            .galaxyIndex,
        ).toBe(
          1n,
        );
      },
    );

    it(
      'should toggle optional camera rotation while keeping the scene ready',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticMapScene,
          );

        fixture.componentRef.setInput(
          'model',
          model(),
        );

        fixture.detectChanges();

        fixture
          .componentInstance
          .toggleRotation();

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          cameraState.rotationEnabled,
        ).toBe(
          false,
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-map-scene"]',
            )
            ?.getAttribute(
              'data-rotation-enabled',
            ),
        ).toBe(
          'false',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-map-rotation-toggle"]',
            )
            ?.textContent,
        ).toContain(
          'BLOQUEADA',
        );
      },
    );

    it(
      'should select a real galactic sector instead of exposing a renderer-only GPU sample',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticMapScene,
          );

        fixture.componentRef.setInput(
          'model',
          model(),
        );

        fixture.detectChanges();

        fixture
          .componentInstance
          .onCanvasPointerDown(
            pointerEvent(
              7,
              120,
              140,
            ),
          );

        fixture
          .componentInstance
          .onCanvasPointerUp(
            pointerEvent(
              7,
              122,
              143,
            ),
          );

        fixture.detectChanges();

        expect(
          markerSelectCalls,
        ).toEqual([
          [
            122,
            143,
          ],
        ]);

        expect(
          selectCalls,
        ).toHaveLength(
          0,
        );

        expect(
          sectorSelectCalls,
        ).toEqual([
          [
            122,
            143,
          ],
        ]);

        expect(
          fixture
            .componentInstance
            .sectorSelection(),
        ).toBe(
          selectedSector,
        );

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="galactic-map-selection"]',
          ),
        ).toBeNull();

        expect(
          element
            .querySelector(
              '[data-testid="galactic-map-selected-sample"]',
            ),
        ).toBeNull();

        expect(
          element
            .querySelector(
              '[data-testid="galactic-map-selected-sector-coordinates"]',
            )
            ?.textContent,
        ).toContain(
          'Sector (4, -3)',
        );

        const exploreRequests:
          GalacticMapSectorSelection[] =
          [];

        fixture
          .componentInstance
          .sectorExplore
          .subscribe(
            (selection) => {
              exploreRequests.push(
                selection,
              );
            },
          );

        element
          .querySelector<HTMLButtonElement>(
            '[data-testid="galactic-map-explore-sector-link"]',
          )
          ?.click();

        expect(
          exploreRequests,
        ).toEqual([
          selectedSector,
        ]);
      },
    );

    it(
      'should keep sector selection informational on a catalogued read-only map',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticMapScene,
          );

        fixture.componentRef.setInput(
          'model',
          model(
            1n,
            DiscoveryState.CATALOGUED,
          ),
        );

        fixture.detectChanges();

        fixture
          .componentInstance
          .onCanvasPointerDown(
            pointerEvent(
              9,
              120,
              140,
            ),
          );

        fixture
          .componentInstance
          .onCanvasPointerUp(
            pointerEvent(
              9,
              122,
              143,
            ),
          );

        fixture.detectChanges();

        const exploreRequests:
          GalacticMapSectorSelection[] =
          [];

        fixture.componentInstance.sectorExplore
          .subscribe(
            (
              selection,
            ) => {
              exploreRequests.push(
                selection,
              );
            },
          );

        fixture.componentInstance
          .requestSectorExploration(
            selectedSector,
          );

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="galactic-map-explore-sector-link"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-sector-read-only-message"]',
          )?.textContent,
        ).toContain(
          'modo consulta',
        );

        expect(exploreRequests).toEqual([]);
      },
    );

    it(
      'should give a persistent marker absolute priority over sector selection, expose 10.7 relative position and keep its archive link',
      () => {
        markerSelectionResult =
          selectedMarker;

        const fixture =
          TestBed.createComponent(
            GalacticMapScene,
          );

        fixture.componentRef.setInput(
          'model',
          model(),
        );

        fixture.detectChanges();

        fixture
          .componentInstance
          .onCanvasPointerDown(
            pointerEvent(
              12,
              180,
              160,
            ),
          );

        fixture
          .componentInstance
          .onCanvasPointerUp(
            pointerEvent(
              12,
              180,
              160,
            ),
          );

        fixture.detectChanges();

        expect(
          markerSelectCalls,
        ).toEqual([
          [
            180,
            160,
          ],
        ]);

        expect(
          selectCalls,
        ).toHaveLength(
          0,
        );

        expect(
          sectorSelectCalls,
        ).toHaveLength(
          0,
        );

        expect(
          fixture
            .componentInstance
            .selection(),
        ).toBeNull();

        expect(
          fixture
            .componentInstance
            .sectorSelection(),
        ).toBeNull();

        expect(
          fixture
            .componentInstance
            .markerSelection(),
        ).toBe(
          selectedMarker,
        );

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="galactic-map-marker-selection"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-selected-marker-family"]',
          )?.textContent,
        ).toContain(
          'Sistema',
        );

        expect(
          element.querySelector(
            '[data-testid="galactic-map-selected-marker-identity"]',
          )?.textContent,
        ).toContain(
          'SYS-0',
        );

        expect(
          element.querySelector(
            '[data-testid="galactic-map-selected-marker-state"]',
          )?.textContent,
        ).toContain(
          'Detectado',
        );

        const relativePosition =
          element.querySelector(
            '[data-testid="galactic-map-relative-position"]',
          );

        expect(
          relativePosition,
        ).toBeTruthy();

        expect(
          relativePosition?.textContent,
        ).toContain(
          'POSICIÓN RELATIVA EN LA GALAXIA',
        );

        expect(
          relativePosition?.getAttribute(
            'data-relative-x-light-years',
          ),
        ).toBe(
          '0',
        );

        expect(
          relativePosition?.getAttribute(
            'data-relative-y-light-years',
          ),
        ).toBe(
          '0',
        );

        expect(
          relativePosition?.getAttribute(
            'data-distance-from-center-light-years',
          ),
        ).toBe(
          '0',
        );

        expect(
          relativePosition?.getAttribute(
            'data-normalized-radius',
          ),
        ).toBe(
          '0',
        );

        expect(
          relativePosition?.getAttribute(
            'data-azimuth-degrees',
          ),
        ).toBe(
          '0',
        );

        expect(
          relativePosition?.getAttribute(
            'data-galactic-region',
          ),
        ).toBe(
          'CENTRAL',
        );

        expect(
          element.querySelector(
            '[data-testid="galactic-map-relative-region"]',
          )?.textContent,
        ).toContain(
          'Región central',
        );

        expect(
          element.querySelector(
            '[data-testid="galactic-map-marker-link"]',
          )?.getAttribute(
            'href',
          ),
        ).toBe(
          '/archive/system/0/0/0?seed=7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1&version=1',
        );

        expect(
          fixture
            .componentInstance
            .markerArchiveQueryParams(),
        ).toEqual({
          seed:
            '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
          version:
            '1',
        });


        fixture
          .componentInstance
          .onLayerVisibilityChange({
            layerId:
              'systems',
            visible:
              false,
          });

        expect(
          fixture
            .componentInstance
            .markerSelection(),
        ).toBeNull();
      },
    );

    it(
      'should not accidentally select a sector after a drag gesture',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticMapScene,
          );

        fixture.componentRef.setInput(
          'model',
          model(),
        );

        fixture.detectChanges();

        fixture
          .componentInstance
          .onCanvasPointerDown(
            pointerEvent(
              9,
              100,
              100,
            ),
          );

        fixture
          .componentInstance
          .onCanvasPointerMove(
            pointerEvent(
              9,
              150,
              120,
            ),
          );

        fixture
          .componentInstance
          .onCanvasPointerUp(
            pointerEvent(
              9,
              150,
              120,
            ),
          );

        expect(
          selectCalls,
        ).toHaveLength(
          0,
        );

        expect(
          sectorSelectCalls,
        ).toHaveLength(
          0,
        );
      },
    );

    it(
      'should reset the camera and clear Angular sector/marker selection state',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticMapScene,
          );

        fixture.componentRef.setInput(
          'model',
          model(),
        );

        fixture.detectChanges();

        // Initialising a new galaxy now resets the runtime once when
        // there is no previously saved view. Count only the explicit
        // user-requested reset below, not the initialisation reset.
        const resetCallsBeforeUserAction = resetCalls;
        expect(resetCallsBeforeUserAction).toBe(1);

        fixture
          .componentInstance
          .onCanvasPointerDown(
            pointerEvent(
              4,
              200,
              200,
            ),
          );

        fixture
          .componentInstance
          .onCanvasPointerUp(
            pointerEvent(
              4,
              200,
              200,
            ),
          );

        fixture.detectChanges();

        expect(
          fixture
            .componentInstance
            .sectorSelection(),
        ).not.toBeNull();

        fixture
          .componentInstance
          .resetView();

        fixture.detectChanges();

        expect(
          resetCalls,
        ).toBe(
          resetCallsBeforeUserAction + 1,
        );

        expect(
          fixture
            .componentInstance
            .selection(),
        ).toBeNull();

        expect(
          fixture
            .componentInstance
            .sectorSelection(),
        ).toBeNull();

        expect(
          fixture
            .componentInstance
            .markerSelection(),
        ).toBeNull();
      },
    );

    it(
      'should dispose the interactive renderer runtime when Angular destroys the scene',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticMapScene,
          );

        fixture.componentRef.setInput(
          'model',
          model(),
        );

        fixture.detectChanges();
        fixture.destroy();

        expect(
          disposeCalls,
        ).toBe(
          1,
        );

        expect(
          cameraStateListener,
        ).toBeNull();

        expect(
          lodStateListener,
        ).toBeNull();
      },
    );

    it(
      'should compose visual galaxy spin around the galaxy local axis without changing its plane normal',
      () => {
        const group =
          new THREE.Group();

        const tiltRadians =
          THREE.MathUtils.degToRad(
            -20,
          );

        const initialLocalXAxis =
          new THREE.Vector3(
            1,
            0,
            0,
          );

        const localPlaneNormal =
          new THREE.Vector3(
            0,
            0,
            1,
          );

        applyGalaxyVisualRotation(
          group,
          tiltRadians,
          0,
        );

        const initialPlaneNormal =
          localPlaneNormal
            .clone()
            .applyQuaternion(
              group.quaternion,
            );

        const initialXAxis =
          initialLocalXAxis
            .clone()
            .applyQuaternion(
              group.quaternion,
            );

        applyGalaxyVisualRotation(
          group,
          tiltRadians,
          Math.PI /
            2,
        );

        const spunPlaneNormal =
          localPlaneNormal
            .clone()
            .applyQuaternion(
              group.quaternion,
            );

        const spunXAxis =
          initialLocalXAxis
            .clone()
            .applyQuaternion(
              group.quaternion,
            );

        expect(
          spunPlaneNormal.distanceTo(
            initialPlaneNormal,
          ),
        ).toBeLessThan(
          1e-12,
        );

        expect(
          spunXAxis.distanceTo(
            initialXAxis,
          ),
        ).toBeGreaterThan(
          1,
        );
      },
    );

    it(
      'should use the same zero presentation tilt for every galactic morphology',
      () => {
        const spheroidal =
          model(
            0n,
          );

        const barred =
          model(
            1n,
          );

        const spiral =
          model(
            3n,
          );

        const dwarf =
          model(
            4n,
          );

        const irregular =
          model(
            10n,
          );

        for (
          const candidate of [
            spheroidal,
            barred,
            spiral,
            dwarf,
            irregular,
          ]
        ) {
          expect(
            staticPresentationTiltRadians(
              candidate,
            ),
          ).toBe(
            0,
          );
        }
      },
    );

    it(
      'should keep the renderer-only galaxy cloud resident across camera-sector window changes and vary it only by LOD',
      () => {
        const activeModel =
          model();

        const coverage =
          activeModel
            .explorationCoverage;

        expect(
          coverage,
        ).not.toBeNull();

        if (
          coverage ===
            null
        ) {
          throw new Error(
            'Expected exploration coverage.',
          );
        }

        const baseWindow =
          Object.freeze({
            visible:
              Object.freeze({
                minX:
                  -8,
                maxX:
                  8,
                minY:
                  -5,
                maxY:
                  5,
              }),
            active:
              Object.freeze({
                minX:
                  -9,
                maxX:
                  9,
                minY:
                  -6,
                maxY:
                  6,
              }),
            visibleSectorCount:
              187,
            activeSectorCount:
              247,
            prefetchMarginSectors:
              1,
            lodLevel:
              GalacticMapLodLevel.BALANCED,
            particleRetentionRatio:
              0.96,
            signature:
              'BALANCED:-9:9:-6:6',
          });

        const zoomedWindow =
          Object.freeze({
            ...baseWindow,
            visible:
              Object.freeze({
                minX:
                  -2,
                maxX:
                  2,
                minY:
                  -2,
                maxY:
                  2,
              }),
            active:
              Object.freeze({
                minX:
                  -3,
                maxX:
                  3,
                minY:
                  -3,
                maxY:
                  3,
              }),
            visibleSectorCount:
              25,
            activeSectorCount:
              49,
            signature:
              'BALANCED:-3:3:-3:3',
          });

        const baseResidency =
          galacticMapRendererParticleResidencyWindow(
            baseWindow,
            coverage,
          );

        const zoomedResidency =
          galacticMapRendererParticleResidencyWindow(
            zoomedWindow,
            coverage,
          );

        expect(
          baseResidency.active,
        ).toEqual({
          minX:
            coverage.grid
              .minCoordinate,
          maxX:
            coverage.grid
              .maxCoordinate,
          minY:
            coverage.grid
              .minCoordinate,
          maxY:
            coverage.grid
              .maxCoordinate,
        });

        expect(
          baseResidency.activeSectorCount,
        ).toBe(
          Number(
            coverage
              .totalSectorCount,
          ),
        );

        expect(
          zoomedResidency.active,
        ).toEqual(
          baseResidency.active,
        );

        expect(
          zoomedResidency.signature,
        ).toBe(
          baseResidency.signature,
        );

        expect(
          baseResidency.signature,
        ).toBe(
          'RENDER_FULL:BALANCED',
        );

        const detailResidency =
          galacticMapRendererParticleResidencyWindow(
            Object.freeze({
              ...zoomedWindow,
              lodLevel:
                GalacticMapLodLevel.DETAIL,
              particleRetentionRatio:
                1,
              signature:
                'DETAIL:-3:3:-3:3',
            }),
            coverage,
          );

        expect(
          detailResidency.signature,
        ).toBe(
          'RENDER_FULL:DETAIL',
        );
      },
    );

    it(
      'should keep whole-galaxy particles legible at OVERVIEW without altering DETAIL presentation',
      () => {
        const overview =
          galacticMapPointVisibilityProfile(
            GalacticMapLodLevel.OVERVIEW,
          );

        const balanced =
          galacticMapPointVisibilityProfile(
            GalacticMapLodLevel.BALANCED,
          );

        const detail =
          galacticMapPointVisibilityProfile(
            GalacticMapLodLevel.DETAIL,
          );

        expect(
          overview.pointScale,
        ).toBeGreaterThan(
          balanced.pointScale,
        );

        expect(
          balanced.pointScale,
        ).toBeGreaterThan(
          detail.pointScale,
        );

        expect(
          overview.opacityScale *
          overview.outerVisibilityScale,
        ).toBeGreaterThan(
          balanced.opacityScale *
          balanced.outerVisibilityScale,
        );

        expect(
          detail,
        ).toEqual({
          pointScale:
            1,
          opacityScale:
            1,
          outerVisibilityScale:
            1,
        });
      },
    );

    it(
      'should preserve morphology-specific framing while point 10.2 changes only the camera interaction layer',
      () => {
        const spheroidal =
          model(
            0n,
          );

        const barred =
          model(
            1n,
          );

        const spiral =
          model(
            3n,
          );

        const dwarf =
          model(
            4n,
          );

        const irregular =
          model(
            10n,
          );

        expect(
          staticPresentationScaleMultiplier(
            spheroidal,
          ),
        ).toBe(
          1,
        );

        expect(
          staticPresentationScaleMultiplier(
            barred,
          ),
        ).toBe(
          1,
        );

        expect(
          staticPresentationScaleMultiplier(
            spiral,
          ),
        ).toBe(
          1,
        );

        expect(
          staticPresentationScaleMultiplier(
            dwarf,
          ),
        ).toBe(
          1.34,
        );

        expect(
          staticPresentationScaleMultiplier(
            irregular,
          ),
        ).toBe(
          1.20,
        );
      },
    );
  },
);
