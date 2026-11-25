/** GENESIS 38.bis-T7c · Identidad visible de colonias confirmadas.
 * Solo consume planes COLVIS ya autorizados por VIDA.9/VIDA.8; no genera
 * colonias, coordenadas, habitantes ni edificios científicos nuevos.
 */
import type { Vida38InfrastructurePlan386 } from './vida38-infrastructure-plan-38-6';

export interface Colvis3ColonyDetailsT7c {
  readonly tier:'ADVANCED'|'VERY_ADVANCED';
  readonly tierLabel:string;
  readonly purpose:string;
  readonly purposeLabel:string;
  readonly destination:'PLANET'|'MOON';
  readonly destinationLabel:string;
  readonly lineageLabel:string;
  readonly technologyLabel:string;
  readonly bandLabel:string;
  readonly populationLabel:string;
  readonly originRegistered:boolean;
  readonly markerHex:number;
  readonly lampHex:number;
  readonly lampBudget:number;
}

const purposes={
  RESEARCH:'Investigación', EXTRACTION:'Extracción',
  HABITATION:'Habitación', BIOSPHERE_CONSERVATION:'Conservación de biosfera',
} as const;
const technologies={
  SEALED_SURFACE:'Hábitat superficial sellado',
  SUBSURFACE_VAULT:'Complejo subsuperficial',
  ENVIRONMENTAL_SHIELD:'Protección ambiental',
} as const;
const bands={OUTPOST:'Puesto avanzado',SETTLEMENT:'Asentamiento',CITY:'Ciudad',NETWORK:'Red colonial'} as const;
const lineages={HUMANOID:'Humanoide',REPTILIAN:'Reptiliana',INSECTOID:'Insectoide'} as const;
const grouped=(n:number)=>String(n).replace(/\B(?=(\d{3})+(?!\d))/gu,'.');

export function colvis3ColonyDetailsFromVerifiedPlanT7c(
  plan:Vida38InfrastructurePlan386,
):Colvis3ColonyDetailsT7c|null {
  const source=plan.colonyArchitectureCOLVIS1;
  if(plan.provenance!=='VIDA8_COLONIAL_SETTLEMENT'||!source||
    plan.locationStatus!=='RECONSTRUCTED_NOT_OBSERVED'||
    !Object.prototype.hasOwnProperty.call(purposes,source.function)||
    (!plan.habitatTechnology||!Object.prototype.hasOwnProperty.call(technologies,plan.habitatTechnology))||
    !Object.prototype.hasOwnProperty.call(bands,plan.scale)||
    !Object.prototype.hasOwnProperty.call(lineages,plan.lineage)||
    (source.founderTier!=='ADVANCED'&&source.founderTier!=='VERY_ADVANCED')||
    (source.destinationKind!=='PLANET'&&source.destinationKind!=='MOON'))return null;
  const range=source.populationRange;
  const valid=Array.isArray(range)&&range.length===2&&
    Number.isSafeInteger(range[0])&&Number.isSafeInteger(range[1])&&
    range[0]>=0&&range[1]>=range[0];
  const high=source.founderTier==='VERY_ADVANCED';
  // Resaltado óptico de un marcador UI (no el tamaño físico de una ciudad).
  // Luz por función, densidad por tier; nunca presupone una colonia nativa.
  const lampHex=source.function==='EXTRACTION'?0xffb46e:
    source.function==='BIOSPHERE_CONSERVATION'?0x7ff5ae:
    source.function==='HABITATION'?0xffdfa2:high?0xb9c8ff:0xc2edff;
  return Object.freeze({tier:source.founderTier,
    tierLabel:high?'Muy avanzada':'Avanzada',purpose:source.function,
    purposeLabel:purposes[source.function],destination:source.destinationKind,
    destinationLabel:source.destinationKind==='PLANET'?'Planeta':'Luna',
    lineageLabel:lineages[plan.lineage],
    technologyLabel:technologies[plan.habitatTechnology as keyof typeof technologies],
    bandLabel:bands[plan.scale as keyof typeof bands],
    populationLabel:valid?`${grouped(range[0])}–${grouped(range[1])} habitantes`:'No evaluable',
    originRegistered:!!source.founderSourceBodyStorageKey,
    markerHex:high?0xff4fd8:source.function==='EXTRACTION'?0xff8a24:source.function==='BIOSPHERE_CONSERVATION'?0x52ff8e:source.function==='HABITATION'?0xff6b3d:0xffb347,
    lampHex,lampBudget:high?16:8});
}

/** Radio del icono, no radio del asentamiento. Objetivo ~24 px de diámetro
 * de referencia; nunca permite marcadores enormes ni altera el LOD real. */
export function colvis3MarkerRadiusSceneT7c(bodyRadiusScene:number,projectedBodyDiameterPixels:number):number {
  if(!Number.isFinite(bodyRadiusScene)||bodyRadiusScene<=0)return 0;
  const d=Number.isFinite(projectedBodyDiameterPixels)&&projectedBodyDiameterPixels>0
    ? projectedBodyDiameterPixels:200;
  return bodyRadiusScene*Math.max(.025,Math.min(.090,24/Math.max(160,d)));
}

/** Selección por distancia en pantalla: un toque corto no debe rotar la escena. */
export function colvis3IsColonyClickT7c(
  pointerDistancePixels:number,screenDistancePixels:number,visibleHemisphere:boolean,
):boolean {
  return Number.isFinite(pointerDistancePixels)&&pointerDistancePixels<=7&&
    Number.isFinite(screenDistancePixels)&&screenDistancePixels<=23&&visibleHemisphere;
}
