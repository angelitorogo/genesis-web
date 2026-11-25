/** GENESIS 38.bis-T7m — zoom óptico para inspección colonial.
 *
 * El zoom anterior desplazaba físicamente la cámara: con perspectiva,
 * diferentes profundidades del terreno y de los edificios aumentaban a
 * velocidades diferentes. Este contrato fija la cámara en el encuadre lejano
 * aprobado y modifica exclusivamente el factor de proyección.
 *
 * No modifica dimensiones físicas, cuerpos, colonias ni terreno.
 */
import {
  colvis3ColonyFramingT7e,
  COLVIS3_MAX_INSPECTION_ZOOM_T7E,
  type Colvis3ColonyFramingT7e,
} from './colvis3-colony-camera-t7e';

export interface Colvis3ColonyOpticalFramingT7m {
  /** Encuadre espacial fijo: INDEPENDIENTE del nivel de zoom solicitado. */
  readonly framing:Colvis3ColonyFramingT7e;
  /** Zoom de proyección Three.js: 1 en el máximo alejamiento aprobado. */
  readonly cameraZoom:number;
}

export function colvis3ColonyOpticalFramingT7m(
  footprintScene:number,bodyRadiusScene:number,zoom:number,
):Colvis3ColonyOpticalFramingT7m|null {
  if(!Number.isFinite(zoom)||zoom<=0)return null;
  const fixed=colvis3ColonyFramingT7e(
    footprintScene,bodyRadiusScene,COLVIS3_MAX_INSPECTION_ZOOM_T7E);
  if(!fixed)return null;
  const z=Math.max(.32,Math.min(COLVIS3_MAX_INSPECTION_ZOOM_T7E,zoom));
  return Object.freeze({framing:fixed,
    cameraZoom:COLVIS3_MAX_INSPECTION_ZOOM_T7E/z});
}
