import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {
  deriveVida38HumanoidAnatomy,
  deriveVida38HumanoidFaceLandmarks38GC,
  type Vida38HumanoidAnatomy,
  type Vida38HumanoidQuality,
  type Vida38HumanoidRawMesh,
} from './vida38-humanoid-organic-field-38-2e';
import { createVida38HumanoidSkinV1 } from './vida38-humanoid-organic-material-38-2e';
import { buildVida38CivilReptilianSdfMesh38OD5 } from './vida38-civilized-reptilian-sdf-union-38-2od5';
import { deriveVida38ReptilianVisualPlan38OE2, type Vida38ReptilianVisualPlan38OE2 } from './vida38-civilized-reptilian-identity-38-2oe2';
import { selectVida38ReptilianVariation38OE1 } from './vida38-civilized-reptilian-variation-38-2oe1';
import { deriveVida38CivilReptilianOrbitalFrame38OE4, createVida38CivilReptilianEyeMeshes38OE4, type Vida38CivilReptilianOrbitalFrame38OE4 } from './vida38-civilized-reptilian-ocular-38-2oe4';
import { deriveVida38ReptilianAccessoryPlan38OE3, type Vida38ReptilianAccessoryPlan38OE3 } from './vida38-civilized-reptilian-accessories-38-2oe3';
import { deriveVida38OrganicGarmentPlan38OE7B } from './vida38-reptilian-organic-garments-38-2oe7b';
import { createVida38ReptilianOrganicGarments38OE7C } from './vida38-reptilian-organic-garments-38-2oe7c';
import { deriveVida38TechArmorPlan38OE8, createVida38ReptilianTechnicalGarments38OE8, VIDA38_TECH_GARMENT_REVISION_38OE8 } from './vida38-reptilian-technical-garments-38-2oe8';
import { selectVida38WardrobeFamily38OE8B, getVida38WardrobeEngine38OE8B, VIDA38_WARDROBE_COHERENCE_REVISION_38OE8B } from './vida38-reptilian-wardrobe-coherence-38-2oe8b';
import { deriveVida38CulturalDiversityPlan38OE9, VIDA38_CULTURAL_DIVERSITY_REVISION_38OE9 } from './vida38-reptilian-cultural-diversity-38-2oe9';

export type Vida38CivilizedReptilianLevel38OD = 'PRIMITIVE' | 'ADVANCED' | 'VERY_ADVANCED';
export type Vida38CivilizedReptilianProfile38OD =
  | 'LITHE_SCOUT'
  | 'ROBUST_SENTINEL'
  | 'CREST_SCHOLAR'
  | 'AMPHIBIOUS_DIPLOMAT'
  | 'LONGNECK_SEER'
  | 'BRACHYCEPHALIC_GUARD'
  | 'HORNED_WARLORD'
  | 'PLATED_TITAN'
  | 'EXTREME_DIGITIGRADE_HUNTER'
  | 'MARSH_ORACLE';
export type Vida38CivilizedReptilianGarmentLine38OE =
  | 'SCIENTIST'
  | 'MILITARY'
  | 'NOBLE'
  | 'EXPLORER'
  | 'TECHNO_PRIEST'
  | 'INDUSTRIAL_COLONIZER';
export type Vida38CivilizedReptilianCulture38OE =
  | 'STAR_KINGDOM'
  | 'BASILICA_TECHNOCRACY'
  | 'FRONTIER_HEGEMONY'
  | 'PELAGIC_CONCORD'
  | 'DUNE_MANDATE'
  | 'OBSIDIAN_CLAN';
export type Vida38CivilizedReptilianGarmentFamily38OE6 =
  | 'TECH_SUIT'
  | 'CEREMONIAL_ROBES'
  | 'SEGMENTED_ARMOR'
  | 'NOBLE_REGALIA'
  | 'COLONIAL_RIG'
  | 'PELAGIC_DRAPE';

interface Vida38CivilizedReptilianMorphology38OD {
  readonly level: Vida38CivilizedReptilianLevel38OD;
  readonly profile: Vida38CivilizedReptilianProfile38OD;
  readonly garmentLine: Vida38CivilizedReptilianGarmentLine38OE;
  readonly culture: Vida38CivilizedReptilianCulture38OE;
  readonly garmentFamily: Vida38CivilizedReptilianGarmentFamily38OE6;
  readonly garmentPrimaryHex: string;
  readonly garmentSecondaryHex: string;
  readonly dorsalHex: string;
  readonly snoutForward: number;
  readonly snoutWidthScale: number;
  readonly jawDrop: number;
  readonly jawWidthScale: number;
  readonly craniumLift: number;
  readonly headWidthScale: number;
  readonly neckStretch: number;
  readonly digitigradeBias: number;
  readonly tailLength: number;
  readonly crestHeight: number;
  readonly crestCount: number;
  readonly hornLength: number;
  readonly plateCount: number;
  readonly barbelLength: number;
  readonly shoulderScale: number;
  readonly armBulk: number;
  readonly legBulk: number;
  readonly torsoWidthBias: number;
  readonly handClawCount: number;
  readonly footClawCount: number;
  readonly eyeHueHex: string;
  readonly eyeSpacingScale: number;
  readonly eyeSizeScale: number;
  readonly neonAccentHex: string;
  readonly neonSecondaryHex: string;
  readonly suitLineBiasA: number;
  readonly suitLineBiasB: number;
  readonly suitLineBiasC: number;
  readonly identityPlan38OE2: Vida38ReptilianVisualPlan38OE2;
  readonly accessoryPlan38OE3: Vida38ReptilianAccessoryPlan38OE3;
}
interface Vida38CivilizedReptilianProfileTemplate38OE {
  readonly snoutForward: number;
  readonly snoutWidthScale: number;
  readonly jawDrop: number;
  readonly jawWidthScale: number;
  readonly craniumLift: number;
  readonly headWidthScale: number;
  readonly neckStretch: number;
  readonly digitigradeBias: number;
  readonly tailLength: number;
  readonly crestHeight: number;
  readonly crestCount: number;
  readonly hornLength: number;
  readonly plateCount: number;
  readonly barbelLength: number;
  readonly shoulderScale: number;
  readonly armBulk: number;
  readonly legBulk: number;
  readonly torsoWidthBias: number;
  readonly eyeSpacingScale: number;
  readonly eyeSizeScale: number;
  readonly eyeHueHex: string;
}
const PROFILE_LIBRARY_38OE: Record<Vida38CivilizedReptilianProfile38OD, Vida38CivilizedReptilianProfileTemplate38OE> = {
  LITHE_SCOUT: { snoutForward: 0.17, snoutWidthScale: 0.92, jawDrop: 0.05, jawWidthScale: 0.96, craniumLift: 0.04, headWidthScale: 0.96, neckStretch: 1.10, digitigradeBias: 0.16, tailLength: 0.94, crestHeight: 0.04, crestCount: 0, hornLength: 0.00, plateCount: 0, barbelLength: 0.00, shoulderScale: 0.98, armBulk: 0.94, legBulk: 0.95, torsoWidthBias: 0.01, eyeSpacingScale: 1.02, eyeSizeScale: 0.96, eyeHueHex: '#d8d067' },
  ROBUST_SENTINEL: { snoutForward: 0.19, snoutWidthScale: 1.08, jawDrop: 0.03, jawWidthScale: 1.12, craniumLift: 0.04, headWidthScale: 1.04, neckStretch: 0.98, digitigradeBias: 0.10, tailLength: 0.76, crestHeight: 0.08, crestCount: 2, hornLength: 0.00, plateCount: 2, barbelLength: 0.00, shoulderScale: 1.08, armBulk: 1.12, legBulk: 1.08, torsoWidthBias: 0.05, eyeSpacingScale: 0.97, eyeSizeScale: 0.92, eyeHueHex: '#d9a34c' },
  CREST_SCHOLAR: { snoutForward: 0.15, snoutWidthScale: 0.98, jawDrop: 0.03, jawWidthScale: 0.96, craniumLift: 0.08, headWidthScale: 0.98, neckStretch: 1.06, digitigradeBias: 0.13, tailLength: 0.86, crestHeight: 0.14, crestCount: 4, hornLength: 0.00, plateCount: 0, barbelLength: 0.00, shoulderScale: 1.00, armBulk: 0.96, legBulk: 1.00, torsoWidthBias: 0.00, eyeSpacingScale: 1.00, eyeSizeScale: 1.00, eyeHueHex: '#91d6f2' },
  AMPHIBIOUS_DIPLOMAT: { snoutForward: 0.12, snoutWidthScale: 1.12, jawDrop: 0.02, jawWidthScale: 1.06, craniumLift: 0.02, headWidthScale: 1.10, neckStretch: 1.02, digitigradeBias: 0.08, tailLength: 0.70, crestHeight: 0.03, crestCount: 0, hornLength: 0.00, plateCount: 1, barbelLength: 0.08, shoulderScale: 0.98, armBulk: 0.96, legBulk: 0.95, torsoWidthBias: 0.02, eyeSpacingScale: 1.08, eyeSizeScale: 1.05, eyeHueHex: '#88dbc8' },
  LONGNECK_SEER: { snoutForward: 0.16, snoutWidthScale: 0.88, jawDrop: 0.04, jawWidthScale: 0.90, craniumLift: 0.10, headWidthScale: 0.94, neckStretch: 1.18, digitigradeBias: 0.14, tailLength: 0.82, crestHeight: 0.10, crestCount: 3, hornLength: 0.00, plateCount: 0, barbelLength: 0.00, shoulderScale: 0.96, armBulk: 0.92, legBulk: 0.96, torsoWidthBias: -0.01, eyeSpacingScale: 0.98, eyeSizeScale: 0.98, eyeHueHex: '#b3e8ff' },
  BRACHYCEPHALIC_GUARD: { snoutForward: 0.08, snoutWidthScale: 1.16, jawDrop: 0.02, jawWidthScale: 1.18, craniumLift: 0.02, headWidthScale: 1.16, neckStretch: 0.94, digitigradeBias: 0.08, tailLength: 0.72, crestHeight: 0.02, crestCount: 0, hornLength: 0.00, plateCount: 2, barbelLength: 0.00, shoulderScale: 1.12, armBulk: 1.10, legBulk: 1.05, torsoWidthBias: 0.06, eyeSpacingScale: 1.10, eyeSizeScale: 0.92, eyeHueHex: '#ffbf8c' },
  HORNED_WARLORD: { snoutForward: 0.18, snoutWidthScale: 1.02, jawDrop: 0.05, jawWidthScale: 1.04, craniumLift: 0.05, headWidthScale: 1.00, neckStretch: 0.98, digitigradeBias: 0.12, tailLength: 0.88, crestHeight: 0.05, crestCount: 1, hornLength: 0.18, plateCount: 1, barbelLength: 0.00, shoulderScale: 1.10, armBulk: 1.08, legBulk: 1.06, torsoWidthBias: 0.04, eyeSpacingScale: 0.99, eyeSizeScale: 0.94, eyeHueHex: '#ffd37e' },
  PLATED_TITAN: { snoutForward: 0.16, snoutWidthScale: 1.00, jawDrop: 0.03, jawWidthScale: 1.02, craniumLift: 0.05, headWidthScale: 1.03, neckStretch: 0.96, digitigradeBias: 0.10, tailLength: 0.96, crestHeight: 0.08, crestCount: 2, hornLength: 0.00, plateCount: 4, barbelLength: 0.00, shoulderScale: 1.16, armBulk: 1.14, legBulk: 1.10, torsoWidthBias: 0.08, eyeSpacingScale: 0.98, eyeSizeScale: 0.90, eyeHueHex: '#bfe8a6' },
  EXTREME_DIGITIGRADE_HUNTER: { snoutForward: 0.20, snoutWidthScale: 0.94, jawDrop: 0.04, jawWidthScale: 0.96, craniumLift: 0.04, headWidthScale: 0.96, neckStretch: 1.00, digitigradeBias: 0.22, tailLength: 1.02, crestHeight: 0.06, crestCount: 2, hornLength: 0.00, plateCount: 0, barbelLength: 0.00, shoulderScale: 0.98, armBulk: 0.95, legBulk: 1.10, torsoWidthBias: -0.02, eyeSpacingScale: 0.96, eyeSizeScale: 0.88, eyeHueHex: '#d5f06c' },
  MARSH_ORACLE: { snoutForward: 0.14, snoutWidthScale: 0.96, jawDrop: 0.03, jawWidthScale: 0.94, craniumLift: 0.06, headWidthScale: 0.95, neckStretch: 1.08, digitigradeBias: 0.12, tailLength: 0.84, crestHeight: 0.12, crestCount: 3, hornLength: 0.07, plateCount: 0, barbelLength: 0.10, shoulderScale: 0.97, armBulk: 0.94, legBulk: 0.97, torsoWidthBias: 0.00, eyeSpacingScale: 1.00, eyeSizeScale: 1.00, eyeHueHex: '#7ad9b8' },
};
class Rng {
  constructor(private state: number) {}
  next(): number {
    let x = this.state || 0x12345678;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 0xffffffff;
  }
  range(min: number, max: number): number { return min + (max - min) * this.next(); }
}
function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }
function smoothstep(lo: number, hi: number, x: number): number {
  const t = clamp((x - lo) / Math.max(1e-6, hi - lo), 0, 1);
  return t * t * (3 - 2 * t);
}
function mixHex(a: string, b: string, factor: number): string {
  return `#${new THREE.Color(a).clone().lerp(new THREE.Color(b), factor).getHexString()}`;
}
function material(colorHex: string, roughness: number, metalness: number, opacity = 1): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorHex), roughness, metalness, opacity,
    transparent: opacity < 1, depthWrite: opacity >= 1,
    clearcoat: 0.18, sheen: 0.06, thickness: 0.16,
    side: THREE.DoubleSide,
  });
}
function civilizationLevelFrom(contract: Vida38SpeciesVisualContract): Vida38CivilizedReptilianLevel38OD {
  const intelligence = contract.intelligence as unknown as Record<string, unknown> | null;
  const probeValues: string[] = [];
  const push = (v: unknown): void => {
    if (v === null || v === undefined) return;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') probeValues.push(String(v).toUpperCase());
  };
  if (intelligence) {
    push(intelligence['civilizationLevel']);
    push(intelligence['civilisationLevel']);
    push(intelligence['societyLevel']);
    push(intelligence['stage']);
    push(intelligence['civilizationStage']);
    push((intelligence['civilization'] as Record<string, unknown> | undefined)?.['level']);
    push((intelligence['society'] as Record<string, unknown> | undefined)?.['level']);
  }
  push((contract as unknown as Record<string, unknown>)['civilizationLevel']);
  push((contract as unknown as Record<string, unknown>)['technologyLevel']);
  const blob = JSON.stringify(contract.intelligence ?? {}) + ' ' + JSON.stringify(contract ?? {});
  const upperBlob = blob.toUpperCase();
  if (probeValues.some(v => v.includes('VERY_ADVANCED')) || upperBlob.includes('VERY_ADVANCED')) return 'VERY_ADVANCED';
  if (probeValues.some(v => v.includes('ADVANCED')) || upperBlob.includes('ADVANCED')) return 'ADVANCED';
  return 'PRIMITIVE';
}
function deriveMorphology38OD(contract: Vida38SpeciesVisualContract): Vida38CivilizedReptilianMorphology38OD {
  const variation = selectVida38ReptilianVariation38OE1(contract.speciesId, contract.appearanceFingerprint);
  const identityPlan38OE2 = deriveVida38ReptilianVisualPlan38OE2({speciesId:contract.speciesId,appearanceFingerprint:contract.appearanceFingerprint,primaryColorHex:contract.pigmentation.primaryColorHex,secondaryColorHex:contract.pigmentation.secondaryColorHex,bodyLengthMeters:contract.bodyLengthMeters});
  const rng = new Rng(variation.anatomySeed ^ 0x5f3759df);
  const profile = variation.profile;
  const template = PROFILE_LIBRARY_38OE[profile];
  const level = civilizationLevelFrom(contract);
  const garmentLine = variation.garmentLine;
  const culture = variation.culture;
  const accessoryPlan38OE3 = deriveVida38ReptilianAccessoryPlan38OE3({speciesId:contract.speciesId,appearanceFingerprint:contract.appearanceFingerprint,profile,garmentLine,culture});
  const garmentFamily = selectVida38WardrobeFamily38OE8B({
    seed: variation.anatomySeed ^ contract.speciesId.length ^ contract.appearanceFingerprint.length,
    level, garmentLine, culture, profile,
  });
  const diversityPlan38OE9 = deriveVida38CulturalDiversityPlan38OE9(contract);
  const accent = contract.pigmentation.secondaryColorHex;
  const materialPrimaryTint = diversityPlan38OE9.material === 'POLISHED_METAL' ? '#3a4a5a'
    : diversityPlan38OE9.material === 'MATTE_COMPOSITE' ? '#10161e'
      : diversityPlan38OE9.material === 'BIO_MEMBRANE' ? '#10242a'
        : diversityPlan38OE9.material === 'RITUAL_STONEWEAVE' ? '#17171d'
          : diversityPlan38OE9.material === 'FLEX_INDUSTRIAL' ? '#1a2027'
            : diversityPlan38OE9.material === 'TECH_WEAVE' ? '#13202a' : '#16202b';
  const materialAccentTint = diversityPlan38OE9.material === 'POLISHED_METAL' ? '#b7cad7'
    : diversityPlan38OE9.material === 'MATTE_COMPOSITE' ? '#7fa0b8'
      : diversityPlan38OE9.material === 'BIO_MEMBRANE' ? '#90f5ef'
        : diversityPlan38OE9.material === 'RITUAL_STONEWEAVE' ? '#87d6da'
          : diversityPlan38OE9.material === 'FLEX_INDUSTRIAL' ? '#71d0b6'
            : diversityPlan38OE9.material === 'TECH_WEAVE' ? '#7adfff' : '#79c9ff';
  const ornamentBoost = diversityPlan38OE9.adornment === 'ORNATE' ? 0.16
    : diversityPlan38OE9.adornment === 'INSCRIBED' ? 0.10
      : diversityPlan38OE9.adornment === 'LUMINOUS' ? 0.20
        : diversityPlan38OE9.adornment === 'TRIMMED' ? 0.07 : 0.03;
  const garmentPrimaryHex = level === 'PRIMITIVE'
    ? mixHex(accent, '#5e4130', 0.44)
    : level === 'ADVANCED'
      ? mixHex(accent, '#24303b', 0.28)
      : mixHex(
        garmentFamily === 'CEREMONIAL_ROBES' ? '#0f1722' : garmentFamily === 'SEGMENTED_ARMOR' ? '#0a1018' : garmentFamily === 'NOBLE_REGALIA' ? '#0c1624' : garmentFamily === 'COLONIAL_RIG' ? '#10161c' : garmentFamily === 'PELAGIC_DRAPE' ? '#0b1a22' : (garmentLine === 'MILITARY' ? '#08111b' : garmentLine === 'NOBLE' ? '#0b1220' : garmentLine === 'SCIENTIST' ? '#0d1620' : garmentLine === 'TECHNO_PRIEST' ? '#06131b' : garmentLine === 'INDUSTRIAL_COLONIZER' ? '#10161e' : '#0b1522'),
        materialPrimaryTint,
        0.26 + ornamentBoost * 0.25,
      );
  const garmentSecondaryHex = level === 'PRIMITIVE'
    ? mixHex(contract.pigmentation.primaryColorHex, '#d5c1a2', 0.58)
    : level === 'ADVANCED'
      ? mixHex(accent, '#d8e8f2', 0.18)
      : mixHex(
        garmentFamily === 'CEREMONIAL_ROBES' ? '#56d6ff' : garmentFamily === 'SEGMENTED_ARMOR' ? '#6eb6ff' : garmentFamily === 'NOBLE_REGALIA' ? '#7ce8ff' : garmentFamily === 'COLONIAL_RIG' ? '#58d8b8' : garmentFamily === 'PELAGIC_DRAPE' ? '#87f1ef' : (garmentLine === 'MILITARY' ? '#2ca8ff' : garmentLine === 'NOBLE' ? '#1e8fff' : garmentLine === 'SCIENTIST' ? '#79eaff' : garmentLine === 'TECHNO_PRIEST' ? '#50e3d5' : garmentLine === 'INDUSTRIAL_COLONIZER' ? '#5eb8ff' : '#68d7ff'),
        materialAccentTint,
        0.22 + ornamentBoost * 0.18,
      );
  const neonAccentHex = level === 'VERY_ADVANCED'
    ? mixHex(
      garmentFamily === 'SEGMENTED_ARMOR' ? '#4aaeff' : garmentFamily === 'COLONIAL_RIG' ? '#47ffb7' : garmentFamily === 'CEREMONIAL_ROBES' ? '#4ef1ff' : garmentFamily === 'NOBLE_REGALIA' ? '#5cb8ff' : garmentFamily === 'PELAGIC_DRAPE' ? '#72fff3' : (garmentLine === 'MILITARY' ? '#43b6ff' : garmentLine === 'NOBLE' ? '#4bc4ff' : garmentLine === 'SCIENTIST' ? '#7bfff1' : garmentLine === 'TECHNO_PRIEST' ? '#37f0b6' : garmentLine === 'INDUSTRIAL_COLONIZER' ? '#35f0a8' : '#42f1ff'),
      materialAccentTint,
      diversityPlan38OE9.adornment === 'LUMINOUS' ? 0.35 : 0.18,
    )
    : mixHex(garmentSecondaryHex, '#dde8ef', 0.1);
  const neonSecondaryHex = level === 'VERY_ADVANCED'
    ? mixHex(
      garmentFamily === 'NOBLE_REGALIA' ? '#68e6ff' : culture === 'BASILICA_TECHNOCRACY' ? '#24d99d' : culture === 'PELAGIC_CONCORD' ? '#42f0db' : culture === 'DUNE_MANDATE' ? '#4dd2ff' : '#38ffb7',
      materialAccentTint,
      diversityPlan38OE9.adornment === 'LUMINOUS' ? 0.24 : 0.12,
    )
    : mixHex(garmentPrimaryHex, garmentSecondaryHex, 0.2);
  const lineBiasMap: Record<Vida38CivilizedReptilianGarmentLine38OE, [number, number, number]> = {
    SCIENTIST: [0.94, 0.28, 0.20],
    MILITARY: [0.26, 0.96, 0.34],
    NOBLE: [0.72, 0.54, 0.88],
    EXPLORER: [0.64, 0.44, 0.30],
    TECHNO_PRIEST: [0.44, 0.22, 1.00],
    INDUSTRIAL_COLONIZER: [0.18, 0.82, 0.58],
  };
  const [suitLineBiasA, suitLineBiasB, suitLineBiasC] = lineBiasMap[garmentLine];
  return {
    level,
    profile,
    garmentLine,
    culture,
    garmentFamily,
    garmentPrimaryHex,
    garmentSecondaryHex,
    dorsalHex: mixHex(contract.pigmentation.primaryColorHex, '#182028', 0.24),
    snoutForward: template.snoutForward + rng.range(-0.012, 0.012),
    snoutWidthScale: template.snoutWidthScale + rng.range(-0.04, 0.04),
    jawDrop: template.jawDrop + rng.range(-0.008, 0.008),
    jawWidthScale: template.jawWidthScale + rng.range(-0.05, 0.05),
    craniumLift: template.craniumLift + rng.range(-0.015, 0.015),
    headWidthScale: template.headWidthScale + rng.range(-0.03, 0.03),
    neckStretch: template.neckStretch + rng.range(-0.04, 0.04),
    digitigradeBias: template.digitigradeBias + rng.range(-0.018, 0.018),
    tailLength: template.tailLength + rng.range(-0.04, 0.04),
    crestHeight: template.crestHeight + rng.range(-0.012, 0.012),
    crestCount: template.crestCount,
    hornLength: template.hornLength + rng.range(-0.015, 0.015),
    plateCount: template.plateCount,
    barbelLength: template.barbelLength + rng.range(-0.01, 0.01),
    shoulderScale: template.shoulderScale + rng.range(-0.03, 0.03),
    armBulk: template.armBulk + rng.range(-0.03, 0.03),
    legBulk: template.legBulk + rng.range(-0.03, 0.03),
    torsoWidthBias: template.torsoWidthBias + rng.range(-0.01, 0.01),
    handClawCount: profile === 'PLATED_TITAN' ? 3 : 4,
    footClawCount: profile === 'EXTREME_DIGITIGRADE_HUNTER' ? 4 : 3,
    eyeHueHex: template.eyeHueHex,
    eyeSpacingScale: template.eyeSpacingScale + rng.range(-0.03, 0.03),
    eyeSizeScale: template.eyeSizeScale + rng.range(-0.05, 0.05),
    neonAccentHex,
    neonSecondaryHex,
    suitLineBiasA,
    suitLineBiasB,
    suitLineBiasC,
    identityPlan38OE2,
    accessoryPlan38OE3,
  };
}
function createHumanoidCloneContract(contract: Vida38SpeciesVisualContract): Vida38SpeciesVisualContract {
  return {
    ...contract,
    morphology: {
      ...contract.morphology,
      group: 'HUMANOIDS',
      bodyPlan: 'BIPED',
      covering: 'SCALES',
      appendagePairs: 2,
    },
    locomotion: 'WALKING',
  } as Vida38SpeciesVisualContract;
}

function morphRawMeshToReptilian38OD(raw: Vida38HumanoidRawMesh, anatomy: Vida38HumanoidAnatomy, morphology: Vida38CivilizedReptilianMorphology38OD): Vida38HumanoidRawMesh {
  const positions = new Float32Array(raw.positions);
  const normals = new Float32Array(raw.normals);
  const { eyeY } = deriveVida38HumanoidFaceLandmarks38GC(anatomy);
  const headCenterY = eyeY + anatomy.eyeRadius * 0.24;
  const snoutStartY = eyeY - anatomy.eyeRadius * 0.7;
  for (let i = 0; i < positions.length; i += 3) {
    let x = positions[i]!;
    let y = positions[i + 1]!;
    let z = positions[i + 2]!;

    const headMask = smoothstep(headCenterY - anatomy.headHeight * 0.95, headCenterY + anatomy.headHeight * 0.8, y);
    const facialMask = headMask * smoothstep(-0.03, 0.19, z) * (1 - smoothstep(anatomy.jawWidth * 1.18, anatomy.jawWidth * 1.9, Math.abs(x)));
    const jawMask = smoothstep(snoutStartY - 0.14, eyeY - 0.02, y) * smoothstep(0.02, 0.23, z) * (1 - smoothstep(anatomy.jawWidth * 1.1, anatomy.jawWidth * 1.8, Math.abs(x)));
    const browMask = smoothstep(eyeY - 0.01, eyeY + anatomy.eyeRadius * 2.0, y) * smoothstep(0.03, 0.16, z);
    const craniumMask = smoothstep(headCenterY, headCenterY + anatomy.headHeight * 0.95, y) * (1 - smoothstep(0.0, 0.18, z));

    z += facialMask * morphology.snoutForward;
    x *= (1 - facialMask * 0.18) * (1 + facialMask * (morphology.snoutWidthScale - 1));
    y -= jawMask * morphology.jawDrop;
    z += jawMask * morphology.snoutForward * 0.48;
    x *= 1 + jawMask * (morphology.jawWidthScale - 1) * 0.55;
    z -= browMask * 0.014;
    y += craniumMask * morphology.craniumLift;
    z -= craniumMask * morphology.craniumLift * 0.26;
    x *= 1 + headMask * (morphology.headWidthScale - 1) * 0.42;

    const neckMask = smoothstep(anatomy.legLength + anatomy.torsoLength * 0.98, anatomy.legLength + anatomy.torsoLength * 1.18, y) * (1 - smoothstep(0.18, 0.36, Math.abs(x)));
    y += (y - (anatomy.legLength + anatomy.torsoLength * 0.98)) * (morphology.neckStretch - 1) * neckMask;
    z -= neckMask * 0.03;

    const torsoMask = smoothstep(anatomy.legLength + anatomy.torsoLength * 0.18, anatomy.legLength + anatomy.torsoLength * 0.96, y) * (1 - smoothstep(0.0, anatomy.shoulderWidth * 1.4, Math.abs(x)));
    z += torsoMask * smoothstep(-0.18, 0.12, z) * 0.02;
    x *= 1 + torsoMask * (Math.abs(x) / Math.max(0.001, anatomy.shoulderWidth)) * (0.025 + morphology.torsoWidthBias);
    const shoulderMask = smoothstep(anatomy.legLength + anatomy.torsoLength * 0.72, anatomy.legLength + anatomy.torsoLength * 1.02, y);
    x *= 1 + shoulderMask * (morphology.shoulderScale - 1) * 0.38;

    const legMask = 1 - smoothstep(anatomy.legLength * 0.82, anatomy.legLength + anatomy.torsoLength * 0.04, y);
    const calfMask = legMask * smoothstep(0.06, anatomy.hipWidth * 1.26, Math.abs(x)) * smoothstep(-0.05, 0.28, z);
    z += calfMask * morphology.digitigradeBias * smoothstep(anatomy.legLength * 0.18, anatomy.legLength * 0.76, y);
    const heelMask = legMask * (1 - smoothstep(anatomy.legLength * 0.16, anatomy.legLength * 0.44, y));
    z += heelMask * morphology.digitigradeBias * 0.46;
    x *= 1 + legMask * (morphology.legBulk - 1) * 0.22;

    const handMask = smoothstep(anatomy.legLength + anatomy.torsoLength * 0.12, anatomy.legLength + anatomy.torsoLength * 0.9, y) * smoothstep(anatomy.shoulderWidth * 1.02, anatomy.shoulderWidth * 1.76, Math.abs(x));
    z += handMask * 0.03;
    x *= 1 + handMask * (morphology.armBulk - 1) * 0.18;

    positions[i] = x;
    positions[i + 1] = y;
    positions[i + 2] = z;
    normals[i] = 0;
    normals[i + 1] = 0;
    normals[i + 2] = 1;
  }
  return {
    ...raw,
    positions,
    normals,
  };
}


/** El cuerpo continuo es la única fuente de coordenadas anatómicas.
 * Las proyecciones parten de la geometría SDF ya deformada, NUNCA de alturas
 * negativas de un supuesto maniquí con origen en la pelvis. */
function surfaceAt38OD(body: THREE.Mesh, x: number, y: number, from: 'FRONT'|'BACK'|'TOP'): THREE.Vector3 | null {
  const origin = from === 'TOP'
    ? new THREE.Vector3(x, 5, y)
    : new THREE.Vector3(x, y, from === 'FRONT' ? 3 : -3);
  const direction = from === 'TOP'
    ? new THREE.Vector3(0, -1, 0)
    : new THREE.Vector3(0, 0, from === 'FRONT' ? -1 : 1);
  const ray = new THREE.Raycaster(origin, direction, 0, 8);
  body.updateMatrixWorld(true);
  const hit = ray.intersectObject(body, false)[0];
  return hit?.point.clone() ?? null;
}
function addSurfaceDetail38OD(subject: THREE.Group, created: THREE.Object3D[], detail: THREE.Mesh, name: string): void {
  detail.name = name;
  subject.add(detail);
  created.push(detail);
}

function addEyes38OD(subject: THREE.Group, created: THREE.Object3D[], body: THREE.Mesh, a: Vida38HumanoidAnatomy, m: Vida38CivilizedReptilianMorphology38OD): void {
  for (const side of [-1, 1] as const) {
    const frame = deriveVida38CivilReptilianOrbitalFrame38OE4(body, a, m, side);
    if (!frame) continue;
    for (const mesh of createVida38CivilReptilianEyeMeshes38OE4(frame, m.eyeHueHex)) {
      addSurfaceDetail38OD(subject, created, mesh, mesh.name);
    }
  }
}
function addTeeth38OD(subject: THREE.Group, created: THREE.Object3D[], body: THREE.Mesh, a: Vida38HumanoidAnatomy): void {
  const { lipY } = deriveVida38HumanoidFaceLandmarks38GC(a);
  for (let i = 0; i < 8; i++) {
    const x = (i - 3.5) * a.jawWidth * 0.20;
    const hit = surfaceAt38OD(body, x, lipY, 'FRONT');
    if (!hit) continue;
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.028, 5), material('#e9dfcf', 0.30, 0));
    tooth.rotation.z = Math.PI;
    tooth.position.copy(hit).add(new THREE.Vector3(0, -0.006, 0.003));
    addSurfaceDetail38OD(subject, created, tooth, 'VIDA38_2OD_REPTILIAN_TOOTH');
  }
}
function addClaws38OD(subject: THREE.Group, created: THREE.Object3D[], body: THREE.Mesh, a: Vida38HumanoidAnatomy, m: Vida38CivilizedReptilianMorphology38OD): void {
  const handY = a.legLength + 0.55 - a.armReach - 0.13 * a.fingerLength;
  const wristX = a.shoulderWidth + 0.075;
  for (const side of [-1, 1]) {
    for (let i = 0; i < m.handClawCount; i++) {
      const x = side * (wristX + (i - 1.5) * 0.018);
      const hit = surfaceAt38OD(body, x, handY, 'FRONT');
      if (!hit) continue;
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.005, 0.044, 5), material('#d8cfbb', 0.4, 0.01));
      claw.rotation.z = Math.PI;
      claw.position.copy(hit).add(new THREE.Vector3(0, -0.015, 0.008));
      addSurfaceDetail38OD(subject, created, claw, 'VIDA38_2OD_REPTILIAN_CLAW');
    }
    for (let i = 0; i < m.footClawCount; i++) {
      const x = side * (a.hipWidth * 0.61 * a.hipSpacing + (i - 1) * 0.039);
      const hit = surfaceAt38OD(body, x, 0.055, 'FRONT');
      if (!hit) continue;
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.052, 5), material('#d6ceba', 0.39, 0.02));
      claw.rotation.x = Math.PI / 2;
      claw.position.copy(hit).add(new THREE.Vector3(0, 0.005, 0.015));
      addSurfaceDetail38OD(subject, created, claw, 'VIDA38_2OD_REPTILIAN_CLAW');
    }
  }
}
function addCrests38OD(subject: THREE.Group, created: THREE.Object3D[], body: THREE.Mesh, _a: Vida38HumanoidAnatomy, m: Vida38CivilizedReptilianMorphology38OD): void {
  if (m.crestHeight < 0.035 || m.crestCount === 0) return;
  const geometry = body.geometry as THREE.BufferGeometry;
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return;
  const heightSpan = box.max.y - box.min.y;
  for (let i = 0; i < m.crestCount; i++) {
    const z = -0.015 - i * 0.052;
    const desiredY = box.max.y - i * Math.min(heightSpan * 0.035, 0.065);
    const hit = surfaceAnchor38OE1(body, new THREE.Vector3(0, desiredY, z), 'TOP', 0.78);
    if (!hit) continue;
    const height = Math.max(0.025, m.crestHeight * (1 - i * 0.12));
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.020, height, 7), material(m.dorsalHex, 0.62, 0.01));
    crest.position.copy(hit).add(new THREE.Vector3(0, height * 0.43, 0));
    addSurfaceDetail38OD(subject, created, crest, 'VIDA38_2OD_REPTILIAN_CREST');
  }
}
/** Búsqueda de anclaje en la malla SDF real. Evita rayos aislados que
 * pueden no intersectar la cabeza o dejar sin adornos a familias enteras. */
function surfaceAnchor38OE1(
  body: THREE.Mesh,
  target: THREE.Vector3,
  hemisphere: 'FRONT' | 'TOP',
  minFractionY: number,
): THREE.Vector3 | null {
  const geometry = body.geometry as THREE.BufferGeometry;
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  if (!bounds || positions.count === 0) return null;
  const yMinimum = bounds.min.y + (bounds.max.y - bounds.min.y) * minFractionY;
  let bestScore = Number.POSITIVE_INFINITY;
  let best: THREE.Vector3 | null = null;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    if (y < yMinimum) continue;
    if (hemisphere === 'FRONT' && z < -0.04) continue;
    // Para placas dorsales/craneales se prefiere el contorno superior real.
    const score = Math.abs(x - target.x) * 2.2
      + Math.abs(y - target.y) * (hemisphere === 'TOP' ? 1.4 : 1.9)
      + Math.abs(z - target.z) * (hemisphere === 'TOP' ? 1.25 : 0.28)
      - (hemisphere === 'TOP' ? y * 0.16 : z * 0.04);
    if (score < bestScore) {
      bestScore = score;
      best = new THREE.Vector3(x, y, z);
    }
  }
  return best;
}
function addHornsPlatesBarbels38OE(subject: THREE.Group, created: THREE.Object3D[], body: THREE.Mesh, a: Vida38HumanoidAnatomy, m: Vida38CivilizedReptilianMorphology38OD): void {
  const { eyeY, lipY } = deriveVida38HumanoidFaceLandmarks38GC(a);
  const geom = body.geometry as THREE.BufferGeometry;
  geom.computeBoundingBox();
  const bb = geom.boundingBox;
  if (!bb) return;
  const height = bb.max.y - bb.min.y;
  const headBandStart = bb.min.y + height * 0.74;
  if (m.hornLength > 0.035) {
    for (const side of [-1, 1]) {
      const x = side * a.eyeSpacing * 0.94 * m.eyeSpacingScale;
      const hornBase = surfaceAnchor38OE1(body, new THREE.Vector3(x, eyeY + a.eyeRadius * 1.3, 0.11), 'FRONT', 0.74);
      if (!hornBase) continue;
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.018, m.hornLength, 6), material(m.dorsalHex, 0.52, 0.02));
      horn.position.copy(hornBase).add(new THREE.Vector3(side * 0.018, m.hornLength * 0.42, 0.016));
      horn.rotation.z = -side * 0.22;
      horn.rotation.x = 0.10;
      addSurfaceDetail38OD(subject, created, horn, 'VIDA38_2OE_REPTILIAN_HORN');
    }
  }
  if (m.plateCount > 0) {
    for (let i = 0; i < m.plateCount; i++) {
      const desiredY = bb.max.y - 0.025 - i * Math.min(height * 0.04, 0.07);
      const z = -0.01 - i * 0.04;
      const hit = surfaceAnchor38OE1(body, new THREE.Vector3(0, desiredY, z), 'TOP', 0.76);
      if (!hit) continue;
      const plateHeight = 0.05 + i * 0.01;
      const plate = new THREE.Mesh(new THREE.ConeGeometry(0.022, plateHeight, 5), material(mixHex(m.dorsalHex, '#24313c', 0.20), 0.58, 0.02));
      plate.position.copy(hit).add(new THREE.Vector3(0, plateHeight * 0.44, 0));
      addSurfaceDetail38OD(subject, created, plate, 'VIDA38_2OE_REPTILIAN_PLATE');
    }
  }
  if (m.barbelLength > 0.025) {
    for (const side of [-1, 1]) {
      const x = side * a.jawWidth * 0.28;
      const targetY = Math.max(headBandStart, lipY - 0.04);
      const chin = surfaceAnchor38OE1(body, new THREE.Vector3(x, targetY, 0.16), 'FRONT', 0.72);
      if (!chin) continue;
      const barbel = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.012, m.barbelLength, 5), material(mixHex(m.dorsalHex, '#364954', 0.16), 0.70, 0.01));
      barbel.position.copy(chin).add(new THREE.Vector3(0, -m.barbelLength * 0.48, 0.014));
      addSurfaceDetail38OD(subject, created, barbel, 'VIDA38_2OE_REPTILIAN_BARBEL');
    }
  }
}

/** Los nombres históricos son marcadores sin geometría para compatibilidad de las
 * pruebas antiguas. La cola de verdad está fusionada en el SDF de la piel. */
function registerIntegratedTail38OD5(subject:THREE.Group,created:THREE.Object3D[]):void {
  for(const name of ['VIDA38_2OD_REPTILIAN_TAIL','VIDA38_2OD_REPTILIAN_TAIL_BASE']) {
    const marker=new THREE.Group(); marker.name=name;
    marker.userData['integratedIntoBodySdf38OD5']=true;
    subject.add(marker); created.push(marker);
  }
}

/** Prendas conformadas sobre triángulos de la piel SDF: ninguna pieza puede
 * aparecer debajo de los pies ni quedar flotando en espacio absoluto. */
function fittedGarment38OD(body: THREE.Mesh, name: string, colorHex: string, roughness: number, metallic: number,
  choose: (x: number, y: number, z: number, nx: number, ny: number, nz: number) => boolean,
  offset = 0.008,
): THREE.Mesh | null {
  const geometry = body.geometry as THREE.BufferGeometry;
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  const normals = geometry.getAttribute('normal') as THREE.BufferAttribute;
  const index = geometry.getIndex();
  if (!index) return null;
  const vertices: number[] = [];
  const normalArray: number[] = [];
  for (let f = 0; f < index.count; f += 3) {
    const i0 = index.getX(f), i1 = index.getX(f + 1), i2 = index.getX(f + 2);
    const ids = [i0, i1, i2];
    const x = (positions.getX(i0) + positions.getX(i1) + positions.getX(i2)) / 3;
    const y = (positions.getY(i0) + positions.getY(i1) + positions.getY(i2)) / 3;
    const z = (positions.getZ(i0) + positions.getZ(i1) + positions.getZ(i2)) / 3;
    const nx = (normals.getX(i0) + normals.getX(i1) + normals.getX(i2)) / 3;
    const ny = (normals.getY(i0) + normals.getY(i1) + normals.getY(i2)) / 3;
    const nz = (normals.getZ(i0) + normals.getZ(i1) + normals.getZ(i2)) / 3;
    if (!choose(x, y, z, nx, ny, nz)) continue;
    for (const id of ids) {
      const a = new THREE.Vector3(normals.getX(id), normals.getY(id), normals.getZ(id)).normalize();
      vertices.push(positions.getX(id) + a.x * offset, positions.getY(id) + a.y * offset, positions.getZ(id) + a.z * offset);
      normalArray.push(a.x, a.y, a.z);
    }
  }
  if (vertices.length < 18) return null;
  const garmentGeometry = new THREE.BufferGeometry();
  garmentGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  garmentGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normalArray, 3));
  garmentGeometry.computeBoundingSphere();
  const garment = new THREE.Mesh(garmentGeometry, material(colorHex, roughness, metallic));
  garment.name = name;
  garment.castShadow = false;
  return garment;
}
/** Revestimiento continuo de 360° para tecnología interestelar.
 * Sigue todos los vértices de la piel SDF (pecho, espalda, brazos, piernas y pies).
 * Las zonas no revestidas se recortan por fragmento: sin bordes de triángulos.
 * Abertura posterior alrededor de la raíz de la cola. */
function addVeryAdvancedSuit38OD5(subject:THREE.Group, created:THREE.Object3D[], body:THREE.Mesh, a:Vida38HumanoidAnatomy, m:Vida38CivilizedReptilianMorphology38OD):void {
  const geometry=(body.geometry as THREE.BufferGeometry).clone();
  const positions=geometry.getAttribute('position') as THREE.BufferAttribute;
  const normals=geometry.getAttribute('normal') as THREE.BufferAttribute;
  for(let i=0;i<positions.count;i++) {
    const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
    const offset=0.0095;
    positions.setXYZ(i,x+normals.getX(i)*offset,y+normals.getY(i)*offset,z+normals.getZ(i)*offset);
  }
  positions.needsUpdate=true;
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  const suit=new THREE.MeshPhysicalMaterial({
    color:m.garmentPrimaryHex,roughness:0.26,metalness:0.52,clearcoat:0.42,clearcoatRoughness:0.18,
    side:THREE.DoubleSide,depthWrite:true,transparent:false,
  });
  const mark=m.identityPlan38OE2;
  const shaderUniforms={
    vida38SuitMeasures:{value:new THREE.Vector2(a.legLength+a.torsoLength*0.93,a.legLength)},
    vida38SuitNeonA:{value:new THREE.Color(m.neonAccentHex)},
    vida38SuitNeonB:{value:new THREE.Color(m.neonSecondaryHex)},
    vida38SuitSecondary:{value:new THREE.Color(m.garmentSecondaryHex)},
    vida38SuitGains:{value:new THREE.Vector3(0.28+m.suitLineBiasA*0.88,0.24+m.suitLineBiasB*0.92,0.18+m.suitLineBiasC*0.92)},
    vida38MarkA:{value:new THREE.Vector4(a.legLength+mark.barHeight,mark.barSpacing,mark.barSide*mark.barOffset,mark.barSlope)},
    vida38MarkB:{value:new THREE.Vector4(mark.barWidth,mark.barLength,mark.barCount,mark.dorsalPhase)},
  };
  suit.onBeforeCompile=(shader:{vertexShader:string;fragmentShader:string;uniforms:Record<string,{value:unknown}>})=>{
    for(const [name,uniform] of Object.entries(shaderUniforms)) shader.uniforms[name]=uniform;
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nvarying vec3 vVida38SuitPoint;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvVida38SuitPoint=position;');
    shader.fragmentShader=shader.fragmentShader
      .replace('#include <common>',`#include <common>
      varying vec3 vVida38SuitPoint;
      uniform vec2 vida38SuitMeasures;
      uniform vec3 vida38SuitNeonA;
      uniform vec3 vida38SuitNeonB;
      uniform vec3 vida38SuitSecondary;
      uniform vec3 vida38SuitGains;
      uniform vec4 vida38MarkA;
      uniform vec4 vida38MarkB;
      float vida38SuitSmooth(float a,float b,float v){return smoothstep(a,b,v);}`)
      .replace('#include <color_fragment>',`#include <color_fragment>
      vec3 sp=vVida38SuitPoint;
      float hipY=vida38SuitMeasures.y;
      if(sp.y>vida38SuitMeasures.x || (sp.z< -0.28 && abs(sp.x)<0.20 && sp.y>hipY-0.53 && sp.y<hipY+0.19)) discard;
      float back=vida38SuitSmooth(0.07,0.24,-sp.z);
      float torso=vida38SuitSmooth(hipY+0.02,hipY+0.19,sp.y) * (1.0-vida38SuitSmooth(hipY+0.83,hipY+0.98,sp.y));
      vec3 suitBase=mix(vec3(0.010,0.020,0.036),vida38SuitSecondary,0.22+0.12*back);
      float cyanBelt=exp(-pow((sp.y-(hipY+0.045))/0.034,2.0));
      float blueEdge=exp(-pow((abs(sp.x)-0.31)/0.045,2.0))*torso;
      float frontDiag=exp(-pow((sp.x-(sp.y-(hipY+0.48))*0.32)/0.060,2.0))*torso*vida38SuitSmooth(-0.02,0.15,sp.z);
      float backSpine=(1.0-vida38SuitSmooth(0.02,0.065,abs(sp.x)))*back*torso;
      float dorsalMark=exp(-pow((fract((sp.y-hipY)*3.0+vida38MarkB.w)-0.5)/0.08,2.0))*backSpine;
      float shoulderArc=exp(-pow((abs(sp.x)-0.28)/0.06,2.0))*vida38SuitSmooth(hipY+0.56,hipY+0.86,sp.y);
      float chestBars=exp(-pow((sp.y-(hipY+0.60))/0.028,2.0))*vida38SuitSmooth(-0.03,0.10,sp.z)*(1.0-vida38SuitSmooth(0.02,0.18,abs(sp.x)));
      float boot=(1.0-vida38SuitSmooth(0.13,0.28,sp.y));
      float bootTrim=exp(-pow((sp.y-0.11)/0.023,2.0))*boot;
      float ritualCrown=exp(-pow((sp.y-(hipY+0.77))/0.026,2.0))*vida38SuitSmooth(-0.02,0.16,sp.z)*(1.0-vida38SuitSmooth(0.05,0.25,abs(sp.x)));
      float greenTrace=max(cyanBelt*0.42,max(backSpine*0.52,dorsalMark*0.30));
      float cyanTrace=max(blueEdge*0.30,frontDiag*vida38SuitGains.x);
      float shoulderTrace=shoulderArc*vida38SuitGains.y;
      float ritualTrace=max(chestBars,ritualCrown)*vida38SuitGains.z;
      float personalTrace=0.0;
      for(int markIndex=0;markIndex<3;markIndex++) {
        if(float(markIndex)>=vida38MarkB.z) break;
        float markerY=vida38MarkA.x+float(markIndex)*vida38MarkA.y;
        float markerX=vida38MarkA.z+(sp.y-markerY)*vida38MarkA.w;
        float cross=exp(-pow((sp.y-markerY)/vida38MarkB.x,2.0));
        float extent=1.0-vida38SuitSmooth(vida38MarkB.y*0.74,vida38MarkB.y,abs(sp.x-markerX));
        float visible=vida38SuitSmooth(0.05,0.18,sp.z);
        personalTrace=max(personalTrace,cross*extent*visible*torso);
      }
      suitBase=mix(suitBase,vec3(0.020,0.072,0.11),boot*0.66);
      suitBase=mix(suitBase,vida38SuitNeonB,clamp(greenTrace+bootTrim*0.46,0.0,0.78));
      suitBase=mix(suitBase,vida38SuitNeonA,clamp(cyanTrace+shoulderTrace*0.48,0.0,0.84));
      suitBase=mix(suitBase,vida38SuitSecondary,clamp(ritualTrace*0.45,0.0,0.55));
      suitBase=mix(suitBase,vida38SuitNeonB,clamp(personalTrace*0.82,0.0,0.82));
      diffuseColor.rgb=suitBase;`)
      .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
       totalEmissiveRadiance+=vida38SuitNeonB*clamp(greenTrace*0.36+bootTrim*0.22,0.0,1.0);
       totalEmissiveRadiance+=vida38SuitNeonA*clamp(cyanTrace*0.42+shoulderTrace*0.20,0.0,1.0);
       totalEmissiveRadiance+=vida38SuitSecondary*clamp(ritualTrace*0.16,0.0,0.55);
       totalEmissiveRadiance+=vida38SuitNeonB*clamp(personalTrace*0.24,0.0,0.32);`);
  };
  suit.customProgramCacheKey=()=> 'vida38-2oe2-reptilian-suit-360-uniforms';
  const mesh=new THREE.Mesh(geometry,suit);
  mesh.name='VIDA38_2OD_REPTILIAN_GARMENT';
  mesh.userData['garmentCoverage38OD5']='FULL_360';
  mesh.userData['colorPalette38OD5']='BLACK_BLUE_GREEN_NEON';
  mesh.userData['tailOpening38OD5']=true;
  mesh.userData['garmentLine38OE']=m.garmentLine;
  mesh.userData['culture38OE']=m.culture;
  mesh.userData['garmentFamily38OE6']=m.garmentFamily;
  mesh.userData['identityMark38OE2']={
    bars:mark.barCount,side:mark.barSide,height:mark.barHeight,
    spacing:mark.barSpacing,offset:mark.barOffset,slope:mark.barSlope,
    width:mark.barWidth,length:mark.barLength,
  };
  mesh.castShadow=true;
  subject.add(mesh);created.push(mesh);
}

function addGarmentPrimitive38OE6(subject: THREE.Group, created: THREE.Object3D[], mesh: THREE.Mesh, part: string): void {
  mesh.name = 'VIDA38_2OD_REPTILIAN_GARMENT';
  mesh.userData['garmentPart38OE6'] = part;
  subject.add(mesh);
  created.push(mesh);
}


function createOrganicGarmentMaterial38OE7(color: string, roughness: number, metalness: number, opacity = 1): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness,
    side: THREE.DoubleSide,
    transparent: opacity < 0.999,
    opacity,
  });
}

function createOrganicDrapePanel38OE7(width: number, height: number, color: string, roughness: number, metalness: number, opts?: {
  opacity?: number;
  flare?: number;
  waveDepth?: number;
  waveCount?: number;
  topInset?: number;
  phase?: number;
  backwardLean?: number;
}): THREE.Mesh {
  const options = opts ?? {};
  const geometry = new THREE.PlaneGeometry(width, height, 10, 24);
  const position = geometry.attributes['position'];
  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const flare = options.flare ?? 0.18;
  const waveDepth = options.waveDepth ?? 0.022;
  const waveCount = options.waveCount ?? 1.6;
  const topInset = options.topInset ?? 0.18;
  const phase = options.phase ?? 0;
  const backwardLean = options.backwardLean ?? 0;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const t = (y + halfH) / height;
    const lateral = halfW > 0 ? x / halfW : 0;
    const widthScale = (1 - topInset * t) * (1 + flare * (1 - t));
    const sculptedX = x * widthScale;
    const ripple = Math.sin(t * Math.PI * waveCount + phase + lateral * 0.9) * waveDepth * (0.30 + 0.70 * (1 - t));
    const billow = Math.sin(lateral * Math.PI) * waveDepth * 0.45 * (1 - t);
    const sculptedZ = ripple + billow - backwardLean * t;
    position.setXYZ(i, sculptedX, y, sculptedZ);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, createOrganicGarmentMaterial38OE7(color, roughness, metalness, options.opacity ?? 1));
  mesh.castShadow = true;
  mesh.userData['garmentGeom38OE7'] = true;
  mesh.userData['garmentGeomKind38OE7'] = 'DRAPE_PANEL';
  return mesh;
}

function createOrganicCollar38OE7(radiusTop: number, radiusBottom: number, height: number, color: string, roughness: number, metalness: number, scallop = 0.016): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 22, 4, true);
  const position = geometry.attributes['position'];
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const angle = Math.atan2(z, x);
    const radius = Math.hypot(x, z);
    const ring = Math.sin(angle * 2.0) * scallop;
    const lift = (y / Math.max(0.001, height)) * scallop * 0.6;
    const target = radius + ring + lift;
    const scale = radius > 1e-4 ? target / radius : 1;
    position.setXYZ(i, x * scale, y, z * scale);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, createOrganicGarmentMaterial38OE7(color, roughness, metalness));
  mesh.castShadow = true;
  mesh.userData['garmentGeom38OE7'] = true;
  mesh.userData['garmentGeomKind38OE7'] = 'ORGANIC_COLLAR';
  return mesh;
}

function addCeremonialRobes38OE6(subject:THREE.Group, created:THREE.Object3D[], body:THREE.Mesh, a:Vida38HumanoidAnatomy, m:Vida38CivilizedReptilianMorphology38OD):void {
  const p=a.legLength;
  const shell=fittedGarment38OD(body,'VIDA38_2OD_REPTILIAN_GARMENT',m.garmentPrimaryHex,0.78,0.02,(x,y,z)=>Math.abs(x)<0.42 && y>p+0.08 && y<p+0.92 && Math.abs(z)<0.34,0.010);
  if(shell){shell.userData['garmentFamily38OE6']=m.garmentFamily; shell.userData['garmentGeom38OE7']=true; addGarmentPrimitive38OE6(subject,created,shell,'ROBE_TORSO_OE7');}
  const mantle=fittedGarment38OD(body,'VIDA38_2OD_REPTILIAN_GARMENT',m.garmentSecondaryHex,0.64,0.05,(x,y,z)=>y>p+0.50 && y<p+0.88 && Math.abs(x)<0.54 && Math.abs(z)<0.30,0.014);
  if(mantle){mantle.userData['garmentFamily38OE6']=m.garmentFamily; mantle.userData['garmentGeom38OE7']=true; addGarmentPrimitive38OE6(subject,created,mantle,'MANTLE_WRAP_OE7');}
  const skirtH=a.legLength*0.98;
  const front=createOrganicDrapePanel38OE7(a.shoulderWidth*0.98,skirtH,m.garmentPrimaryHex,0.76,0.02,{flare:0.24,waveDepth:0.024,waveCount:1.8,topInset:0.16,phase:0.2});
  front.position.set(0,p-0.10,0.19); addGarmentPrimitive38OE6(subject,created,front,'FRONT_DRAPE_OE7');
  const backLeft=createOrganicDrapePanel38OE7(a.shoulderWidth*0.46,skirtH*0.94,m.garmentPrimaryHex,0.76,0.02,{flare:0.28,waveDepth:0.018,waveCount:1.4,topInset:0.08,phase:1.2,backwardLean:0.03});
  backLeft.position.set(-a.shoulderWidth*0.23,p-0.12,-0.17); addGarmentPrimitive38OE6(subject,created,backLeft,'BACK_LEFT_DRAPE_OE7');
  const backRight=createOrganicDrapePanel38OE7(a.shoulderWidth*0.46,skirtH*0.94,m.garmentPrimaryHex,0.76,0.02,{flare:0.28,waveDepth:0.018,waveCount:1.4,topInset:0.08,phase:2.1,backwardLean:0.03});
  backRight.position.set(a.shoulderWidth*0.23,p-0.12,-0.17); addGarmentPrimitive38OE6(subject,created,backRight,'BACK_RIGHT_DRAPE_OE7');
  const shoulderCape=createOrganicDrapePanel38OE7(a.shoulderWidth*1.30,a.torsoLength*0.52,m.garmentSecondaryHex,0.58,0.05,{flare:0.14,waveDepth:0.016,waveCount:1.0,topInset:0.32,phase:0.6,backwardLean:0.08});
  shoulderCape.position.set(0,p+a.torsoLength*0.54,-0.10); addGarmentPrimitive38OE6(subject,created,shoulderCape,'SHOULDER_CAPE_OE7');
  const collar=createOrganicCollar38OE7(Math.max(0.085, a.jawWidth * 0.62),Math.max(0.092, a.jawWidth * 0.70),0.18,m.garmentSecondaryHex,0.52,0.08,0.010);
  collar.position.set(0,p+a.torsoLength*0.74,0.01); addGarmentPrimitive38OE6(subject,created,collar,'HIGH_COLLAR_OE7');
  const trim=createOrganicDrapePanel38OE7(0.082,skirtH*0.94,m.neonSecondaryHex,0.18,0.16,{flare:0.02,waveDepth:0.010,waveCount:1.2,topInset:0.06,opacity:0.92});
  trim.position.set(0,p-0.12,0.205); addGarmentPrimitive38OE6(subject,created,trim,'FRONT_TRIM_OE7');
}

function addNobleRegalia38OE6(subject:THREE.Group, created:THREE.Object3D[], body:THREE.Mesh, a:Vida38HumanoidAnatomy, m:Vida38CivilizedReptilianMorphology38OD):void {
  const p=a.legLength;
  const tunic=fittedGarment38OD(body,'VIDA38_2OD_REPTILIAN_GARMENT',m.garmentPrimaryHex,0.44,0.18,(x,y,z)=>y>p+0.08 && y<p+0.86 && Math.abs(x)<0.42 && Math.abs(z)<0.33,0.010);
  if(tunic){tunic.userData['garmentFamily38OE6']=m.garmentFamily; tunic.userData['garmentGeom38OE7']=true; addGarmentPrimitive38OE6(subject,created,tunic,'TUNIC_CORE_OE7');}
  const collar=createOrganicCollar38OE7(Math.max(0.086, a.jawWidth * 0.60),Math.max(0.094, a.jawWidth * 0.73),0.16,m.garmentSecondaryHex,0.30,0.36,0.012);
  collar.position.set(0,p+a.torsoLength*0.77,0.01); addGarmentPrimitive38OE6(subject,created,collar,'NOBLE_COLLAR_OE7');
  const cape=createOrganicDrapePanel38OE7(a.shoulderWidth*1.18,a.torsoLength*1.02,m.garmentPrimaryHex,0.48,0.10,{flare:0.30,waveDepth:0.024,waveCount:1.2,topInset:0.24,phase:0.4,backwardLean:0.10});
  cape.position.set(0,p+a.torsoLength*0.24,-0.19); addGarmentPrimitive38OE6(subject,created,cape,'BACK_CAPE_OE7');
  for (const side of [-1,1] as const) {
    const panel=createOrganicDrapePanel38OE7(0.16,a.legLength*0.94,m.garmentSecondaryHex,0.40,0.14,{flare:0.10,waveDepth:0.014,waveCount:1.5,topInset:0.18,phase:side<0?0.3:1.0});
    panel.position.set(side*0.14,p-0.12,0.17); addGarmentPrimitive38OE6(subject,created,panel,side<0?'LEFT_REGALIA_OE7':'RIGHT_REGALIA_OE7');
  }
  const shoulderMantleLeft=createOrganicDrapePanel38OE7(0.24,0.34,m.garmentSecondaryHex,0.34,0.24,{flare:0.18,waveDepth:0.014,waveCount:1.0,topInset:0.26,phase:0.2,backwardLean:0.04});
  shoulderMantleLeft.position.set(-a.shoulderWidth*0.58,p+a.torsoLength*0.62,0.02); shoulderMantleLeft.rotation.z=-0.20; addGarmentPrimitive38OE6(subject,created,shoulderMantleLeft,'LEFT_SHOULDER_MANTLE_OE7');
  const shoulderMantleRight=createOrganicDrapePanel38OE7(0.24,0.34,m.garmentSecondaryHex,0.34,0.24,{flare:0.18,waveDepth:0.014,waveCount:1.0,topInset:0.26,phase:0.8,backwardLean:0.04});
  shoulderMantleRight.position.set(a.shoulderWidth*0.58,p+a.torsoLength*0.62,0.02); shoulderMantleRight.rotation.z=0.20; addGarmentPrimitive38OE6(subject,created,shoulderMantleRight,'RIGHT_SHOULDER_MANTLE_OE7');
  const gem=new THREE.Mesh(new THREE.OctahedronGeometry(0.045),material(m.neonAccentHex,0.10,0.18,0.90));
  gem.position.set(0,p+a.torsoLength*0.52,0.19); addGarmentPrimitive38OE6(subject,created,gem,'CHEST_GEM');
}

function addPelagicDrape38OE6(subject:THREE.Group, created:THREE.Object3D[], body:THREE.Mesh, a:Vida38HumanoidAnatomy, m:Vida38CivilizedReptilianMorphology38OD):void {
  const p=a.legLength;
  const skinSuit=fittedGarment38OD(body,'VIDA38_2OD_REPTILIAN_GARMENT',m.garmentPrimaryHex,0.30,0.24,(x,y,z)=>y>p+0.06 && y<p+0.92 && Math.abs(x)<0.42 && Math.abs(z)<0.35,0.010);
  if(skinSuit){skinSuit.userData['garmentFamily38OE6']=m.garmentFamily; addGarmentPrimitive38OE6(subject,created,skinSuit,'PELAGIC_SUIT');}
  const collar=new THREE.Mesh(new THREE.CylinderGeometry(Math.max(0.082, a.jawWidth * 0.58),Math.max(0.088, a.jawWidth * 0.64),0.12,16,1,true),material(m.garmentSecondaryHex,0.18,0.22,0.88));
  collar.position.set(0,p+a.torsoLength*0.74,0.01); addGarmentPrimitive38OE6(subject,created,collar,'AQUATIC_COLLAR');
  for (const side of [-1,1] as const) {
    const sideDrape=new THREE.Mesh(new THREE.BoxGeometry(0.08,a.legLength*0.82,0.012),material(m.garmentSecondaryHex,0.18,0.10,0.78));
    sideDrape.position.set(side*(a.shoulderWidth*0.86),p-0.06,0.02); sideDrape.rotation.z=side*0.22; addGarmentPrimitive38OE6(subject,created,sideDrape,side<0?'LEFT_FLOW':'RIGHT_FLOW');
    const armFin=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.28,0.010),material(m.neonSecondaryHex,0.12,0.08,0.72));
    armFin.position.set(side*(a.shoulderWidth+0.12),p+a.torsoLength*0.42,0.03); armFin.rotation.z=side*0.34; addGarmentPrimitive38OE6(subject,created,armFin,side<0?'LEFT_FIN':'RIGHT_FIN');
  }
  const chestWave=fittedGarment38OD(body,'VIDA38_2OD_REPTILIAN_GARMENT',m.neonAccentHex,0.12,0.14,(x,y,z)=>z>0.05 && y>p+0.32 && y<p+0.72 && Math.abs(x)<0.34 && Math.abs(x - Math.sin((y-p)*12.0)*0.11)<0.10,0.018);
  if(chestWave){chestWave.userData['garmentFamily38OE6']=m.garmentFamily; addGarmentPrimitive38OE6(subject,created,chestWave,'CHEST_WAVE');}
}

function addCultureSignature38OE6A(subject: THREE.Group, created: THREE.Object3D[], body: THREE.Mesh, a: Vida38HumanoidAnatomy, m: Vida38CivilizedReptilianMorphology38OD): void {
  const p = a.legLength;
  if (m.culture === 'BASILICA_TECHNOCRACY') {
    const stoleFront = createOrganicDrapePanel38OE7(0.09, a.torsoLength * 0.88, m.neonSecondaryHex, 0.12, 0.18, { flare: 0.08, waveDepth: 0.010, waveCount: 1.3, topInset: 0.08, opacity: 0.88 });
    stoleFront.position.set(0, p + a.torsoLength * 0.40, 0.19);
    addGarmentPrimitive38OE6(subject, created, stoleFront, 'BASILICA_STOLE_FRONT');
    const stoleBack = createOrganicDrapePanel38OE7(0.08, a.torsoLength * 0.82, m.neonSecondaryHex, 0.12, 0.18, { flare: 0.06, waveDepth: 0.009, waveCount: 1.1, topInset: 0.06, backwardLean: 0.06, opacity: 0.76 });
    stoleBack.position.set(0, p + a.torsoLength * 0.38, -0.18);
    addGarmentPrimitive38OE6(subject, created, stoleBack, 'BASILICA_STOLE_BACK');
    for (const side of [-1, 1] as const) {
      const shrine = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.014), material(m.garmentSecondaryHex, 0.18, 0.24, 0.82));
      shrine.position.set(side * (a.shoulderWidth * 0.62), p + a.torsoLength * 0.66, 0.10);
      shrine.rotation.z = side * 0.18;
      addGarmentPrimitive38OE6(subject, created, shrine, side < 0 ? 'BASILICA_LEFT_SHRINE' : 'BASILICA_RIGHT_SHRINE');
    }
    const glyph = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.014), material(m.neonAccentHex, 0.08, 0.18, 0.86));
    glyph.position.set(0, p + a.torsoLength * 0.60, 0.20);
    glyph.rotation.z = Math.PI * 0.25;
    addGarmentPrimitive38OE6(subject, created, glyph, 'BASILICA_GLYPH');
  } else if (m.culture === 'PELAGIC_CONCORD') {
    const dorsalFin = new THREE.Mesh(new THREE.BoxGeometry(0.12, a.torsoLength * 0.56, 0.010), material(m.neonSecondaryHex, 0.10, 0.10, 0.58));
    dorsalFin.position.set(0, p + a.torsoLength * 0.50, -0.19);
    addGarmentPrimitive38OE6(subject, created, dorsalFin, 'PELAGIC_DORSAL_FIN');
    for (const side of [-1, 1] as const) {
      const veil = createOrganicDrapePanel38OE7(0.13, a.legLength * 0.98, m.garmentSecondaryHex, 0.08, 0.06, { flare: 0.22, waveDepth: 0.020, waveCount: 1.6, topInset: 0.18, phase: side < 0 ? 0.2 : 0.9, backwardLean: 0.04, opacity: 0.58 });
      veil.position.set(side * (a.shoulderWidth * 0.78), p - 0.02, 0.02);
      veil.rotation.z = side * 0.28;
      addGarmentPrimitive38OE6(subject, created, veil, side < 0 ? 'PELAGIC_LEFT_VEIL' : 'PELAGIC_RIGHT_VEIL');
      const armMembrane = createOrganicDrapePanel38OE7(0.07, 0.26, m.neonAccentHex, 0.08, 0.06, { flare: 0.12, waveDepth: 0.012, waveCount: 1.0, topInset: 0.18, phase: side < 0 ? 0.4 : 1.1, opacity: 0.62 });
      armMembrane.position.set(side * (a.shoulderWidth * 0.78), p + a.torsoLength * 0.36, 0.06);
      armMembrane.rotation.z = side * 0.48;
      addGarmentPrimitive38OE6(subject, created, armMembrane, side < 0 ? 'PELAGIC_LEFT_MEMBRANE' : 'PELAGIC_RIGHT_MEMBRANE');
    }
    const wave = fittedGarment38OD(body, 'VIDA38_2OD_REPTILIAN_GARMENT', m.neonSecondaryHex, 0.08, 0.08, (x, y, z) => z > 0.05 && y > p + 0.26 && y < p + 0.78 && Math.abs(x - Math.sin((y - p) * 10.0) * 0.13) < 0.08, 0.023);
    if (wave) { wave.userData['garmentFamily38OE6'] = m.garmentFamily; addGarmentPrimitive38OE6(subject, created, wave, 'PELAGIC_WAVE_OVERLAY'); }
  } else if (m.culture === 'DUNE_MANDATE') {
    const wrap = new THREE.Mesh(new THREE.BoxGeometry(0.17, a.torsoLength * 0.78, 0.014), material(m.garmentSecondaryHex, 0.32, 0.10, 0.78));
    wrap.position.set(0, p + a.torsoLength * 0.42, 0.18);
    wrap.rotation.z = 0.36;
    addGarmentPrimitive38OE6(subject, created, wrap, 'DUNE_WRAP');
  } else if (m.culture === 'OBSIDIAN_CLAN') {
    for (const side of [-1, 1] as const) {
      const spur = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 6), material(m.garmentSecondaryHex, 0.16, 0.52));
      spur.position.set(side * (a.shoulderWidth * 0.66), p + a.torsoLength * 0.66, -0.02);
      spur.rotation.z = side * -0.34;
      addGarmentPrimitive38OE6(subject, created, spur, side < 0 ? 'OBSIDIAN_LEFT_SPUR' : 'OBSIDIAN_RIGHT_SPUR');
    }
  } else if (m.culture === 'STAR_KINGDOM') {
    const backCape = new THREE.Mesh(new THREE.BoxGeometry(a.shoulderWidth * 1.32, a.torsoLength * 0.84, 0.016), material(m.garmentSecondaryHex, 0.26, 0.18, 0.70));
    backCape.position.set(0, p + a.torsoLength * 0.34, -0.18);
    addGarmentPrimitive38OE6(subject, created, backCape, 'KINGDOM_CAPE');
  } else if (m.culture === 'FRONTIER_HEGEMONY') {
    const chestRig = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.20, 0.08), material(m.garmentSecondaryHex, 0.26, 0.42));
    chestRig.position.set(a.shoulderWidth * 0.24, p + a.torsoLength * 0.44, 0.16);
    addGarmentPrimitive38OE6(subject, created, chestRig, 'FRONTIER_CHEST_MODULE');
  }
}

function addOrganicSoftGarments38OE7B(subject: THREE.Group, created: THREE.Object3D[], body: THREE.Mesh, a: Vida38HumanoidAnatomy, m: Vida38CivilizedReptilianMorphology38OD, speciesId: string, appearanceFingerprint: string, quality: Vida38HumanoidQuality): void {
  const plan = deriveVida38OrganicGarmentPlan38OE7B({
    speciesId, appearanceFingerprint,
    garmentFamily: m.garmentFamily, garmentLine: m.garmentLine, culture: m.culture,
    primaryColor: m.garmentPrimaryHex, accentColor: m.garmentSecondaryHex,
  });
  const items = createVida38ReptilianOrganicGarments38OE7C(body, a, plan, quality);
  // e7c: no añadir paneles rígidos bajo/encima de las prendas blandas.
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    item.userData['garmentFamily38OE6'] = m.garmentFamily;
    item.userData['culture38OE'] = m.culture;
    addGarmentPrimitive38OE6(subject, created, item, String(item.userData['garmentPart38OE6'] ?? 'SOFT_CLOTH'));
  }
  subject.userData['vida38OrganicGarmentPlan38OE7B'] = plan.signature;
  subject.userData['vida38OrganicGarmentLength38OE7B'] = plan.length;
  subject.userData['vida38OrganicGarmentKind38OE7B'] = plan.kind;
  subject.userData['vida38OrganicGarmentRevision38OE7C'] = 'VIDA.38.2o.e7c';
}

/** 38.2o.e8: una malla SDF conformal y verdaderas placas de coraza curvas.
 * El material/segmentación depende de especie, cultura y línea funcional.
 * Las prendas blandas e7c y el traje interestelar 38.2o.d5 NO se alteran. */
function addAdvancedTechnicalArmor38OE8(
  subject: THREE.Group, created: THREE.Object3D[], body: THREE.Mesh,
  anatomy: Vida38HumanoidAnatomy, m: Vida38CivilizedReptilianMorphology38OD,
  speciesId: string, appearanceFingerprint: string, quality: Vida38HumanoidQuality,
): void {
  const family = m.garmentFamily;
  if (family !== 'SEGMENTED_ARMOR' && family !== 'COLONIAL_RIG') return;
  const plan = deriveVida38TechArmorPlan38OE8({
    speciesId, appearanceFingerprint, family,
    garmentLine: m.garmentLine, culture: m.culture,
  });
  const meshes = createVida38ReptilianTechnicalGarments38OE8(body, anatomy, plan, quality);
  for (const mesh of meshes) {
    mesh.userData['garmentFamily38OE6'] = family;
    mesh.userData['culture38OE'] = m.culture;
    subject.add(mesh);
    created.push(mesh);
  }
  subject.userData['vida38TechnicalGarmentRevision38OE8'] = VIDA38_TECH_GARMENT_REVISION_38OE8;
  subject.userData['vida38TechnicalGarmentPlan38OE8'] = plan.signature;
  subject.userData['vida38TechnicalGarmentMaterial38OE8'] = plan.materialKind;
  subject.userData['vida38TechnicalGarmentSilhouette38OE8'] = plan.silhouette;
  subject.userData['vida38TechnicalGarmentDiscipline38OE8'] = plan.discipline;
}

function addVeryAdvancedGarments38OE6(subject: THREE.Group, created: THREE.Object3D[], body: THREE.Mesh, a: Vida38HumanoidAnatomy, m: Vida38CivilizedReptilianMorphology38OD, speciesId: string, appearanceFingerprint: string, quality: Vida38HumanoidQuality): void {
  switch (m.garmentFamily) {
    case 'CEREMONIAL_ROBES':
    case 'NOBLE_REGALIA':
    case 'PELAGIC_DRAPE':
      addOrganicSoftGarments38OE7B(subject, created, body, a, m, speciesId, appearanceFingerprint, quality);
      // Las bandas y cajas culturales 38.2o.e6a provocaban los parches que se
      // observaban en la galería. La malla blanda ya incluye identidad cultural.
      return;
    case 'COLONIAL_RIG':
      addAdvancedTechnicalArmor38OE8(subject, created, body, a, m, speciesId, appearanceFingerprint, quality);
      return;
    case 'SEGMENTED_ARMOR':
      addAdvancedTechnicalArmor38OE8(subject, created, body, a, m, speciesId, appearanceFingerprint, quality);
      return;
    default: addVeryAdvancedSuit38OD5(subject, created, body, a, m); break;
  }
  addCultureSignature38OE6A(subject, created, body, a, m);
}

function addGarments38OD(subject: THREE.Group, created: THREE.Object3D[], body: THREE.Mesh, a: Vida38HumanoidAnatomy, m: Vida38CivilizedReptilianMorphology38OD, speciesId: string, appearanceFingerprint: string, quality: Vida38HumanoidQuality): void {
  if (m.level === 'VERY_ADVANCED') { addVeryAdvancedGarments38OE6(subject,created,body,a,m,speciesId,appearanceFingerprint,quality); return; }
  const p = a.legLength;
  const front = (_x: number, _y: number, z: number, _nx: number, _ny: number, nz: number) => z > 0.015 && nz > 0.16;
  const panels: Array<{ color: string; rough: number; metal: number; mask: (x: number, y: number, z: number, nx: number, ny: number, nz: number) => boolean }> = [];
  if (m.level === 'PRIMITIVE') {
    panels.push({color: m.garmentPrimaryHex, rough: 0.93, metal: 0.01, mask: (x,y,z,nx,ny,nz) => front(x,y,z,nx,ny,nz) && y>p+0.22 && y<p+0.76 && Math.abs(x - (y - p - 0.46)*0.54) < 0.115});
    panels.push({color: m.garmentSecondaryHex, rough: 0.85, metal: 0.02, mask: (x,y,z,nx,ny,nz) => front(x,y,z,nx,ny,nz) && y>p-0.11 && y<p+0.09 && Math.abs(x)<0.36});
    panels.push({color: mixHex(m.garmentPrimaryHex, m.garmentSecondaryHex, 0.3), rough: 0.92, metal: 0.01, mask: (x,y,z,nx,ny,nz) => front(x,y,z,nx,ny,nz) && y>p-0.20 && y<p-0.065 && Math.abs(x)<0.22});
    panels.push({color: m.garmentSecondaryHex, rough: 0.88, metal: 0.01, mask: (x,y,z,nx,ny,nz) => front(x,y,z,nx,ny,nz) && y>p+0.58 && y<p+0.83 && Math.abs(x)>0.27 && Math.abs(x)<0.47});
  } else if (m.level === 'ADVANCED') {
    panels.push({color: m.garmentPrimaryHex, rough: 0.52, metal: 0.05, mask: (x,y,z,nx,ny,nz) => front(x,y,z,nx,ny,nz) && y>p+0.13 && y<p+0.75 && Math.abs(x)<0.36});
    panels.push({color: m.garmentSecondaryHex, rough: 0.38, metal: 0.15, mask: (x,y,z,nx,ny,nz) => front(x,y,z,nx,ny,nz) && y>p+0.28 && y<p+0.81 && Math.abs(x - (y-p-.49)*0.50) < 0.056});
    panels.push({color: m.garmentPrimaryHex, rough: 0.50, metal: 0.09, mask: (x,y,z,nx,ny,nz) => front(x,y,z,nx,ny,nz) && y>p-0.06 && y<p+0.12 && Math.abs(x)<0.38});
    panels.push({color: m.garmentSecondaryHex, rough: 0.37, metal: 0.18, mask: (x,y,z,nx,ny,nz) => front(x,y,z,nx,ny,nz) && y>p+0.62 && y<p+0.84 && Math.abs(x)>0.26 && Math.abs(x)<0.49});
  } else {
    const neonTrim = m.neonAccentHex;
    const neonAux = m.neonSecondaryHex;
    panels.push({color: m.garmentPrimaryHex, rough: 0.18, metal: 0.28, mask: (x,y,z,nx,ny,nz) => front(x,y,z,nx,ny,nz) && y>p+0.10 && y<p+0.90 && Math.abs(x)<0.42});
    panels.push({color: neonTrim, rough: 0.08, metal: 0.38, mask: (x,y,z,nx,ny,nz) => front(x,y,z,nx,ny,nz) && y>p+0.20 && y<p+0.86 && Math.abs(x - (y-p-.52)*0.46) < 0.090});
    panels.push({color: neonAux, rough: 0.10, metal: 0.34, mask: (x,y,z,nx,ny,nz) => front(x,y,z,nx,ny,nz) && y>p+0.62 && y<p+0.86 && Math.abs(x)>0.22 && Math.abs(x)<0.48});
    panels.push({color: neonAux, rough: 0.12, metal: 0.30, mask: (x,y,z,nx,ny,nz) => front(x,y,z,nx,ny,nz) && y>p-0.02 && y<p+0.16 && Math.abs(x)<0.40});
    panels.push({color: m.garmentPrimaryHex, rough: 0.18, metal: 0.34, mask: (x,y,z,nx,ny,nz) => z>0.0 && y>-0.02 && y<p-0.02 && Math.abs(x)<0.38 && Math.abs(x)>0.08});
    panels.push({color: neonTrim, rough: 0.08, metal: 0.38, mask: (x,y,z,nx,ny,nz) => z>0.03 && y>-0.01 && y<0.18 && Math.abs(x)<0.34 && Math.abs(x)>0.14});
  }
  for (let layer = 0; layer < panels.length; layer++) {
    const panel = panels[layer]!;
    const garment = fittedGarment38OD(body, 'VIDA38_2OD_REPTILIAN_GARMENT', panel.color, panel.rough, panel.metal, panel.mask, 0.008 + layer * 0.003);
    if (garment) { subject.add(garment); created.push(garment); }
  }
}

function addVeryAdvancedAccessories38OE3(subject: THREE.Group, created: THREE.Object3D[], body: THREE.Mesh, a: Vida38HumanoidAnatomy, m: Vida38CivilizedReptilianMorphology38OD): void {
  if (m.level !== 'VERY_ADVANCED') return;
  const plan = m.accessoryPlan38OE3;
  const neonPrimary = m.neonAccentHex;
  const neonSecondary = m.neonSecondaryHex;
  const darkMetal = material(m.garmentPrimaryHex, 0.22, 0.68);
  const brightMetal = material(m.garmentSecondaryHex, 0.18, 0.74);
  const glow = material(neonPrimary, 0.10, 0.36, 0.92);
  const sideSign = plan.leftHanded ? -1 : 1;

  // 38.2o.e4: monturas ópticas ABIERTAS: nunca cubrir ni la córnea, ni el iris.
  const leftFrame = deriveVida38CivilReptilianOrbitalFrame38OE4(body, a, m, -1);
  const rightFrame = deriveVida38CivilReptilianOrbitalFrame38OE4(body, a, m, 1);
  if (leftFrame && rightFrame) {
    const frames: Vida38CivilReptilianOrbitalFrame38OE4[] = [leftFrame, rightFrame];
    const eyeSpan = leftFrame.center.distanceTo(rightFrame.center);
    const opticalMetal = material('#18323c', 0.28, 0.52);
    const opticalNeon = material(neonSecondary, 0.18, 0.36);
    for (const frame of frames) {
      // TorusGeometry ya está en XY, normal +Z: no usar cilindros frontales.
      if (plan.eyewear === 'MONOCLE' && frame.side !== (plan.leftHanded ? -1 : 1)) continue;
      const ringRadius = Math.max(frame.radiusX, frame.radiusY) * (plan.eyewear === 'SPLIT_GOGGLES' ? 1.28 : 1.36);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(ringRadius, 0.0045, 5, 24), opticalMetal,
      );
      ring.scale.set(1.05, 0.92, 1);
      ring.position.copy(frame.center).addScaledVector(frame.gaze, frame.radiusZ + 0.001);
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), frame.gaze);
      ring.userData['openOptics38OE4'] = true;
      addSurfaceDetail38OD(subject, created, ring, 'VIDA38_2OE3_REPTILIAN_ACCESSORY_EYEWEAR');
      if (plan.eyewear === 'VISOR') {
        const accent = new THREE.Mesh(new THREE.TorusGeometry(ringRadius * 1.12, 0.0023, 4, 24), opticalNeon);
        accent.scale.set(1.03, 0.86, 1);
        accent.position.copy(ring.position).addScaledVector(frame.gaze, 0.002);
        accent.quaternion.copy(ring.quaternion);
        accent.userData['openOptics38OE4'] = true;
        addSurfaceDetail38OD(subject, created, accent, 'VIDA38_2OE3_REPTILIAN_ACCESSORY_EYEWEAR');
      }
      if (plan.eyewear === 'MONOCLE') {
        const transmitter = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), opticalNeon);
        transmitter.position.copy(ring.position).add(new THREE.Vector3(frame.side * ringRadius, ringRadius * 0.65, 0.001));
        transmitter.userData['openOptics38OE4'] = true;
        addSurfaceDetail38OD(subject, created, transmitter, 'VIDA38_2OE3_REPTILIAN_ACCESSORY_EYEWEAR');
      }
    }
    // Puente fino por encima de los ojos, no una barra negra sobre las pupilas.
    if (plan.eyewear !== 'MONOCLE') {
      const bridgeMid = leftFrame.center.clone().lerp(rightFrame.center, 0.5);
      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0038, eyeSpan * 0.40, 7), opticalNeon);
      bridge.rotation.z = Math.PI / 2;
      bridge.position.copy(bridgeMid).add(new THREE.Vector3(0, Math.max(leftFrame.radiusY, rightFrame.radiusY) * 1.38, Math.max(leftFrame.radiusZ, rightFrame.radiusZ) + 0.009));
      bridge.userData['openOptics38OE4'] = true;
      addSurfaceDetail38OD(subject, created, bridge, 'VIDA38_2OE3_REPTILIAN_ACCESSORY_EYEWEAR');
    }
  }

  const wristY = a.legLength + 0.55 - a.armReach * 0.72;
  const wristX = sideSign * (a.shoulderWidth + 0.06);
  if (plan.wrist !== 'NONE') {
    const consoleSide = plan.wrist === 'LEFT_CONSOLE' ? -1 : 1;
    const armX = consoleSide * (a.shoulderWidth + 0.055);
    const forearm = surfaceAt38OD(body, armX, wristY, 'FRONT');
    if (forearm) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.070, 0.034, 0.045), darkMetal);
      band.position.copy(forearm).add(new THREE.Vector3(0, 0, 0.030));
      addSurfaceDetail38OD(subject, created, band, 'VIDA38_2OE3_REPTILIAN_ACCESSORY_WRIST');
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.024, 0.010), material(neonSecondary, 0.08, 0.18, 0.86));
      screen.position.copy(forearm).add(new THREE.Vector3(0, 0.012, 0.052));
      addSurfaceDetail38OD(subject, created, screen, 'VIDA38_2OE3_REPTILIAN_ACCESSORY_WRIST');
    }
  }

  if (plan.handheld !== 'NONE') {
    const staffBottomY = 0.12;
    const height = plan.handheld === 'DATA_ROD' ? 0.72 : plan.handheld === 'SCEPTER' ? 1.00 : 1.18;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.020, height, 10), darkMetal);
    shaft.position.set(wristX, staffBottomY + height * 0.5, 0.12);
    addSurfaceDetail38OD(subject, created, shaft, 'VIDA38_2OE3_REPTILIAN_ACCESSORY_HANDHELD');
    const topY = staffBottomY + height;
    if (plan.handheld === 'STAFF') {
      const head = new THREE.Mesh(new THREE.TorusKnotGeometry(0.042, 0.010, 48, 8), brightMetal);
      head.position.set(wristX, topY + 0.020, 0.12);
      addSurfaceDetail38OD(subject, created, head, 'VIDA38_2OE3_REPTILIAN_ACCESSORY_HANDHELD');
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.020, 12, 10), material(neonSecondary, 0.08, 0.14, 0.88));
      core.position.set(wristX, topY + 0.020, 0.12);
      addSurfaceDetail38OD(subject, created, core, 'VIDA38_2OE3_REPTILIAN_ACCESSORY_HANDHELD');
    } else if (plan.handheld === 'SCEPTER') {
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.10, 6), brightMetal);
      head.position.set(wristX, topY + 0.030, 0.12);
      addSurfaceDetail38OD(subject, created, head, 'VIDA38_2OE3_REPTILIAN_ACCESSORY_HANDHELD');
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.022), material(neonPrimary, 0.08, 0.16, 0.84));
      gem.position.set(wristX, topY + 0.075, 0.12);
      addSurfaceDetail38OD(subject, created, gem, 'VIDA38_2OE3_REPTILIAN_ACCESSORY_HANDHELD');
    } else {
      const rod = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.18, 0.030), brightMetal);
      rod.position.set(wristX, topY - 0.010, 0.12);
      addSurfaceDetail38OD(subject, created, rod, 'VIDA38_2OE3_REPTILIAN_ACCESSORY_HANDHELD');
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.050, 0.012), material(neonSecondary, 0.06, 0.12, 0.88));
      tip.position.set(wristX, topY + 0.070, 0.12);
      addSurfaceDetail38OD(subject, created, tip, 'VIDA38_2OE3_REPTILIAN_ACCESSORY_HANDHELD');
    }
  }

  if (plan.shoulder !== 'NONE') {
    const shoulderY = a.legLength + a.torsoLength * 0.86;
    if (plan.shoulder === 'BACK_SPIRE') {
      const anchor = surfaceAt38OD(body, 0, shoulderY, 'BACK');
      if (anchor) {
        const spine = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.26, 6), darkMetal);
        spine.rotation.x = Math.PI;
        spine.position.copy(anchor).add(new THREE.Vector3(0, 0.16, -0.035));
        addSurfaceDetail38OD(subject, created, spine, 'VIDA38_2OE3_REPTILIAN_ACCESSORY_SHOULDER');
        const node = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), material(neonSecondary, 0.08, 0.15, 0.90));
        node.position.copy(anchor).add(new THREE.Vector3(0, 0.27, -0.040));
        addSurfaceDetail38OD(subject, created, node, 'VIDA38_2OE3_REPTILIAN_ACCESSORY_SHOULDER');
      }
    } else {
      const shoulderSide = plan.shoulder === 'LEFT_BEACON' ? -1 : 1;
      const anchor = surfaceAt38OD(body, shoulderSide * (a.shoulderWidth + 0.01), shoulderY, 'FRONT');
      if (anchor) {
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.06, 10), darkMetal);
        pad.rotation.z = Math.PI / 2;
        pad.position.copy(anchor).add(new THREE.Vector3(shoulderSide * 0.045, 0.01, 0.01));
        addSurfaceDetail38OD(subject, created, pad, 'VIDA38_2OE3_REPTILIAN_ACCESSORY_SHOULDER');
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), material(neonPrimary, 0.08, 0.16, 0.88));
        beacon.position.copy(anchor).add(new THREE.Vector3(shoulderSide * 0.072, 0.035, 0.030));
        addSurfaceDetail38OD(subject, created, beacon, 'VIDA38_2OE3_REPTILIAN_ACCESSORY_SHOULDER');
      }
    }
  }
}

export function createVida38CivilizedReptilianPreview38O(subject: THREE.Group, contract: Vida38SpeciesVisualContract, quality: Vida38HumanoidQuality = 'HIGH'): THREE.Object3D[] {
  const created: THREE.Object3D[] = [];
  const morphology = deriveMorphology38OD(contract);
  const baseContract = createHumanoidCloneContract(contract);
  const anatomy = deriveVida38HumanoidAnatomy(baseContract);
  const raw = buildVida38CivilReptilianSdfMesh38OD5(anatomy, quality, morphology.tailLength);
  const reptilianRaw = morphRawMeshToReptilian38OD(raw, anatomy, morphology);
  const body = createVida38HumanoidSkinV1(reptilianRaw, baseContract);
  body.name = 'VIDA38_2OD_REPTILIAN_BODY';
  const geometry = body.geometry as THREE.BufferGeometry;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  subject.add(body); created.push(body);

  addGarments38OD(subject, created, body, anatomy, morphology, contract.speciesId, contract.appearanceFingerprint, quality);
  addVeryAdvancedAccessories38OE3(subject, created, body, anatomy, morphology);
  addEyes38OD(subject, created, body, anatomy, morphology);
  addTeeth38OD(subject, created, body, anatomy);
  addClaws38OD(subject, created, body, anatomy, morphology);
  addCrests38OD(subject, created, body, anatomy, morphology);
  addHornsPlatesBarbels38OE(subject, created, body, anatomy, morphology);
  registerIntegratedTail38OD5(subject, created);

  subject.userData['civilizedRenderer38O'] = 'REPTILIAN';
  subject.userData['vida38ReptilianSdfReuse38OD'] = true;
  subject.userData['civilizationLevel38O'] = morphology.level;
  subject.userData['vida38ReptilianLevel38OD'] = morphology.level;
  subject.userData['vida38ReptilianProfile38OD'] = morphology.profile;
  subject.userData['vida38ReptilianGarmentLine38OE'] = morphology.garmentLine;
  subject.userData['vida38ReptilianGarmentFamily38OE6'] = morphology.garmentFamily;
  subject.userData['vida38WardrobeEngine38OE8B'] = getVida38WardrobeEngine38OE8B(morphology.garmentFamily, morphology.level);
  subject.userData['vida38WardrobeSelectionRevision38OE8B'] = VIDA38_WARDROBE_COHERENCE_REVISION_38OE8B;
  subject.userData['vida38CulturalDiversityRevision38OE9'] = VIDA38_CULTURAL_DIVERSITY_REVISION_38OE9;
  subject.userData['vida38CulturalDiversityPlan38OE9'] = deriveVida38CulturalDiversityPlan38OE9(contract);
  subject.userData['vida38ReptilianCultureStyle38OE6A'] = morphology.culture + ':' + morphology.garmentFamily;
  subject.userData['vida38ReptilianCulture38OE'] = morphology.culture;
  subject.userData['vida38ReptilianVisualSignature38OE2'] = morphology.identityPlan38OE2.exactVisualSignature;
  subject.userData['vida38ReptilianAccessorySignature38OE3'] = morphology.accessoryPlan38OE3.exactAccessorySignature;
  subject.userData['vida38ReptilianOrbitalGlobe38OE4'] = true;
  subject.userData['vida38ReptilianAccessoryPlan38OE3'] = { eyewear: morphology.accessoryPlan38OE3.eyewear, handheld: morphology.accessoryPlan38OE3.handheld, wrist: morphology.accessoryPlan38OE3.wrist, shoulder: morphology.accessoryPlan38OE3.shoulder, leftHanded: morphology.accessoryPlan38OE3.leftHanded };
  subject.userData['uprightPosture38O'] = true;
  subject.userData['alienGarment38O'] = true;
  subject.userData['vida38ReptilianAnchored38OD2'] = true;
  subject.userData['vida38ReptilianPolish38OD3'] = true;
  subject.userData['vida38IntegratedSdfTail38OD5'] = true;
  subject.userData['vida38Full360Suit38OD5'] = morphology.level === 'VERY_ADVANCED' && morphology.garmentFamily === 'TECH_SUIT';
  const bodyBounds = new THREE.Box3().setFromObject(body);
  subject.userData['vida38ReptilianBodyBounds38OD2'] = { minY: bodyBounds.min.y, maxY: bodyBounds.max.y };
  return created;
}
