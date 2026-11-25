/** GENESIS 38.bis-T7r — colonias visibles durante la noche desde SystemScene.
 * Ayudas ÓPTICAS en píxeles para emisores reales de la colonia. Nunca son
 * marcadores circulares, fuentes estelares ni nuevos datos científicos. */
export interface ColonialNightVisibilityT7r {
  readonly opacity: number;
  readonly diameterPixels: number;
}
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

/** Incidencia = 0: noche. facing = 1: colonia orientada a cámara.
 * El hemisferio oculto jamás muestra el indicador. */
export function colonialNightVisibilityT7r(
  stellarExposure:number,frontFacingCos:number,bodyDiameterPixels:number,
):ColonialNightVisibilityT7r {
  if(!Number.isFinite(frontFacingCos)||!Number.isFinite(bodyDiameterPixels)||
    bodyDiameterPixels<2 || frontFacingCos<=0)return {opacity:0,diameterPixels:0};
  const night=1-clamp(Number.isFinite(stellarExposure)?stellarExposure:1,0,1);
  const face=clamp((frontFacingCos-.015)/.14,0,1);
  const faceSmooth=face*face*(3-2*face);
  // Un brillo tenue al amanecer: la colonia no recibe una segunda estrella.
  const opacity=(.025+.96*night*night)*faceSmooth;
  // A grandes distancias se percibe un punto luminoso, nunca un anillo de
  // diámetro planetario. En primer plano tampoco se agranda en exceso.
  const diameterPixels=clamp(bodyDiameterPixels*.017,2.6,7);
  return {opacity,diameterPixels};
}

/** Diámetro del billboard en coordenadas de escena, calibrado a píxeles.
 * No altera tamaño físico ni escalado de arquitectura COLVIS.2. */
export function colonialNightGlowSceneSizeT7r(
  diameterPixels:number,siteDistanceScene:number,fovDegrees:number,viewportHeightPixels:number,
):number {
  if(!(diameterPixels>0&&siteDistanceScene>0&&fovDegrees>0&&fovDegrees<170&&viewportHeightPixels>0))return 0;
  return 2*siteDistanceScene*Math.tan(fovDegrees*Math.PI/360)*diameterPixels/viewportHeightPixels;
}
