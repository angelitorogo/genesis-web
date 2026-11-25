/** COLVIS.2 - world-scale-independent framing for inspecting a physical colony.
 * Changes only the camera. It never scales or relocates buildings or planets.
 */
export interface Colvis2ColonyCameraFraming {
  readonly distanceScene:number;
  readonly nearScene:number;
  readonly farScene:number;
}
export function colvis2ColonyCameraFraming(
  footprintScene:number,bodyRadiusScene:number,zoom=1,
):Colvis2ColonyCameraFraming|null {
  if(!Number.isFinite(footprintScene)||footprintScene<=0||
     !Number.isFinite(bodyRadiusScene)||bodyRadiusScene<=0||
     !Number.isFinite(zoom)||zoom<=0)return null;
  const distanceScene=Math.max(1e-8,footprintScene*3.7*Math.max(.32,Math.min(8,zoom)));
  const nearScene=Math.max(1e-10,distanceScene/420);
  const farScene=Math.max(distanceScene*380,Math.sqrt(bodyRadiusScene*distanceScene)*3.5);
  return Object.freeze({distanceScene,nearScene,farScene});
}
