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

const BODY_TRACKING_TRANSITION_MILLISECONDS =
  460;

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
 * Point-24.4 camera interaction controller shared by every SystemScene host,
 * extended at point 24.7 with presentation-only body tracking.
 *
 * The controller changes only the presentation camera. It never changes
 * orbital state or body physics. Left drag orbits, right drag pans, wheel
 * zooms to the cursor and touch uses one-finger orbit / two-finger dolly-pan.
 * A short primary click is forwarded to the scene picker; a drag is not.
 * Body tracking translates the camera/OrbitControls target with the selected
 * object's world position, preserving normal orbital simulation underneath.
 */
export class SystemSceneCameraController {

  private readonly controls:
    OrbitControls;

  private systemMaxTargetRadius =
    2;

  private bodyTrackingActive =
    false;

  private bodyTrackingTransitionComplete =
    false;

  private trackingStartTimestampMilliseconds:
    number | null =
    null;

  private readonly trackingStartBodyPosition =
    new THREE.Vector3();

  private readonly trackingLastBodyPosition =
    new THREE.Vector3();

  private readonly trackingStartCameraPosition =
    new THREE.Vector3();

  private readonly trackingStartControlsTarget =
    new THREE.Vector3();

  private readonly trackingViewDirection =
    new THREE.Vector3();

  private readonly trackingScratchBodyDelta =
    new THREE.Vector3();

  private readonly trackingScratchStartCamera =
    new THREE.Vector3();

  private readonly trackingScratchStartTarget =
    new THREE.Vector3();

  private readonly trackingScratchDesiredCamera =
    new THREE.Vector3();

  private trackingDesiredDistance =
    1;

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

    this.stopBodyTracking();

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
    this.systemMaxTargetRadius =
      limits.maxTargetRadius;
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

  beginBodyTracking(
    worldPosition:
      THREE.Vector3,

    bodyRadiusScene:
      number,
  ): void {

    this.bodyTrackingActive =
      true;
    this.bodyTrackingTransitionComplete =
      false;
    this.trackingStartTimestampMilliseconds =
      null;

    this.trackingStartBodyPosition.copy(
      worldPosition,
    );
    this.trackingLastBodyPosition.copy(
      worldPosition,
    );
    this.trackingStartCameraPosition.copy(
      this.camera.position,
    );
    this.trackingStartControlsTarget.copy(
      this.controls.target,
    );

    this.trackingViewDirection
      .copy(
        this.camera.position,
      )
      .sub(
        this.controls.target,
      );

    if (
      this.trackingViewDirection.lengthSq() <
        1e-10
    ) {
      this.trackingViewDirection.set(
        0.18,
        0.34,
        1,
      );
    }

    this.trackingViewDirection.normalize();

    this.trackingDesiredDistance =
      systemSceneBodyFocusDistance(
        bodyRadiusScene,
        this.controls.minDistance,
        this.controls.maxDistance,
      );

    this.controls.minTargetRadius =
      0;
    this.controls.maxTargetRadius =
      Number.POSITIVE_INFINITY;
    this.controls.cursor.copy(
      worldPosition,
    );

    this.onChange();
  }

  updateBodyTracking(
    worldPosition:
      THREE.Vector3,

    timestampMilliseconds:
      number,
  ): void {

    if (
      !this.bodyTrackingActive
    ) {
      return;
    }

    if (
      this.trackingStartTimestampMilliseconds ===
        null
    ) {
      this.trackingStartTimestampMilliseconds =
        Number.isFinite(
          timestampMilliseconds,
        )
          ? timestampMilliseconds
          : 0;
    }

    const safeTimestamp =
      Number.isFinite(
        timestampMilliseconds,
      )
        ? timestampMilliseconds
        : this.trackingStartTimestampMilliseconds;

    const transitionFraction =
      Math.min(
        1,
        Math.max(
          0,
          (
            safeTimestamp -
            this.trackingStartTimestampMilliseconds
          ) /
            BODY_TRACKING_TRANSITION_MILLISECONDS,
        ),
      );

    if (
      transitionFraction <
        1
    ) {
      const eased =
        smoothStep01(
          transitionFraction,
        );

      this.trackingScratchBodyDelta
        .copy(
          worldPosition,
        )
        .sub(
          this.trackingStartBodyPosition,
        );

      this.trackingScratchStartCamera
        .copy(
          this.trackingStartCameraPosition,
        )
        .add(
          this.trackingScratchBodyDelta,
        );

      this.trackingScratchStartTarget
        .copy(
          this.trackingStartControlsTarget,
        )
        .add(
          this.trackingScratchBodyDelta,
        );

      this.trackingScratchDesiredCamera
        .copy(
          this.trackingViewDirection,
        )
        .multiplyScalar(
          this.trackingDesiredDistance,
        )
        .add(
          worldPosition,
        );

      this.camera.position.lerpVectors(
        this.trackingScratchStartCamera,
        this.trackingScratchDesiredCamera,
        eased,
      );

      this.controls.target.lerpVectors(
        this.trackingScratchStartTarget,
        worldPosition,
        eased,
      );

      this.controls.cursor.copy(
        this.controls.target,
      );
      this.controls.update();
      this.trackingLastBodyPosition.copy(
        worldPosition,
      );
      return;
    }

    if (
      !this.bodyTrackingTransitionComplete
    ) {
      this.trackingScratchDesiredCamera
        .copy(
          this.trackingViewDirection,
        )
        .multiplyScalar(
          this.trackingDesiredDistance,
        )
        .add(
          worldPosition,
        );

      this.camera.position.copy(
        this.trackingScratchDesiredCamera,
      );
      this.controls.target.copy(
        worldPosition,
      );
      this.controls.cursor.copy(
        worldPosition,
      );
      this.trackingLastBodyPosition.copy(
        worldPosition,
      );
      this.bodyTrackingTransitionComplete =
        true;
      this.controls.update();
      return;
    }

    this.trackingScratchBodyDelta
      .copy(
        worldPosition,
      )
      .sub(
        this.trackingLastBodyPosition,
      );

    this.camera.position.add(
      this.trackingScratchBodyDelta,
    );
    this.controls.target.add(
      this.trackingScratchBodyDelta,
    );
    this.controls.cursor.copy(
      this.controls.target,
    );
    this.trackingLastBodyPosition.copy(
      worldPosition,
    );
    this.controls.update();
  }

  stopBodyTracking():
    void {

    this.bodyTrackingActive =
      false;
    this.bodyTrackingTransitionComplete =
      false;
    this.trackingStartTimestampMilliseconds =
      null;
    this.controls.maxTargetRadius =
      this.systemMaxTargetRadius;
    this.controls.cursor.copy(
      this.controls.target,
    );
  }

  resetView():
    void {

    this.stopBodyTracking();
    this.controls.reset();
    this.controls.cursor.set(
      0,
      0,
      0,
    );
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

export function systemSceneBodyFocusDistance(
  bodyRadiusScene:
    number,

  minDistance:
    number,

  maxDistance:
    number,
): number {

  const safeRadius =
    Number.isFinite(
      bodyRadiusScene,
    ) &&
    bodyRadiusScene >
      0
      ? bodyRadiusScene
      : 0.04;

  const safeMinDistance =
    Number.isFinite(
      minDistance,
    ) &&
    minDistance >
      0
      ? minDistance
      : 0.28;

  const safeMaxDistance =
    Number.isFinite(
      maxDistance,
    ) &&
    maxDistance >
      safeMinDistance
      ? maxDistance
      : Math.max(
          safeMinDistance *
            4,
          2,
        );

  const preferredDistance =
    Math.max(
      0.78,
      safeRadius *
        8.5,
      safeMinDistance *
        1.6,
    );

  return Math.max(
    safeMinDistance,
    Math.min(
      safeMaxDistance *
        0.72,
      preferredDistance,
    ),
  );
}

function smoothStep01(
  value:
    number,
): number {
  const clamped =
    Math.min(
      1,
      Math.max(
        0,
        value,
      ),
    );

  return clamped *
    clamped *
    (
      3 -
      2 *
        clamped
    );
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
