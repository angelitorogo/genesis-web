import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import type { Vida38HumanoidQuality } from './vida38-humanoid-organic-field-38-2e';

export type Vida38CivilizationLevel38OC = 'PRIMITIVE' | 'ADVANCED' | 'VERY_ADVANCED';
export type Vida38ReptilianHumanoidProfile38OC = 'SAGE_LITHE' | 'WARDEN_ROBUST' | 'CREST_NOBLE';

export interface Vida38ReptilianHumanoidMorphology38OC {
  readonly level: Vida38CivilizationLevel38OC;
  readonly profile: Vida38ReptilianHumanoidProfile38OC;
  readonly skinColorHex: string;
  readonly accentColorHex: string;
  readonly bellyColorHex: string;
  readonly darkColorHex: string;
  readonly garmentBaseHex: string;
  readonly shoulderWidth: number;
  readonly chestScale: number;
  readonly hipWidth: number;
  readonly neckLength: number;
  readonly headLength: number;
  readonly snoutLength: number;
  readonly armReach: number;
  readonly legLength: number;
  readonly tailLength: number;
  readonly handClawCount: number;
  readonly footClawCount: number;
  readonly scaleCount: number;
  readonly crestCount: number;
}

export function mixHex38OC(a: string, b: string, factor: number): string {
  return `#${new THREE.Color(a).clone().lerp(new THREE.Color(b), factor).getHexString()}`;
}

function hash32(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619) >>> 0;
  return h >>> 0;
}

export class Vida38Rng38OC {
  constructor(private state: number) {}
  next(): number {
    let x = this.state || 0x12345678;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 0xffffffff;
  }
  range(min: number, max: number): number { return min + (max - min) * this.next(); }
  pick<T>(values: readonly T[]): T { return values[Math.min(values.length - 1, Math.floor(this.next() * values.length))]!; }
}

export function civilizationLevelFrom38OC(contract: Vida38SpeciesVisualContract): Vida38CivilizationLevel38OC {
  const intelligence = contract.intelligence as unknown as Record<string, unknown> | null;
  const value = String(intelligence?.['civilizationLevel'] ?? intelligence?.['civilisationLevel'] ?? intelligence?.['societyLevel'] ?? intelligence?.['stage'] ?? intelligence?.['civilizationStage'] ?? 'PRIMITIVE').toUpperCase();
  return value === 'VERY_ADVANCED' ? 'VERY_ADVANCED' : value === 'ADVANCED' ? 'ADVANCED' : 'PRIMITIVE';
}

export function deriveVida38ReptilianHumanoidMorphology38OC(contract: Vida38SpeciesVisualContract, quality: Vida38HumanoidQuality): Vida38ReptilianHumanoidMorphology38OC {
  const seed = hash32(`${contract.speciesId}|${contract.appearanceFingerprint}|38.2oc`);
  const profileIndex = seed % 3;
  const profile: Vida38ReptilianHumanoidProfile38OC = profileIndex === 0 ? 'SAGE_LITHE' : profileIndex === 1 ? 'WARDEN_ROBUST' : 'CREST_NOBLE';
  const level = civilizationLevelFrom38OC(contract);
  const skinColorHex = contract.pigmentation.primaryColorHex;
  const accentColorHex = contract.pigmentation.secondaryColorHex;
  const bellyColorHex = mixHex38OC(skinColorHex, '#e7dcc7', 0.34);
  const darkColorHex = mixHex38OC(skinColorHex, '#18212b', 0.22);
  const garmentBaseHex = mixHex38OC(accentColorHex, '#334857', 0.28);
  const lodFactor = quality === 'LOW' ? 0.7 : quality === 'MEDIUM' ? 1 : 1.25;
  return {
    level,
    profile,
    skinColorHex,
    accentColorHex,
    bellyColorHex,
    darkColorHex,
    garmentBaseHex,
    shoulderWidth: profile === 'WARDEN_ROBUST' ? 0.4 : profile === 'CREST_NOBLE' ? 0.36 : 0.34,
    chestScale: profile === 'WARDEN_ROBUST' ? 1.14 : profile === 'CREST_NOBLE' ? 1.02 : 0.96,
    hipWidth: profile === 'WARDEN_ROBUST' ? 0.22 : 0.19,
    neckLength: profile === 'CREST_NOBLE' ? 0.26 : 0.2,
    headLength: profile === 'SAGE_LITHE' ? 1.12 : profile === 'WARDEN_ROBUST' ? 1.02 : 1.08,
    snoutLength: profile === 'WARDEN_ROBUST' ? 1.0 : 1.12,
    armReach: profile === 'SAGE_LITHE' ? 1.06 : 0.98,
    legLength: profile === 'SAGE_LITHE' ? 0.98 : 0.92,
    tailLength: profile === 'CREST_NOBLE' ? 0.68 : 0.56,
    handClawCount: 4,
    footClawCount: 3,
    scaleCount: Math.round((quality === 'LOW' ? 18 : quality === 'MEDIUM' ? 30 : 44) * lodFactor),
    crestCount: profile === 'CREST_NOBLE' ? 5 : profile === 'WARDEN_ROBUST' ? 2 : 0,
  };
}
