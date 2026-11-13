import type { Vida38CivilizedReptilianCulture38OE, Vida38CivilizedReptilianGarmentLine38OE, Vida38CivilizedReptilianProfile38OD } from './vida38-civilized-reptilian-preview-38-2o';

export type Vida38ReptilianEyewear38OE3 = 'VISOR' | 'SPLIT_GOGGLES' | 'MONOCLE';
export type Vida38ReptilianHandheld38OE3 = 'NONE' | 'STAFF' | 'SCEPTER' | 'DATA_ROD';
export type Vida38ReptilianWrist38OE3 = 'NONE' | 'LEFT_CONSOLE' | 'RIGHT_CONSOLE';
export type Vida38ReptilianShoulder38OE3 = 'NONE' | 'LEFT_BEACON' | 'RIGHT_BEACON' | 'BACK_SPIRE';

export interface Vida38ReptilianAccessoryPlan38OE3 {
  readonly eyewear: Vida38ReptilianEyewear38OE3;
  readonly handheld: Vida38ReptilianHandheld38OE3;
  readonly wrist: Vida38ReptilianWrist38OE3;
  readonly shoulder: Vida38ReptilianShoulder38OE3;
  readonly leftHanded: boolean;
  readonly exactAccessorySignature: string;
}

function fnv1a32(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619) >>> 0;
  return hash >>> 0;
}
function avalanche32(hash: number): number {
  let h = hash >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}
function pick<T>(list: readonly T[], seed: number): T { return list[seed % list.length]!; }

const EYEWEAR: readonly Vida38ReptilianEyewear38OE3[] = ['VISOR','SPLIT_GOGGLES','MONOCLE'];
const HANDHELD: readonly Vida38ReptilianHandheld38OE3[] = ['NONE','STAFF','SCEPTER','DATA_ROD'];
const WRIST: readonly Vida38ReptilianWrist38OE3[] = ['NONE','LEFT_CONSOLE','RIGHT_CONSOLE'];
const SHOULDER: readonly Vida38ReptilianShoulder38OE3[] = ['NONE','LEFT_BEACON','RIGHT_BEACON','BACK_SPIRE'];

export function deriveVida38ReptilianAccessoryPlan38OE3(args: {
  speciesId: string;
  appearanceFingerprint: string;
  profile: Vida38CivilizedReptilianProfile38OD;
  garmentLine: Vida38CivilizedReptilianGarmentLine38OE;
  culture: Vida38CivilizedReptilianCulture38OE;
}): Vida38ReptilianAccessoryPlan38OE3 {
  const identity = `${args.speciesId}|${args.appearanceFingerprint}|${args.profile}|${args.garmentLine}|${args.culture}|38.2oe3`;
  const eyewearSeed = avalanche32(fnv1a32(`EYE|${identity}`));
  const handheldSeed = avalanche32(fnv1a32(`HAND|${identity}`));
  const wristSeed = avalanche32(fnv1a32(`WRIST|${identity}`));
  const shoulderSeed = avalanche32(fnv1a32(`SHOULDER|${identity}`));
  const dominantLeft = (avalanche32(fnv1a32(`LATERAL|${identity}`)) & 1) === 1;
  let eyewear = pick(EYEWEAR, eyewearSeed);
  let handheld = pick(HANDHELD, handheldSeed);
  let wrist = pick(WRIST, wristSeed);
  let shoulder = pick(SHOULDER, shoulderSeed);

  // Ajustes culturales / funcionales para lecturas más coherentes.
  if (args.garmentLine === 'SCIENTIST' && handheld === 'NONE') handheld = 'DATA_ROD';
  if (args.garmentLine === 'MILITARY' && handheld === 'NONE') handheld = 'SCEPTER';
  if (args.garmentLine === 'TECHNO_PRIEST' && handheld === 'NONE') handheld = 'STAFF';
  if (args.garmentLine === 'INDUSTRIAL_COLONIZER' && wrist === 'NONE') wrist = dominantLeft ? 'LEFT_CONSOLE' : 'RIGHT_CONSOLE';
  if (args.garmentLine === 'EXPLORER' && shoulder === 'NONE') shoulder = dominantLeft ? 'LEFT_BEACON' : 'RIGHT_BEACON';
  if (args.culture === 'BASILICA_TECHNOCRACY' && shoulder === 'NONE') shoulder = 'BACK_SPIRE';
  if (args.culture === 'PELAGIC_CONCORD' && eyewear === 'MONOCLE') eyewear = 'VISOR';
  if (args.profile === 'HORNED_WARLORD' || args.profile === 'PLATED_TITAN') eyewear = 'SPLIT_GOGGLES';

  const exactAccessorySignature = `${eyewear}|${handheld}|${wrist}|${shoulder}|${dominantLeft ? 'L' : 'R'}`;
  return { eyewear, handheld, wrist, shoulder, leftHanded: dominantLeft, exactAccessorySignature };
}
