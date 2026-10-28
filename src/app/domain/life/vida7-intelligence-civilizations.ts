/** VIDA.7 — inteligencia y civilizaciones nativas en Ground Truth privado.
 * No modifica las biosferas anteriores ni constituye observacion del jugador.
 */
import type { Vida3BodyIdentity } from './procedural-microbial-vida3';
import type { Vida6HabitatKind } from './vida6-ecosystems-species';

export const VIDA7_REVISION = 'VIDA.7/intelligence-civilizations/v1' as const;
export const VIDA7_NAMESPACE = 'VIDA.7/intelligence-civilizations/v1' as const;
/** Mantener la seleccion previsualizada en VIDA.5c: 65% inteligente, 60% civilizado condicionado. */
export const VIDA7_INTELLIGENCE_PROBABILITY = 0.65 as const;
export const VIDA7_CIVILIZATION_CONDITIONAL_PROBABILITY = 0.60 as const;
/** Distribucion REAL de VIDA.7. Sustituye la proyeccion tecnologica historica 60/30/10 de VIDA.5c. */
export const VIDA7_TIER_PROBABILITIES = Object.freeze({
  PRIMITIVE: 0.65, ADVANCED: 0.30, VERY_ADVANCED: 0.05,
} as const);
export type Vida7CivilizableLineage = 'HUMANOID' | 'REPTILIAN' | 'INSECTOID';
export type Vida7CivilizationTier = keyof typeof VIDA7_TIER_PROBABILITIES;
export type Vida7Eligibility = 'NO_CALIBRATION' | 'NON_PLANET' | 'RESTRICTED_HABITAT' |
  'INCOMPLETE_ECOSYSTEM' | 'UNSUITABLE_ATMOSPHERE' | 'ELIGIBLE';
export type Vida7SocialStructure = 'CLAN' | 'COOPERATIVE_BAND' | 'SWARM_NETWORK' |
  'URBAN_NETWORK' | 'PLANETARY_COORDINATION';
export type Vida7Communication = 'VOCAL_SYMBOLIC' | 'VISUAL_GESTURAL' | 'CHEMOSENSORY_SYMBOLIC';
export type Vida7BuiltForm = 'HABITAT_HOMESTEAD' | 'ROCK_TERRACE' | 'COLONY_MOUND' |
  'MODULAR_CITY' | 'INTEGRATED_HABITAT' | 'CANOPY_NEST' | 'WETLAND_PLATFORM';
export interface Vida7IntelligentSpecies {
  /** Ref a una especie de VIDA.6, no crea un taxon adicional. */
  readonly speciesId: string;
  readonly lineage: Vida7CivilizableLineage;
  readonly communication: Vida7Communication;
  readonly socialStructure: Vida7SocialStructure;
  readonly cognitionTraits: readonly ('SYMBOLIC_LEARNING' | 'SOCIAL_MEMORY' |
    'PROBLEM_SOLVING' | 'TOOL_MANIPULATION' | 'COLLECTIVE_PLANNING')[];
}
export interface Vida7Settlement {
  readonly id: string;
  /** Modelo de emplazamiento compatible con el habitat realmente ocupado en VIDA.6. */
  readonly habitat: Vida6HabitatKind;
  readonly builtForm: Vida7BuiltForm;
  readonly purpose: 'SUBSISTENCE' | 'HABITATION' | 'CRAFT' | 'RESEARCH' | 'COORDINATION';
  readonly scale: 'SMALL' | 'MEDIUM' | 'LARGE';
}
export interface Vida7Civilization {
  readonly founderSpeciesId: string;
  readonly lineage: Vida7CivilizableLineage;
  readonly tier: Vida7CivilizationTier;
  readonly culture: {
    readonly socialOrganization: Vida7SocialStructure;
    readonly governingTradition: string;
    readonly communication: Vida7Communication;
    readonly culturalFocus: string;
  };
  /** Capacidad tecnologica cualitativa, no objetos en 3D ni alteraciones planetarias. */
  readonly technology: readonly string[];
  readonly settlementPatterns: readonly Vida7Settlement[];
}
export interface Vida7IntelligenceCivilizationSnapshot {
  readonly revision: typeof VIDA7_REVISION;
  readonly identity: Vida3BodyIdentity;
  readonly bodyStorageKey: string;
  readonly ecosystemRevision: 'VIDA.6/ecosystems-species/v1';
  readonly ecosystemDigest: string;
  readonly calibrationDigest: string | null;
  readonly eligibility: Vida7Eligibility;
  readonly intelligentSpecies: Vida7IntelligentSpecies | null;
  readonly civilization: Vida7Civilization | null;
  /** Se distingue inteligencia efectiva de civilizacion establecida. */
  readonly intelligencePresent: boolean;
  readonly civilizationPresent: boolean;
  readonly digest: string;
}
