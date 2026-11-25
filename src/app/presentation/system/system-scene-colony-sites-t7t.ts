/** GENESIS 38.bis-T7t — selector óptico de ubicaciones coloniales.
 * No observa nuevas colonias y no modifica sus coordenadas científicas.
 * El marcador únicamente se muestra cuando COLONIAS está habilitado,
 * la capa del anfitrión está visible y el emplazamiento queda por encima
 * del horizonte geométrico desde la cámara actual.
 */
export interface SystemSceneColonySiteMarkerPresentationT7t {
  readonly visible:boolean;
  readonly diameterPixels:number;
}

export function systemSceneColonySiteMarkerPresentationT7t(
  coloniesEnabled:boolean,
  bodyLayerEnabled:boolean,
  bodyDiameterPixels:number,
  facingCosine:number,
):SystemSceneColonySiteMarkerPresentationT7t {
  if(!coloniesEnabled || !bodyLayerEnabled ||
     !Number.isFinite(bodyDiameterPixels) || bodyDiameterPixels<90 ||
     !Number.isFinite(facingCosine) || facingCosine<=0.015) {
    return Object.freeze({visible:false,diameterPixels:0});
  }
  // Tamaño óptico de un anillo LOCAL: la selección del cuerpo completo
  // conserva su círculo verde independiente. Evita falsos asentamientos
  // gigantes cuando el cuerpo se observa muy lejos.
  return Object.freeze({
    visible:true,
    diameterPixels:Math.max(12,Math.min(25,bodyDiameterPixels*.07)),
  });
}

export function systemSceneColonySiteMarkerWorldDiameterT7t(
  pixels:number,distance:number,fovDegrees:number,viewportHeight:number,
  hostRadiusScene:number,
):number {
  if(!Number.isFinite(pixels)||pixels<=0 || !Number.isFinite(distance)||distance<=0 ||
    !Number.isFinite(fovDegrees)||fovDegrees<=0 || fovDegrees>=180 ||
    !Number.isFinite(viewportHeight)||viewportHeight<=0 ||
    !Number.isFinite(hostRadiusScene)||hostRadiusScene<=0)return 0;
  const worldPerPixel=2*distance*Math.tan(fovDegrees*Math.PI/360)/viewportHeight;
  return Math.min(pixels*worldPerPixel,hostRadiusScene*.28);
}
