import type { RadiationWorldPRE3308, RadiationDosePRE3308 } from '../../domain/planetary/radiation-transport-pre33-08';
export interface RadiationScientificFieldPRE3308 {
  readonly label: string; readonly value: string; readonly note: string | null;
}
const f=(label:string,value:string,note:string):RadiationScientificFieldPRE3308=>
  Object.freeze({label,value,note});
const fmt=(value:number)=>new Intl.NumberFormat('es-ES',{maximumSignificantDigits:4,notation:'scientific'}).format(value);
function doseField(label:string,d:RadiationDosePRE3308):RadiationScientificFieldPRE3308{
 const n=d.doseGrayPerYear!==null?`${fmt(d.doseGrayPerYear)} Gy/año (CT-0)`:
   d.eventDoseGray!==null?`${fmt(d.eventDoseGray)} Gy/episodio`:
   d.status==='NO_SURFACE_REFERENCE'?'No aplica: sin superficie sólida':'No resuelta';
 return f(label,n,`${d.reason} No acredita seguridad biológica ni historial de exposición.`);
}
/** Uses read-only V3 projection, never legacy V1 index as radiation dose. */
export function radiationFieldsPRE3308(world:RadiationWorldPRE3308|null):readonly RadiationScientificFieldPRE3308[]{
 if(world===null) return Object.freeze([]);
 return Object.freeze([
  f('PRE-33.08 — Fuente ionizante fotónica / partículas',
    `${world.photonSource==='QUANTIFIED'?'Espectro cuantificado':world.photonSource==='INDEPENDENT_ABSENCE'?'Ausencia acreditada':'Desconocida'} / ${world.particleSource==='QUANTIFIED'?'Espectro cuantificado':world.particleSource==='INDEPENDENT_ABSENCE'?'Ausencia acreditada':'Desconocida'}`,
    'Espectros y flujos separados: la insolación bolométrica y el índice 20.10 nunca se convierten a XUV, rayos gamma o partículas.'),
  f('PRE-33.08 — Columna gaseosa física',world.atmosphereColumn===null?'No resuelta / no aplica':
    `${fmt(world.atmosphereColumn.kilogramsPerSquareMeter)} kg/m²`,
    'Solo desde la presión causal 33.06 y gravedad: no utiliza presión-escenario 20.x/21.x.'),
  f('PRE-33.08 — Cubierta H₂O CT-0',world.oceanIceColumn===null?'No resuelta / no aplica':
    `${fmt(world.oceanIceColumn.kilogramsPerSquareMeter)} kg/m²`,
    'Columna de hielo constitutiva de 32.F.3; no representa por sí sola blindaje contra partículas.'),
  f('PRE-33.08 — Transmisión γ 1 MeV de referencia',
    world.gammaOneMeVReferenceDirectTransmission01===null?'No evaluable':
    fmt(world.gammaOneMeVReferenceDirectTransmission01),
    'Haz directo monoenergético (NIST, aproximación de hielo por agua), NO dosis absorbida, dispersión secundaria ni protección global.'),
  doseField('PRE-33.08 — Dosis ionizante superficial',world.surface),
  doseField('PRE-33.08 — Dosis ionizante subsuperficial',world.subsurface),
  doseField('PRE-33.08 — Dosis en envoltura',world.envelope),
  f('PRE-33.08 — Blindaje magnetosférico de partículas',
    world.magneticParticleTransmission01===null?'No resuelto':fmt(world.magneticParticleTransmission01),
    'El índice magnetosférico V1 no caracteriza el espectro ni la propagación de partículas.'),
 ]);
}
