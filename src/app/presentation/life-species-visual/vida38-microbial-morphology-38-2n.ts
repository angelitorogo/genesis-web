import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';

/** Arquetipos visuales hipotéticos; no se infiere el taxón microscópico real de VIDA. */
export const VIDA38_MICROBIAL_FORMS_38N = [
  'COCCOID_AGGREGATE', 'BACILLI', 'SPIRILLA', 'VIBRIOS', 'BRANCHING_FILAMENTS',
  'BIOFILM', 'CILIATED', 'AMOEBOID', 'DIATOM', 'RADIOLARIAN',
] as const;
export type Vida38MicrobialForm38N = typeof VIDA38_MICROBIAL_FORMS_38N[number];
export type Vida38MicrobialMaterial38N = 'MUCOUS' | 'WAXY' | 'CELLULOSE' | 'SILICEOUS' | 'GELATINOUS' | 'LEATHERY';
export type Vida38MicrobialOrganization38N = 'INDIVIDUAL' | 'COMPACT_COLONY' | 'LOOSE_COLONY' | 'CHAIN' | 'SHEET';
export const VIDA38_MICROBIAL_REVISION_38N = 'VIDA.38.2n/microbial-architecture/v1' as const;

export const VIDA38_MICROBIAL_LABELS_38N: Readonly<Record<Vida38MicrobialForm38N, string>> = Object.freeze({
  COCCOID_AGGREGATE: 'Cocoides · colonias compactas de células',
  BACILLI: 'Bacilos · cuerpos alargados y septos',
  SPIRILLA: 'Espirilos · cuerpos helicoidales',
  VIBRIOS: 'Vibrios · células curvadas',
  BRANCHING_FILAMENTS: 'Filamentos · ramificación celular organizada',
  BIOFILM: 'Biopelícula · matriz adherida y colonias',
  CILIATED: 'Ciliados · membrana y cilios funcionales',
  AMOEBOID: 'Ameboides · membranas y pseudópodos',
  DIATOM: 'Diatomeas · envolturas silíceas ornamentadas',
  RADIOLARIAN: 'Radiolarios · cuerpos y espículas radiales',
});

export interface Vida38MicrobialMorphology38N {
  readonly revision: typeof VIDA38_MICROBIAL_REVISION_38N;
  readonly provenance: 'ARTISTIC_HYPOTHESIS_NOT_OBSERVED';
  readonly speciesId: string;
  readonly seed: number;
  readonly form: Vida38MicrobialForm38N;
  readonly variation: number;
  readonly organization: Vida38MicrobialOrganization38N;
  readonly material: Vida38MicrobialMaterial38N;
  /** Talla de VIDA en metros, no tamaño de pantalla ni de la colonia reconstruida. */
  readonly sourceLengthMeters: number;
  readonly colonyCount: number;
  readonly slenderness: number;
  readonly curvature: number;
  readonly envelopeIrregularity: number;
  readonly density: number;
  readonly luminescent: boolean;
  readonly habitat: Vida38SpeciesVisualContract['ecology']['habitat'];
}

export function vida38MicrobialHash38N(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h >>> 0;
}
export class Vida38MicrobialRandom38N {
  constructor(private state: number) {}
  next(): number {
    let x = this.state || 0x9e3779b9;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 4294967296;
  }
  range(min: number, max: number): number { return min + (max - min) * this.next(); }
  int(min: number, max: number): number { return min + Math.floor(this.next() * (max - min + 1)); }
}

/** La anatomía depende de la identidad estable, no del color, ni de Math.random, ni del orden de consulta. */
export function deriveVida38MicrobialMorphology38N(c: Vida38SpeciesVisualContract): Vida38MicrobialMorphology38N {
  if (c.morphology.group !== 'MICROORGANISMS') throw new Error('VIDA.38.2n: este generador es exclusivo de MICROORGANISMS');
  const familySeed = vida38MicrobialHash38N(`${c.speciesId}|38.2n|morphotype`);
  const seed = vida38MicrobialHash38N(`${c.speciesId}|${c.variantSeedUint32}|${c.appearanceFingerprint}|38.2n|anatomy`);
  const rng = new Vida38MicrobialRandom38N(seed);
  const form = VIDA38_MICROBIAL_FORMS_38N[familySeed % VIDA38_MICROBIAL_FORMS_38N.length]!;
  const isWater = ['SURFACE_WET_MARGIN', 'AQUIFER', 'PROTECTED_SEEP', 'SUBSURFACE_CAVERN'].includes(c.ecology.habitat);
  const organized: Record<Vida38MicrobialForm38N, readonly Vida38MicrobialOrganization38N[]> = {
    COCCOID_AGGREGATE: ['COMPACT_COLONY', 'LOOSE_COLONY', 'CHAIN'],
    BACILLI: ['LOOSE_COLONY', 'CHAIN', 'INDIVIDUAL'],
    SPIRILLA: ['INDIVIDUAL', 'LOOSE_COLONY'],
    VIBRIOS: ['LOOSE_COLONY', 'CHAIN'],
    BRANCHING_FILAMENTS: ['CHAIN', 'LOOSE_COLONY'],
    BIOFILM: ['SHEET'],
    CILIATED: ['INDIVIDUAL', 'LOOSE_COLONY'],
    AMOEBOID: ['INDIVIDUAL', 'LOOSE_COLONY'],
    DIATOM: ['INDIVIDUAL', 'LOOSE_COLONY', 'CHAIN'],
    RADIOLARIAN: ['INDIVIDUAL', 'LOOSE_COLONY'],
  };
  const byForm: Record<Vida38MicrobialForm38N, Vida38MicrobialMaterial38N> = {
    COCCOID_AGGREGATE: 'WAXY', BACILLI: 'WAXY', SPIRILLA: 'MUCOUS', VIBRIOS: 'MUCOUS',
    BRANCHING_FILAMENTS: 'CELLULOSE', BIOFILM: 'GELATINOUS', CILIATED: 'MUCOUS',
    AMOEBOID: 'GELATINOUS', DIATOM: 'SILICEOUS', RADIOLARIAN: 'SILICEOUS',
  };
  const orgs = organized[form];
  // Densidad y organización dependen de la especie; los hábitats húmedos pueden variar la capa mucosa.
  return Object.freeze({
    revision: VIDA38_MICROBIAL_REVISION_38N,
    provenance: 'ARTISTIC_HYPOTHESIS_NOT_OBSERVED',
    speciesId: c.speciesId, seed, form, variation: familySeed >>> 11 & 7,
    organization: orgs[rng.int(0, orgs.length - 1)]!, material: byForm[form],
    sourceLengthMeters: c.bodyLengthMeters,
    colonyCount: Math.max(1, Math.round(rng.range(5, 13) * (isWater ? 1.08 : 1))),
    slenderness: rng.range(0.72, 1.48),
    curvature: rng.range(0.08, 0.35),
    envelopeIrregularity: rng.range(0.024, 0.095),
    density: rng.range(0.67, 1.24),
    luminescent: c.pigmentation.bioluminescent,
    habitat: c.ecology.habitat,
  });
}
