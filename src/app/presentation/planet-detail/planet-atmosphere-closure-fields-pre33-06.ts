import type { AtmosphereClosurePRE3306 } from '../../domain/planetary/atmosphere-causal-closure-pre33-06';

export interface AtmosphereClosureFieldPRE3306 {readonly label:string;readonly value:string;readonly note:string;}
const fmt=(v:number|null):string=>v===null?'No resuelto':new Intl.NumberFormat('es-ES',{
  notation:'scientific',maximumSignificantDigits:4}).format(v);

/** No separate sections; both the planetary and lunar cards share these five fields. */
export function atmosphereClosureFieldsPRE3306(c:AtmosphereClosurePRE3306|null):readonly AtmosphereClosureFieldPRE3306[]{
  if(c===null)return [];
  const status:Record<AtmosphereClosurePRE3306['status'],string>={
    NO_SOLID_SURFACE_REFERENCE:'Envoltura profunda: no existe una presión sobre corteza expuesta',
    MISSING_PRIMORDIAL_GAS_INVENTORY_AND_FLUXES:'No resuelto: faltan inventario gaseoso inicial y tasas causales',
    MISSING_EXOBASE_AND_STELLAR_FORCING:'No resuelto: faltan exobase y forzamiento externo',
    UNIDENTIFIED_PHOTOCHEMICAL_PRODUCTS:'No resuelto: fotoproductos sin especiación',
    EXOBASE_OUTSIDE_KINETIC_DOMAIN:'Fuera del dominio de transición cinética de exobase',
    CONDITIONAL_FORWARD_SCENARIO:'Escenario de evolución, no inventario independiente',
    CAUSAL_INTERVAL_MODEL_RESOLVED:'Intervalo causal calculado; no es una observación ni estabilidad histórica',
  };
  const f=(label:string,value:string,note:string)=>({label,value,note});
  return Object.freeze([
    f('PRE-33.06 — procedencia del inventario',
      `Origen inicial: ${c.inventorySourceId??'No disponible'} · volátiles condicionales (cota): ${fmt(c.conditionalVolatileReservoirCeilingKilograms)} kg · H₂O CT-0 (separada): ${fmt(c.referenceH2OCT0Kilograms)} kg`,
      'El reservorio congelado/rocoso o la masa H₂O CT-0 no equivalen a masa de gas inicial. Los índices heredados tampoco.'),
    f('PRE-33.06 — fuente y pérdidas',
      `Fuentes ${fmt(c.suppliedKilograms)} kg · escape térmico ${fmt(c.thermalEscapedKilograms)} kg · partículas ${fmt(c.particleEscapedKilograms)} kg · fotólisis escapada ${fmt(c.photolysisEscapedKilograms)} kg`,
      `Tasas: ${c.ratesSourceId??'No disponibles'} · condensados ${fmt(c.condensedKilograms)} kg · productos por caracterizar ${fmt(c.unidentifiedPhotochemicalKilograms)} kg. Los sumideros sin tasa no se hacen cero.`),
    f('PRE-33.06 — exobase y forzamiento',
      `${c.exobaseSourceId??'EUV, partículas y exobase no determinados'} · Kn ${fmt(c.exobaseKnudsenNumber)}`,
      'Exige fuente externa de alta energía, temperatura, densidad, altitud y sección colisional; insolación bolométrica no es EUV.'),
    f('PRE-33.06 — presión escenario / causal',
      `Escenario heredado ${fmt(c.scenarioPressurePascal)} Pa (equivalente ${fmt(c.scenarioEquivalentGasMassKilograms)} kg) · presión V3 por formación ${fmt(c.causalModelPressurePascal)} Pa · candidato condicional ${fmt(c.candidateForwardPressurePascal)} Pa`,
      `Σ parciales causales ${fmt(c.causalModelPressurePascal===null?null:c.causalModelPartialsPascal.reduce((a,b)=>a+b.pressurePascal,0))} Pa; cierre de masa ${fmt(c.relativeMassResidual01)}. Una conversión P·área/g no identifica el gas original.`),
    ...(c.historyEpochs?.length ? [
      f('PRE-33.06 — cronología atmosférica desde formación',
        `${c.historyEpochs.length} intervalos · reservorio inicial ${fmt(c.formationReservoirKilograms??null)} kg · gas CT-0 ${fmt(c.remainingGasKilograms)} kg`,
        'Historia determinista fechada, EUV y viento estelar por ley de edad modelada. Reservorio remanente, condensados, escape y gas son destinos distintos.'),
      f('PRE-33.06 — especies gaseosas CT-0',
        (c.candidateForwardPartialsPascal??[]).filter(x=>x.pressurePascal>0).sort((a,b)=>b.pressurePascal-a.pressurePascal)
          .slice(0,5).map(x=>`${x.gas}: ${fmt(x.pressurePascal)} Pa`).join(' · ')||'Sin columna gaseosa cuantificable',
        'Parciales del modelo V3, no espectros ni biofirmas. CO/O₂ fotoquímicos pueden producirse abióticamente.'),
    ] : []),
    f('PRE-33.06 — veredicto transversal',status[c.status],
      'V3 solo. Ninguna presión se promueve a Ground Truth observado ni autoriza biología. No se confunde ausencia de entradas con vacío.'),
  ]);
}

/** Lunar 32.F.1 already shows five detailed PRE-33.06 fields; add only the
 * genuinely new formation-reservoir ceiling and cross-body audit verdict. */
export function lunarTransversalAtmosphereFieldsPRE3306(
  c:AtmosphereClosurePRE3306|null,
):readonly AtmosphereClosureFieldPRE3306[]{
  if(c===null)return [];
  return Object.freeze([
    {label:'PRE-33.06 — reservorio lunar no gaseoso',
      value:`Cota condicional de volátiles de formación ${fmt(c.conditionalVolatileReservoirCeilingKilograms)} kg · gas inicial independiente ${fmt(c.initialGasKilograms)} kg`,
      note:'32.F.1d no identifica N₂, CO₂, H₂O gaseosa ni fracción desgasificada. No utilizar masa de hielo como atmósfera.'},
    {label:'PRE-33.06 — cierre transversal CT-0',
      value:`${c.status} · presión física V3 ${fmt(c.causalModelPressurePascal)} Pa · escenario químico V3 ${fmt(c.candidateForwardPressurePascal)} Pa · residuo de masa ${fmt(c.relativeMassResidual01)}`, 
      note:'El mismo contrato causal se aplica a planetas y lunas. Escenario V3 desde formación distinto de índices/escenarios 21.x; no se declara resuelta la especiación lunar 32.F.1d.'},
    ...(c.historyEpochs?.length?[{label:'PRE-33.06 — historia y gases CT-0',
      value:`${c.historyEpochs.length} intervalos desde formación · inventario gaseoso final ${fmt(c.remainingGasKilograms)} kg · CO₂/N₂: ${c.assumedChemistry==='UNIDENTIFIED_LUNAR_VOLATILE_ENDMEMBER'?'especies condicionales':'origen V3'}`,
      note:'Presión condicional procedimental distinta de presión superficial física independiente. Pérdidas, reposición y condensación se conservan en el tiempo.'}]:[]),
  ]);
}
