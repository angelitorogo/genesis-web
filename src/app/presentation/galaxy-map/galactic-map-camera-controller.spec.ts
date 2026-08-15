import {
  vi,
} from 'vitest';

import * as THREE from 'three';

import {
  GalacticMapCameraController,
  rollRadiansForHorizontalDrag,
  selectionRaycastThreshold,
} from './galactic-map-camera-controller';

describe(
  'GalacticMapCameraController',
  () => {
    function canvas():
      HTMLCanvasElement {

      const value =
        document.createElement(
          'canvas',
        );

      vi
        .spyOn(
          value,
          'getBoundingClientRect',
        )
        .mockReturnValue({
          x:
            0,
          y:
            0,
          width:
            400,
          height:
            400,
          top:
            0,
          right:
            400,
          bottom:
            400,
          left:
            0,
          toJSON() {
            return {};
          },
        });

      return value;
    }

    function camera():
      THREE.PerspectiveCamera {

      const value =
        new THREE.PerspectiveCamera(
          40,
          1,
          0.1,
          20,
        );

      value.position.set(
        0,
        -2.72,
        2.18,
      );

      value.lookAt(
        0,
        0,
        0,
      );

      value.updateMatrixWorld(
        true,
      );

      return value;
    }

    function pointerEvent(
      type:
        string,

      init:
        Readonly<{
          pointerId: number;
          clientX: number;
          clientY: number;
          button?: number;
          pointerType?: string;
        }>,
    ): PointerEvent {

      const event =
        new MouseEvent(
          type,
          {
            bubbles:
              true,
            cancelable:
              true,
            clientX:
              init.clientX,
            clientY:
              init.clientY,
            button:
              init.button ??
              0,
          },
        ) as unknown as PointerEvent;

      Object.defineProperties(
        event,
        {
          pointerId: {
            value:
              init.pointerId,
          },
          pointerType: {
            value:
              init.pointerType ??
              'mouse',
          },
        },
      );

      return event;
    }

    it(
      'should initialize bounded zoom, pan target and optional rotation from the frozen point-10.1 camera',
      () => {
        const controller =
          new GalacticMapCameraController(
            camera(),
            canvas(),
            () => {},
          );

        const state =
          controller.cameraState();

        expect(
          state.distance,
        ).toBeGreaterThan(
          3,
        );

        expect(
          state.distance,
        ).toBeLessThan(
          4,
        );

        expect(
          state.targetX,
        ).toBe(
          0,
        );

        expect(
          state.targetY,
        ).toBe(
          0,
        );

        expect(
          state.targetZ,
        ).toBe(
          0,
        );

        expect(
          state.rotationEnabled,
        ).toBe(
          true,
        );

        expect(
          state.rollRadians,
        ).toBe(
          0,
        );

        controller.dispose();
      },
    );

    it(
      'should enable and disable camera rotation without disabling zoom or pan',
      () => {
        let changes =
          0;

        const controller =
          new GalacticMapCameraController(
            camera(),
            canvas(),
            () => {
              changes +=
                1;
            },
          );

        controller.setRotationEnabled(
          false,
        );

        expect(
          controller
            .cameraState()
            .rotationEnabled,
        ).toBe(
          false,
        );

        controller.setRotationEnabled(
          true,
        );

        expect(
          controller
            .cameraState()
            .rotationEnabled,
        ).toBe(
          true,
        );

        expect(
          changes,
        ).toBeGreaterThanOrEqual(
          2,
        );

        controller.dispose();
      },
    );

    it(
      'should convert horizontal secondary-button drag into camera-local roll without moving the orbit target',
      () => {
        const sceneCamera =
          camera();

        const sceneCanvas =
          canvas();

        let changes =
          0;

        const controller =
          new GalacticMapCameraController(
            sceneCamera,
            sceneCanvas,
            () => {
              changes +=
                1;
            },
          );

        const initialPosition =
          sceneCamera.position.clone();

        const initialState =
          controller.cameraState();

        sceneCanvas.dispatchEvent(
          pointerEvent(
            'pointerdown',
            {
              pointerId:
                7,
              clientX:
                160,
              clientY:
                200,
              button:
                2,
            },
          ),
        );

        document.dispatchEvent(
          pointerEvent(
            'pointermove',
            {
              pointerId:
                7,
              clientX:
                230,
              clientY:
                240,
            },
          ),
        );

        document.dispatchEvent(
          pointerEvent(
            'pointerup',
            {
              pointerId:
                7,
              clientX:
                230,
              clientY:
                240,
              button:
                2,
            },
          ),
        );

        const rolled =
          controller.cameraState();

        expect(
          rolled.rollRadians,
        ).toBeCloseTo(
          rollRadiansForHorizontalDrag(
            70,
          ),
          12,
        );

        expect(
          rolled.targetX,
        ).toBeCloseTo(
          initialState.targetX,
          12,
        );

        expect(
          rolled.targetY,
        ).toBeCloseTo(
          initialState.targetY,
          12,
        );

        expect(
          rolled.targetZ,
        ).toBeCloseTo(
          initialState.targetZ,
          12,
        );

        expect(
          sceneCamera.position.distanceTo(
            initialPosition,
          ),
        ).toBeLessThan(
          1e-12,
        );

        expect(
          changes,
        ).toBeGreaterThanOrEqual(
          1,
        );

        controller.dispose();
      },
    );

    it(
      'should include secondary-button roll in the rotation toggle contract',
      () => {
        const sceneCanvas =
          canvas();

        const controller =
          new GalacticMapCameraController(
            camera(),
            sceneCanvas,
            () => {},
          );

        controller.setRotationEnabled(
          false,
        );

        sceneCanvas.dispatchEvent(
          pointerEvent(
            'pointerdown',
            {
              pointerId:
                9,
              clientX:
                120,
              clientY:
                180,
              button:
                2,
            },
          ),
        );

        document.dispatchEvent(
          pointerEvent(
            'pointermove',
            {
              pointerId:
                9,
              clientX:
                220,
              clientY:
                180,
            },
          ),
        );

        expect(
          controller
            .cameraState()
            .rollRadians,
        ).toBe(
          0,
        );

        controller.dispose();
      },
    );

    it(
      'should reset the camera to the saved point-10.1 inspection view',
      () => {
        const sceneCamera =
          camera();

        const sceneCanvas =
          canvas();

        const controller =
          new GalacticMapCameraController(
            sceneCamera,
            sceneCanvas,
            () => {},
          );

        const initial =
          controller.cameraState();

        const initialQuaternion =
          sceneCamera.quaternion.clone();

        sceneCanvas.dispatchEvent(
          pointerEvent(
            'pointerdown',
            {
              pointerId:
                11,
              clientX:
                180,
              clientY:
                200,
              button:
                2,
            },
          ),
        );

        document.dispatchEvent(
          pointerEvent(
            'pointermove',
            {
              pointerId:
                11,
              clientX:
                250,
              clientY:
                200,
            },
          ),
        );

        document.dispatchEvent(
          pointerEvent(
            'pointerup',
            {
              pointerId:
                11,
              clientX:
                250,
              clientY:
                200,
              button:
                2,
            },
          ),
        );

        expect(
          Math.abs(
            controller
              .cameraState()
              .rollRadians,
          ),
        ).toBeGreaterThan(
          0.1,
        );

        sceneCamera.position.set(
          1.5,
          -1.7,
          1.2,
        );

        sceneCamera.updateMatrixWorld(
          true,
        );

        controller.resetView();

        const reset =
          controller.cameraState();

        expect(
          reset.distance,
        ).toBeCloseTo(
          initial.distance,
          12,
        );

        expect(
          reset.azimuthRadians,
        ).toBeCloseTo(
          initial.azimuthRadians,
          12,
        );

        expect(
          reset.polarRadians,
        ).toBeCloseTo(
          initial.polarRadians,
          12,
        );

        expect(
          reset.rollRadians,
        ).toBe(
          0,
        );

        expect(
          1 -
          Math.abs(
            sceneCamera.quaternion.dot(
              initialQuaternion,
            ),
          ),
        ).toBeLessThan(
          1e-12,
        );

        controller.dispose();
      },
    );

    it(
      'should adapt the point-picking world threshold to camera distance while keeping strict bounds',
      () => {
        expect(
          selectionRaycastThreshold(
            0.1,
          ),
        ).toBe(
          0.014,
        );

        expect(
          selectionRaycastThreshold(
            3.5,
          ),
        ).toBeCloseTo(
          0.04025,
          12,
        );

        expect(
          selectionRaycastThreshold(
            100,
          ),
        ).toBe(
          0.070,
        );
      },
    );

    it(
      'should precisely pick a GPU sample under the cursor without turning it into a physical entity',
      () => {
        const sceneCamera =
          camera();

        const sceneCanvas =
          canvas();

        const controller =
          new GalacticMapCameraController(
            sceneCamera,
            sceneCanvas,
            () => {},
          );

        const geometry =
          new THREE.BufferGeometry();

        geometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(
            [
              0,
              0,
              0,
              1,
              1,
              0,
            ],
            3,
          ),
        );

        geometry.computeBoundingSphere();

        const material =
          new THREE.PointsMaterial();

        const points =
          new THREE.Points(
            geometry,
            material,
          );

        points.updateMatrixWorld(
          true,
        );

        const selection =
          controller.selectPoint(
            points,
            200,
            200,
          );

        expect(
          selection,
        ).not.toBeNull();

        expect(
          selection?.sampleIndex,
        ).toBe(
          0,
        );

        expect(
          selection?.renderX,
        ).toBeCloseTo(
          0,
          12,
        );

        expect(
          selection?.renderY,
        ).toBeCloseTo(
          0,
          12,
        );

        expect(
          selection?.renderZ,
        ).toBeCloseTo(
          0,
          12,
        );

        controller.dispose();
        geometry.dispose();
        material.dispose();
      },
    );

    it(
      'should reject clicks outside the strict screen-space selection radius',
      () => {
        const controller =
          new GalacticMapCameraController(
            camera(),
            canvas(),
            () => {},
          );

        const geometry =
          new THREE.BufferGeometry();

        geometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(
            [
              0,
              0,
              0,
            ],
            3,
          ),
        );

        geometry.computeBoundingSphere();

        const material =
          new THREE.PointsMaterial();

        const points =
          new THREE.Points(
            geometry,
            material,
          );

        points.updateMatrixWorld(
          true,
        );

        expect(
          controller.selectPoint(
            points,
            30,
            30,
          ),
        ).toBeNull();

        controller.dispose();
        geometry.dispose();
        material.dispose();
      },
    );
  },
);
