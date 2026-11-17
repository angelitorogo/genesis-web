/** GENESIS 38.6c4 — visual-only direct-starlight visibility of verified colonies.
 * A small building's wall normal is NOT the moon's horizon normal: applying
 * standard body day/night shading to the wall allows lights behind the moon
 * to illuminate it. This extra pass clips *reflected* light against the
 * radius from the moon centre to the building, including up to three stars.
 * No PointLights, scientific flux, or artificial lamps are modified.
 */
import * as THREE from 'three';
import type { SystemScenePlanetLightBindingV1 } from '../system/system-scene-atmosphere-material';

export const VIDA38_COLONIAL_RADIAL_OCCLUSION_REVISION_386C4 = 'VIDA.38.6c4/colony-radial-starlight-occlusion/v1' as const;

/** Mirror of the shader's visibility function for deterministic tests and
 * diagnostics. This is not used to generate scientific sunlight or colonies. */
export function vida38ColonialHorizonVisibility386c4(
  bodyCenterView: THREE.Vector3,
  structureView: THREE.Vector3,
  lightDirectionsView: readonly THREE.Vector3[],
  lightWeightsView: THREE.Vector3,
): number {
  const radial = structureView.clone().sub(bodyCenterView);
  if (radial.lengthSq() <= 1e-12) return 0;
  radial.normalize();
  let day = 0;
  const weights = [lightWeightsView.x,lightWeightsView.y,lightWeightsView.z];
  for (let i=0;i<Math.min(3,lightDirectionsView.length);i++) {
    const dir=lightDirectionsView[i];
    const weight=weights[i] ?? 0;
    if (!dir || !(dir.lengthSq()>1e-10) || !(weight>0) || !Number.isFinite(weight)) continue;
    const incidence=radial.dot(dir.clone().normalize());
    const t=Math.max(0,Math.min(1,(incidence+.025)/.05));
    day+=weight*(t*t*(3-2*t));
  }
  return Math.max(0,Math.min(1,day));
}

const VERTEX_COMMON = '#include <common>';
const PROJECT_VERTEX = '#include <project_vertex>';
const FRAGMENT_COMMON = '#include <common>';
const OPAQUE_FRAGMENT = '#include <opaque_fragment>';

/** Exposed for regression checks; this patch must run AFTER the existing
 * multistellar body-lighting patch, whose uniforms remain authoritative. */
export function patchVida38ColonialRadialOcclusion386c4(
  vertexShader: string, fragmentShader: string,
): Readonly<{vertexShader:string;fragmentShader:string}> {
  if (!vertexShader.includes(VERTEX_COMMON) || !vertexShader.includes(PROJECT_VERTEX) ||
      !fragmentShader.includes(FRAGMENT_COMMON) || !fragmentShader.includes(OPAQUE_FRAGMENT) ||
      !fragmentShader.includes('uGenesisLightDirectionsView') ||
      !fragmentShader.includes('uGenesisLightWeights')) {
    throw new Error('38.6c4: the standard multistellar day/night shader must be installed first.');
  }
  const vertex = vertexShader
    .replace(VERTEX_COMMON, `${VERTEX_COMMON}\nuniform vec3 uVida38ColonialBodyCenterView;\nvarying vec3 vVida38ColonialRadialView;`)
    .replace(PROJECT_VERTEX, `${PROJECT_VERTEX}
// The instanced vertex mvPosition is in view space; modelMatrix alone is
// centered on the site, not on the moon. This uniform is the MOON centre.
vVida38ColonialRadialView = mvPosition.xyz - uVida38ColonialBodyCenterView;`);
  const fragment = fragmentShader
    .replace(FRAGMENT_COMMON, `${FRAGMENT_COMMON}\nvarying vec3 vVida38ColonialRadialView;`)
    .replace(OPAQUE_FRAGMENT, `// 38.6c4: source visibility is determined by the planetary/lunar horizon,
// not by independent outward normals of walls, antennas and domes.
// Therefore a star behind the moon contributes ZERO reflected light even
// when its renderer DirectionalLight happens to hit a wall face.
float vida38RadialDay = 0.0;
vec3 vida38RadialNormal = normalize(vVida38ColonialRadialView);
for (int vida38Star = 0; vida38Star < 3; vida38Star++) {
  float vida38Flux = max(uGenesisLightWeights[vida38Star], 0.0);
  vec3 vida38Dir = uGenesisLightDirectionsView[vida38Star];
  if (vida38Flux > 0.0 && dot(vida38Dir, vida38Dir) > 1.0e-10) {
    float vida38Incidence = dot(vida38RadialNormal, normalize(vida38Dir));
    vida38RadialDay += vida38Flux * smoothstep(-0.025, 0.025, vida38Incidence);
  }
}
// The body shader already handles realistic source contributions, atmosphere
// and normal-based surface shading. This is ONLY an extra occultation gate.
outgoingLight *= clamp(vida38RadialDay, 0.0, 1.0);
${OPAQUE_FRAGMENT}`);
  return {vertexShader:vertex, fragmentShader:fragment};
}

/** Shader-only mask on the existing colonial MeshStandardMaterials.
 * Materials are shared among sites: per-fragment radial direction is essential
 * to avoid switching the material for every colony on different hemispheres.
 * The bodyCentreView Vector3 is mutable and updated once per frame by its
 * renderer; it does not store scientific data or require per-instance uniforms. */
export function installVida38ColonialRadialOcclusion386c4(
  material: THREE.MeshStandardMaterial,
  binding: SystemScenePlanetLightBindingV1,
  bodyCenterView: THREE.Vector3,
): void {
  if (material.userData['vida38ColonialRadialOcclusion386c4'] === true) return;
  if (material.userData['genesisDayNightPipeline'] === undefined) {
    throw new Error('38.6c4 requires the pre-existing multistellar day/night material binding.');
  }
  const previousCompile = material.onBeforeCompile;
  const previousKey = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previousCompile.call(material, shader, renderer);
    shader.uniforms['uVida38ColonialBodyCenterView'] = {value:bodyCenterView};
    // Use the SAME mutable light vectors/weights as the moon's surface. No
    // home-star-only shortcut: B or C can illuminate an otherwise dark region.
    shader.uniforms['uGenesisLightDirectionsView'] = {value:binding.lightDirectionsView};
    shader.uniforms['uGenesisLightWeights'] = {value:binding.lightWeightsView};
    const patched = patchVida38ColonialRadialOcclusion386c4(shader.vertexShader,shader.fragmentShader);
    shader.vertexShader=patched.vertexShader;
    shader.fragmentShader=patched.fragmentShader;
  };
  material.customProgramCacheKey = () => `${previousKey}|VIDA38-COLONIAL-RADIAL-OCCLUSION-386C4`;
  material.userData['vida38ColonialRadialOcclusion386c4'] = true;
  material.needsUpdate = true;
}
