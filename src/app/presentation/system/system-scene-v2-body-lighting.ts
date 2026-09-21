import * as THREE from 'three';
import {
  v2PhysicalPositionAu,
  v2PhysicalStellarLuminosity,
} from './system-scene-v2-comet-stellar-flux';
import {
  type SystemSceneMotionContributionSnapshot,
  type SystemSceneSnapshot,
} from './system-scene-snapshot';
import {
  installSystemSceneDayNightMaterialV1,
  type SystemSceneDayNightMaterialProfileV1,
  type SystemScenePlanetLightBindingV1,
} from './system-scene-atmosphere-material';

/** Each V2 body needs its OWN three directional uniforms: a single InstancedMesh
 * material cannot represent distinct terminators on widely separated objects.
 * Planet, moon and minor-body uniforms are updated by the same renderer pass. */
export function createV2BodyLightBinding(): SystemScenePlanetLightBindingV1 {
  return {
    lightDirectionsView: [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(1, 0, 0),
    ],
    lightWeightsView: new THREE.Vector3(1, 0, 0),
  };
}

/** V1 keeps its frozen planet-only shader behaviour. In V2 all materialized
 * reflectors share the same per-frame top-three stellar calculation. */
export function systemSceneLightingTargets<
  Planet extends { readonly id: string },
  Moon extends { readonly id: string },
  Minor extends { readonly id: string },
>(
  snapshot: {
    readonly generatorVersionCode: number;
    readonly planets: readonly Planet[];
    readonly moons: readonly Moon[];
    readonly minorBodies: readonly Minor[];
  },
): readonly (Planet | Moon | Minor)[] {
  if (snapshot.generatorVersionCode !== 2) return snapshot.planets;
  return [...snapshot.planets, ...snapshot.moons, ...snapshot.minorBodies];
}

/** Presentation-only optical parameters; no fabricated atmosphere or albedo.
 * Emissive maps (volcanism) are deliberately preserved by the planet shader. */
export function v2SmallBodyDayNightProfile(
  atmospherePresent = false,
  atmosphereColorHex = '#a9c6db',
): SystemSceneDayNightMaterialProfileV1 {
  return {
    version: 1,
    terminatorSoftness01: atmospherePresent ? 0.09 : 0.022,
    nightFloor01: atmospherePresent ? 0.032 : 0.012,
    twilightGlow01: atmospherePresent ? 0.16 : 0,
    atmospherePresent,
    dayTintHex: atmosphereColorHex,
    nightTintHex: '#39536b',
  };
}

/** Shares exactly the existing planet day/night GLSL implementation. Patch only
 * standard reflected surfaces; do not darken comet coma/ion/dust emission. */
export function installV2BodyLightingOnSurfaces(
  root: THREE.Object3D,
  binding: SystemScenePlanetLightBindingV1,
  profile = v2SmallBodyDayNightProfile(),
): number {
  const installed = new Set<THREE.MeshStandardMaterial>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial) || installed.has(material)) continue;
      installSystemSceneDayNightMaterialV1(material, profile, binding);
      installed.add(material);
    }
  });
  return installed.size;
}

/** The moon limb is a separately authored ShaderMaterial (not StandardMaterial).
 * A night-side halo must not glow uniformly when its solid surface is dark. */
export function installV2MoonAtmosphereLighting(
  root: THREE.Object3D,
  binding: SystemScenePlanetLightBindingV1,
): number {
  let installed = 0;
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const material = object.material;
    if (!(material instanceof THREE.ShaderMaterial) ||
        material.name !== 'GENESIS moon atmosphere 25.10') return;
    material.uniforms['uGenesisLightDirectionsView'] = { value: binding.lightDirectionsView };
    material.uniforms['uGenesisLightWeights'] = { value: binding.lightWeightsView };
    const marker = 'void main() {';
    const alphaMarker = 'gl_FragColor = vec4(uGenesisMoonAtmosphereColor, genesisAlpha);';
    if (!material.fragmentShader.includes(marker) || !material.fragmentShader.includes(alphaMarker)) {
      throw new Error('Moon atmosphere shader lighting injection requires the frozen 25.10 markers.');
    }
    material.fragmentShader = material.fragmentShader
      .replace(marker, `uniform vec3 uGenesisLightDirectionsView[3];
uniform vec3 uGenesisLightWeights;
${marker}`)
      .replace(alphaMarker, `float genesisMoonDay = clamp(
    smoothstep(-0.09, 0.09, dot(genesisNormal, normalize(uGenesisLightDirectionsView[0]))) * uGenesisLightWeights.x +
    smoothstep(-0.09, 0.09, dot(genesisNormal, normalize(uGenesisLightDirectionsView[1]))) * uGenesisLightWeights.y +
    smoothstep(-0.09, 0.09, dot(genesisNormal, normalize(uGenesisLightDirectionsView[2]))) * uGenesisLightWeights.z,
    0.0, 1.0);
  genesisAlpha *= mix(0.08, 1.0, genesisMoonDay);
  ${alphaMarker}`);
    material.userData['genesisV2MultistellarMoonAtmosphere'] = true;
    material.needsUpdate = true;
    installed += 1;
  });
  return installed;
}

/**
 * 15.3 TRIPLE hotfix. The outer orbit and each local S-type planetary system
 * use DIFFERENT visual AU-to-scene scales. Reusing rendered distances for
 * flux makes the tertiary star brighten/dim arbitrarily as the scene is
 * spaced for readability. Resolve real AU sources ONCE per frame; directions
 * remain those of the actual visible stars in the caller's scene.
 *
 * This is presentation weighting only, not a change to physical climate,
 * orbital dynamics, generation or the independent comet thermal model.
 */
export interface V2TripleLightingSource {
  readonly starId: string;
  readonly positionAu: readonly [number, number, number];
  readonly luminositySolar: number;
  readonly photosphereRadiusAu: number;
}

export function v2TripleLightingSources(
  snapshot: Pick<SystemSceneSnapshot, 'stars' | 'motions'>,
  simulationDay: number,
): readonly V2TripleLightingSource[] {
  if (!Number.isFinite(simulationDay)) {
    throw new RangeError('TRIPLE lighting requires a finite simulation day.');
  }
  return snapshot.stars.map(star => Object.freeze({
    starId: star.id,
    positionAu: v2PhysicalPositionAu(star.motionContributions, snapshot.motions, simulationDay),
    luminositySolar: v2PhysicalStellarLuminosity(star),
    photosphereRadiusAu: (star.sourceRadiusSolar ?? 0) * 0.00465047,
  }));
}

/** Per-body, AU-based flux, keeping each component separate for its own terminator. */
export function v2TripleBodyLightFluxes(
  contributions: readonly SystemSceneMotionContributionSnapshot[],
  motions: SystemSceneSnapshot['motions'],
  sources: readonly V2TripleLightingSource[],
  simulationDay: number,
): readonly { readonly starId: string; readonly flux: number }[] {
  if (!Number.isFinite(simulationDay)) {
    throw new RangeError('TRIPLE lighting requires a finite simulation day.');
  }
  const positionAu = v2PhysicalPositionAu(contributions, motions, simulationDay);
  return sources.map(source => {
    const distanceAu = Math.max(Math.hypot(
      positionAu[0] - source.positionAu[0],
      positionAu[1] - source.positionAu[1],
      positionAu[2] - source.positionAu[2],
    ), source.photosphereRadiusAu, 1e-9);
    const flux = source.luminositySolar / distanceAu ** 2;
    return { starId: source.starId, flux: Number.isFinite(flux) ? flux : Number.MAX_VALUE };
  });
}
