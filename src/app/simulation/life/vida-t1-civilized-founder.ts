/** VIDA.T1 — selección compartida y calibración previa del fenotipo fundador.
 * No crea civilizaciones: reproduce las mismas tiradas originales de VIDA.7
 * ANTES de cerrar el snapshot VIDA.6, sin alterar especies no fundadoras.
 */
import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import { VIDA4_GROUPS } from '../../domain/life/procedural-ecology-vida4';
import {
  VIDA5C_ROLL_NAMESPACE, type Vida5cAdvancedBiosphere,
} from '../../domain/life/vida5c-advanced-biospheres';
import type { Vida3BodyIdentity, Vida3MicrobialSnapshot } from '../../domain/life/procedural-microbial-vida3';
import type {
  Vida6EcosystemRegime, Vida6Species, Vida6HabitatKind,
} from '../../domain/life/vida6-ecosystems-species';
import {
  VIDA7_NAMESPACE, VIDA7_TIER_PROBABILITIES,
  VIDA7_INTELLIGENCE_PROBABILITY, VIDA7_CIVILIZATION_CONDITIONAL_PROBABILITY,
  type Vida7Eligibility, type Vida7CivilizableLineage, type Vida7CivilizationTier,
} from '../../domain/life/vida7-intelligence-civilizations';

export const VIDA_T1_MIN_CIVILIZED_BODY_LENGTH_METERS = 1.5 as const;
export const VIDA_T1_MORPHOLOGY_NAMESPACE = 'VIDA.T1/civilized-founder-morphology/v1' as const;

const SETTLEABLE: readonly Vida6HabitatKind[] = [
  'SURFACE_SOIL','SURFACE_WET_MARGIN','SURFACE_CANOPY',
  'SURFACE_OPEN_TERRAIN','SURFACE_ROCK_SHELTER',
];
const LINEAGE_HABITATS: Readonly<Record<Vida7CivilizableLineage, readonly Vida6HabitatKind[]>> = {
  HUMANOID: ['SURFACE_SOIL','SURFACE_WET_MARGIN','SURFACE_OPEN_TERRAIN','SURFACE_ROCK_SHELTER'],
  REPTILIAN: ['SURFACE_WET_MARGIN','SURFACE_OPEN_TERRAIN','SURFACE_ROCK_SHELTER'],
  INSECTOID: ['SURFACE_SOIL','SURFACE_WET_MARGIN','SURFACE_CANOPY'],
};

function roll(key: string): number {
  const bytes = sha256(utf8ToBytes(key));
  return (bytes[0] * 0x1000000 + bytes[1] * 0x10000 + bytes[2] * 0x100 + bytes[3]) / 0x100000000;
}
function choose<T>(items: readonly T[], key: string): T {
  if (items.length === 0) throw Error('VIDA.T1 cannot select from empty candidates');
  return items[Math.min(items.length - 1, Math.floor(roll(key) * items.length))]!;
}

export function vidaT1CivilizableLineageOf(species: Vida6Species): Vida7CivilizableLineage | null {
  if (species.group === 'HUMANOIDS') return 'HUMANOID';
  if (species.group === 'REPTILES') return 'REPTILIAN';
  if (species.group === 'INSECTS') return 'INSECTOID';
  return null;
}

export function vidaT1EligibleCivilizableSpecies(
  species: readonly Vida6Species[],
): readonly Vida6Species[] {
  return species.filter(candidate => {
    const lineage = vidaT1CivilizableLineageOf(candidate);
    return lineage !== null && SETTLEABLE.includes(candidate.habitat) &&
      LINEAGE_HABITATS[lineage].includes(candidate.habitat);
  });
}

/** Exactamente la elegibilidad histórica de VIDA.7, compartida por VIDA.6 y VIDA.7. */
export function vidaT1EligibilityOf(input: {
  readonly kind: Vida3BodyIdentity['kind'];
  readonly habitat: Vida3MicrobialSnapshot['habitat'];
  readonly regime: Vida6EcosystemRegime;
  readonly effectiveGroups: readonly (typeof VIDA4_GROUPS)[number][];
  readonly calibration?: Vida5cAdvancedBiosphere;
}): Vida7Eligibility {
  const calibration = input.calibration;
  if (input.kind !== 'PLANET') return 'NON_PLANET';
  if (!calibration) return 'NO_CALIBRATION';
  if (input.habitat !== 'SURFACE_OPEN' ||
      (input.regime !== 'SURFACE_DIVERSE' && input.regime !== 'SURFACE_LIMITED'))
    return 'RESTRICTED_HABITAT';
  if (!calibration.nativeCivilizationPrerequisitesReady ||
      VIDA4_GROUPS.some(group => !input.effectiveGroups.includes(group)))
    return 'INCOMPLETE_ECOSYSTEM';
  if (calibration.atmosphericFeedback.status !== 'APPLIED' ||
      (calibration.atmosphericFeedback.oxygenFraction01 ?? 0) < 0.16 ||
      (calibration.atmosphericFeedback.oxygenPartialPressurePascal ?? 0) < 16000)
    return 'UNSUITABLE_ATMOSPHERE';
  return 'ELIGIBLE';
}

export interface VidaT1FounderSelection {
  readonly speciesId: string;
  readonly lineage: Vida7CivilizableLineage;
  /** null = especie inteligente sin civilización; no se modifica su tamaño. */
  readonly civilizationTier: Vida7CivilizationTier | null;
}

/** Mantiene *idénticas* las tiradas VIDA.5c/VIDA.7 de inteligencia y civilización. */
export function vidaT1SelectFounder(
  universeSeed: string,
  bodyStorageKey: string,
  eligible: readonly Vida6Species[],
): VidaT1FounderSelection | null {
  if (eligible.length === 0) return null;
  const forecastRoll = (phase: string) => roll([
    VIDA5C_ROLL_NAMESPACE, universeSeed, bodyStorageKey, phase,
  ].join('|'));
  if (forecastRoll('INTELLIGENCE') >= VIDA7_INTELLIGENCE_PROBABILITY) return null;
  const namespace = [VIDA7_NAMESPACE, universeSeed, bodyStorageKey].join('|');
  const lineages = [...new Set(eligible.map(species => vidaT1CivilizableLineageOf(species)!))].sort();
  const lineage = choose(lineages, namespace + '|lineage');
  const founder = choose(eligible.filter(species => vidaT1CivilizableLineageOf(species) === lineage),
    namespace + '|species');
  if (forecastRoll('CIVILIZATION') >= VIDA7_CIVILIZATION_CONDITIONAL_PROBABILITY) {
    return Object.freeze({ speciesId: founder.id, lineage, civilizationTier: null });
  }
  const tierRoll = roll(namespace + '|tier');
  const civilizationTier: Vida7CivilizationTier =
    tierRoll < VIDA7_TIER_PROBABILITIES.PRIMITIVE ? 'PRIMITIVE' :
      tierRoll < VIDA7_TIER_PROBABILITIES.PRIMITIVE + VIDA7_TIER_PROBABILITIES.ADVANCED ?
        'ADVANCED' : 'VERY_ADVANCED';
  return Object.freeze({ speciesId: founder.id, lineage, civilizationTier });
}

/** Cambia solamente el fundador civilizado: los demás fenotipos permanecen byte a byte iguales. */
export function vidaT1CalibrateFounder(
  species: readonly Vida6Species[],
  selection: VidaT1FounderSelection | null,
  universeSeed: string,
  bodyStorageKey: string,
): readonly Vida6Species[] {
  if (!selection || !selection.civilizationTier) return species;
  const index = species.findIndex(candidate => candidate.id === selection.speciesId);
  if (index < 0) throw Error('VIDA.T1: civilization founder is absent from VIDA.6 ecosystem');
  const founder = species[index]!;
  // Mantener proporciones diversas por semilla: no convertir todos los fundadores a 1,50 m exactos.
  const sizeRoll = roll([
    VIDA_T1_MORPHOLOGY_NAMESPACE, universeSeed, bodyStorageKey, founder.id, 'body-length',
  ].join('|'));
  const targetMeters = Number((VIDA_T1_MIN_CIVILIZED_BODY_LENGTH_METERS + 0.95 * sizeRoll).toFixed(3));
  const correctedLength = Math.max(founder.phenotype.bodyLengthMeters, targetMeters);
  // En un insectoide de tamaño macroscópico no conservar locomoción aérea propia
  // de los pequeños individuos; representa locomoción terrestre y manipuladores.
  const locomotion = founder.group === 'INSECTS' && founder.phenotype.locomotion === 'FLYING'
    ? 'CRAWLING' as const : founder.phenotype.locomotion;
  if (founder.phenotype.bodyLengthMeters === correctedLength &&
      founder.phenotype.locomotion === locomotion &&
      founder.adaptations.includes('MACROSCOPIC_TOOL_MANIPULATION')) {
    return species;
  }
  const updated: Vida6Species = Object.freeze({
    ...founder,
    adaptations: founder.adaptations.includes('MACROSCOPIC_TOOL_MANIPULATION')
      ? founder.adaptations
      : Object.freeze([...founder.adaptations, 'MACROSCOPIC_TOOL_MANIPULATION']),
    phenotype: Object.freeze({
      ...founder.phenotype,
      locomotion,
      bodyLengthMeters: correctedLength,
    }),
  });
  const result = [...species];
  result[index] = updated;
  return Object.freeze(result);
}
