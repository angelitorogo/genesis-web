import * as THREE from 'three';
import type { SystemSceneOrbitalRingPlanV1 } from './system-scene-artificial-satellites-visciv2';

/**
 * VISCIV.6n — purely presentational projection of artificial ring shadows on
 * the planetary surface. Directions and flux weights come from the existing
 * planet day/night shader (up to 3 stars). Rings remain independent from
 * native astronomical ring systems, science, persistence and urban emission.
 */
export interface OrbitalSurfaceShadowRingVISCIV6n {
  readonly root: THREE.Group;
  readonly rotor: THREE.Group;
  readonly plan: SystemSceneOrbitalRingPlanV1;
}

export interface OrbitalSurfaceShadowBindingVISCIV6n {
  /** Update after orbital/spin/camera matrices, before renderer.render(). */
  update(camera: THREE.Camera, enabled: boolean): void;
}

export const ORBITAL_SURFACE_SHADOW_MAX_RINGS_VISCIV6n = 3;
const SHADOW_SHADER_MARKER = 'outgoingLight *= genesisNightVisibility * genesisNightTint;';
const VISUAL_MIN_HALF_WIDTH_VISCIV6na = 0.155;
const VISUAL_PENUMBRA_WIDTH_VISCIV6na = 0.024;
// VISCIV.6o — two wide, smooth silhouettes of major integrated orbital hubs.
// This changes the OUTER SHAPE of the shadow, never its internal opacity: no stripes.
const MONUMENTAL_LOBE_START_VISCIV6o = 0.78;
const MONUMENTAL_LOBE_END_VISCIV6o = 0.985;

/** Extra half-width of the two principal integrated hubs, in scene units. */
export function orbitalMonumentalHubHalfWidthVISCIV6o(
  kind: SystemSceneOrbitalRingPlanV1['ringKind'], planetRadiusScene: number,
): number {
  if (!(planetRadiusScene > 0) || !Number.isFinite(planetRadiusScene)) return 0;
  const factor = kind === 'INDUSTRIAL' ? 0.060 : kind === 'HABITAT' ? 0.050 : 0.034;
  return factor * planetRadiusScene;
}

/** Continuous, deterministic and symmetrical expansion around the two major hubs. */
export function orbitalMonumentalHubSilhouetteVISCIV6o(
  unitHit: THREE.Vector3, unitHubAxis: THREE.Vector3, maximumExpansion: number,
): number {
  if (!(maximumExpansion > 0) || unitHit.lengthSq() < 1e-12 || unitHubAxis.lengthSq() < 1e-12) return 0;
  const alignment = Math.abs(unitHit.dot(unitHubAxis) / Math.sqrt(unitHit.lengthSq() * unitHubAxis.lengthSq()));
  const t = THREE.MathUtils.clamp((alignment - MONUMENTAL_LOBE_START_VISCIV6o) /
    (MONUMENTAL_LOBE_END_VISCIV6o - MONUMENTAL_LOBE_START_VISCIV6o), 0, 1);
  return maximumExpansion * t * t * (3 - 2 * t);
}


/**
 * Standalone CPU reference for the shader's ray/plane/annulus test.
 * Positions, directions, ring normals and radii must use a single coordinate
 * system (e.g. planetary-centred view space) and consistent length units.
 * Returns the amount of direct day-side starlight intercepted, in [0,1].
 */
export function orbitalRingSurfaceShadowOcclusionVISCIV6n(
  point: THREE.Vector3,
  directionToStar: THREE.Vector3,
  planeNormal: THREE.Vector3,
  ringRadius: number,
  bandHalfWidth: number,
  penumbraWidth = VISUAL_PENUMBRA_WIDTH_VISCIV6na,
): number {
  if (!(ringRadius > 0) || !(bandHalfWidth > 0) ||
      directionToStar.lengthSq() < 1e-10 || planeNormal.lengthSq() < 1e-10) return 0;
  const star = directionToStar.clone().normalize();
  const normal = planeNormal.clone().normalize();
  if (point.dot(star) <= 0) return 0; // Night side: no direct stellar flux.
  const denominator = normal.dot(star);
  if (Math.abs(denominator) < 1e-5) return 0;
  const t = -normal.dot(point) / denominator;
  if (t <= 1e-5) return 0; // The ring lies behind the illuminated surface.
  const hit = point.clone().addScaledVector(star, t);
  const distance = Math.abs(hit.length() - ringRadius);
  const effectiveHalfWidth = Math.max(bandHalfWidth, VISUAL_MIN_HALF_WIDTH_VISCIV6na);
  const near = Math.max(0, effectiveHalfWidth - penumbraWidth);
  const far = effectiveHalfWidth + penumbraWidth;
  const edge = THREE.MathUtils.clamp((distance - near) / Math.max(1e-6, far - near), 0, 1);
  return 1 - edge * edge * (3 - 2 * edge);
}

/**
 * Compose after the existing 25.6 day/night and before its city-light addition.
 * Shadowing `outgoingLight` here leaves VISCIV.6d native urban emission intact.
 * The CPU only updates a few uniforms; ray casting occurs in the fragment shader
 * and requires no extra draw calls, shadow maps or per-frame textures.
 */
export function installOrbitalSurfaceShadowVISCIV6n(
  material: THREE.MeshStandardMaterial,
  planetSurfaceMesh: THREE.Object3D,
  rings: readonly OrbitalSurfaceShadowRingVISCIV6n[],
  planetRadiusScene: number,
): OrbitalSurfaceShadowBindingVISCIV6n {
  if (rings.length === 0 || rings.length > ORBITAL_SURFACE_SHADOW_MAX_RINGS_VISCIV6n) {
    throw new RangeError('VISCIV.6n requires between 1 and 3 orbital rings.');
  }
  if (!(planetRadiusScene > 0)) throw new RangeError('VISCIV.6n requires a positive planet radius.');

  const count = { value: rings.length };
  const planetCenterView = { value: new THREE.Vector3() };
  const ringNormals = { value: Array.from({ length: 3 }, () => new THREE.Vector3(0, 1, 0)) };
  const ringAxes = { value: Array.from({ length: 3 }, () => new THREE.Vector3(1, 0, 0)) };
  // x = radius, y = band half-width, z = penumbra, w = smooth hub expansion (scene units).
  const ringBands = { value: Array.from({ length: 3 }, () => new THREE.Vector4(0, 0, 0, 0)) };
  const upstreamCompile = material.onBeforeCompile;
  const upstreamCacheKey = material.customProgramCacheKey();

  material.onBeforeCompile = (shader, renderer) => {
    upstreamCompile.call(material, shader, renderer);
    shader.uniforms['uGenesisRingShadowCountVISCIV6n'] = count;
    shader.uniforms['uGenesisRingPlanetCenterViewVISCIV6n'] = planetCenterView;
    shader.uniforms['uGenesisRingNormalsViewVISCIV6n'] = ringNormals;
    shader.uniforms['uGenesisRingAxesViewVISCIV6n'] = ringAxes;
    shader.uniforms['uGenesisRingBandsVISCIV6n'] = ringBands;
    shader.fragmentShader = patchOrbitalSurfaceShadowShaderVISCIV6n(shader.fragmentShader);
  };
  material.customProgramCacheKey = () => `${upstreamCacheKey}|GENESIS-VISCIV-6n-RING-SHADOW`;
  material.userData['genesisOrbitalSurfaceShadowVISCIV6n'] = { version: 1, ringCount: rings.length };
  material.needsUpdate = true;

  const normal = new THREE.Vector3();
  const axis = new THREE.Vector3();
  return Object.freeze({
    update(camera: THREE.Camera, enabled: boolean): void {
      count.value = enabled ? rings.length : 0;
      if (!enabled) return;
      camera.updateMatrixWorld();
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      planetSurfaceMesh.updateWorldMatrix(true, false);
      planetSurfaceMesh.getWorldPosition(planetCenterView.value);
      planetCenterView.value.applyMatrix4(camera.matrixWorldInverse);
      for (let i = 0; i < rings.length; i++) {
        const ring = rings[i]!;
        ring.root.updateWorldMatrix(true, false);
        ring.rotor.updateWorldMatrix(true, false);
        normal.set(0, 1, 0).transformDirection(ring.root.matrixWorld)
          .transformDirection(camera.matrixWorldInverse);
        axis.set(1, 0, 0).transformDirection(ring.rotor.matrixWorld)
          .transformDirection(camera.matrixWorldInverse);
        ringNormals.value[i]!.copy(normal);
        ringAxes.value[i]!.copy(axis);
        const plan = ring.plan;
        const authoredHalfWidth = (0.5 * (plan.bandWidthPlanetRadii ?? 0.13) + 0.055);
        ringBands.value[i]!.set(
          plan.orbitRadiusPlanetRadii * planetRadiusScene,
          Math.max(authoredHalfWidth, VISUAL_MIN_HALF_WIDTH_VISCIV6na) * planetRadiusScene,
          VISUAL_PENUMBRA_WIDTH_VISCIV6na * planetRadiusScene,
          orbitalMonumentalHubHalfWidthVISCIV6o(plan.ringKind, planetRadiusScene),
        );
      }
    },
  });
}

export function patchOrbitalSurfaceShadowShaderVISCIV6n(fragment: string): string {
  if (!fragment.includes('#include <common>') || !fragment.includes(SHADOW_SHADER_MARKER) ||
      !fragment.includes('genesisWeightedDay0') || !fragment.includes('uGenesisLightDirectionsView')) {
    throw new RangeError('VISCIV.6n requires the GENESIS 25.6 day/night shader with stellar weights.');
  }
  const uniforms = `
uniform float uGenesisRingShadowCountVISCIV6n;
uniform vec3 uGenesisRingPlanetCenterViewVISCIV6n;
uniform vec3 uGenesisRingNormalsViewVISCIV6n[3];
uniform vec3 uGenesisRingAxesViewVISCIV6n[3];
uniform vec4 uGenesisRingBandsVISCIV6n[3];

float genesisRingShadowForStarVISCIV6n(vec3 surfaceRelativeView, vec3 lightDirectionView) {
  vec3 sun = normalize(lightDirectionView);
  float facing = dot(normalize(surfaceRelativeView), sun);
  if (facing <= 0.0) return 0.0;
  float transmitted = 1.0;
  for (int i = 0; i < 3; ++i) {
    if (float(i) >= uGenesisRingShadowCountVISCIV6n) break;
    // CPU uploads already-normalized view-space axes. Do not renormalize
    // them for every planet fragment and every light source.
    vec3 planeNormal = uGenesisRingNormalsViewVISCIV6n[i];
    float denominator = dot(planeNormal, sun);
    if (abs(denominator) < 0.00001) continue;
    float alongSun = -dot(surfaceRelativeView, planeNormal) / denominator;
    if (alongSun <= 0.00001) continue;
    vec3 intersectionPoint = surfaceRelativeView + alongSun * sun;
    vec4 band = uGenesisRingBandsVISCIV6n[i];
    float angleThicknessBoost = 0.030 * (1.0 - clamp(abs(denominator), 0.0, 1.0));
    float effectiveFade = max(0.001, band.z * 0.72);
    float maximumHalfWidth = band.y + angleThicknessBoost + band.w;
    // Fast radial-shell reject before sqrt or any detailed silhouette work.
    float outerRadius = band.x + maximumHalfWidth + effectiveFade;
    float innerRadius = max(0.0, band.x - maximumHalfWidth - effectiveFade);
    float radiusSq = dot(intersectionPoint, intersectionPoint);
    if (radiusSq < innerRadius * innerRadius || radiusSq > outerRadius * outerRadius) continue;
    float radialDistance = sqrt(radiusSq);
    float radialDelta = abs(radialDistance - band.x);
    // Only two broad hub expansions, anchored to the actual rotating rotor.
    // These modify the silhouette, not the opacity inside it: NO periodic stripes.
    vec3 axisU = uGenesisRingAxesViewVISCIV6n[i];
    float nodeAlignment = abs(dot(intersectionPoint, axisU) / max(radialDistance, 0.0001));
    float nodeLobe = smoothstep(0.78, 0.985, nodeAlignment);
    float effectiveHalfWidth = band.y + angleThicknessBoost + band.w * nodeLobe;
    float edge = 1.0 - smoothstep(max(0.0, effectiveHalfWidth - effectiveFade), effectiveHalfWidth + effectiveFade, radialDelta);
    // Preserve the strong, continuous VISCIV.6n.b core with no interior marks.
    float opacity = 0.80;
    transmitted *= 1.0 - edge * opacity;
    if (transmitted < 0.011) break;
  }
  // The shadow fades toward the existing day/night terminator rather than
  // stopping abruptly at the last sunlit fragment.
  return clamp((1.0 - transmitted) * smoothstep(0.0, 0.09, facing), 0.0, 1.0);
}
`;
  const shadow = `
// VISCIV.6n: evaluate each stellar ray against the orbital megastructures.
// Urban emissive light is ADDED by 25.6 *after* this multiplier.
if (uGenesisRingShadowCountVISCIV6n > 0.5) {
  vec3 surfaceRelativeViewVISCIV6n = -vViewPosition - uGenesisRingPlanetCenterViewVISCIV6n;
  // Skip ray tests for absent / unlit stars (typically 1 of 3 active).
  float shadowW0 = genesisWeightedDay0 > 0.0001
    ? genesisWeightedDay0 * genesisRingShadowForStarVISCIV6n(surfaceRelativeViewVISCIV6n, uGenesisLightDirectionsView[0]) : 0.0;
  float shadowW1 = genesisWeightedDay1 > 0.0001
    ? genesisWeightedDay1 * genesisRingShadowForStarVISCIV6n(surfaceRelativeViewVISCIV6n, uGenesisLightDirectionsView[1]) : 0.0;
  float shadowW2 = genesisWeightedDay2 > 0.0001
    ? genesisWeightedDay2 * genesisRingShadowForStarVISCIV6n(surfaceRelativeViewVISCIV6n, uGenesisLightDirectionsView[2]) : 0.0;
  float directDay = max(0.0001, genesisWeightedDay0 + genesisWeightedDay1 + genesisWeightedDay2);
  float occlusion = clamp((shadowW0 + shadowW1 + shadowW2) / directDay, 0.0, 1.0);
  outgoingLight *= (1.0 - 0.93 * occlusion);
}
`;
  return fragment
    .replace('#include <common>', `#include <common>\n${uniforms}`)
    .replace(SHADOW_SHADER_MARKER, `${SHADOW_SHADER_MARKER}${shadow}`);
}
