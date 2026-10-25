import type { GeochemistryPRE3307 } from '../../domain/planetary/geochemistry-pre33-07';

export interface GeoChemicalDisplayFieldPRE3307 {
  readonly label:string;
  readonly value:string;
  readonly note:string|null;
}
const fmt=(n:number)=>new Intl.NumberFormat('es-ES',{maximumSignificantDigits:4,notation:'scientific'}).format(n);
/** Scientific fiche only; the internal chemical assessment is never an observed discovery. */
export function geoChemicalFieldsPRE3307(g:GeochemistryPRE3307|null):readonly GeoChemicalDisplayFieldPRE3307[]{
  if(!g)return [];
  const solvent=g.niche.solventState==='MODELLED_LIQUID_CT0'
    ? `${g.niche.solvent} líquido modelado CT-0` : g.niche.solventState==='NOT_MODELLED'
    ? 'Sin fase líquida de H₂O en el modelo CT-0' : 'Solvente/fase no resueltos';
  const power=g.quantifiedPathwayPowerWatts===null?'No evaluable: faltan tasas y/o actividades'
    :`${fmt(g.quantifiedPathwayPowerWatts)} W (única ruta cuantificada)`;
  const resolved=g.reactions.filter(r=>r.status==='POWER_MODELLED_CT0').length;
  const hypothetical=g.reactions.filter(r=>r.status==='HYPOTHETICAL_PATHWAY').length;
  const sensitivity=g.formationSensitivityPRE3307;
  const bound=sensitivity?.conditionalUpperPowerWatts;
  const description=sensitivity?`${sensitivity.status} · ${sensitivity.physicalContact}`:'Sin inventario mineral de formación';
  return Object.freeze([
    {label:'PRE-33.07 — Solvente y nicho físico',value:solvent,
      note:`${g.niche.niche}. Sin suponer agua como único solvente universal; otras fases requieren composición propia.`},
    {label:'PRE-33.07 — Reactivos y contacto',value:
      `${g.inventorySourceIds.length} fuentes de inventario; contacto agua-roca: ${g.niche.waterRockContact}`,
      note:'Una masa de H₂O o silicatos no identifica actividades, mineralogía reactiva ni una velocidad de reacción.'},
    {label:'PRE-33.07 — Rutas y desequilibrio',value:
      `${resolved} resueltas; ${hypothetical} hipotéticas; ${g.reactions.length} catalogadas`,
      note:g.reactions.map(r=>`${r.route}: ${r.status}; ${r.reason}`).join(' | ')},
    {label:'PRE-33.07 — Potencia química exergónica (ruta)',value:power,
      note:'P = max(0, −ΔG) × mol/s, solo para una ruta con especies, actividades, termodinámica y tasa. No es energía térmica, Carnot, ATP ni vida certificada.'},
    {label:'PRE-33.07 — Inventario mineral y transporte V3',value:description,
      note:sensitivity?`Agua: ${sensitivity.liquidWaterKilograms===null?'no resuelta':fmt(sensitivity.liquidWaterKilograms)+' kg'}; silicatos: ${sensitivity.silicateRockKilograms===null?'no resueltos':fmt(sensitivity.silicateRockKilograms)+' kg'}. Se conserva la separación física océano-roca.`:
        'No existen fuentes suficientes para evaluar la sensibilidad mineral.'},
    {label:'PRE-33.07 — Límite geoquímico condicional',value:bound===null||bound===undefined
      ?'No evaluable con el dominio y fuentes disponibles':
      `0 a ${fmt(bound)} W · escenario de sensibilidad, NO potencia física resuelta`,
      note:'Ejemplo FeO/H₂O, inventario mineral, contacto, actividad de H₂ y velocidad de reacción sujetos a hipótesis declaradas. No demuestra suministro bioenergético ni permite activar vida.'},
    {label:'PRE-33.07 — Potencia efectivamente bioutilizada',value:'No determinada',
      note:'La accesibilidad, transporte, acoplamiento bioenergético y eficiencia de captura pertenecen a hipótesis biológicas posteriores. Ninguna potencia metabólica inventada.'},
    {label:'PRE-33.07 — Estado científico',value:g.hasPositiveResolvedPower
      ? 'Potencia positiva de ruta CT-0 (no implica metabolismo)'
      : 'No hay potencia química positiva demostrada con las fuentes disponibles',
      note:'Ni cero físico universal ni ausencia de vida. Resultado interno V3; ninguna observación o descubrimiento automático.'},
  ]);
}
