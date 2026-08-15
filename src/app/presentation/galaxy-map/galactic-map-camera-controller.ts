import * as THREE from 'three';

import {
  OrbitControls,
} from 'three/addons/controls/OrbitControls.js';

const MIN_CAMERA_DISTANCE =
  0.25;

const MAX_CAMERA_DISTANCE =
  7.20;

const MAX_TARGET_RADIUS =
  1.35;

const MIN_POLAR_ANGLE =
  0.16;

const MAX_POLAR_ANGLE =
  Math.PI -
  MIN_POLAR_ANGLE;

const MAX_SELECTION_PIXEL_DISTANCE =
  10;

const MIN_SELECTION_THRESHOLD =
  0.014;

const MAX_SELECTION_THRESHOLD =
  0.070;

const GALAXY_SPIN_RADIANS_PER_HORIZONTAL_PIXEL =
  0.006;

export interface GalacticMapCameraState {
  readonly distance:
    number;

  readonly azimuthRadians:
    number;

  readonly polarRadians:
    number;

  readonly targetX:
    number;

  readonly targetY:
    number;

  readonly targetZ:
    number;

  readonly rotationEnabled:
    boolean;
}

export interface GalacticMapVisualSelection {
  readonly sampleIndex:
    number;

  readonly renderX:
    number;

  readonly renderY:
    number;

  readonly renderZ:
    number;

  readonly pixelDistance:
    number;
}

/**
 * Point-10.2 camera and picking controller.
 *
 * The selected index identifies one GPU render sample only. It is not a star,
 * system, discovery, locator or persisted Ground Truth entity.
 *
 * The point-10.2 interaction extension keeps the approved OrbitControls
 * free orbit on the primary button and uses a horizontal secondary-button drag
 * to spin the rendered galaxy around its own local axis while the camera remains
 * unchanged. Pan remains available through Ctrl + primary-button drag.
 */
export class GalacticMapCameraController {

  private readonly controls:
    OrbitControls;

  private readonly raycaster =
    new THREE.Raycaster();

  private readonly ndc =
    new THREE.Vector2();

  private readonly candidateLocal =
    new THREE.Vector3();

  private readonly candidateWorld =
    new THREE.Vector3();

  private readonly projected =
    new THREE.Vector3();

  private galaxySpinPointerId:
    number | null =
    null;

  private galaxySpinPointerLastClientX =
    0;

  private suppressControlsChange =
    false;

  private readonly onControlsChange =
    () => {
      if (
        this.suppressControlsChange
      ) {
        return;
      }

      this.onChange();
    };

  private readonly onGalaxySpinPointerDown =
    (
      event:
        PointerEvent,
    ) => {
      if (
        event.pointerType !==
          'mouse' ||
        event.button !==
          2
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      if (
        !this.controls.enableRotate
      ) {
        return;
      }

      this.galaxySpinPointerId =
        event.pointerId;

      this.galaxySpinPointerLastClientX =
        event.clientX;

      if (
        typeof this.canvas.setPointerCapture ===
          'function'
      ) {
        try {
          this.canvas.setPointerCapture(
            event.pointerId,
          );
        } catch {
          // Pointer capture is an interaction aid only. The gesture still
          // works while the pointer remains over the canvas.
        }
      }

      const ownerDocument =
        this.canvas.ownerDocument;

      ownerDocument.addEventListener(
        'pointermove',
        this.onGalaxySpinPointerMove,
        true,
      );

      ownerDocument.addEventListener(
        'pointerup',
        this.onGalaxySpinPointerUp,
        true,
      );

      ownerDocument.addEventListener(
        'pointercancel',
        this.onGalaxySpinPointerCancel,
        true,
      );
    };

  private readonly onGalaxySpinPointerMove =
    (
      event:
        PointerEvent,
    ) => {
      if (
        event.pointerId !==
          this.galaxySpinPointerId
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      const deltaX =
        event.clientX -
        this.galaxySpinPointerLastClientX;

      this.galaxySpinPointerLastClientX =
        event.clientX;

      if (
        deltaX ===
          0
      ) {
        return;
      }

      const stepRadians =
        galaxySpinRadiansForHorizontalDrag(
          deltaX,
        );

      this.onGalaxySpinStep(
        stepRadians,
      );
    };

  private readonly onGalaxySpinPointerUp =
    (
      event:
        PointerEvent,
    ) => {
      if (
        event.pointerId !==
          this.galaxySpinPointerId
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      this.finishGalaxySpinGesture(
        event.pointerId,
      );
    };

  private readonly onGalaxySpinPointerCancel =
    (
      event:
        PointerEvent,
    ) => {
      if (
        event.pointerId !==
          this.galaxySpinPointerId
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      this.finishGalaxySpinGesture(
        event.pointerId,
      );
    };

  constructor(
    private readonly camera:
      THREE.PerspectiveCamera,

    private readonly canvas:
      HTMLCanvasElement,

    private readonly onChange:
      () => void,

    private readonly onGalaxySpinStep:
      (radians: number) => void =
      () => {},
  ) {
    this.controls =
      new OrbitControls(
        this.camera,
        this.canvas,
      );

    this.controls.enableZoom =
      true;

    this.controls.enablePan =
      true;

    this.controls.enableRotate =
      true;

    this.controls.enableDamping =
      false;

    this.controls.screenSpacePanning =
      true;

    this.controls.zoomToCursor =
      true;

    this.controls.zoomSpeed =
      0.86;

    this.controls.panSpeed =
      0.72;

    this.controls.rotateSpeed =
      0.58;

    this.controls.minDistance =
      MIN_CAMERA_DISTANCE;

    this.controls.maxDistance =
      MAX_CAMERA_DISTANCE;

    this.controls.minPolarAngle =
      MIN_POLAR_ANGLE;

    this.controls.maxPolarAngle =
      MAX_POLAR_ANGLE;

    this.controls.minTargetRadius =
      0;

    this.controls.maxTargetRadius =
      MAX_TARGET_RADIUS;

    this.controls.cursor.set(
      0,
      0,
      0,
    );

    this.controls.target.set(
      0,
      0,
      0,
    );

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

    this.controls.update();
    this.controls.saveState();

    this.controls.addEventListener(
      'change',
      this.onControlsChange,
    );

    this.canvas.addEventListener(
      'pointerdown',
      this.onGalaxySpinPointerDown,
      true,
    );
  }

  cameraState():
    GalacticMapCameraState {

    return Object.freeze({
      distance:
        this.controls.getDistance(),

      azimuthRadians:
        this.controls.getAzimuthalAngle(),

      polarRadians:
        this.controls.getPolarAngle(),

      targetX:
        this.controls.target.x,

      targetY:
        this.controls.target.y,

      targetZ:
        this.controls.target.z,

      rotationEnabled:
        this.controls.enableRotate,
    });
  }

  setRotationEnabled(
    enabled:
      boolean,
  ): void {

    this.controls.enableRotate =
      enabled;

    if (
      !enabled &&
      this.galaxySpinPointerId !==
        null
    ) {
      this.finishGalaxySpinGesture(
        this.galaxySpinPointerId,
      );
    }

    this.onChange();
  }

  resetView():
    void {

    this.suppressControlsChange =
      true;

    try {
      this.controls.reset();
      this.controls.update();
    } finally {
      this.suppressControlsChange =
        false;
    }

    this.camera.updateMatrixWorld(
      true,
    );

    this.onChange();
  }

  selectPoint(
    points:
      THREE.Points<
        THREE.BufferGeometry,
        THREE.Material | THREE.Material[]
      >,

    clientX:
      number,

    clientY:
      number,
  ): GalacticMapVisualSelection | null {

    const bounds =
      this.canvas.getBoundingClientRect();

    if (
      bounds.width <=
        0 ||
      bounds.height <=
        0
    ) {
      return null;
    }

    this.ndc.set(
      (
        (
          clientX -
          bounds.left
        ) /
        bounds.width
      ) *
        2 -
        1,
      -(
        (
          clientY -
          bounds.top
        ) /
        bounds.height
      ) *
        2 +
        1,
    );

    this.raycaster.params.Points.threshold =
      selectionRaycastThreshold(
        this.controls.getDistance(),
      );

    this.raycaster.setFromCamera(
      this.ndc,
      this.camera,
    );

    points.updateWorldMatrix(
      true,
      false,
    );

    const intersections =
      this.raycaster.intersectObject(
        points,
        false,
      );

    const position =
      points.geometry.getAttribute(
        'position',
      );

    let bestSelection:
      GalacticMapVisualSelection | null =
      null;

    let bestPixelDistanceSquared =
      MAX_SELECTION_PIXEL_DISTANCE *
      MAX_SELECTION_PIXEL_DISTANCE;

    for (
      const intersection
      of intersections
    ) {
      const sampleIndex =
        intersection.index;

      if (
        sampleIndex ===
          undefined ||
        sampleIndex <
          0 ||
        sampleIndex >=
          position.count
      ) {
        continue;
      }

      this.candidateLocal.fromBufferAttribute(
        position as THREE.BufferAttribute,
        sampleIndex,
      );

      this.candidateWorld.copy(
        this.candidateLocal,
      );

      points.localToWorld(
        this.candidateWorld,
      );

      this.projected.copy(
        this.candidateWorld,
      );

      this.projected.project(
        this.camera,
      );

      const projectedClientX =
        bounds.left +
        (
          this.projected.x +
          1
        ) *
          0.5 *
          bounds.width;

      const projectedClientY =
        bounds.top +
        (
          1 -
          this.projected.y
        ) *
          0.5 *
          bounds.height;

      const deltaX =
        projectedClientX -
        clientX;

      const deltaY =
        projectedClientY -
        clientY;

      const pixelDistanceSquared =
        deltaX *
          deltaX +
        deltaY *
          deltaY;

      if (
        pixelDistanceSquared >
        bestPixelDistanceSquared
      ) {
        continue;
      }

      bestPixelDistanceSquared =
        pixelDistanceSquared;

      bestSelection =
        Object.freeze({
          sampleIndex,

          renderX:
            this.candidateWorld.x,

          renderY:
            this.candidateWorld.y,

          renderZ:
            this.candidateWorld.z,

          pixelDistance:
            Math.sqrt(
              pixelDistanceSquared,
            ),
        });
    }

    return bestSelection;
  }

  dispose():
    void {

    if (
      this.galaxySpinPointerId !==
        null
    ) {
      this.finishGalaxySpinGesture(
        this.galaxySpinPointerId,
      );
    }

    this.canvas.removeEventListener(
      'pointerdown',
      this.onGalaxySpinPointerDown,
      true,
    );

    this.controls.removeEventListener(
      'change',
      this.onControlsChange,
    );

    this.controls.dispose();
  }

  private finishGalaxySpinGesture(
    pointerId:
      number,
  ): void {

    const ownerDocument =
      this.canvas.ownerDocument;

    ownerDocument.removeEventListener(
      'pointermove',
      this.onGalaxySpinPointerMove,
      true,
    );

    ownerDocument.removeEventListener(
      'pointerup',
      this.onGalaxySpinPointerUp,
      true,
    );

    ownerDocument.removeEventListener(
      'pointercancel',
      this.onGalaxySpinPointerCancel,
      true,
    );

    if (
      typeof this.canvas.releasePointerCapture ===
        'function'
    ) {
      try {
        if (
          typeof this.canvas.hasPointerCapture !==
            'function' ||
          this.canvas.hasPointerCapture(
            pointerId,
          )
        ) {
          this.canvas.releasePointerCapture(
            pointerId,
          );
        }
      } catch {
        // Pointer capture is not required for cleanup correctness.
      }
    }

    this.galaxySpinPointerId =
      null;
  }
}

export function selectionRaycastThreshold(
  cameraDistance:
    number,
): number {

  return THREE.MathUtils.clamp(
    cameraDistance *
      0.0115,
    MIN_SELECTION_THRESHOLD,
    MAX_SELECTION_THRESHOLD,
  );
}

export function galaxySpinRadiansForHorizontalDrag(
  deltaX:
    number,
): number {

  return -deltaX *
    GALAXY_SPIN_RADIANS_PER_HORIZONTAL_PIXEL;
}

