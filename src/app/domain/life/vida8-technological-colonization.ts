/** VIDA.8 — Ground Truth colonial separado de la vida nativa y observada.
 * No convierte colonias en biosferas naturales ni aplica terraformacion a la fisica V3.
 */
import type { Vida3BodyIdentity } from './procedural-microbial-vida3';
import type { Vida7CivilizableLineage, Vida7CivilizationTier } from './vida7-intelligence-civilizations';

export const VIDA8_REVISION = 'VIDA.8/technological-colonization/v1' as const;
export const VIDA8_NAMESPACE = 'VIDA.8/technological-colonization/v1' as const;
export type Vida8HabitatTechnology = 'SEALED_SURFACE' | 'SUBSURFACE_VAULT' | 'ENVIRONMENTAL_SHIELD';
export type Vida8ColonyFunction = 'RESEARCH' | 'EXTRACTION' | 'HABITATION' | 'BIOSPHERE_CONSERVATION';
export type Vida8PopulationBand = 'OUTPOST' | 'SETTLEMENT' | 'CITY' | 'NETWORK';
export type Vida8TerraformingStage = 'NONE' | 'FEASIBILITY' | 'PILOT_CLOSED' | 'LONG_TERM_PROJECT';
export type Vida8Outcome = 'NO_ELIGIBLE_ORIGIN' | 'NO_SOLID_SURFACE' | 'NOT_SELECTED' | 'COLONIZED';
export interface Vida8OriginRef {
  readonly civilizationDigest: string;
  readonly sourceEcosystemDigest: string;
  readonly sourceBodyStorageKey: string;
  readonly sourceIdentity: Vida3BodyIdentity;
  readonly founderSpeciesId: string;
  readonly lineage: Vida7CivilizableLineage;
  readonly tier: Exclude<Vida7CivilizationTier,'PRIMITIVE'>;
}
export interface Vida8ColonialSettlement {
  readonly id: string;
  readonly habitatTechnology: Vida8HabitatTechnology;
  readonly function: Vida8ColonyFunction;
  readonly populationBand: Vida8PopulationBand;
  /** Poblacion en un intervalo cualitativo; nunca habitantes nativos del destino. */
  readonly colonialPopulationRange: readonly [number,number];
  readonly supportSystems: readonly string[];
}
export interface Vida8IntroducedOrganism {
  readonly originSpeciesId: string;
  readonly provenance: 'IMPORTED_FROM_ORIGIN';
  readonly role: 'CLOSED_LOOP_MICROBES' | 'CONTROLLED_CULTIVATION';
  readonly containment: 'SEALED_BIOREACTOR' | 'CLOSED_GROW_MODULE';
}
export interface Vida8TerraformingProject {
  readonly stage: Exclude<Vida8TerraformingStage,'NONE'>;
  readonly goals: readonly ('ATMOSPHERIC_PROCESSING' | 'RADIATION_SHIELDING' | 'THERMAL_REGULATION' | 'WATER_RECYCLING')[];
  readonly environmentChanged: false;
  readonly isFeasibilityOnly: boolean;
  readonly ecologicalReleaseAuthorized: false;
}
export interface Vida8Colony {
  readonly id: string;
  readonly origin: Vida8OriginRef;
  readonly settlement: Vida8ColonialSettlement;
  readonly introducedOrganisms: readonly Vida8IntroducedOrganism[];
  readonly terraform: Vida8TerraformingProject | null;
  /** Nunca equivale a vida originada en el planeta/luna destino. */
  readonly provenance: 'TECHNOLOGICAL_COLONIZATION';
}
export interface Vida8ColonizationSnapshot {
  readonly revision: typeof VIDA8_REVISION;
  readonly identity: Vida3BodyIdentity;
  readonly bodyStorageKey: string;
  readonly ecosystemRevision: 'VIDA.6/ecosystems-species/v1';
  readonly ecosystemDigest: string;
  readonly nativeCivilizationRevision: 'VIDA.7/intelligence-civilizations/v1';
  readonly nativeCivilizationDigest: string;
  /** Nunca alterar la vida nativa, incluso en destinos esteriles colonizados. */
  readonly nativeLifePresent: boolean;
  readonly nativeIntelligencePresent: boolean;
  readonly nativeCivilizationPresent: boolean;
  readonly introducedLifePresent: boolean;
  readonly colonialPopulationPresent: boolean;
  readonly outcome: Vida8Outcome;
  readonly colonies: readonly Vida8Colony[];
  readonly digest: string;
}
