import * as THREE from 'three';

import {
  OrbitControls,
} from 'three/addons/controls/OrbitControls.js';

const MIN_POLAR_ANGLE =
  0.08;

const MAX_POLAR_ANGLE =
  Math.PI -
  MIN_POLAR_ANGLE;

const CLICK_SELECTION_THRESHOLD_PIXELS =
  7;

export interface SystemSceneCameraLimits {
  readonly homeDistance:
    number;

  readonly minDistance:
    number;

  readonly maxDistance:
    number;

  readonly maxTargetRadius:
    number;
}

export type SystemScenePickHandler =
  (
    clientX:
      number,

    clientY:
      number,
  ) => void;

/**
 * Point-24.4 camera interaction controller shared by every SystemScene host.
 *
 * The controller changes only the presentation camera. It never changes
 * orbital state or body physics. Left drag orbits, right drag pans, wheel
 * zooms to the cursor and touch uses one-finger orbit / two-finger dolly-pan.
 * A short primary click is forwarded to the scene picker; a drag is not.
 */
export class SystemSceneCameraController {

  private readonly controls:
    OrbitControls;

  private pointerDown:
    {
      readonly pointerId:
        number;

      readonly button:
        number;

      readonly clientX:
        number;

      readonly clientY:
        number;

      moved:
        boolean;
    } | null =
    null;

  private readonly onControlsChange =
    () => {
      this.onChange();
    };

  private readonly onPointerDown =
    (
      event:
        PointerEvent,
    ): void => {

      if (
        event.button !==
        0
      ) {
        return;
      }

      this.pointerDown = {
        pointerId:
          event.pointerId,
        button:
          event.button,
        clientX:
          event.clientX,
        clientY:
          event.clientY,
        moved:
          false,
      };
    };

  private readonly onPointerMove =
    (
      event:
        PointerEvent,
    ): void => {

      const pointerDown =
        this.pointerDown;

      if (
        pointerDown ===
          null ||
        pointerDown.pointerId !==
          event.pointerId
      ) {
        return;
      }

      if (
        systemScenePointerTravelPixels(
          pointerDown.clientX,
          pointerDown.clientY,
          event.clientX,
          event.clientY,
        ) >
        CLICK_SELECTION_THRESHOLD_PIXELS
      ) {
        pointerDown.moved =
          true;
      }
    };

  private readonly onPointerUp =
    (
      event:
        PointerEvent,
    ): void => {

      const pointerDown =
        this.pointerDown;

      this.pointerDown =
        null;

      if (
        pointerDown ===
          null ||
        pointerDown.pointerId !==
          event.pointerId ||
        pointerDown.button !==
          0 ||
        pointerDown.moved
      ) {
        return;
      }

      if (
        systemScenePointerTravelPixels(
          pointerDown.clientX,
          pointerDown.clientY,
          event.clientX,
          event.clientY,
        ) >
        CLICK_SELECTION_THRESHOLD_PIXELS
      ) {
        return;
      }

      this.onPick(
        event.clientX,
        event.clientY,
      );
    };

  private readonly onPointerCancel =
    (): void => {
      this.pointerDown =
        null;
    };

  private readonly onContextMenu =
    (
      event:
        MouseEvent,
    ): void => {
      event.preventDefault();
    };

  constructor(
    private readonly camera:
      THREE.PerspectiveCamera,

    private readonly canvas:
      HTMLCanvasElement,

    private readonly onChange:
      () => void,

    private readonly onPick:
      SystemScenePickHandler,
  ) {

    this.controls =
      new OrbitControls(
        camera,
        canvas,
      );

    this.controls.enableRotate =
      true;
    this.controls.enablePan =
      true;
    this.controls.enableZoom =
      true;
    this.controls.enableDamping =
      false;
    this.controls.screenSpacePanning =
      true;
    this.controls.zoomToCursor =
      true;
    this.controls.zoomSpeed =
      0.82;
    this.controls.panSpeed =
      0.72;
    this.controls.rotateSpeed =
      0.58;
    this.controls.minPolarAngle =
      MIN_POLAR_ANGLE;
    this.controls.maxPolarAngle =
      MAX_POLAR_ANGLE;

    this.controls.mouseButtons.LEFT =
      THREE.MOUSE.ROTATE;
    this.controls.mouseButtons.MIDDLE =
      THREE.MOUSE.DOLLY;
    this.controls.mouseButtons.RIGHT =
      THREE.MOUSE.PAN;

    this.controls.touches.ONE =
      THREE.TOUCH.ROTATE;
    this.controls.touches.TWO =
      THREE.TOUCH.DOLLY_PAN;

    this.controls.addEventListener(
      'change',
      this.onControlsChange,
    );

    this.canvas.addEventListener(
      'pointerdown',
      this.onPointerDown,
    );
    this.canvas.addEventListener(
      'pointermove',
      this.onPointerMove,
    );
    this.canvas.addEventListener(
      'pointerup',
      this.onPointerUp,
    );
    this.canvas.addEventListener(
      'pointercancel',
      this.onPointerCancel,
    );
    this.canvas.addEventListener(
      'contextmenu',
      this.onContextMenu,
    );
  }

  frameSystem(
    outerRadiusScene:
      number,
  ): void {

    const limits =
      systemSceneCameraLimits(
        outerRadiusScene,
      );

    this.controls.minDistance =
      limits.minDistance;
    this.controls.maxDistance =
      limits.maxDistance;
    this.controls.minTargetRadius =
      0;
    this.controls.maxTargetRadius =
      limits.maxTargetRadius;

    this.controls.target.set(
      0,
      0,
      0,
    );
    this.controls.cursor.set(
      0,
      0,
      0,
    );

    this.camera.position.set(
      limits.homeDistance *
        0.18,
      limits.homeDistance *
        0.34,
      limits.homeDistance,
    );
    this.camera.lookAt(
      0,
      0,
      0,
    );

    this.controls.update();
    this.controls.saveState();
    this.onChange();
  }

  resetView():
    void {

    this.controls.reset();
    this.controls.update();
    this.onChange();
  }

  dispose():
    void {

    this.controls.removeEventListener(
      'change',
      this.onControlsChange,
    );

    this.canvas.removeEventListener(
      'pointerdown',
      this.onPointerDown,
    );
    this.canvas.removeEventListener(
      'pointermove',
      this.onPointerMove,
    );
    this.canvas.removeEventListener(
      'pointerup',
      this.onPointerUp,
    );
    this.canvas.removeEventListener(
      'pointercancel',
      this.onPointerCancel,
    );
    this.canvas.removeEventListener(
      'contextmenu',
      this.onContextMenu,
    );

    this.controls.dispose();
  }
}

export function systemSceneCameraLimits(
  outerRadiusScene:
    number,
): SystemSceneCameraLimits {

  const safeOuterRadius =
    Number.isFinite(
      outerRadiusScene,
    ) &&
    outerRadiusScene >
      0
      ? outerRadiusScene
      : 4.8;

  const homeDistance =
    Math.max(
      7.4,
      safeOuterRadius *
        2.25,
    );

  return Object.freeze({
    homeDistance,
    minDistance:
      Math.max(
        0.28,
        safeOuterRadius *
          0.055,
      ),
    maxDistance:
      Math.max(
        28,
        homeDistance *
          5.5,
      ),
    maxTargetRadius:
      Math.max(
        2,
        safeOuterRadius *
          1.45,
      ),
  });
}

export function systemScenePointerTravelPixels(
  startX:
    number,

  startY:
    number,

  endX:
    number,

  endY:
    number,
): number {

  return Math.hypot(
    endX -
      startX,
    endY -
      startY,
  );
}
