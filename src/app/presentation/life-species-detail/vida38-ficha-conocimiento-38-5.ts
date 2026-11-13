/**
 * GENESIS 38.5 — proyección únicamente de conocimiento confirmado.
 * No genera taxones, culturas, tecnologías ni observaciones; no consulta Ground Truth.
 * Esta función NO sustituye la autorización del router/catálogo: exige su confirmación explícita.
 */
import { VIDA9_REVISION, vida9DigestForRecord, type Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';
import {
  vida38SpeciesVisualContractFromConfirmedV1,
  type Vida38SpeciesVisualContract,
} from '../life-species-visual/vida38-species-visual-contract';

type Vida6Species = Vida9BiologyRecord['ecosystem']['species'][number];
type Vida6Relation = Vida9BiologyRecord['ecosystem']['relations'][number];
type Vida7Civilization = NonNullable<Vida9BiologyRecord['intelligence']['civilization']>;

/** Debe provenir del mecanismo de descubrimiento/confirmación, NO de VIDA.9 privado. */
export interface Vida38SpeciesKnowledgeGrant385 {
  readonly confirmedSystem: boolean;
  readonly bodyStorageKey: string;
}

export interface Vida38SpeciesDetailKnowledge385 {
  readonly species: Vida6Species;
  readonly visualContract: Vida38SpeciesVisualContract;
  readonly originBodyStorageKey: string;
  readonly historicalOriginEpochYears: null;
  readonly ecologicalRelations: readonly Vida6Relation[];
  readonly civilization: Vida7Civilization | null;
  readonly provenance: 'VIDA.6/VIDA.7/VIDA.9 · CT-0 confirmado';
  readonly representation: 'RECONSTRUCCIÓN CIENTÍFICA PROCEDURAL · NO IMAGEN OBSERVADA';
}

/** Null = acceso no autorizado, datos no íntegros o especie inexistente. Fail closed. */
export function vida38ConfirmedSpeciesDetail385(
  record: Vida9BiologyRecord | null,
  speciesId: string,
  grant: Vida38SpeciesKnowledgeGrant385,
): Vida38SpeciesDetailKnowledge385 | null {
  if (!grant.confirmedSystem || !record || !speciesId ||
      !grant.bodyStorageKey || record.bodyStorageKey !== grant.bodyStorageKey ||
      record.revision !== VIDA9_REVISION || record.epoch !== 'CT-0' ||
      record.epochOffsetYears !== 0 ||
      record.revealPolicy !== 'FULL_SYSTEM_REVEAL_ON_CONFIRMED' ||
      record.historicalOriginEpochYears !== null) return null;

  // El digest se valida ANTES de divulgar relaciones, tecnología o cultura.
  const { digest, ...content } = record;
  if (vida9DigestForRecord(content) !== digest) return null;

  const visualContract = vida38SpeciesVisualContractFromConfirmedV1(record, speciesId);
  if (!visualContract) return null;
  const species = record.ecosystem.species.find(s => s.id === speciesId);
  if (!species) return null;
  const validSpeciesIds = new Set(record.ecosystem.species.map(s => s.id));
  const ecologicalRelations = record.ecosystem.relations.filter(r =>
    (r.sourceSpeciesId === speciesId || r.targetSpeciesId === speciesId) &&
    validSpeciesIds.has(r.sourceSpeciesId) && validSpeciesIds.has(r.targetSpeciesId));
  const civ = record.intelligence.civilization;
  const intelligence = record.intelligence.intelligentSpecies;
  const civilization = civ && intelligence &&
    civ.founderSpeciesId === speciesId && intelligence.speciesId === speciesId &&
    civ.lineage === intelligence.lineage && record.nativeCivilizationPresent
      ? civ : null;

  return Object.freeze({
    species,
    visualContract,
    originBodyStorageKey: record.bodyStorageKey,
    historicalOriginEpochYears: null,
    ecologicalRelations: Object.freeze([...ecologicalRelations]),
    civilization,
    provenance: 'VIDA.6/VIDA.7/VIDA.9 · CT-0 confirmado' as const,
    representation: 'RECONSTRUCCIÓN CIENTÍFICA PROCEDURAL · NO IMAGEN OBSERVADA' as const,
  });
}
