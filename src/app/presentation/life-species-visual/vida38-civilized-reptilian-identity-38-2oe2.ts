/** Auditoría CT-0 de identidad fenotípica para reptilianos civilizados.
 * No infiere apariencia a partir de una ID: audita parámetros visuales efectivos
 * y un marcador de vestuario que realmente se representa en WebGL.
 * No usa Math.random(), estado global, ni requiere acceso a IndexedDB. */
import {
  selectVida38ReptilianVariation38OE1,
  type Vida38ReptilianVariation38OE1,
} from './vida38-civilized-reptilian-variation-38-2oe1';

export interface Vida38ReptilianIdentityInput38OE2 {
  readonly speciesId: string;
  readonly appearanceFingerprint: string;
  readonly primaryColorHex?: string;
  readonly secondaryColorHex?: string;
  readonly bodyLengthMeters?: number;
}
export interface Vida38ReptilianVisualPlan38OE2 {
  readonly profile: Vida38ReptilianVariation38OE1['profile'];
  readonly garmentLine: Vida38ReptilianVariation38OE1['garmentLine'];
  readonly culture: Vida38ReptilianVariation38OE1['culture'];
  readonly primaryColorHex: string;
  readonly secondaryColorHex: string;
  readonly bodyLengthMeters: number;
  readonly barCount: number;
  readonly barSide: number;
  readonly barHeight: number;
  readonly barSpacing: number;
  readonly barOffset: number;
  readonly barSlope: number;
  readonly barWidth: number;
  readonly barLength: number;
  readonly dorsalPhase: number;
  /** Firma del plan que se dibuja; no contiene speciesId ni appearanceFingerprint. */
  readonly exactVisualSignature: string;
  /** Firma más gruesa para agrupar individuos potencialmente parecidos. */
  readonly coarseVisualSignature: string;
}
export interface Vida38ReptilianVisualPair38OE2 {
  readonly firstSpeciesId: string;
  readonly secondSpeciesId: string;
  readonly distance: number;
  readonly exact: boolean;
}
export interface Vida38ReptilianIdentityAudit38OE2 {
  readonly revision: '38.2o.e2';
  readonly population: number;
  readonly uniqueSourceIds: number;
  readonly exactDuplicatePairs: number;
  readonly nearDuplicatePairs: number;
  readonly distinctVisualPlans: number;
  readonly distribution: Readonly<{profiles: number;garmentLines: number;cultures: number}>;
  readonly samplePairs: readonly Vida38ReptilianVisualPair38OE2[];
  readonly nearDistanceThreshold: number;
  readonly exactAuditPassed: boolean;
  /** Indica que no se han comprobado píxeles ni visión perceptual humana. */
  readonly method: 'PARAMETRIC_VISUAL_PLAN_NOT_RENDERED_PIXELS';
}
function hash32(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619) >>> 0;
  return h >>> 0;
}
function avalanche32(value: number): number {
  let h = value >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16; return h >>> 0;
}
function unit(seed: number, shift: number, bits = 12): number {
  const mask = (1 << bits) - 1;
  return ((seed >>> shift) & mask) / mask;
}
function fixed(value: number): number { return Number(value.toFixed(5)); }
function normalizeHex(value?: string): string {
  if (!value) return '#808080';
  const hex = value.trim().toLowerCase();
  return /^#[a-f0-9]{6}$/.test(hex) ? hex : '#808080';
}
function colorDistance(a: string,b: string): number {
  let accum = 0;
  for(let i=1;i<=5;i+=2) {
    const x=parseInt(a.slice(i,i+2),16);
    const y=parseInt(b.slice(i,i+2),16);
    accum += Math.pow((x-y)/255,2);
  }
  return Math.sqrt(accum/3);
}

export function deriveVida38ReptilianVisualPlan38OE2(input: Vida38ReptilianIdentityInput38OE2): Vida38ReptilianVisualPlan38OE2 {
  const variation = selectVida38ReptilianVariation38OE1(input.speciesId, input.appearanceFingerprint);
  const identity = `${input.speciesId.length}:${input.speciesId}|${input.appearanceFingerprint.length}:${input.appearanceFingerprint}`;
  // Dos dominios independientes. Los parámetros son discretos (no se usa la identidad
  // en la firma como atajo: solamente genes visualmente aplicados).
  const seedA = avalanche32(hash32(`38.2oe2:MARK_A|${identity}`));
  const seedB = avalanche32(hash32(`38.2oe2:MARK_B|${identity}`));
  const barCount = 1 + (seedA % 3);
  const barSide = seedB % 2 === 0 ? -1 : 1;
  const barHeight = fixed(0.47 + unit(seedA, 4, 12) * 0.24);
  const barSpacing = fixed(0.045 + unit(seedA, 16, 12) * 0.043);
  const barOffset = fixed(0.14 + unit(seedB, 3, 12) * 0.12);
  const barSlope = fixed(-0.32 + unit(seedB, 17, 12) * 0.64);
  const barWidth = fixed(0.012 + unit(seedA, 12, 10) * 0.012);
  const barLength = fixed(0.105 + unit(seedB, 13, 10) * 0.07);
  const dorsalPhase = fixed(unit(seedB, 7, 12));
  const primaryColorHex = normalizeHex(input.primaryColorHex);
  const secondaryColorHex = normalizeHex(input.secondaryColorHex);
  const bodyLengthMeters = fixed(Number.isFinite(input.bodyLengthMeters) && (input.bodyLengthMeters ?? 0) > 0 ? input.bodyLengthMeters! : 2.0);
  const exactVisualSignature = JSON.stringify([
    variation.profile,variation.garmentLine,variation.culture,
    primaryColorHex,secondaryColorHex,bodyLengthMeters,
    barCount,barSide,barHeight,barSpacing,barOffset,barSlope,barWidth,barLength,dorsalPhase,
  ]);
  const coarseVisualSignature = JSON.stringify([
    variation.profile,variation.garmentLine,variation.culture,
    barCount,barSide,Math.floor(barHeight*12),Math.floor(barOffset*12),
  ]);
  return {
    profile:variation.profile,garmentLine:variation.garmentLine,culture:variation.culture,
    primaryColorHex,secondaryColorHex,bodyLengthMeters,
    barCount,barSide,barHeight,barSpacing,barOffset,barSlope,barWidth,barLength,dorsalPhase,
    exactVisualSignature,coarseVisualSignature,
  };
}

/** 0 = indistinguible en el espacio de rasgos; no es una distancia entre imágenes.
 * Penaliza las diferencias de anatomía, vestimenta, cultura y pigmentación.
 * El marcador de identidad se evalúa en detalle incluso si coincide el arquetipo. */
export function distanceVida38ReptilianVisualPlans38OE2(a:Vida38ReptilianVisualPlan38OE2,b:Vida38ReptilianVisualPlan38OE2):number {
  const categoryPenalty = (a.profile===b.profile?0:0.32)
    +(a.garmentLine===b.garmentLine?0:0.20)
    +(a.culture===b.culture?0:0.11);
  const distance = categoryPenalty
    +colorDistance(a.primaryColorHex,b.primaryColorHex)*0.15
    +colorDistance(a.secondaryColorHex,b.secondaryColorHex)*0.07
    +Math.min(1,Math.abs(a.bodyLengthMeters-b.bodyLengthMeters)/1.4)*0.10
    +Math.abs(a.barCount-b.barCount)*0.065
    +(a.barSide===b.barSide?0:0.05)
    +Math.abs(a.barHeight-b.barHeight)/0.24*0.085
    +Math.abs(a.barOffset-b.barOffset)/0.12*0.075
    +Math.abs(a.barSpacing-b.barSpacing)/0.043*0.035
    +Math.abs(a.barSlope-b.barSlope)/0.64*0.045
    +Math.abs(a.barWidth-b.barWidth)/0.012*0.03
    +Math.abs(a.barLength-b.barLength)/0.07*0.03;
  return Number(distance.toFixed(6));
}

export function auditVida38ReptilianIdentity38OE2(
  inputs:readonly Vida38ReptilianIdentityInput38OE2[],
  options:Readonly<{nearDistanceThreshold?:number;maxSamplePairs?:number}> = {},
):Vida38ReptilianIdentityAudit38OE2 {
  return auditVida38ReptilianPreparedPlans38OE2(
    inputs.map(input=>({input,plan:deriveVida38ReptilianVisualPlan38OE2(input)})),options,
  );
}
/** Entrada de prueba para poder forzar colisiones y verificar la detección.
 * El renderer siempre usa deriveVida38ReptilianVisualPlan38OE2: no hay overrides. */
export function auditVida38ReptilianPreparedPlans38OE2(
  plans:readonly Readonly<{input:Vida38ReptilianIdentityInput38OE2;plan:Vida38ReptilianVisualPlan38OE2}>[],
  options:Readonly<{nearDistanceThreshold?:number;maxSamplePairs?:number}> = {},
):Vida38ReptilianIdentityAudit38OE2 {
  const nearThreshold=options.nearDistanceThreshold ?? 0.14;
  const sampleLimit=options.maxSamplePairs ?? 20;
  const ids=new Set<string>(plans.map(item=>item.input.speciesId));
  const exactMap=new Map<string,number[]>();
  const groups=new Map<string,number[]>();
  const profileSet=new Set<string>();const garmentSet=new Set<string>();const cultureSet=new Set<string>();
  plans.forEach(({plan},i)=>{
    profileSet.add(plan.profile);garmentSet.add(plan.garmentLine);cultureSet.add(plan.culture);
    const exact=exactMap.get(plan.exactVisualSignature)??[];
    exact.push(i);exactMap.set(plan.exactVisualSignature,exact);
    // Solo se consideran próximos si coinciden sus categorías principales.
    const key=`${plan.profile}|${plan.garmentLine}|${plan.culture}`;
    const group=groups.get(key)??[];
    group.push(i);groups.set(key,group);
  });
  const pairs:Vida38ReptilianVisualPair38OE2[]=[];
  let exactDuplicatePairs=0,nearDuplicatePairs=0;
  const addPair=(i:number,j:number,distance:number,exact:boolean)=>{
    if(pairs.length<sampleLimit) pairs.push({firstSpeciesId:plans[i]!.input.speciesId,secondSpeciesId:plans[j]!.input.speciesId,distance,exact});
  };
  for(const matches of exactMap.values()) {
    if(matches.length<=1)continue;
    for(let i=0;i<matches.length;i++) for(let j=i+1;j<matches.length;j++) {
      if(plans[matches[i]!]!.input.speciesId===plans[matches[j]!]!.input.speciesId)continue;
      exactDuplicatePairs++;
      addPair(matches[i]!,matches[j]!,0,true);
    }
  }
  for(const group of groups.values()) {
    for(let i=0;i<group.length;i++) for(let j=i+1;j<group.length;j++) {
      const first=plans[group[i]!]!;
      const second=plans[group[j]!]!;
      if(first.input.speciesId===second.input.speciesId)continue;
      if(first.plan.exactVisualSignature===second.plan.exactVisualSignature)continue;
      const distance=distanceVida38ReptilianVisualPlans38OE2(first.plan,second.plan);
      if(distance < nearThreshold) {nearDuplicatePairs++; addPair(group[i]!,group[j]!,distance,false);}
    }
  }
  return {
    revision:'38.2o.e2',population:plans.length,uniqueSourceIds:ids.size,
    exactDuplicatePairs,nearDuplicatePairs,distinctVisualPlans:exactMap.size,
    distribution:{profiles:profileSet.size,garmentLines:garmentSet.size,cultures:cultureSet.size},
    samplePairs:pairs,nearDistanceThreshold:nearThreshold,
    exactAuditPassed:exactDuplicatePairs===0 && ids.size===plans.length,
    method:'PARAMETRIC_VISUAL_PLAN_NOT_RENDERED_PIXELS',
  };
}
