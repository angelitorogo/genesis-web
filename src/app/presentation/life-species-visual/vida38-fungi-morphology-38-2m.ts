import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';

/** Familias de cuerpo fructífero, nunca etiquetas taxonómicas inferidas. */
export const VIDA38_FUNGAL_FORMS_38M = [
  'AGARICOID', 'BOLETOID', 'BRACKET', 'CORAL',
  'GASTEROID', 'CUP', 'GELATINOUS', 'ROSETTE',
] as const;
export type Vida38FungalForm38M = (typeof VIDA38_FUNGAL_FORMS_38M)[number];
export type Vida38FungalTexture38M = 'FLESHY' | 'FIBROUS' | 'LEATHERY' | 'POROUS' | 'VELVETY' | 'WET' | 'GELATINOUS' | 'DRY';
export const VIDA38_FUNGAL_REVISION_38M = 'VIDA.38.2m/fungal-architecture/v1' as const;

export interface Vida38FungalMorphology38M {
  readonly revision: typeof VIDA38_FUNGAL_REVISION_38M;
  readonly provenance: 'ARTISTIC_HYPOTHESIS_NOT_OBSERVED';
  readonly speciesId: string;
  readonly form: Vida38FungalForm38M;
  readonly variation: number;
  readonly seed: number;
  readonly sourceLengthMeters: number;
  readonly heightFactor: number;
  readonly widthFactor: number;
  readonly branchComplexity: number;
  readonly density: number;
  readonly curvature: number;
  readonly edgeIrregularity: number;
  readonly texture: Vida38FungalTexture38M;
  readonly humidHabitat: boolean;
}

export function vida38FungalHash38M(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  return h >>> 0;
}

/** RNG sin estado global ni Math.random; compatible con CT-0. */
export class Vida38FungalRandom38M {
  constructor(private state: number) {}
  next(): number {
    let x = this.state || 0x9e3779b9;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 4294967296;
  }
  range(a: number, b: number): number { return a + (b - a) * this.next(); }
  int(a: number, b: number): number { return a + Math.floor(this.next() * (b - a + 1)); }
}

/** El tipo y la anatomía no dependen de los colores de pigmentación. */
export function deriveVida38FungalMorphology38M(contract: Vida38SpeciesVisualContract): Vida38FungalMorphology38M {
  if (contract.morphology.group !== 'FUNGI') throw new Error('VIDA.38.2m: solo se admite FUNGI');
  const identity = `${contract.speciesId}|VIDA38_2M`;
  const familyHash = vida38FungalHash38M(`${identity}|family`);
  const seed = vida38FungalHash38M(`${identity}|${contract.variantSeedUint32}|${contract.appearanceFingerprint}|anatomy`);
  const rng = new Vida38FungalRandom38M(seed);
  const form = VIDA38_FUNGAL_FORMS_38M[familyHash % VIDA38_FUNGAL_FORMS_38M.length]!;
  const length = Number.isFinite(contract.bodyLengthMeters) ? Math.max(0.001, contract.bodyLengthMeters) : 0.01;
  const isHumid = ['SURFACE_WET_MARGIN', 'AQUIFER', 'PROTECTED_SEEP', 'SUBSURFACE_CAVERN'].includes(contract.ecology.habitat);
  const textureOptions: readonly Vida38FungalTexture38M[] = form === 'GELATINOUS'
    ? ['GELATINOUS', 'WET']
    : form === 'BRACKET' || form === 'ROSETTE' ? ['LEATHERY', 'VELVETY', 'FIBROUS', 'DRY']
    : form === 'GASTEROID' ? ['VELVETY', 'POROUS', 'DRY', 'FLESHY']
    : ['FLESHY', 'FIBROUS', 'VELVETY', 'POROUS', 'WET', 'DRY'];
  const texture = textureOptions[rng.int(0, textureOptions.length - 1)]!;
  return Object.freeze({
    revision: VIDA38_FUNGAL_REVISION_38M,
    provenance: 'ARTISTIC_HYPOTHESIS_NOT_OBSERVED',
    speciesId: contract.speciesId,
    form,
    variation: vida38FungalHash38M(`${identity}|variation`) % 5,
    seed,
    sourceLengthMeters: contract.bodyLengthMeters,
    heightFactor: Math.min(1.5, Math.max(0.72, 0.88 + 0.19 * Math.log1p(length))) * rng.range(0.86, 1.16),
    widthFactor: rng.range(0.76, 1.34),
    branchComplexity: rng.range(0.76, 1.24),
    density: rng.range(0.66, 1.27),
    curvature: rng.range(0.06, 0.3),
    edgeIrregularity: rng.range(0.055, 0.21),
    texture,
    humidHabitat: isHumid,
  });
}

export const VIDA38_FUNGAL_LABELS_38M: Readonly<Record<Vida38FungalForm38M, string>> = Object.freeze({
  AGARICOID: 'Agaricoide · sombrero y láminas',
  BOLETOID: 'Boletoide · robusto y poroso',
  BRACKET: 'Poliporoide · repisas laterales',
  CORAL: 'Clavarioide · ramificación coralina',
  GASTEROID: 'Gasteroide · cuerpo cerrado',
  CUP: 'Cupuliforme · copa abierta',
  GELATINOUS: 'Gelatinoso · lóbulos plegados',
  ROSETTE: 'Roseta · láminas superpuestas',
});
