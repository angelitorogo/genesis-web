import {
  TestBed,
} from '@angular/core/testing';

import {
  provideRouter,
} from '@angular/router';

import {
  vi,
} from 'vitest';

import {
  MinorBodyKind,
} from '../../domain/planetary/minor-body-kind';

import {
  ArchiveStellarSystemKnowledgeLevel,
} from '../genesis-archive/archive-stellar-system-card';

import {
  SYSTEM_SCENE_RUNTIME_FACTORY,
  SystemScene,
  SystemSceneWebGl2UnavailableError,
  systemSceneCameraFovDegrees,
  systemSceneDevicePixelRatio,
  systemScenePickingRadiusScene,
  type SystemSceneLayerVisibility,
  type SystemSceneRuntime,
  type SystemSceneSelectionChangeHandler,
} from './system-scene';

import {
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

describe(
  'SystemScene through point 25.11',
  () => {

    let resize:
      SystemSceneRuntime['resize'];

    let render:
      SystemSceneRuntime['render'];

    let dispose:
      SystemSceneRuntime['dispose'];

    let resetView:
      NonNullable<SystemSceneRuntime['resetView']>;

    let followBody:
      NonNullable<SystemSceneRuntime['followBody']>;

    let stopFollowing:
      NonNullable<SystemSceneRuntime['stopFollowing']>;

    let setLayerVisibility:
      NonNullable<SystemSceneRuntime['setLayerVisibility']>;

    let setPageVisible:
      NonNullable<SystemSceneRuntime['setPageVisible']>;

    let runtimeFactory:
      ReturnType<typeof vi.fn>;

    let capturedSelectionHandler:
      SystemSceneSelectionChangeHandler | null;

    beforeEach(
      async () => {

        capturedSelectionHandler =
          null;

        resize =
          vi.fn(
            (
              _width:
                number,

              _height:
                number,

              _devicePixelRatio:
                number,
            ): void => {},
          );

        render =
          vi.fn(
            (
              _snapshot:
                SystemSceneSnapshot,
            ) =>
              Object.freeze({
                renderer:
                  'WEBGL2' as const,
                shaderPipeline:
                  'GLSL_WEBGL2_V1' as const,
                webGpuEvaluation:
                  'API_UNAVAILABLE' as const,
                physicalBodyCount:
                  3,
                sceneObjectCount:
                  11,
              }),
          );

        dispose =
          vi.fn(
            (): void => {},
          );

        resetView =
          vi.fn(
            (): void => {},
          );

        followBody =
          vi.fn(
            (
              _bodyId:
                string,
            ): boolean => true,
          );

        stopFollowing =
          vi.fn(
            (): void => {},
          );

        setLayerVisibility =
          vi.fn(
            (
              _visibility:
                SystemSceneLayerVisibility,
            ): void => {},
          );

        setPageVisible =
          vi.fn(
            (
              _visible:
                boolean,
            ): void => {},
          );

        const runtime:
          SystemSceneRuntime =
          {
            resize,
            render,
            resetView,
            followBody,
            stopFollowing,
            setLayerVisibility,
            setPageVisible,
            dispose,
          };

        runtimeFactory =
          vi.fn(
            (
              _canvas:
                HTMLCanvasElement,

              onSelectionChange?:
                SystemSceneSelectionChangeHandler,
            ): SystemSceneRuntime => {
              capturedSelectionHandler =
                onSelectionChange ??
                null;

              return runtime;
            },
          );

        await TestBed
          .configureTestingModule({
            imports: [
              SystemScene,
            ],

            providers: [
              provideRouter(
                [],
              ),
              {
                provide:
                  SYSTEM_SCENE_RUNTIME_FACTORY,

                useValue:
                  runtimeFactory,
              },
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should initialize the injected Three.js runtime, render the exact snapshot and expose READY state',
      () => {

        const fixture =
          TestBed.createComponent(
            SystemScene,
          );

        const snapshot =
          sceneSnapshot();

        fixture
          .componentRef
          .setInput(
            'snapshot',
            snapshot,
          );

        fixture.detectChanges();

        expect(
          runtimeFactory,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          setPageVisible,
        ).toHaveBeenCalledWith(
          true,
        );

        expect(
          render,
        ).toHaveBeenCalledWith(
          snapshot,
        );

        expect(
          fixture
            .componentInstance
            .renderState(),
        ).toBe(
          'ready',
        );

        expect(
          fixture
            .nativeElement
            .querySelector(
              '[data-testid="system-scene-ready"]',
            ),
        ).toBeTruthy();

        expect(
          fixture
            .componentInstance
            .renderInfo()
            ?.physicalBodyCount,
        ).toBe(
          3,
        );

        expect(
          fixture
            .componentInstance
            .renderInfo()
            ?.shaderPipeline,
        ).toBe(
          'GLSL_WEBGL2_V1',
        );

        expect(
          fixture
            .componentInstance
            .renderInfo()
            ?.webGpuEvaluation,
        ).toBe(
          'API_UNAVAILABLE',
        );

        expect(
          fixture
            .nativeElement
            .querySelector(
              '[data-testid="system-scene-controls"]',
            )
            ?.textContent,
        ).toContain(
          'ORBITAR',
        );


        expect(
          fixture
            .nativeElement
            .querySelector(
              '[data-testid="system-scene-ready"]',
            )
            ?.textContent,
        ).toContain(
          'ATM · TERM · NIGHT',
        );

        expect(
          fixture
            .nativeElement
            .querySelector(
              '[data-testid="system-scene-ready"]',
            )
            ?.textContent,
        ).toContain(
          'LOD · INST · CACHE',
        );
      },
    );

    it(
      'should reject mutable scene input before it reaches even an injected renderer runtime',
      () => {

        const fixture =
          TestBed.createComponent(
            SystemScene,
          );

        const mutableSnapshot = {
          ...sceneSnapshot(),
        } as SystemSceneSnapshot;

        fixture
          .componentRef
          .setInput(
            'snapshot',
            mutableSnapshot,
          );

        fixture.detectChanges();

        expect(
          render,
        ).not.toHaveBeenCalled();

        expect(
          fixture
            .componentInstance
            .renderState(),
        ).toBe(
          'error',
        );
      },
    );

    it(
      'should expose shared body selection state and reset-view controls to every SystemScene host',
      () => {

        const fixture =
          TestBed.createComponent(
            SystemScene,
          );

        fixture
          .componentRef
          .setInput(
            'snapshot',
            sceneSnapshot(),
          );

        const emittedSelections: unknown[] = [];

        fixture
          .componentInstance
          .bodySelectionChange
          .subscribe(
            selection => {
              emittedSelections.push(
                selection,
              );
            },
          );

        fixture.detectChanges();

        expect(
          capturedSelectionHandler,
        ).not.toBeNull();

        (
          capturedSelectionHandler as
            SystemSceneSelectionChangeHandler
        )(
          Object.freeze({
            bodyId:
              'planet-1',
            kind:
              'planet',
            label:
              'b',
            title:
              'Jotheria b',
          }),
        );

        fixture.detectChanges();

        expect(
          fixture
            .componentInstance
            .selection()
            ?.bodyId,
        ).toBe(
          'planet-1',
        );

        expect(
          fixture
            .nativeElement
            .querySelector(
              '[data-testid="system-scene-selection"]',
            )
            ?.textContent,
        ).toContain(
          'Jotheria b',
        );

        expect(
          fixture
            .componentInstance
            .bodyCardOpen(),
        ).toBe(
          true,
        );

        expect(
          fixture
            .nativeElement
            .querySelector(
              '[data-testid="system-scene-body-card"]',
            )
            ?.textContent,
        ).toContain(
          'FICHA DE CUERPO · 24.8',
        );

        expect(
          fixture
            .nativeElement
            .querySelector(
              '[data-testid="system-scene-body-card-risk"]',
            )
            ?.textContent,
        ).toContain(
          'APROXIMACIÓN',
        );

        (
          fixture
            .nativeElement as
              HTMLElement
        )
          .querySelector<HTMLButtonElement>(
            '[data-testid="system-scene-follow-selection"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          followBody,
        ).toHaveBeenCalledWith(
          'planet-1',
        );

        expect(
          fixture
            .componentInstance
            .trackingSelection()
            ?.bodyId,
        ).toBe(
          'planet-1',
        );

        expect(
          fixture
            .nativeElement
            .querySelector(
              '[data-testid="system-scene-tracking-status"]',
            )
            ?.textContent,
        ).toContain(
          'Jotheria b',
        );

        expect(
          (
            fixture
              .nativeElement as
                HTMLElement
          )
            .querySelector<HTMLButtonElement>(
              '[data-testid="system-scene-follow-selection"]',
            )
            ?.disabled,
        ).toBe(
          true,
        );

        expect(
          emittedSelections,
        ).toHaveLength(
          1,
        );

        (
          fixture
            .nativeElement as
              HTMLElement
        )
          .querySelector<HTMLButtonElement>(
            '[data-testid="system-scene-reset-view"]',
          )
          ?.click();

        expect(
          resetView,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          fixture
            .componentInstance
            .trackingSelection(),
        ).toBeNull();
      },
    );

    it(
      'should expose the phase-26.2 QA fiche link only for selected stars when the host explicitly enables it',
      () => {
        const fixture =
          TestBed.createComponent(
            SystemScene,
          );

        fixture.componentRef.setInput(
          'snapshot',
          sceneSnapshot(),
        );
        fixture.detectChanges();

        const selectionHandler =
          capturedSelectionHandler as
            SystemSceneSelectionChangeHandler;

        selectionHandler(
          Object.freeze({
            bodyId:
              'star-a',
            kind:
              'star',
            label:
              'A',
            title:
              'Jotheria A',
          }),
        );

        fixture.detectChanges();

        expect(
          (
            fixture.nativeElement as
              HTMLElement
          ).querySelector(
            '[data-testid="system-scene-stellar-fiche-qa-link"]',
          ),
        ).toBeNull();

        fixture.componentRef.setInput(
          'stellarFicheQaRoute',
          '/laboratory/stellar-systems/fiche-qa',
        );

        fixture.detectChanges();

        const stellarLink =
          (
            fixture.nativeElement as
              HTMLElement
          ).querySelector<HTMLAnchorElement>(
            '[data-testid="system-scene-stellar-fiche-qa-link"]',
          );

        expect(
          stellarLink,
        ).toBeTruthy();
        expect(
          stellarLink?.textContent,
        ).toContain(
          'ABRIR FICHA CIENTÍFICA · 26.2',
        );
        expect(
          stellarLink?.getAttribute(
            'href',
          ),
        ).toBe(
          '/laboratory/stellar-systems/fiche-qa',
        );

        selectionHandler(
          Object.freeze({
            bodyId:
              'planet-1',
            kind:
              'planet',
            label:
              'b',
            title:
              'Jotheria b',
          }),
        );

        fixture.detectChanges();

        expect(
          (
            fixture.nativeElement as
              HTMLElement
          ).querySelector(
            '[data-testid="system-scene-stellar-fiche-qa-link"]',
          ),
        ).toBeNull();
      },
    );

    it(
      'should open a navigation sheet for stars, planets, moons and every current minor-body family',
      () => {

        const fixture =
          TestBed.createComponent(
            SystemScene,
          );

        fixture
          .componentRef
          .setInput(
            'snapshot',
            sceneSnapshot(),
          );

        fixture.detectChanges();

        const selectionHandler =
          capturedSelectionHandler as
            SystemSceneSelectionChangeHandler;

        const cases = [
          ['star-a', 'star', 'Jotheria A', 'ESTRELLA'],
          ['planet-1', 'planet', 'Jotheria b', 'PLANETA'],
          ['moon-1-1', 'moon', 'Jotheria b I', 'LUNA'],
          ['minor-1-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'minor-body', 'Asteroide AST-001', 'ASTEROIDE'],
          ['minor-2-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 'minor-body', 'Cometa COM-005', 'COMETA'],
          ['minor-3-CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', 'minor-body', 'TNO TNO-003', 'OBJETO TRANSNEPTUNIANO'],
          ['minor-4-DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', 'minor-body', 'Capturado CAP-002', 'OBJETO EXTRASOLAR CAPTURADO'],
        ] as const;

        for (
          const [
            bodyId,
            kind,
            title,
            expectedText,
          ]
          of cases
        ) {
          selectionHandler(
            Object.freeze({
              bodyId,
              kind,
              label:
                title,
              title,
            }),
          );

          fixture.detectChanges();

          const card =
            (
              fixture.nativeElement as
                HTMLElement
            ).querySelector<HTMLElement>(
              '[data-testid="system-scene-selection"]',
            );

          expect(
            card,
          ).toBeTruthy();

          expect(
            card?.dataset['bodyId'],
          ).toBe(
            bodyId,
          );

          expect(
            card?.dataset['bodyKind'],
          ).toBe(
            kind,
          );

          expect(
            card?.textContent,
          ).toContain(
            expectedText,
          );
        }

        selectionHandler(
          Object.freeze({
            bodyId:
              'moon-1-1',
            kind:
              'moon',
            label:
              'I',
            title:
              'Jotheria b I',
          }),
        );

        fixture.detectChanges();

        expect(
          fixture.nativeElement.querySelector(
            '[data-testid="system-scene-selection"]',
          )?.textContent,
        ).toContain(
          'Host',
        );

        expect(
          fixture.nativeElement.querySelector(
            '[data-testid="system-scene-selection"]',
          )?.textContent,
        ).toContain(
          'Jotheria b',
        );
      },
    );

    it(
      'should let the user close and reopen the selected body sheet without clearing selection or camera tracking',
      () => {
        const fixture =
          TestBed.createComponent(
            SystemScene,
          );

        fixture.componentRef.setInput(
          'snapshot',
          sceneSnapshot(),
        );

        fixture.detectChanges();

        (
          capturedSelectionHandler as
            SystemSceneSelectionChangeHandler
        )(
          Object.freeze({
            bodyId:
              'planet-1',
            kind:
              'planet',
            label:
              'b',
            title:
              'Jotheria b',
          }),
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element.querySelector<HTMLButtonElement>(
          '[data-testid="system-scene-body-card-close"]',
        )?.click();

        fixture.detectChanges();

        expect(
          fixture.componentInstance.selection()?.bodyId,
        ).toBe(
          'planet-1',
        );

        expect(
          fixture.componentInstance.bodyCardOpen(),
        ).toBe(
          false,
        );

        expect(
          element.querySelector(
            '[data-testid="system-scene-body-card-open"]',
          ),
        ).toBeTruthy();

        element.querySelector<HTMLButtonElement>(
          '[data-testid="system-scene-body-card-open"]',
        )?.click();

        fixture.detectChanges();

        expect(
          fixture.componentInstance.bodyCardOpen(),
        ).toBe(
          true,
        );

        expect(
          element.querySelector(
            '[data-testid="system-scene-body-card"]',
          ),
        ).toBeTruthy();
      },
    );

    it(
      'should keep the current tracked body while another body is inspected and only retarget after an explicit follow action',
      () => {

        const fixture =
          TestBed.createComponent(
            SystemScene,
          );

        fixture
          .componentRef
          .setInput(
            'snapshot',
            sceneSnapshot(),
          );

        fixture.detectChanges();

        const selectionHandler =
          capturedSelectionHandler as
            SystemSceneSelectionChangeHandler;

        selectionHandler(
          Object.freeze({
            bodyId:
              'planet-1',
            kind:
              'planet',
            label:
              'b',
            title:
              'Jotheria b',
          }),
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-testid="system-scene-follow-selection"]',
          )
          ?.click();

        selectionHandler(
          Object.freeze({
            bodyId:
              'star-a',
            kind:
              'star',
            label:
              'A',
            title:
              'Jotheria A',
          }),
        );

        fixture.detectChanges();

        expect(
          fixture
            .componentInstance
            .selection()
            ?.bodyId,
        ).toBe(
          'star-a',
        );

        expect(
          fixture
            .componentInstance
            .trackingSelection()
            ?.bodyId,
        ).toBe(
          'planet-1',
        );

        expect(
          followBody,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          element
            .querySelector<HTMLButtonElement>(
              '[data-testid="system-scene-follow-selection"]',
            )
            ?.disabled,
        ).toBe(
          false,
        );

        element
          .querySelector<HTMLButtonElement>(
            '[data-testid="system-scene-follow-selection"]',
          )
          ?.click();

        expect(
          followBody,
        ).toHaveBeenLastCalledWith(
          'star-a',
        );

        expect(
          fixture
            .componentInstance
            .trackingSelection()
            ?.bodyId,
        ).toBe(
          'star-a',
        );
      },
    );

    it(
      'should toggle planet, moon, habitable-zone, orbital-risk and minor-body subtype layers through the shared SystemScene host',
      () => {

        const fixture =
          TestBed.createComponent(
            SystemScene,
          );

        fixture
          .componentRef
          .setInput(
            'snapshot',
            sceneSnapshot(),
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        const planetButton =
          element.querySelector<HTMLButtonElement>(
            '[data-testid="system-scene-layer-planets"]',
          );

        const moonButton =
          element.querySelector<HTMLButtonElement>(
            '[data-testid="system-scene-layer-moons"]',
          );

        const habitableZoneButton =
          element.querySelector<HTMLButtonElement>(
            '[data-testid="system-scene-layer-habitable-zone"]',
          );

        const orbitalRiskButton =
          element.querySelector<HTMLButtonElement>(
            '[data-testid="system-scene-layer-orbital-risk"]',
          );

        const asteroidButton =
          element.querySelector<HTMLButtonElement>(
            '[data-testid="system-scene-layer-asteroids"]',
          );

        const cometButton =
          element.querySelector<HTMLButtonElement>(
            '[data-testid="system-scene-layer-comets"]',
          );

        const tnoButton =
          element.querySelector<HTMLButtonElement>(
            '[data-testid="system-scene-layer-tno"]',
          );

        const capturedButton =
          element.querySelector<HTMLButtonElement>(
            '[data-testid="system-scene-layer-captured"]',
          );

        expect(
          planetButton?.disabled,
        ).toBe(false);

        expect(
          moonButton?.disabled,
        ).toBe(false);

        expect(
          habitableZoneButton?.disabled,
        ).toBe(false);

        expect(
          orbitalRiskButton?.disabled,
        ).toBe(false);

        expect(
          asteroidButton?.disabled,
        ).toBe(false);

        expect(
          cometButton?.disabled,
        ).toBe(false);

        expect(
          tnoButton?.disabled,
        ).toBe(false);

        expect(
          capturedButton?.disabled,
        ).toBe(false);

        planetButton?.click();
        fixture.detectChanges();

        expect(
          fixture.componentInstance.planetsVisible(),
        ).toBe(false);

        expect(
          setLayerVisibility,
        ).toHaveBeenLastCalledWith({
          planets: false,
          moons: false,
          habitableZone: false,
          orbitalRisk: false,
          asteroids: false,
          comets: false,
          transNeptunianObjects: false,
          capturedObjects: false,
        });

        moonButton?.click();
        habitableZoneButton?.click();
        orbitalRiskButton?.click();
        asteroidButton?.click();
        cometButton?.click();
        tnoButton?.click();
        capturedButton?.click();
        fixture.detectChanges();

        expect(
          fixture.componentInstance.moonsVisible(),
        ).toBe(true);

        expect(
          fixture.componentInstance.habitableZoneVisible(),
        ).toBe(true);

        expect(
          fixture.componentInstance.orbitalRiskVisible(),
        ).toBe(true);

        expect(
          element.querySelector(
            '[data-testid="system-scene-habitable-zone-legend"]',
          )?.textContent,
        ).toContain(
          '0.82–1.46 AU',
        );

        expect(
          element.querySelector(
            '[data-testid="system-scene-orbital-risk-legend"]',
          )?.textContent,
        ).toContain(
          'Aproximación',
        );

        expect(
          fixture.componentInstance.asteroidsVisible(),
        ).toBe(true);

        expect(
          element.querySelector(
            '[data-testid="system-scene-asteroid-belt-legend"]',
          )?.textContent,
        ).toContain(
          'INNER 2.20–3.10 AU',
        );

        expect(
          element.querySelector(
            '[data-testid="system-scene-asteroid-belt-legend"]',
          )?.textContent,
        ).toContain(
          'OUTER 9.50–14.8 AU',
        );

        expect(
          fixture.componentInstance.cometsVisible(),
        ).toBe(true);

        expect(
          fixture.componentInstance.transNeptunianObjectsVisible(),
        ).toBe(true);

        expect(
          fixture.componentInstance.capturedObjectsVisible(),
        ).toBe(true);

        expect(
          setLayerVisibility,
        ).toHaveBeenLastCalledWith({
          planets: false,
          moons: true,
          habitableZone: true,
          orbitalRisk: true,
          asteroids: true,
          comets: true,
          transNeptunianObjects: true,
          capturedObjects: true,
        });
      },
    );

    it(
      'should pause the runtime while the document is hidden, resume it when visible and remove the listener on destroy',
      () => {
        const ownVisibilityDescriptor =
          Object.getOwnPropertyDescriptor(
            document,
            'visibilityState',
          );

        let visibilityState:
          DocumentVisibilityState =
          'visible';

        Object.defineProperty(
          document,
          'visibilityState',
          {
            configurable:
              true,
            get:
              () =>
                visibilityState,
          },
        );

        try {
          const fixture =
            TestBed.createComponent(
              SystemScene,
            );

          fixture
            .componentRef
            .setInput(
              'snapshot',
              sceneSnapshot(),
            );

          fixture.detectChanges();

          expect(
            setPageVisible,
          ).toHaveBeenLastCalledWith(
            true,
          );

          visibilityState =
            'hidden';

          document.dispatchEvent(
            new Event(
              'visibilitychange',
            ),
          );

          expect(
            setPageVisible,
          ).toHaveBeenLastCalledWith(
            false,
          );

          visibilityState =
            'visible';

          document.dispatchEvent(
            new Event(
              'visibilitychange',
            ),
          );

          expect(
            setPageVisible,
          ).toHaveBeenLastCalledWith(
            true,
          );

          const callCountBeforeDestroy =
            vi.mocked(
              setPageVisible,
            ).mock.calls.length;

          fixture.destroy();

          visibilityState =
            'hidden';

          document.dispatchEvent(
            new Event(
              'visibilitychange',
            ),
          );

          expect(
            setPageVisible,
          ).toHaveBeenCalledTimes(
            callCountBeforeDestroy,
          );
        } finally {
          if (
            ownVisibilityDescriptor ===
              undefined
          ) {
            Reflect.deleteProperty(
              document,
              'visibilityState',
            );
          } else {
            Object.defineProperty(
              document,
              'visibilityState',
              ownVisibilityDescriptor,
            );
          }
        }
      },
    );

    it(
      'should expose an explicit unavailable state when WebGL2 cannot be created',
      () => {

        runtimeFactory
          .mockImplementationOnce(
            () => {
              throw new SystemSceneWebGl2UnavailableError();
            },
          );

        const fixture =
          TestBed.createComponent(
            SystemScene,
          );

        fixture
          .componentRef
          .setInput(
            'snapshot',
            sceneSnapshot(),
          );

        fixture.detectChanges();

        expect(
          fixture
            .componentInstance
            .renderState(),
        ).toBe(
          'unavailable',
        );

        expect(
          fixture
            .nativeElement
            .querySelector(
              '[data-testid="system-scene-unavailable"]',
            ),
        ).toBeTruthy();
      },
    );

    it(
      'should dispose the runtime when Angular destroys the route scene',
      () => {

        const fixture =
          TestBed.createComponent(
            SystemScene,
          );

        fixture
          .componentRef
          .setInput(
            'snapshot',
            sceneSnapshot(),
          );

        fixture.detectChanges();
        fixture.destroy();

        expect(
          dispose,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      'should cap DPR and widen vertical/mobile camera FOV without changing physics',
      () => {

        expect(
          systemSceneDevicePixelRatio(
            0.5,
          ),
        ).toBe(
          1,
        );

        expect(
          systemSceneDevicePixelRatio(
            3.5,
          ),
        ).toBe(
          2,
        );

        expect(
          systemSceneDevicePixelRatio(
            Number.NaN,
          ),
        ).toBe(
          1,
        );

        expect(
          systemSceneCameraFovDegrees(
            0.7,
          ),
        ).toBe(
          54,
        );

        expect(
          systemSceneCameraFovDegrees(
            1,
          ),
        ).toBe(
          48,
        );

        expect(
          systemSceneCameraFovDegrees(
            16 /
              9,
          ),
        ).toBe(
          44,
        );
      },
    );
    it(
      'should keep a comfortable invisible picking radius when V4 compresses a visible planet',
      () => {
        expect(
          systemScenePickingRadiusScene(
            'planet',
            0.015,
          ),
        ).toBeGreaterThanOrEqual(
          0.085,
        );

        expect(
          systemScenePickingRadiusScene(
            'planet',
            0.015,
          ),
        ).toBeGreaterThan(
          0.015 *
          5,
        );
      },
    );

  },
);

function sceneSnapshot():
  SystemSceneSnapshot {

  return Object.freeze({
    universeSeed:
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',

    generatorVersionCode:
      1,

    address:
      Object.freeze({
        galaxyIndex:
          '3',
        sectorKey:
          '-17',
        galacticObjectIndex:
          '8',
      }),

    proceduralIdentity:
      'G3 / S-17 / O8',

    title:
      'Jotheria',

    discoveryStateCode:
      4,

    discoveryStateLabel:
      'Catalogado',

    knowledgeLevel:
      ArchiveStellarSystemKnowledgeLevel
        .CATALOGUED,

    multiplicityName:
      'BINARY',

    componentCount:
      2,

    accessibleLabel:
      'Escena tridimensional del sistema estelar Jotheria. 2 estrellas, 1 planeta y 3 órbitas visibles.',

    stars:
      Object.freeze([
        Object.freeze({
          id:
            'star-a',
          kind:
            'star' as const,
          label:
            'A',
          title:
            'Jotheria A',
          colorHex:
            '#FFDDB2',
          radiusScene:
            0.32,
          position:
            Object.freeze({
              x: -0.6,
              y: 0,
              z: 0,
            }),
          orbitId:
            'orbit-star-a',
          motionContributions:
            Object.freeze([
              Object.freeze({
                motionId:
                  'stellar-inner-relative',
                scale:
                  -0.45,
              }),
            ]),
          surfaceStyle:
            'emissive' as const,
          lightIntensity:
            5.6,
          sourceLuminositySolar:
            1.2,
          surfaceEnvironment:
            null,
          giantAtmosphere:
            null,
          specialPresentation:
            null,
          spin:
            Object.freeze({
              source:
                'UNAVAILABLE' as const,
              rotationPeriodHours:
                null,
              axialTiltDegrees:
                null,
              isRetrograde:
                null,
              isSynchronized:
                false,
              epochPhaseDegrees:
                15,
            }),
        }),
        Object.freeze({
          id:
            'star-b',
          kind:
            'star' as const,
          label:
            'B',
          title:
            'Jotheria B',
          colorHex:
            '#D9EDFF',
          radiusScene:
            0.24,
          position:
            Object.freeze({
              x: 0.85,
              y: 0,
              z: 0.16,
            }),
          orbitId:
            'orbit-star-b',
          motionContributions:
            Object.freeze([
              Object.freeze({
                motionId:
                  'stellar-inner-relative',
                scale:
                  0.55,
              }),
            ]),
          surfaceStyle:
            'emissive' as const,
          lightIntensity:
            4.8,
          sourceLuminositySolar:
            0.6,
          surfaceEnvironment:
            null,
          giantAtmosphere:
            null,
          specialPresentation:
            null,
          spin:
            Object.freeze({
              source:
                'UNAVAILABLE' as const,
              rotationPeriodHours:
                null,
              axialTiltDegrees:
                null,
              isRetrograde:
                null,
              isSynchronized:
                false,
              epochPhaseDegrees:
                225,
            }),
        }),
      ]),

    planets:
      Object.freeze([
        Object.freeze({
          id:
            'planet-1',
          kind:
            'planet' as const,
          label:
            'Jotheria b',
          title:
            'Jotheria b',
          colorHex:
            '#4B7FCB',
          radiusScene:
            0.08,
          position:
            Object.freeze({
              x: 2.3,
              y: 0.07,
              z: 0.65,
            }),
          orbitId:
            'orbit-planet-1',
          motionContributions:
            Object.freeze([
              Object.freeze({
                motionId:
                  'planet-1-motion',
                scale:
                  1,
              }),
            ]),
          surfaceStyle:
            'oceanic' as const,
          lightIntensity:
            0,
          sourceLuminositySolar:
            null,
          surfaceEnvironment:
            null,
          giantAtmosphere:
            null,
          specialPresentation:
            null,
          spin:
            Object.freeze({
              source:
                'PLANET_19_3' as const,
              rotationPeriodHours:
                24,
              axialTiltDegrees:
                23.44,
              isRetrograde:
                false,
              isSynchronized:
                false,
              epochPhaseDegrees:
                30,
            }),
        }),
      ]),

    moons:
      Object.freeze([
        Object.freeze({
          id:
            'moon-1-1',
          kind:
            'moon' as const,
          label:
            'I',
          title:
            'Jotheria b I',
          hostPlanetId:
            'planet-1',
          hostPlanetOrdinal:
            1,
          colorHex:
            '#B9D8E8',
          radiusScene:
            0.02,
          position:
            Object.freeze({
              x: 2.42,
              y: 0.07,
              z: 0.65,
            }),
          orbitId:
            'orbit-moon-1-1',
          motionContributions:
            Object.freeze([]),
          spin:
            Object.freeze({
              source:
                'MOON_21_4' as const,
              rotationPeriodHours:
                72,
              axialTiltDegrees:
                null,
              isRetrograde:
                null,
              isSynchronized:
                true,
              epochPhaseDegrees:
                45,
            }),
          visualPresentation: Object.freeze({
          version: 1 as const,
          sourceMoonIdentity: 'MOON-FIXTURE-1',
          sourceHostPlanetType: 'GAS_GIANT',
          sourceRadiusEarth: 0.27,
          sourceMassEarth: 0.012,
          sourceMeanDensityGramsPerCubicCentimeter: 3.1,
          sourceSurfaceGravityEarth: 0.16,
          sourceAtmosphereRetentionIndex01: 0.46,
          sourceAtmosphereRegime: 'SUBSTANTIAL',
          sourceWaterInventoryIndex01: 0.62,
          sourceInferredIceRichnessIndex01: 0.48,
          sourceSubsurfaceOceanPotentialIndex01: 0.68,
          sourceSurfaceLiquidWaterPotentialIndex01: 0.42,
          sourceWaterRegime: 'MIXED',
          sourceEstimatedSurfaceTemperatureKelvin: 276,
          sourceGeologicalActivityIndex01: 0.44,
          sourceTidalHeatingIndex01: 0.32,
          sourceGeologyRegime: 'ACTIVE',
          sourceOverallHabitabilityIndex01: 0.52,
          sourceIsPotentiallyHabitable: true,
          sourceGiantHostSpecialization: true,
          sourceGiantCompositionRegime: 'MIXED_ROCK_ICE',
          sourceIsLargeGiantMoon: true,
          sourceIsTidallyActiveGiantMoon: false,
          sourceIsOceanBearingGiantMoonCandidate: true,
          shapeClass: 'MAJOR_PLANETARY' as const,
          surfaceStyle: 'OCEANIC' as const,
          presentationRadiusScene: 0.031,
          presentationIrregularity01: 0.02,
          presentationLiquidCoverage01: 0.42,
          presentationIceCoverage01: 0.34,
          presentationVolcanicCoverage01: 0.12,
          presentationCloudCoverage01: 0.38,
          presentationAtmospherePresent: true,
          presentationAtmosphereStrength01: 0.48,
          presentationAtmosphereShellScale: 1.035,
          presentationBaseColorHex: '#386F91',
          presentationAccentColorHex: '#A8BBA8',
          presentationAtmosphereColorHex: '#9FC9DF',
          presentationSeedUint32: 123456789,
        }),
        }),
      ]),

    minorBodies:
      Object.freeze([
        Object.freeze({
          id:
            'minor-1-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          kind:
            'minor-body' as const,
          minorBodyKind:
            MinorBodyKind.ASTEROID,
          label:
            'AST-001',
          title:
            'Asteroide AST-001',
          colorHex:
            '#B59A78',
          radiusScene:
            0.014,
          position:
            Object.freeze({
              x: 3.2,
              y: 0,
              z: 0.4,
            }),
          orbitId:
            'orbit-minor-1',
          motionContributions:
            Object.freeze([]),
          asteroidPresentation:
            null,
          cometPresentation:
            null,
        }),
        Object.freeze({
          id:
            'minor-2-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
          kind:
            'minor-body' as const,
          minorBodyKind:
            MinorBodyKind.COMET,
          label:
            'COM-005',
          title:
            'Cometa COM-005',
          colorHex:
            '#DCC7A0',
          radiusScene:
            0.014,
          position:
            Object.freeze({
              x: -3.8,
              y: 0.2,
              z: -0.7,
            }),
          orbitId:
            'orbit-minor-2',
          motionContributions:
            Object.freeze([]),
          asteroidPresentation:
            null,
          cometPresentation:
            Object.freeze({
              version: 1 as const,
              source: 'PHASE_22_6_COMET_ACTIVITY' as const,
              proceduralId: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
              sourceDiameterKilometers: 18,
              iceFraction01: 0.68,
              dustFraction01: 0.32,
              porosityIndex01: 0.62,
              bulkDensityGramsPerCubicCentimeter: 0.62,
              geometricAlbedo01: 0.04,
              volatileRichnessIndex01: 0.82,
              periodRegime: 'SHORT_PERIOD' as const,
              referenceLuminositySolar: 1,
              semiMajorAxisAu: 4,
              eccentricity: 0.75,
              periapsisAu: 1,
              apoapsisAu: 7,
              orbitalPeriodYears: 8,
              epochMeanAnomalyDegrees: 0,
              presentationTimeScale: 1,
              shapeSeedUint32: 123456,
              presentationNucleusColorHex: '#3F4141',
              presentationComaColorHex: '#B9EBF1',
              presentationDustTailColorHex: '#D6BD92',
              presentationIonTailColorHex: '#91DDFF',
              presentationNucleusRoughness01: 0.91,
              presentationNucleusAxisScaleX: 1.08,
              presentationNucleusAxisScaleY: 0.93,
              presentationNucleusAxisScaleZ: 0.99,
              presentationNucleusIrregularity01: 0.52,
            }),
        }),
        Object.freeze({
          id:
            'minor-3-CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
          kind:
            'minor-body' as const,
          minorBodyKind:
            MinorBodyKind.TRANS_NEPTUNIAN_OBJECT,
          label:
            'TNO-003',
          title:
            'TNO TNO-003',
          colorHex:
            '#8AA9C8',
          radiusScene:
            0.014,
          position:
            Object.freeze({
              x: 5.1,
              y: -0.1,
              z: 1.2,
            }),
          orbitId:
            'orbit-minor-3',
          motionContributions:
            Object.freeze([]),
          asteroidPresentation:
            null,
          cometPresentation:
            null,
        }),
        Object.freeze({
          id:
            'minor-4-DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
          kind:
            'minor-body' as const,
          minorBodyKind:
            MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT,
          label:
            'CAP-002',
          title:
            'Capturado CAP-002',
          colorHex:
            '#9FBCB0',
          radiusScene:
            0.014,
          position:
            Object.freeze({
              x: -4.4,
              y: 0.3,
              z: 1.4,
            }),
          orbitId:
            'orbit-minor-4',
          motionContributions:
            Object.freeze([]),
          asteroidPresentation:
            null,
          cometPresentation:
            null,
        }),
      ]),

    asteroidBelts:
      Object.freeze([
        Object.freeze({
          id:
            'asteroid-belt-inner',
          label:
            'Cinturón interior',
          region:
            'INNER' as const,
          innerEdgeAu:
            2.2,
          outerEdgeAu:
            3.1,
          peakAu:
            2.65,
          populationIndex01:
            0.58,
          innerRadiusScene:
            3.0,
          outerRadiusScene:
            4.1,
          peakRadiusScene:
            3.55,
          colorHex:
            '#7f8c99',
          opacity:
            0.075,
          peakOpacity:
            0.12,
          boundaryOpacity:
            0.18,
          anchorMotionContributions:
            Object.freeze([]),
        }),
        Object.freeze({
          id:
            'asteroid-belt-outer',
          label:
            'Cinturón exterior',
          region:
            'OUTER' as const,
          innerEdgeAu:
            9.5,
          outerEdgeAu:
            14.8,
          peakAu:
            12.1,
          populationIndex01:
            0.72,
          innerRadiusScene:
            5.3,
          outerRadiusScene:
            6.7,
          peakRadiusScene:
            6.0,
          colorHex:
            '#8ea5c8',
          opacity:
            0.09,
          peakOpacity:
            0.14,
          boundaryOpacity:
            0.22,
          anchorMotionContributions:
            Object.freeze([]),
        }),
      ]),

    habitableZone:
      Object.freeze({
        topology:
          'CIRCUMBINARY' as const,
        radiativeInnerEdgeAu:
          0.82,
        radiativeOuterEdgeAu:
          1.46,
        dynamicallyHabitableInnerEdgeAu:
          0.94,
        dynamicallyHabitableOuterEdgeAu:
          1.35,
        radiativeInnerRadiusScene:
          1.45,
        radiativeOuterRadiusScene:
          2.18,
        dynamicallyHabitableInnerRadiusScene:
          1.62,
        dynamicallyHabitableOuterRadiusScene:
          2.06,
        presentationAdjusted:
          true,
        dynamicalOverlapFraction01:
          0.72,
        anchorMotionContributions:
          Object.freeze([]),
      }),

    orbitalRiskTargets:
      Object.freeze([
        Object.freeze({
          id:
            'orbital-risk-planet-1',
          targetBodyId:
            'planet-1',
          targetOrbitId:
            'orbit-planet-1',
          targetKind:
            'planet' as const,
          targetLabel:
            'Jotheria b',
          sourceMinorBodyCount:
            2,
          riskCandidateCount:
            1,
          approachCorridorCount:
            1,
          radialCrossingOnlyCount:
            1,
          directCollisionGeometryCount:
            0,
          severity:
            'APPROACH' as const,
          highestOrbitalRiskIndex01:
            0.64,
          highestRegimeName:
            'PLANET_APPROACH_CORRIDOR',
          colorHex:
            '#FFAA52',
        }),
      ]),

    layers:
      Object.freeze({
        moonCount: 1,
        minorBodyCount: 4,
        habitableZoneAvailable: true,
        orbitalRiskTargetCount: 1,
        orbitalCrossingTargetCount: 0,
        orbitalApproachTargetCount: 1,
        orbitalCollisionGeometryTargetCount: 0,
      }),

    orbits:
      Object.freeze([
        Object.freeze({
          id:
            'orbit-star-a',
          kind:
            'stellar' as const,
          label:
            'A',
          colorHex:
            '#FFFFFF',
          opacity:
            0.22,
          semiMajorScene:
            0.7,
          semiMinorScene:
            0.7,
          focusOffsetScene:
            0,
          rotationDegrees:
            0,
          inclinationDegrees:
            0,
          motionId:
            'stellar-inner-relative',
          motionScale:
            -0.45,
          anchorMotionContributions:
            Object.freeze([]),
        }),
        Object.freeze({
          id:
            'orbit-star-b',
          kind:
            'stellar' as const,
          label:
            'B',
          colorHex:
            '#FFFFFF',
          opacity:
            0.22,
          semiMajorScene:
            0.95,
          semiMinorScene:
            0.95,
          focusOffsetScene:
            0,
          rotationDegrees:
            0,
          inclinationDegrees:
            0,
          motionId:
            'stellar-inner-relative',
          motionScale:
            0.55,
          anchorMotionContributions:
            Object.freeze([]),
        }),
        Object.freeze({
          id:
            'orbit-planet-1',
          kind:
            'planetary' as const,
          label:
            'Jotheria b',
          colorHex:
            '#99BCCD',
          opacity:
            0.26,
          semiMajorScene:
            2.4,
          semiMinorScene:
            2.35,
          focusOffsetScene:
            0.05,
          rotationDegrees:
            18,
          inclinationDegrees:
            4,
          motionId:
            'planet-1-motion',
          motionScale:
            1,
          anchorMotionContributions:
            Object.freeze([]),
        }),
      ]),

    motions:
      Object.freeze([
        Object.freeze({
          id:
            'stellar-inner-relative',
          semiMajorAxisAu:
            1.2,
          eccentricity:
            0.08,
          periodDays:
            120,
          rotationDegrees:
            0,
          inclinationDegrees:
            0,
          epochMeanAnomalyDegrees:
            30,
        }),
        Object.freeze({
          id:
            'planet-1-motion',
          semiMajorAxisAu:
            3.1,
          eccentricity:
            0.02,
          periodDays:
            420,
          rotationDegrees:
            18,
          inclinationDegrees:
            4,
          epochMeanAnomalyDegrees:
            140,
        }),
      ]),

    simulation:
      Object.freeze({
        epochSimulationDay:
          0,
        playbackDaysPerRealSecond:
          6.666666666666667,
      }),

    scale:
      Object.freeze({
        outerRadiusAu:
          6.2,
        orbitScaleScenePerAu:
          0.77,
        targetOuterRadiusScene:
          4.8,
      }),
  });
}
