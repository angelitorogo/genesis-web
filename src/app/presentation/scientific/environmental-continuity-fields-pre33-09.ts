import type { EnvironmentalContinuityReportPRE3309 } from '../../domain/planetary/environmental-continuity-pre33-09';
import type { MoonEnvironmentalHistory32F5 } from '../../domain/planetary/moon-environmental-history-32-f-5';

export interface EnvironmentalContinuityFieldPRE3309 {
 readonly label: string;
 readonly value: string;
 readonly note: string | null;
}
const field=(label:string,value:string,note:string):EnvironmentalContinuityFieldPRE3309=>
 Object.freeze({label,value,note});
const years=(x:number)=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(x);

/** Uses ONLY a validated, knowledge-authorized PRE-33.09 report. Null does not
 * mean environmental incompatibility and is never transformed to zero years. */
export function environmentalContinuityFieldsPRE3309(
 report:EnvironmentalContinuityReportPRE3309|null,
):readonly EnvironmentalContinuityFieldPRE3309[] {
 if(!report || report.perspective!=='OBSERVED_KNOWLEDGE' || report.access!=='SCIENTIFIC_FICHE_AVAILABLE') return Object.freeze([
  field('PRE-33.09 — Continuidad ambiental histórica','No certificada',
    'Sin trayectoria física fechada y autorizada 31.7/32.12. CT-0 no acredita duración ni ausencia de vida.'),
 ]);
 const surface=report.routes.find(r=>r.route==='SURFACE_AQUEOUS');
 const subsurface=report.routes.find(r=>r.route==='SUBSURFACE_AQUEOUS');
 const summary=(r:typeof surface)=>r?`${years(r.compatibleYearSlots)} años compatibles documentados · ${years(r.longestContinuousYearSlots)} años de tramo máximo`:'No evaluable';
 return Object.freeze([
  field('PRE-33.09 — Continuidad superficial',summary(surface),
   'Años inclusivos compatibles bajo evidencia fechada y observada; no implica organismos, abiogénesis ni estabilidad futura.'),
  field('PRE-33.09 — Continuidad subsuperficial',summary(subsurface),
   'Los huecos y sucesos sin consecuencia cuantificada rompen la certificación de continuidad, sin acreditar esterilidad.'),
  field('PRE-33.09 — Cobertura histórica total','No establecida',
   'La consulta cubre únicamente el intervalo solicitado; el catálogo de eventos tampoco se presupone completo.'),
 ]);
}

/** Existing 32.F.5 only contains partial dated lunar physics. It is useful as
 * provenance, but cannot be converted into a favorable 31.7 route verdict. */
export function lunarContinuityFieldsPRE3309(
 history:MoonEnvironmentalHistory32F5|null,
):readonly EnvironmentalContinuityFieldPRE3309[] {
 if(!history) return environmentalContinuityFieldsPRE3309(null);
 const dated=history.intervals.filter(x=>x.environmentalProvenanceKey!==null);
 const irradiance=history.intervals.filter(x=>x.irradianceWattsPerSquareMeter!==null);
 return Object.freeze([
  field('PRE-33.09 — Cobertura de fuentes fechadas',
   `${dated.length} intervalo(s) ambientales · ${irradiance.length} de irradiancia`,
   '32.F.5 describe coberturas parciales; una irradiancia bolométrica no es clima, dosis ni habitabilidad continua.'),
  field('PRE-33.09 — Ventanas compatibles continuas','No certificadas',
   `Intervalos interrumpidos: ${history.datedModelInterruptions.length}; eventos registrados: ${history.events.length}. `+
   'Faltan historias sincronizadas de solvente, presión, geoquímica, radiación y dinámica; CT-0 no se propaga al pasado.'),
  field('PRE-33.09 — Persistencia de vida','No evaluada',
   'Los sucesos sin efectos medidos no autorizan extinciones ni supervivencia automática.'),
 ]);
}
