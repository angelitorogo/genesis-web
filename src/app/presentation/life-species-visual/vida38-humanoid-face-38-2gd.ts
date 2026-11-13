/**
 * GENESIS 38.2g.d — identidad craneofacial, hipótesis de reconstrucción.
 * ÚNICAS fuentes: contrato confirmado 38.1 e ID estable. No altera VIDA.
 * La geometría depende de rasgos biológicos + speciesId, NUNCA de pigmentos.
 */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';

export const VIDA38_HUMANOID_FACE_REVISION = 'VIDA.38.2g.d/craniofacial-diversity/v1' as const;
export type Vida38HairStyle = 'BALD' | 'SPARSE' | 'MEDIUM' | 'DENSE' | 'DORSAL_CREST' | 'LATERAL';
export type Vida38RestingExpression = 'NEUTRAL' | 'WATCHFUL' | 'RELAXED' | 'STERN' | 'RESERVED';
export type Vida38Dentition = 'CANINES' | 'MIXED' | 'FLAT' | 'REDUCED';

export interface Vida38HumanoidFaceProfile38GD {
  readonly revision: typeof VIDA38_HUMANOID_FACE_REVISION;
  readonly speciesId: string;
  readonly seed: number;
  readonly fingerprint: string;
  readonly provenance: 'HYPOTHETICAL_ARTISTIC_RECONSTRUCTION_NOT_OBSERVED';
  readonly hairStyle: Vida38HairStyle;
  readonly hairDensity: number; // 0..1, no es dato biológico observado
  readonly hairLength: number; // unidades del SDF
  readonly hairFlow: number; // orientación suave de las fibras
  readonly eyebrowHair: number; // pilosidad, distinta de la cresta ósea
  readonly eyebrowLength: number;
  readonly eyebrowSlant: number;
  readonly eyebrowSeparation: number;
  readonly browRidge: number; // 0 ausencia ... 1.75 prominencia fuerte
  readonly eyeOpenness: number;
  readonly eyelidTension: number;
  readonly eyeTilt: number;
  readonly skullCrown: number;
  readonly facialWidth: number;
  readonly faceLength: number;
  readonly cheekVolume: number;
  readonly chinProjection: number;
  readonly jawBreadth: number;
  readonly noseWidth: number;
  readonly nasalBridge: number;
  readonly lipFullness: number;
  readonly mouthCurve: number;
  readonly mouthOpen: number;
  readonly restingExpression: Vida38RestingExpression;
  readonly dentition: Vida38Dentition;
  readonly toothScale: number;
  readonly teethVisible: boolean;
}

function hash32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 16777619) >>> 0;
  return h;
}
function sample(seed: number, channel: string): number {
  let x = hash32(`${seed}|${channel}|38.2g.d`);
  x ^= x >>> 16; x = Math.imul(x, 0x7feb352d); x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b); x ^= x >>> 16;
  return (x >>> 0) / 4294967295;
}
const blend = (a: number, b: number, x: number) => a + (b - a) * x;
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const round = (x: number) => +x.toFixed(6);

export function deriveVida38HumanoidFace38GD(c: Vida38SpeciesVisualContract): Vida38HumanoidFaceProfile38GD {
  if (c.morphology.group !== 'HUMANOIDS' && c.intelligence?.lineage !== 'HUMANOID') {
    throw new Error('38.2g.d: perfil facial aplicado a una especie no humanoide');
  }
  const seed = hash32([
    VIDA38_HUMANOID_FACE_REVISION, c.speciesId, c.bodyLengthMeters,
    c.ecology.habitat, c.ecology.nutrition, c.ecology.niche,
    c.morphology.bodyPlan, c.morphology.covering, c.locomotion,
    [...c.adaptations].sort().join(','), c.intelligence?.lineage ?? 'NONE',
  ].join('|'));
  const r = (key: string) => sample(seed, key);
  const centered = (key: string) => r(key) * 2 - 1;
  const hairCandidate = r('scalp-type');
  const covering = c.morphology.covering;
  const fibrous = covering === 'FUR' || covering === 'FIBROUS';
  const scaled = covering === 'SCALES' || covering === 'CHITINOUS';
  // El pelo en piel coriácea es posible como hipótesis estética, pero no
  // se infiere de la cobertura certificada. En escamas, predomina calvicie.
  const baldChance = scaled ? 0.68 : fibrous ? 0.12 : 0.28;
  let hairStyle: Vida38HairStyle;
  if (hairCandidate < baldChance) hairStyle = 'BALD';
  else {
    const variant = r('scalp-variant');
    hairStyle = variant < 0.24 ? 'SPARSE' : variant < 0.54 ? 'MEDIUM' : variant < 0.78 ? 'DENSE' : variant < 0.91 ? 'DORSAL_CREST' : 'LATERAL';
  }
  const hairDensity = hairStyle === 'BALD' ? 0 :
    hairStyle === 'SPARSE' ? blend(0.13, 0.31, r('density')) :
    hairStyle === 'MEDIUM' ? blend(0.37, 0.61, r('density')) :
    hairStyle === 'DENSE' ? blend(0.71, 1.0, r('density')) :
    blend(0.36, 0.84, r('density'));
  const eyebrowHair = hairStyle === 'BALD' && scaled ? 0 :
    r('brow-hair-absence') < 0.20 ? 0 : blend(0.14, fibrous ? 0.92 : 0.74, r('brow-hair'));
  const ridge = r('orbital-ridge');
  const browRidge = ridge < 0.22 ? 0 : ridge < 0.46 ? blend(0.08, 0.33, r('ridge-strength')) :
    ridge < 0.76 ? blend(0.53, 0.98, r('ridge-strength')) : blend(1.18, 1.72, r('ridge-strength'));
  const exprRoll = r('expression-type');
  const restingExpression: Vida38RestingExpression = exprRoll < 0.22 ? 'NEUTRAL' : exprRoll < 0.43 ? 'WATCHFUL' :
    exprRoll < 0.63 ? 'RELAXED' : exprRoll < 0.83 ? 'STERN' : 'RESERVED';
  const expressionBias = restingExpression === 'STERN' ? -0.64 : restingExpression === 'RELAXED' ? 0.57 :
    restingExpression === 'WATCHFUL' ? 0.37 : restingExpression === 'RESERVED' ? -0.27 : 0;
  const nutrition = c.ecology.nutrition;
  const dentition: Vida38Dentition = nutrition === 'PREDATOR' ? 'CANINES' : nutrition === 'OMNIVORE' ? 'MIXED' :
    nutrition === 'HERBIVORE' ? 'FLAT' : 'REDUCED';
  const visibilityRoll = r('mouth-visibility');
  const teethVisible = dentition === 'CANINES' ? visibilityRoll < 0.83 : dentition === 'MIXED' ? visibilityRoll < 0.52 :
    dentition === 'FLAT' ? visibilityRoll < 0.28 : visibilityRoll < 0.08;
  const mouthOpen = teethVisible ? blend(0.017, 0.027, r('mouth-open')) : blend(0.003, 0.009, r('mouth-open'));

  const fields = {
    hairStyle,
    hairDensity: round(hairDensity),
    hairLength: round(hairStyle === 'BALD' ? 0 : blend(0.028, hairStyle === 'SPARSE' ? 0.10 : 0.22, r('hair-length'))),
    hairFlow: round(centered('hair-flow') * 0.55),
    eyebrowHair: round(eyebrowHair),
    eyebrowLength: round(blend(0.70, 1.30, r('eyebrow-length'))),
    eyebrowSlant: round(centered('eyebrow-slant') * 0.23 + expressionBias * 0.06),
    eyebrowSeparation: round(blend(0.88, 1.16, r('brow-separation'))),
    browRidge: round(browRidge),
    eyeOpenness: round(clamp(1 + centered('eye-aperture') * 0.20 + expressionBias * 0.15, 0.65, 1.28)),
    eyelidTension: round(clamp(blend(0.72, 1.27, r('lid-tension')) - expressionBias * 0.07, 0.68, 1.30)),
    eyeTilt: round(centered('eye-tilt') * 0.16),
    skullCrown: round(blend(0.87, 1.14, r('skull-crown'))),
    facialWidth: round(blend(0.83, 1.20, r('facial-width'))),
    faceLength: round(blend(0.82, 1.22, r('facial-length'))),
    cheekVolume: round(blend(0.78, 1.29, r('cheek-volume'))),
    chinProjection: round(blend(0.78, 1.29, r('chin-projection'))),
    jawBreadth: round(blend(0.83, 1.21, r('jaw-breadth'))),
    noseWidth: round(blend(0.73, 1.36, r('nose-width'))),
    nasalBridge: round(blend(0.78, 1.23, r('nose-bridge'))),
    lipFullness: round(blend(0.66, 1.39, r('lip-fullness'))),
    mouthCurve: round(clamp(centered('mouth-curve') * 0.015 + expressionBias * 0.013, -0.028, 0.028)),
    mouthOpen: round(mouthOpen),
    restingExpression,
    dentition,
    toothScale: round(dentition === 'CANINES' ? blend(0.95, 1.19, r('tooth-size')) :
      dentition === 'MIXED' ? blend(0.73, 1.02, r('tooth-size')) :
      dentition === 'FLAT' ? blend(0.55, 0.83, r('tooth-size')) : blend(0.24, 0.52, r('tooth-size'))),
    teethVisible,
  };
  const fingerprint = hash32(JSON.stringify(fields)).toString(16).padStart(8, '0');
  return Object.freeze({
    revision: VIDA38_HUMANOID_FACE_REVISION,
    speciesId: c.speciesId,
    seed,
    fingerprint,
    provenance: 'HYPOTHETICAL_ARTISTIC_RECONSTRUCTION_NOT_OBSERVED',
    ...fields,
  });
}

/** Color capilar determinista: depende de pigmentos, pero NO de la geometría. */
export function deriveVida38HumanoidHairColor38GD(c: Vida38SpeciesVisualContract): string {
  const seed = hash32(`${VIDA38_HUMANOID_FACE_REVISION}|${c.speciesId}|hair-color`);
  const a = c.pigmentation.primaryColorHex;
  const b = c.pigmentation.secondaryColorHex;
  const c1 = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16));
  const c2 = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  const mix = blend(0.24, 0.79, sample(seed, 'mix'));
  const shade = blend(0.48, 0.94, sample(seed, 'shade'));
  return '#' + c1.map((v, i) => Math.round(clamp((v * (1 - mix) + c2[i]! * mix) * shade, 4, 245)).toString(16).padStart(2, '0')).join('');
}
