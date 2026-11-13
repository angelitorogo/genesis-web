import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { computeVida38SpeciesCameraFramingV1 } from './vida38-species-camera-framing-38-2ha';
import { LifeSpeciesVisualPreviewComponent } from './life-species-visual-preview';

const YAW = -0.42;
const PITCH = 0.18;

const box = (width: number, height: number, depth: number, minY = -0.66): THREE.Box3 =>
  new THREE.Box3(
    new THREE.Vector3(-width / 2, minY, -depth / 2),
    new THREE.Vector3(width / 2, minY + height, depth / 2),
  );

/** Validación en espacio de cámara durante una vuelta completa de la especie. */
function assertFit(bounds: THREE.Box3, aspect: number, yaw: number, pitch: number): void {
  const vFov = 34;
  const frame = computeVida38SpeciesCameraFramingV1({ bounds, aspect, verticalFovDegrees: vFov, yaw, pitch });
  const tangentVertical = Math.tan(THREE.MathUtils.degToRad(vFov / 2));
  const tangentHorizontal = tangentVertical * aspect;
  const viewing = new THREE.Vector3(Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const up = new THREE.Vector3(-Math.sin(pitch) * Math.sin(yaw), Math.cos(pitch), -Math.sin(pitch) * Math.cos(yaw));
  const center = bounds.getCenter(new THREE.Vector3());
  for (let angleIndex = 0; angleIndex < 24; angleIndex++) {
    const angle = angleIndex * Math.PI * 2 / 24;
    for (const x of [bounds.min.x, bounds.max.x]) {
      for (const y of [bounds.min.y, bounds.max.y]) {
        for (const z of [bounds.min.z, bounds.max.z]) {
          const rotated = new THREE.Vector3(x - center.x, y - center.y, z - center.z)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
            .add(center).sub(frame.focus);
          const depth = frame.distance - rotated.dot(viewing);
          expect(depth).toBeGreaterThan(0.1);
          expect(Math.abs(rotated.dot(right)) / (depth * tangentHorizontal)).toBeLessThan(0.83);
          expect(Math.abs(rotated.dot(up)) / (depth * tangentVertical)).toBeLessThan(0.83);
        }
      }
    }
  }
}

describe('GENESIS 38.2h.a — encuadre automático de fichas biológicas', () => {
  it('centra al mamífero bajo en su geometría real, no en una altura fija de la escena', () => {
    const bounds = box(1.95, 0.58, 0.65);
    const framing = computeVida38SpeciesCameraFramingV1({bounds, aspect: 2.0, verticalFovDegrees: 34, yaw: YAW, pitch: PITCH});
    expect(framing.focus.y).toBeCloseTo(bounds.getCenter(new THREE.Vector3()).y - 0.58 * 0.045, 6);
    expect(framing.focus.y).toBeLessThan(0);
    expect(framing.distance).toBeGreaterThan(framing.minDistance);
    expect(framing.maxDistance).toBeGreaterThan(framing.distance);
  });

  it('encuadra sin recortar cuadrúpedos alargados, humanoides, plantas y modelos anchos incluso girando', () => {
    for (const bounds of [
      box(1.95, 0.58, 0.65), // mamífero largo y bajo
      box(0.65, 1.95, 0.45), // humanoide
      box(1.05, 1.95, 0.86), // planta
      box(1.95, 0.95, 1.75), // animal ancho/voluminoso
    ]) {
      for (const aspect of [0.6, 1, 2.1]) {
        assertFit(bounds, aspect, YAW, PITCH);
        assertFit(bounds, aspect, 0.8, -0.4);
      }
    }
  });

  it('excluye la peana al calcular el cuerpo y no cambia el modelo para encuadrarlo', () => {
    const root = new THREE.Group();
    const subject = new THREE.Group();
    const animal = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.5, 0.6));
    animal.position.y = -0.32;
    subject.add(animal);
    root.add(subject);
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.16, 8));
    platform.position.y = -0.74;
    root.add(platform);
    const subjectBounds = new THREE.Box3().setFromObject(subject);
    const fullBounds = new THREE.Box3().setFromObject(root);
    expect(fullBounds.getSize(new THREE.Vector3()).x).toBeGreaterThan(subjectBounds.getSize(new THREE.Vector3()).x);
    const beforePosition = animal.position.clone();
    computeVida38SpeciesCameraFramingV1({bounds:subjectBounds, aspect: 2, verticalFovDegrees: 34, yaw: YAW, pitch: PITCH});
    expect(animal.position).toEqual(beforePosition);
    animal.geometry.dispose();
    platform.geometry.dispose();
  });

  it('Restablecer vista reutiliza el objetivo geométrico, incluso tras una órbita y un zoom', () => {
    const component = new LifeSpeciesVisualPreviewComponent();
    const camera = new THREE.PerspectiveCamera(34, 2.1, 0.1, 100);
    const bounds = box(1.95, 0.62, 0.75);
    const internal = component as unknown as {
      camera: THREE.PerspectiveCamera;
      subjectBounds: THREE.Box3;
      cameraFraming: ReturnType<typeof computeVida38SpeciesCameraFramingV1> | null;
      distance: number;
      yaw: number;
      pitch: number;
    };
    internal.camera = camera;
    internal.subjectBounds = bounds;
    internal.distance = 7;
    internal.yaw = 1.1;
    internal.pitch = -0.45;
    component.resetView();
    const frame = computeVida38SpeciesCameraFramingV1({ bounds, aspect: 2.1, verticalFovDegrees: 34, yaw: YAW, pitch: PITCH });
    expect(internal.yaw).toBeCloseTo(YAW);
    expect(internal.pitch).toBeCloseTo(PITCH);
    expect(internal.distance).toBeCloseTo(frame.distance);
    const viewDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const toTarget = frame.focus.clone().sub(camera.position).normalize();
    expect(viewDirection.distanceTo(toTarget)).toBeLessThan(1e-6);
  });

  it('tolera bounds degenerados y parámetros no finitos sin generar NaN', () => {
    const frame = computeVida38SpeciesCameraFramingV1({
      bounds: new THREE.Box3(), verticalFovDegrees: Number.NaN, aspect: Number.NaN, yaw: 0, pitch: Number.NaN,
    });
    expect(Number.isFinite(frame.distance)).toBe(true);
    expect(frame.distance).toBeGreaterThan(0);
    expect(frame.focus.toArray().every(Number.isFinite)).toBe(true);
  });
});
