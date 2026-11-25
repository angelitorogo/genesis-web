import * as THREE from 'three';
import type {
  SystemSceneBodySnapshot, SystemSceneMoonSnapshot,
  SystemSceneOrbitSnapshot, SystemSceneScaleSnapshot,
} from './system-scene-snapshot';
import { viscorbLocalOrbitLayoutV1, viscorbPresentedMoonRadiusV1,
  viscorbMoonOrbitPresentationScaleV1, viscorbBlendOrbitTransformV1,
} from './viscorb-local-orbit-projection';

interface ViscorbMoonBindingV1 {
  readonly moon: SystemSceneMoonSnapshot;
  readonly object: THREE.Group;
  readonly orbit: SystemSceneOrbitSnapshot;
  readonly line: THREE.LineLoop;
  readonly sizeScale: number;
  readonly originalOpacity: number;
  readonly physicalPosition: THREE.Vector3;
  readonly physicalAnchor: THREE.Vector3;
}

interface ViscorbHostBindingV1 {
  readonly host: SystemSceneBodySnapshot;
  readonly object: THREE.Group;
  readonly moonBindings: readonly ViscorbMoonBindingV1[];
  readonly orbitScale: number;
  readonly outerRadiusScene: number;
  readonly scale: SystemSceneScaleSnapshot;
}

/**
 * Transient presentation transform. No orbital element, seed, snapshot or
 * authoritative projection is changed. Exactly the existing moon groups and
 * orbital lines are reused; the current scientific positions are re-evaluated
 * from their unchanged contributions on every frame.
 */
export class ViscorbSystemLocalPresentationV1 {
  private active: ViscorbHostBindingV1 | null = null;
  private alpha = 0;
  private desiredAlpha = 0;
  private lastTimeMs: number | null = null;
  private lastComputedDay: number | null = null;

  begin(
    planet: SystemSceneBodySnapshot,
    planets: readonly SystemSceneBodySnapshot[],
    moons: readonly SystemSceneMoonSnapshot[],
    orbits: readonly SystemSceneOrbitSnapshot[],
    scale: SystemSceneScaleSnapshot,
    objects: ReadonlyMap<string, THREE.Group>,
    lines: ReadonlyMap<string, THREE.LineLoop>,
  ): number | null {
    this.endImmediately();
    if (planet.kind !== 'planet' || !planets.some(p => p.id === planet.id)) return null;
    const host = objects.get(planet.id);
    if (!host) return null;
    const entries = moons.filter(moon => moon.hostPlanetId === planet.id)
      .map(moon => {
        const object = objects.get(moon.id);
        const orbit = orbits.find(item => item.id === moon.orbitId && item.kind === 'moon');
        const line = lines.get(moon.orbitId);
        if (!object || !orbit || !line || !line.geometry.getAttribute('position')) return null;
        const radii = viscorbOrbitGeometryRadiiV1(line.geometry);
        if (!radii) return null;
        return {moon, object, orbit, line, radii};
      }).filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    if (!entries.length) return null;

    const hostRadius = Math.max(planet.radiusScene, 1e-6);
    const layout = viscorbLocalOrbitLayoutV1(entries.map(({moon, radii}) => ({
      periapsisPlanetRadii: radii.periapsis / hostRadius,
      apoapsisPlanetRadii: radii.apoapsis / hostRadius,
      radiusEarth: moon.visualPresentation.sourceRadiusEarth,
    })), planet.specialPresentation?.rings?.outerRadiusPlanetRadii ?? 1);
    if (!layout) return null;

    const orbitScale = Math.max(0.12, Math.min(6, viscorbMoonOrbitPresentationScaleV1(layout)));
    const moonBindings = entries.map(({moon, object, orbit, line}) => {
      const moonRadius = hostRadius * viscorbPresentedMoonRadiusV1(
        layout, moon.visualPresentation.sourceRadiusEarth,
      ) / layout.planetRadius;
      return {
        moon, object, orbit, line,
        // VISCORB.1b: scale the VISCORB.1a presentation clamps by 0.85 too,
        // preserving the requested reduction for very small or huge moons.
        // This changes only the presentation group, not the moon snapshot.
        sizeScale: Math.max(0.102, Math.min(5.1, moonRadius / Math.max(moon.radiusScene, 1e-6))),
        originalOpacity: line.material instanceof THREE.LineBasicMaterial ? line.material.opacity : 1,
        physicalPosition: new THREE.Vector3(),
        physicalAnchor: new THREE.Vector3(),
      };
    });
    this.active = {host:planet, object:host, moonBindings, orbitScale,
      outerRadiusScene: hostRadius * layout.outermostRadiusScene / layout.planetRadius,
      scale};
    this.alpha = 0;
    this.desiredAlpha = 1;
    this.lastTimeMs = null;
    this.lastComputedDay = null;
    return this.active.outerRadiusScene;
  }

  /** Resume following an existing host after a quick layer visibility change. */
  resume(hostId: string): boolean {
    if (this.active?.host.id !== hostId) return false;
    this.desiredAlpha = 1;
    this.lastTimeMs = null;
    return true;
  }

  /** Start a smooth return to the global projection. */
  release(): void {
    this.desiredAlpha = 0;
    this.lastTimeMs = null;
  }

  /** Reset on snapshot replacement/disposal before source geometry is released. */
  endImmediately(): void {
    if (this.active) {
      for (const binding of this.active.moonBindings) {
        binding.object.scale.setScalar(1);
        binding.line.scale.setScalar(1);
        if (binding.line.material instanceof THREE.LineBasicMaterial) {
          binding.line.material.opacity = binding.originalOpacity;
        }
      }
    }
    this.active = null;
    this.alpha = 0;
    this.desiredAlpha = 0;
    this.lastTimeMs = null;
    this.lastComputedDay = null;
  }

  get hostId(): string | null { return this.active?.host.id ?? null; }

  /** Unmodified scientific location for lighting/occlusion despite visual magnification. */
  physicalMoonPosition(moonId: string): THREE.Vector3 | null {
    return this.active?.moonBindings.find(binding => binding.moon.id === moonId)?.physicalPosition ?? null;
  }

  update(
    simulationDay: number,
    timeMs: number,
    project: (contributions: SystemSceneMoonSnapshot['motionContributions'], day: number,
      scale: SystemSceneScaleSnapshot) => THREE.Vector3,
  ): void {
    const state = this.active;
    if (!state) return;
    const elapsed = this.lastTimeMs === null ? 0 : Math.min(80, Math.max(0, timeMs - this.lastTimeMs));
    this.lastTimeMs = timeMs;
    this.alpha = this.desiredAlpha > this.alpha
      ? Math.min(1, this.alpha + elapsed / 520)
      : Math.max(0, this.alpha - elapsed / 520);
    const hostPosition = state.object.position;
    // Projection engine is evaluated only when simulation time changes.
    // Camera pan/zoom does not regenerate orbital geometry or body ephemerides.
    if (this.lastComputedDay !== simulationDay) {
      for (const binding of state.moonBindings) {
        const source = binding.moon.motionContributions.length
          ? project(binding.moon.motionContributions, simulationDay, state.scale)
          : new THREE.Vector3(binding.moon.position.x,binding.moon.position.y,binding.moon.position.z);
        binding.physicalPosition.copy(source);
        binding.physicalAnchor.copy(binding.orbit.anchorMotionContributions.length
          ? project(binding.orbit.anchorMotionContributions,simulationDay,state.scale)
          : hostPosition);
      }
      this.lastComputedDay = simulationDay;
    }
    const orbitScale = viscorbBlendOrbitTransformV1(1, state.orbitScale, this.alpha);
    for (const binding of state.moonBindings) {
      binding.object.position.copy(binding.physicalPosition)
        .sub(hostPosition).multiplyScalar(orbitScale).add(hostPosition);
      binding.object.scale.setScalar(viscorbBlendOrbitTransformV1(1,binding.sizeScale,this.alpha));
      // Scale an eccentric orbit about its host, including the original focal
      // offset of its orbit anchor; never force an ellipse's centre to the host.
      binding.line.position.copy(binding.physicalAnchor)
        .sub(hostPosition).multiplyScalar(orbitScale).add(hostPosition);
      binding.line.scale.setScalar(orbitScale);
      if (binding.line.material instanceof THREE.LineBasicMaterial) {
        binding.line.material.opacity = viscorbBlendOrbitTransformV1(binding.originalOpacity,
          Math.min(0.70, Math.max(binding.originalOpacity,0.46)),this.alpha);
      }
    }
    if (this.alpha <= 0 && this.desiredAlpha === 0) this.endImmediately();
  }
}

export function viscorbOrbitGeometryRadiiV1(
  geometry: THREE.BufferGeometry,
): {readonly periapsis:number;readonly apoapsis:number} | null {
  const positions = geometry.getAttribute('position');
  if (!positions || positions.count < 3) return null;
  let min = Infinity;
  let max = 0;
  for (let i=0; i<positions.count; i++) {
    const r = Math.hypot(positions.getX(i),positions.getY(i),positions.getZ(i));
    if (!Number.isFinite(r)) return null;
    min = Math.min(min,r);
    max = Math.max(max,r);
  }
  return min > 1e-9 && max >= min ? {periapsis:min,apoapsis:max} : null;
}
