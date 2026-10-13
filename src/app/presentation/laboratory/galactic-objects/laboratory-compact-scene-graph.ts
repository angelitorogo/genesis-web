import * as THREE from 'three';
import { Injector, PLATFORM_ID, runInInjectionContext } from '@angular/core';

/** Shared geometry and material ownership. The game uses the same procedural
 * lab graph inside its existing WebGL scene, never a second canvas/renderer. */
export interface LaboratoryCompactSceneGraph {
  readonly root: THREE.Group;
  update(visualTimeSeconds: number): void;
  dispose(): void;
}

export function disposeLaboratoryCompactGraph(root: THREE.Group): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse(object => {
    const drawable = object as THREE.Mesh;
    if (drawable.geometry instanceof THREE.BufferGeometry) geometries.add(drawable.geometry);
    const material = drawable.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) material.forEach(value => materials.add(value));
    else if (material) materials.add(material);
  });
  geometries.forEach(value => value.dispose());
  materials.forEach(value => value.dispose());
  root.clear();
}

/** The Angular component's shader/geometry methods can also be invoked without
 * mounting its view. A legitimate injection context avoids altering the
 * component's normal DI constructor or opening another canvas. */
export function constructLaboratoryGeometryBuilder<T>(factory: () => T): T {
  const injector = Injector.create({ providers: [
    { provide: PLATFORM_ID, useValue: 'server' },
  ] });
  return runInInjectionContext(injector, factory);
}
