import {
  TestBed,
} from '@angular/core/testing';

import {
  vi,
} from 'vitest';

import {
  ArchiveStellarSystemKnowledgeLevel,
} from '../genesis-archive/archive-stellar-system-card';

import {
  SYSTEM_SCENE_RUNTIME_FACTORY,
  SystemScene,
  SystemSceneWebGl2UnavailableError,
  systemSceneCameraFovDegrees,
  systemSceneDevicePixelRatio,
  type SystemSceneRuntime,
} from './system-scene';

import {
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

describe(
  'SystemScene point 24.3',
  () => {

    let resize:
      SystemSceneRuntime['resize'];

    let render:
      SystemSceneRuntime['render'];

    let dispose:
      SystemSceneRuntime['dispose'];

    let runtimeFactory:
      ReturnType<typeof vi.fn>;

    beforeEach(
      async () => {

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

        const runtime:
          SystemSceneRuntime =
          {
            resize,
            render,
            dispose,
          };

        runtimeFactory =
          vi
            .fn()
            .mockReturnValue(
              runtime,
            );

        await TestBed
          .configureTestingModule({
            imports: [
              SystemScene,
            ],

            providers: [
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
            2.1,
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
            1.7,
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
        }),
      ]),

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
