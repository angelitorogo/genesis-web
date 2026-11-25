/** GENESIS 38.bis-T7f — encuadre local texturizado para inspección colonial.
 * La inspección permanece local: no se aleja más allá del terreno útil.
 */
export interface Colvis3ColonyFramingT7e {
  readonly distanceScene:number;
  readonly nearScene:number;
  readonly farScene:number;
  readonly bodyCentreBlend:number;
}
export const COLVIS3_MAX_INSPECTION_ZOOM_T7E=8;

export function colvis3ColonyFramingT7e(
  footprintScene:number,bodyRadiusScene:number,zoom:number,
):Colvis3ColonyFramingT7e|null {
  if(!Number.isFinite(footprintScene)||footprintScene<=0||
    !Number.isFinite(bodyRadiusScene)||bodyRadiusScene<=0||
    !Number.isFinite(zoom)||zoom<=0)return null;
  const z=Math.max(.32,Math.min(COLVIS3_MAX_INSPECTION_ZOOM_T7E,zoom));
  const distanceScene=Math.max(1e-8,footprintScene*3.7*z);
  const nearScene=Math.max(1e-10,distanceScene/420);
  const farScene=Math.max(distanceScene*420,Math.sqrt(bodyRadiusScene*distanceScene)*4.6);
  return Object.freeze({distanceScene,nearScene,farScene,bodyCentreBlend:0});
}
