/** GENESIS 38.bis-T7n · órbita de la cámara alrededor del asentamiento.
 * Se aplica exclusivamente al visor de inspección: no rota la luna ni el
 * sistema estelar, no altera iluminación, texturas o coordenadas científicas.
 */
import * as THREE from 'three';

export function colvis3ColonyOrbitOffsetT7n(
  outwardNormal:THREE.Vector3,
  referenceTangent:THREE.Vector3,
  azimuthRadians:number,
  elevationRadians:number,
  distanceScene:number,
):THREE.Vector3 {
  const normal=outwardNormal.clone().normalize();
  const tangent=referenceTangent.clone().addScaledVector(normal,
    -referenceTangent.dot(normal)).normalize();
  const sideways=new THREE.Vector3().crossVectors(normal,tangent).normalize();
  const elevation=THREE.MathUtils.clamp(elevationRadians,.20,1.48);
  const horizontal=tangent.multiplyScalar(Math.cos(azimuthRadians))
    .addScaledVector(sideways,Math.sin(azimuthRadians)).normalize();
  return horizontal.multiplyScalar(distanceScene*Math.cos(elevation))
    .addScaledVector(normal,distanceScene*Math.sin(elevation));
}
