/** GENESIS 38.2g.e — constitución, axilas y manos de humanoides.
 * Hipótesis visual determinista basada en VIDA.38.1; NO cambia VIDA ni persistencia.
 * Las proporciones corporales se aplican ANTES de extraer la malla SDF.
 */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import type { Vida38HumanoidMorphologyProfileV1 } from './vida38-humanoid-morphology-38-2f';

export const VIDA38_HUMANOID_TORSO_REVISION = 'VIDA.38.2g.e/torso-axilla-hands/v1' as const;
export type Vida38HumanoidBuild = 'WIRY' | 'LEAN' | 'ATHLETIC' | 'STOCKY' | 'HEAVY';
export type Vida38ChestHairPattern = 'BARE' | 'SPARSE' | 'CENTER' | 'PECTORAL' | 'DENSE';

export interface Vida38HumanoidTorsoProfile38GE {
  readonly revision: typeof VIDA38_HUMANOID_TORSO_REVISION;
  readonly speciesId: string;
  readonly seed: number;
  readonly fingerprint: string;
  readonly provenance: 'HYPOTHETICAL_ARTISTIC_RECONSTRUCTION_NOT_OBSERVED';
  readonly build: Vida38HumanoidBuild;
  readonly chestScale: number;
  readonly waistScale: number;
  readonly abdomenScale: number;
  readonly pectoralDefinition: number;
  readonly shoulderCapScale: number;
  /** Despegue lateral de codo y muñeca desde el hombro, manteniendo axila. */
  readonly elbowOutset: number;
  readonly wristOutset: number;
  readonly armpitClearance: number;
  readonly palmWidth: number;
  readonly fingerSpread: number;
  readonly digitLength: number;
  readonly chestHairPattern: Vida38ChestHairPattern;
  readonly chestHairDensity: number;
  readonly chestHairLength: number;
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619) >>> 0;
  return h;
}
function random(seed: number, label: string): number {
  let v = hash(`${seed}|38.2g.e|${label}`);
  v ^= v >>> 16; v = Math.imul(v, 0x7feb352d); v ^= v >>> 15; v = Math.imul(v, 0x846ca68b);
  return ((v ^ (v >>> 16)) >>> 0) / 0xffffffff;
}
const round = (value: number): number => Number(value.toFixed(6));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function deriveVida38HumanoidTorso38GE(
  c: Vida38SpeciesVisualContract,
  morphology: Vida38HumanoidMorphologyProfileV1,
): Vida38HumanoidTorsoProfile38GE {
  if (c.morphology.group !== 'HUMANOIDS' && c.intelligence?.lineage !== 'HUMANOID') {
    throw new Error('38.2g.e: torso humanoide solicitado para otra familia');
  }
  // Sin cromatismo, orden de carga, appearanceFingerprint ni Math.random().
  const seed = hash([
    VIDA38_HUMANOID_TORSO_REVISION, c.speciesId, c.bodyLengthMeters,
    c.ecology.habitat, c.ecology.nutrition, c.ecology.niche,
    c.morphology.bodyPlan, c.morphology.covering, c.locomotion,
    [...c.adaptations].sort().join(','), morphology.anatomyFingerprint,
  ].join('|'));
  const r = (key: string) => random(seed, key);
  const roll = r('constitution');
  const build: Vida38HumanoidBuild = roll < 0.20 ? 'WIRY' : roll < 0.42 ? 'LEAN' :
    roll < 0.68 ? 'ATHLETIC' : roll < 0.86 ? 'STOCKY' : 'HEAVY';
  const preset = {
    WIRY: [0.85, 0.76, 0.84, 0.80, 0.90],
    LEAN: [0.94, 0.87, 0.91, 0.88, 0.95],
    ATHLETIC: [1.06, 0.92, 1.0, 1.15, 1.10],
    STOCKY: [1.13, 1.08, 1.07, 1.05, 1.17],
    HEAVY: [1.16, 1.15, 1.20, 0.88, 1.20],
  }[build];
  // Perfil corporal ecológico = sesgo leve, nunca deducción científica.
  const rocky = c.ecology.habitat === 'SURFACE_ROCK_SHELTER' ? 0.025 : 0;
  const strong = morphology.bodyMass - 1;
  const chestScale = round(clamp(preset[0] * (1 + strong * 0.10 + (r('chest') - 0.5) * 0.13 + rocky), 0.77, 1.30));
  const waistScale = round(clamp(preset[1] * (1 + strong * 0.12 + (r('waist') - 0.5) * 0.10), 0.68, 1.35));
  const abdomenScale = round(clamp(preset[2] * (1 + strong * 0.12 + (r('abdomen') - 0.5) * 0.13), 0.74, 1.38));
  const pectoralDefinition = round(clamp(preset[3] * (0.90 + morphology.muscularity * 0.10 + r('pec') * 0.10), 0.71, 1.32));
  const shoulderCapScale = round(clamp(preset[4] * (0.94 + r('deltoid') * 0.11), 0.84, 1.34));
  // El codo siempre debe quedar fuera de la anchura lateral del torso en su altura.
  const elbowOutset = round(0.17 + r('elbow-space') * 0.068 + (build === 'HEAVY' ? 0.028 : 0));
  const wristOutset = round(0.18 + r('wrist-space') * 0.071 + (build === 'HEAVY' ? 0.03 : 0));
  const armpitClearance = round(0.078 + r('armpit') * 0.032);
  const palmWidth = round(clamp(1.08 + (r('palm') - 0.5) * 0.16, 1.0, 1.2));
  const fingerSpread = round(clamp(1.04 + (r('finger-fan') - 0.5) * 0.20, 0.95, 1.16));
  const digitLength = round(clamp(1.0 + (r('fingertips') - 0.5) * 0.18, 0.90, 1.10));
  // Vello NO observado: el tipo de cobertura condiciona la plausibilidad.
  const cover = c.morphology.covering;
  const fibrous = cover === 'FUR' || cover === 'FIBROUS';
  const scales = cover === 'SCALES' || cover === 'CHITINOUS';
  const hairRoll = r('chest-hair');
  const baldChance = scales ? 1 : fibrous ? 0.08 : cover === 'FEATHERS' ? 1 : 0.36;
  const chestHairPattern: Vida38ChestHairPattern = hairRoll < baldChance ? 'BARE' :
    hairRoll < baldChance + (1 - baldChance) * 0.24 ? 'SPARSE' :
    hairRoll < baldChance + (1 - baldChance) * 0.52 ? 'CENTER' :
    hairRoll < baldChance + (1 - baldChance) * 0.79 ? 'PECTORAL' : 'DENSE';
  const chestHairDensity = round(chestHairPattern === 'BARE' ? 0 :
    chestHairPattern === 'SPARSE' ? 0.17 + r('density') * 0.17 :
    chestHairPattern === 'CENTER' ? 0.34 + r('density') * 0.24 :
    chestHairPattern === 'PECTORAL' ? 0.45 + r('density') * 0.28 : 0.72 + r('density') * 0.25);
  const chestHairLength = round(0.022 + r('hair-length') * (fibrous ? 0.095 : 0.062));
  const fields = {
    build, chestScale, waistScale, abdomenScale, pectoralDefinition,
    shoulderCapScale, elbowOutset, wristOutset, armpitClearance,
    palmWidth, fingerSpread, digitLength,
    chestHairPattern, chestHairDensity, chestHairLength,
  };
  return Object.freeze({
    revision: VIDA38_HUMANOID_TORSO_REVISION,
    speciesId: c.speciesId,
    seed,
    fingerprint: hash(JSON.stringify(fields)).toString(16).padStart(8, '0'),
    provenance: 'HYPOTHETICAL_ARTISTIC_RECONSTRUCTION_NOT_OBSERVED',
    ...fields,
  });
}
