import {
  TestBed,
} from '@angular/core/testing';

import {
  DiscoveryState,
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
  type GalacticMapLayerVisibility,
} from './galactic-map-layer-state';

import {
  GalacticMapModel,
} from './galactic-map-model';

import {
  GALACTIC_MAP_SCENE_RUNTIME_FACTORY,
  GalacticMapScene,
  staticPresentationScaleMultiplier,
  staticPresentationTiltRadians,
  type GalacticMapSceneRuntime,
} from './galactic-map-scene';

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
            DiscoveryState.DISCOVERED,
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

    let selectCalls:
      Array<readonly [
        number,
        number,
      ]>;

    let layerVisibilityCalls:
      GalacticMapLayerVisibility[];

    let cameraState:
      GalacticMapCameraState;

    let cameraStateListener:
      ((state: GalacticMapCameraState) => void) | null;

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

        selectCalls =
          [];

        layerVisibilityCalls =
          [];

        cameraStateListener =
          null;

        cameraState =
          Object.freeze({
            distance:
              3.5,
            azimuthRadians:
              0,
            polarRadians:
              0.9,
            rollRadians:
              0,
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

            setCameraStateListener(
              listener,
            ) {
              cameraStateListener =
                listener;
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

              cameraState =
                Object.freeze({
                  distance:
                    3.5,
                  azimuthRadians:
                    0,
                  polarRadians:
                    0.9,
                  rollRadians:
                    0,
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

            clearSelection() {},

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

    it(
      'should initialize the interactive renderer host with coverage, persistent markers and six point-10.5 layer controls',
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
              'data-camera-roll',
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
          'Botón derecho + horizontal: alabeo',
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
      },
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
      'should select a GPU sample only for a click-sized primary gesture',
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
          selectCalls,
        ).toEqual([
          [
            122,
            143,
          ],
        ]);

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="galactic-map-selection"]',
          ),
        ).toBeTruthy();

        expect(
          element
            .querySelector(
              '[data-testid="galactic-map-selected-sample"]',
            )
            ?.textContent,
        ).toContain(
          'Muestra #321',
        );
      },
    );

    it(
      'should not accidentally select a GPU sample after a drag gesture',
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
      },
    );

    it(
      'should reset the camera and clear Angular selection state',
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
            .selection(),
        ).not.toBeNull();

        fixture
          .componentInstance
          .resetView();

        fixture.detectChanges();

        expect(
          resetCalls,
        ).toBe(
          1,
        );

        expect(
          fixture
            .componentInstance
            .selection(),
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
      },
    );

    it(
      'should apply the frozen 20-degree depth tilt to both spiral families only',
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

        const expectedTilt =
          -20 *
          Math.PI /
          180;

        expect(
          staticPresentationTiltRadians(
            barred,
          ),
        ).toBeCloseTo(
          expectedTilt,
          12,
        );

        expect(
          staticPresentationTiltRadians(
            spiral,
          ),
        ).toBeCloseTo(
          expectedTilt,
          12,
        );

        expect(
          staticPresentationTiltRadians(
            spheroidal,
          ),
        ).toBe(
          0,
        );
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
