/** GENESIS 38.bis-T7n — marcas opcionales de cuerpos con colonias confirmadas.
 * Lee exclusivamente los planes de infraestructura ya visibles en el snapshot;
 * nunca consulta IndexedDB privado ni altera VIDA.8/VIDA.9.
 */
import type { Vida38InfrastructurePlan386 } from '../infrastructure/vida38-infrastructure-plan-38-6';

export function systemSceneHasConfirmedColonyT7n(
  plans:readonly Vida38InfrastructurePlan386[]|null|undefined,
):boolean {
  return (plans??[]).some(plan=>
    plan.provenance==='VIDA8_COLONIAL_SETTLEMENT' &&
    plan.locationStatus==='RECONSTRUCTED_NOT_OBSERVED');
}

/** Indicador óptico del CUERPO completo, no de cada asentamiento. */
export function systemSceneColonyBodyRingDiameterT7n(radiusScene:number):number {
  if(!Number.isFinite(radiusScene)||radiusScene<=0)return 0;
  return Math.max(radiusScene*3.2,0.14);
}
