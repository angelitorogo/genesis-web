/** VIDA.6 — ecosistemas y especies procedurales de Ground Truth privado.
 * No es observacion, identificacion taxonomica terrestre ni civilizacion VIDA.7.
 */
import type { Vida3BodyIdentity, Vida3MicrobialSnapshot } from './procedural-microbial-vida3';
import type { Vida4Group } from './procedural-ecology-vida4';

export const VIDA6_REVISION = 'VIDA.6/ecosystems-species/v1' as const;
export const VIDA6_RANDOM_NAMESPACE = 'VIDA.6/ecosystems-species/v1' as const;
export type Vida6EcosystemRegime = 'STERILE' | 'ISOLATED_SUBSURFACE' |
  'PROTECTED_MICROBIAL_SEEP' | 'SURFACE_LIMITED' | 'SURFACE_DIVERSE';
export type Vida6HabitatKind = 'AQUIFER' | 'SUBSURFACE_CAVERN' | 'PROTECTED_SEEP' |
  'SURFACE_SOIL' | 'SURFACE_WET_MARGIN' | 'SURFACE_CANOPY' |
  'SURFACE_OPEN_TERRAIN' | 'SURFACE_ROCK_SHELTER' | 'SURFACE_AIR';
export type Vida6Nutrition = 'CHEMOSYNTHETIC' | 'PHOTOSYNTHETIC' | 'DECOMPOSER' |
  'HERBIVORE' | 'PREDATOR' | 'OMNIVORE' | 'MICROBIVORE';
export type Vida6InteractionKind = 'CONSUMES' | 'DECOMPOSES' | 'MUTUALISM' | 'COMPETES';
export type Vida6BodyPlan = 'CELL_COLONY' | 'FILAMENTOUS' | 'FROND' | 'STEMMED' |
  'ARTHROPOD' | 'TETRAPOD' | 'WINGED' | 'BIPED';
export type Vida6BodyCovering = 'MEMBRANE' | 'CHITINOUS' | 'SCALES' | 'FEATHERS' |
  'FUR' | 'LEATHERY' | 'FIBROUS';
export type Vida6Locomotion = 'SESSILE' | 'CRAWLING' | 'WALKING' | 'FLYING' | 'SWIMMING';

export interface Vida6VisualPhenotype {
  readonly bodyPlan: Vida6BodyPlan;
  readonly covering: Vida6BodyCovering;
  readonly locomotion: Vida6Locomotion;
  readonly bodyLengthMeters: number;
  /** RGB hexadecimal para futura representacion procedural, no geometria precalculada. */
  readonly primaryColorHex: string;
  readonly secondaryColorHex: string;
  readonly pattern: 'SOLID' | 'BANDS' | 'SPOTS' | 'MOTTLED';
  readonly appendagePairs: number;
  readonly bioluminescent: boolean;
}
export interface Vida6Species {
  readonly id: string;
  readonly proceduralName: string;
  readonly group: Vida4Group;
  readonly habitat: Vida6HabitatKind;
  readonly nutrition: Vida6Nutrition;
  readonly adaptations: readonly string[];
  readonly phenotype: Vida6VisualPhenotype;
  /** Rol de nicho, no nivel evolutivo ni inteligencia. */
  readonly niche: string;
}
export interface Vida6EcologicalRelation {
  readonly sourceSpeciesId: string;
  readonly targetSpeciesId: string;
  readonly kind: Vida6InteractionKind;
  /** Funciones locales acotadas; no tasas poblacionales o bioquimicas. */
  readonly intensity01: number;
}
export interface Vida6EcosystemSnapshot {
  readonly revision: typeof VIDA6_REVISION;
  readonly identity: Vida3BodyIdentity;
  readonly bodyStorageKey: string;
  readonly microbialRevision: Vida3MicrobialSnapshot['revision'];
  readonly microbialDigest: string;
  readonly originalEcologyDigest: string;
  /** VIDA.5c es la unica fuente de ampliacion superficial; puede ser null para lunas. */
  readonly calibrationDigest: string | null;
  readonly habitat: Vida3MicrobialSnapshot['habitat'];
  readonly regime: Vida6EcosystemRegime;
  readonly effectiveGroups: readonly Vida4Group[];
  readonly species: readonly Vida6Species[];
  readonly relations: readonly Vida6EcologicalRelation[];
  readonly habitatsOccupied: readonly Vida6HabitatKind[];
  readonly biospherePresent: boolean;
  /** Nunca deducir inteligencia o civilizacion a partir del plan corporal. */
  readonly intelligentSpeciesGenerated: false;
  readonly civilizationGenerated: false;
  readonly digest: string;
}
