import type { SystemSceneGiantAtmospherePresentationSnapshot } from './system-scene-giant-atmosphere-presentation';
import type { SystemScenePlanetSurfaceTextureData } from './system-scene-planet-surface-texture';
import type { SystemSceneMoonPresentationV1 } from './system-scene-moon-presentation';
import { buildSystemSceneMoonTextureV1 } from './system-scene-moon-texture';
import { refinePlanetRgbaTextureV1, type PlanetTextureRefinementKind } from './system-scene-planet-texture-refinement';
import { refineGiantAtmosphereMultiresVISCATM1 } from './system-scene-giant-atmosphere-multires-viscatm1';
import { buildCoherentSolidPlanetSurfaceVISSURF5 } from './system-scene-planet-coherent-geography-vissurf5';
import { composeSolidPlanetMaterialsVISSURF5d } from './system-scene-planet-material-composition-vissurf5d';

export type LodgrpAtlasRoleV1 = 'albedo' | 'roughness' | 'relief' | 'normal' | 'emissive' | 'cloud';
export type LodgrpAtlasV1 = Partial<Record<LodgrpAtlasRoleV1, Uint8Array>>;
export interface LodgrpSourceTextureV1 {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
}
export interface LodgrpPlanetRequestV1 {
  readonly type: 'planet';
  readonly generation: number;
  readonly bodyId: string;
  readonly seed: number;
  readonly solidSeed: number;
  readonly giantAtmosphere: SystemSceneGiantAtmospherePresentationSnapshot | null;
  readonly solidSource: Pick<SystemScenePlanetSurfaceTextureData,
    'width' | 'height' | 'rgba' | 'roughnessRgba' | 'reliefRgba' | 'surfaceClassMask'> | null;
  readonly source: Partial<Record<LodgrpAtlasRoleV1, LodgrpSourceTextureV1>>;
}
export interface LodgrpMoonRequestV1 {
  readonly type: 'moon';
  readonly generation: number;
  readonly bodyId: string;
  readonly presentation: SystemSceneMoonPresentationV1;
}
export type LodgrpAtlasRequestV1 = LodgrpPlanetRequestV1 | LodgrpMoonRequestV1;
export interface LodgrpAtlasResultV1 {
  readonly type: 'planet' | 'moon';
  readonly generation: number;
  readonly bodyId: string;
  readonly width: number;
  readonly height: number;
  readonly solid: boolean;
  readonly maps: LodgrpAtlasV1;
}

/** Pure CPU atlas build: exactly the existing 2-level scene textures. Workers
 * run this function off the animation thread, rather than deferring synchronous
 * CPU work with a Promise or setTimeout. No scientific snapshot is mutated. */
export function buildLodgrpAtlasV1(request: LodgrpAtlasRequestV1): LodgrpAtlasResultV1 {
  if (request.type === 'moon') {
    const result = buildSystemSceneMoonTextureV1(request.presentation, {width:1024,height:512});
    if (!result.normalRgba || !result.roughnessRgba) throw new Error('Incomplete lunar detail atlas.');
    return {
      type:'moon', generation:request.generation, bodyId:request.bodyId,
      width:result.width, height:result.height, solid:false,
      maps: {albedo:result.albedoRgba, normal:result.normalRgba, roughness:result.roughnessRgba},
    };
  }
  const solidSource = request.giantAtmosphere === null && request.solidSource?.surfaceClassMask
    ? request.solidSource : null;
  const detailedSolid = solidSource
    ? composeSolidPlanetMaterialsVISSURF5d(
        buildCoherentSolidPlanetSurfaceVISSURF5(solidSource, 1024, request.solidSeed),
        request.solidSeed)
    : null;
  // Three.js samples the green channel of roughness. Maintain the VISSURF.5c
  // ocean correction without importing renderer code into a worker.
  if (detailedSolid?.roughnessRgba) {
    const rgba = detailedSolid.roughnessRgba;
    const classes = detailedSolid.classMask;
    for (let i = 0; i < classes.length; i++) {
      if (classes[i] !== 1) continue;
      const o = i * 4;
      const adjusted = Math.min(205, Math.max(rgba[o+1]!, Math.round(73 + rgba[o+1]! * .77)));
      rgba[o] = rgba[o+1] = rgba[o+2] = adjusted;
    }
  }
  const width = detailedSolid ? 1024 : 512;
  const maps: LodgrpAtlasV1 = {};
  const roles: readonly LodgrpAtlasRoleV1[] = ['albedo','roughness','relief','emissive','cloud'];
  const kinds: Record<LodgrpAtlasRoleV1, PlanetTextureRefinementKind> = {
    albedo:request.giantAtmosphere ? 'GAS' : 'COLOR',
    roughness:'DATA',relief:'DATA',normal:'DATA',emissive:'EMISSION',cloud:'CLOUD',
  };
  for (const role of roles) {
    const base = request.source[role];
    if (!base) continue;
    const composed = detailedSolid && (role === 'albedo' ? detailedSolid.rgba
      : role === 'roughness' ? detailedSolid.roughnessRgba
      : role === 'relief' ? detailedSolid.reliefRgba : null);
    if (composed) {
      maps[role] = composed;
    } else if (request.giantAtmosphere && (role === 'albedo' || role === 'cloud')) {
      maps[role] = refineGiantAtmosphereMultiresVISCATM1(
        base.pixels,base.width,base.height,512,request.seed,
        request.giantAtmosphere,role === 'albedo' ? 'CLOUD_TOPS' : 'UPPER_HAZE',
      );
    } else {
      maps[role] = refinePlanetRgbaTextureV1(
        base.pixels,base.width,base.height,512,request.seed,kinds[role],
      );
    }
  }
  if (detailedSolid) maps.normal = detailedSolid.normalRgba;
  if (!maps.albedo) throw new Error('Missing source albedo.');
  return {type:'planet',generation:request.generation,bodyId:request.bodyId,
    width,height:width/2,solid:!!detailedSolid,maps};
}

export function lodgrpAtlasByteSizeV1(result: LodgrpAtlasResultV1): number {
  return Object.values(result.maps).reduce((total,rgba) => total + (rgba?.byteLength ?? 0),0);
}
