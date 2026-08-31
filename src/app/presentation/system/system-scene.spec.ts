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
  'SystemScene point 24.1',
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
                  0,
                sceneObjectCount:
                  0,
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
          0,
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
      'Escena tridimensional del sistema estelar Jotheria.',
  });
}
