/**
 * GENESIS 38.2f — diversidad humanoide, SOLO reconstrucción hipotética.
 * El dato biológico de VIDA permanece inalterado. La identidad anatómica no
 * depende de colores, patrón, appearanceFingerprint ni del orden de render.
 */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';

export const VIDA38_HUMANOID_MORPHOLOGY_REVISION = 'VIDA.38.2f/humanoid-morphology/v1' as const;

/** Factores adimensionales aplicados ANTES de extraer la superficie SDF. */
export interface Vida38HumanoidMorphologyProfileV1 {
  readonly revision: typeof VIDA38_HUMANOID_MORPHOLOGY_REVISION;
  readonly speciesId: string;
  readonly lengthMeters: number;
  readonly anatomySeed: number;
  readonly anatomyFingerprint: string;
  readonly provenance: 'ARTISTIC_SCIENTIFIC_RECONSTRUCTION_NOT_OBSERVED';
  readonly headScale: number;
  readonly skullWidth: number;
  readonly skullHeight: number;
  readonly skullDepth: number;
  readonly cranialShape: number;
  readonly neckLength: number;
  readonly neckThickness: number;
  readonly faceProjection: number;
  readonly jawWidth: number;
  readonly jawProjection: number;
  readonly eyeSize: number;
  readonly eyeSpacing: number;
  readonly browProminence: number;
  readonly shoulderWidth: number;
  readonly chestWidth: number;
  readonly chestDepth: number;
  readonly torsoLength: number;
  readonly waistWidth: number;
  readonly abdomenVolume: number;
  readonly pelvisWidth: number;
  readonly bodyMass: number;
  readonly muscularity: number;
  readonly postureLean: number;
  readonly armLength: number;
  readonly upperArmRatio: number;
  readonly forearmRatio: number;
  readonly armThickness: number;
  readonly handSize: number;
  readonly fingerLength: number;
  readonly fingerThickness: number;
  readonly legLength: number;
  readonly thighRatio: number;
  readonly calfRatio: number;
  readonly legThickness: number;
  readonly hipSpacing: number;
  readonly footLength: number;
  readonly footWidth: number;
}

export const VIDA38_HUMANOID_MORPHOLOGY_LIMITS: Readonly<Record<
  Exclude<keyof Vida38HumanoidMorphologyProfileV1,
    'revision' | 'speciesId' | 'lengthMeters' | 'anatomySeed' | 'anatomyFingerprint' | 'provenance'>,
  readonly [number, number]
>> = Object.freeze({
  headScale: [0.82, 1.22], skullWidth: [0.84, 1.23], skullHeight: [0.82, 1.20],
  skullDepth: [0.86, 1.20], cranialShape: [-0.18, 0.18],
  neckLength: [0.78, 1.25], neckThickness: [0.85, 1.28],
  faceProjection: [0.74, 1.34], jawWidth: [0.78, 1.24], jawProjection: [0.8, 1.22],
  eyeSize: [0.78, 1.24], eyeSpacing: [0.84, 1.18], browProminence: [0.8, 1.24],
  shoulderWidth: [0.78, 1.24], chestWidth: [0.84, 1.2], chestDepth: [0.83, 1.23],
  torsoLength: [0.88, 1.13], waistWidth: [0.8, 1.2], abdomenVolume: [0.76, 1.25],
  pelvisWidth: [0.82, 1.21], bodyMass: [0.77, 1.27], muscularity: [0.78, 1.27],
  postureLean: [-0.045, 0.055],
  armLength: [0.85, 1.18], upperArmRatio: [0.86, 1.15], forearmRatio: [0.85, 1.16],
  armThickness: [0.80, 1.25], handSize: [0.8, 1.25],
  fingerLength: [0.8, 1.24], fingerThickness: [0.78, 1.24],
  legLength: [0.89, 1.13], thighRatio: [0.85, 1.16], calfRatio: [0.85, 1.17],
  legThickness: [0.80, 1.23], hipSpacing: [0.84, 1.2],
  footLength: [0.8, 1.23], footWidth: [0.83, 1.22],
});

function fnv(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 16777619) >>> 0;
  return h >>> 0;
}
function random01(seed: number, channel: string): number {
  let x = fnv(`${seed.toString(16)}|${channel}|38.2f`);
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967295;
}
const clamp = (x: number, min: number, max: number): number => Math.min(max, Math.max(min, x));
const smooth = (seed: number, channel: string): number => random01(seed, channel) * 2 - 1;

/**
 * Fuente genética visual estable independiente de PIGMENTOS.
 * Se ordenan adaptaciones para no depender de la serialización de sus arrays.
 * Los factores ecológicos son sesgos artísticos, no deducciones evolutivas.
 */
export function deriveVida38HumanoidMorphologyV1(contract: Vida38SpeciesVisualContract): Vida38HumanoidMorphologyProfileV1 {
  if (contract.morphology.group !== 'HUMANOIDS' && contract.intelligence?.lineage !== 'HUMANOID') {
    throw new Error('VIDA.38.2f: perfil humanoide solicitado para un linaje no humanoide');
  }
  const identity = [
    VIDA38_HUMANOID_MORPHOLOGY_REVISION, contract.speciesId,
    contract.bodyLengthMeters, contract.ecology.habitat,
    contract.ecology.niche, contract.locomotion, contract.morphology.bodyPlan,
    contract.morphology.covering, [...contract.adaptations].sort().join(','),
    contract.intelligence?.lineage ?? 'NONE',
  ].join('|');
  const seed = fnv(identity);
  const r = (channel: string): number => smooth(seed, channel);
  const robust = r('robust');
  const lanky = r('elongated');
  const cranial = r('cranial');
  const mass = r('mass');
  const habitat = contract.ecology.habitat;
  const rock = habitat === 'SURFACE_ROCK_SHELTER' ? 1 : 0;
  const open = habitat === 'SURFACE_OPEN_TERRAIN' ? 1 : 0;
  const wet = habitat === 'SURFACE_WET_MARGIN' ? 1 : 0;
  const canopy = habitat === 'SURFACE_CANOPY' ? 1 : 0;
  const crawling = contract.locomotion === 'CRAWLING' ? 1 : 0;
  const armored = contract.adaptations.includes('EXTERNAL_ARMOR') ? 1 : 0;
  const dexterity = contract.adaptations.includes('MACROSCOPIC_TOOL_MANIPULATION') ? 1 : 0;
  const sensory = contract.adaptations.includes('SENSORY_ORIENTATION') ? 1 : 0;
  const relativeSize = clamp(Math.log10(Math.max(0.01, contract.bodyLengthMeters) / 1.6), -1, 1);
  const f = (key: keyof typeof VIDA38_HUMANOID_MORPHOLOGY_LIMITS, value: number): number => {
    const [min, max] = VIDA38_HUMANOID_MORPHOLOGY_LIMITS[key];
    return +clamp(value, min, max).toFixed(6);
  };
  const fields = {
    headScale: f('headScale', 1 + 0.13 * cranial + 0.055 * r('head') - 0.025 * relativeSize),
    skullWidth: f('skullWidth', 1 + 0.14 * r('craniumWidth') + 0.035 * robust),
    skullHeight: f('skullHeight', 1 + 0.13 * r('craniumHeight') + 0.05 * cranial),
    skullDepth: f('skullDepth', 1 + 0.11 * r('craniumDepth') + 0.045 * cranial),
    cranialShape: f('cranialShape', 0.12 * r('cranialShape')),
    neckLength: f('neckLength', 1 + 0.15 * r('neckLong') - 0.08 * rock + 0.04 * wet),
    neckThickness: f('neckThickness', 1 + 0.14 * robust + 0.07 * cranial + 0.055 * r('neckGirth')),
    faceProjection: f('faceProjection', 1 + 0.20 * r('faceProjection')),
    jawWidth: f('jawWidth', 1 + 0.15 * r('jawWide') + 0.04 * robust),
    jawProjection: f('jawProjection', 1 + 0.13 * r('jawDeep')),
    eyeSize: f('eyeSize', 1 + 0.13 * r('eyeLarge') + 0.035 * sensory),
    eyeSpacing: f('eyeSpacing', 1 + 0.105 * r('eyeSpacing')),
    browProminence: f('browProminence', 1 + 0.15 * r('brow') + 0.035 * robust),
    shoulderWidth: f('shoulderWidth', 1 + 0.145 * robust + 0.08 * r('shoulder')),
    chestWidth: f('chestWidth', 1 + 0.11 * robust + 0.07 * r('chestWidth')),
    chestDepth: f('chestDepth', 1 + 0.12 * mass + 0.07 * r('chestDepth')),
    torsoLength: f('torsoLength', 1 + 0.085 * r('torsoLength') - 0.03 * lanky + 0.024 * crawling),
    waistWidth: f('waistWidth', 1 + 0.10 * mass + 0.07 * r('waist')),
    abdomenVolume: f('abdomenVolume', 1 + 0.16 * mass + 0.07 * r('abdomen')),
    pelvisWidth: f('pelvisWidth', 1 + 0.13 * r('pelvis') + 0.035 * robust),
    bodyMass: f('bodyMass', 1 + 0.16 * mass + 0.08 * robust - 0.06 * lanky + 0.05 * rock),
    muscularity: f('muscularity', 1 + 0.12 * robust + 0.08 * r('musculature') + 0.04 * rock),
    postureLean: f('postureLean', 0.03 * r('posture') + 0.015 * crawling),
    armLength: f('armLength', 1 + 0.11 * lanky + 0.06 * r('armLong') + 0.035 * canopy),
    upperArmRatio: f('upperArmRatio', 1 + 0.08 * r('upperArm')),
    forearmRatio: f('forearmRatio', 1 + 0.09 * r('forearm')),
    armThickness: f('armThickness', 1 + 0.15 * robust + 0.08 * r('armGirth') + 0.04 * rock + 0.035 * armored),
    handSize: f('handSize', 1 + 0.13 * r('hands') + 0.045 * rock + 0.025 * dexterity),
    fingerLength: f('fingerLength', 1 + 0.10 * r('fingerLength') + 0.045 * dexterity),
    fingerThickness: f('fingerThickness', 1 + 0.12 * r('fingerGirth') + 0.04 * robust),
    legLength: f('legLength', 1 + 0.095 * lanky + 0.045 * r('legLong') + 0.035 * open - 0.045 * rock - 0.035 * crawling),
    thighRatio: f('thighRatio', 1 + 0.075 * r('thighRatio')),
    calfRatio: f('calfRatio', 1 + 0.08 * r('calfRatio')),
    legThickness: f('legThickness', 1 + 0.15 * robust + 0.065 * r('legGirth') + 0.04 * rock),
    hipSpacing: f('hipSpacing', 1 + 0.09 * r('hipSpacing') + 0.025 * robust),
    footLength: f('footLength', 1 + 0.11 * r('footLength') + 0.055 * wet + 0.025 * robust),
    footWidth: f('footWidth', 1 + 0.11 * r('footWidth') + 0.045 * rock + 0.04 * wet),
  };
  const serial = Object.keys(fields).sort().map(k => `${k}:${fields[k as keyof typeof fields]}`).join('|');
  return Object.freeze({
    revision: VIDA38_HUMANOID_MORPHOLOGY_REVISION,
    speciesId: contract.speciesId,
    lengthMeters: contract.bodyLengthMeters,
    anatomySeed: seed,
    anatomyFingerprint: fnv(`${VIDA38_HUMANOID_MORPHOLOGY_REVISION}|${serial}`).toString(16).padStart(8, '0'),
    provenance: 'ARTISTIC_SCIENTIFIC_RECONSTRUCTION_NOT_OBSERVED',
    ...fields,
  });
}
