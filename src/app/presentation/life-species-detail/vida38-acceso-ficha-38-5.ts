/**
 * 38.5 — Autorización previa a resolver cualquier ficha biológica privada.
 * Deriva el permiso del estado de descubrimiento persistido y coteja el destino
 * solicitado con la identidad CT-0. No consulta ni genera Ground Truth.
 */
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import type { Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';
import {
  vida38ConfirmedSpeciesDetail385,
  type Vida38SpeciesDetailKnowledge385,
} from './vida38-ficha-conocimiento-38-5';

export interface Vida38KnowledgeRoute385 {
  readonly locatorKind: string;
  readonly discoveryState: { readonly code: number };
  readonly generatorVersionCode: number;
  readonly universeSeed: string;
  readonly galaxyIndex: bigint;
  readonly sectorKey: bigint;
  readonly galacticObjectIndex: bigint;
}

export function vida38ExpectedBodyKey385(
  model: Vida38KnowledgeRoute385 | null,
  bodyIndex: bigint | null,
  moonIndex: bigint | null,
  isMoon: boolean,
): string | null {
  if (!model || model.locatorKind !== 'system' ||
      model.generatorVersionCode !== 3 ||
      model.discoveryState.code < DiscoveryState.CONFIRMED.code ||
      bodyIndex === null || bodyIndex < 0n ||
      (isMoon && (moonIndex === null || moonIndex < 0n))) return null;
  return [model.galaxyIndex, model.sectorKey, model.galacticObjectIndex,
    bodyIndex, isMoon ? 'MOON' : 'PLANET', isMoon ? moonIndex : '-']
    .map(String).join(':');
}

export function vida38AuthorizeSpeciesRoute385(
  model: Vida38KnowledgeRoute385 | null,
  bodyIndex: bigint | null,
  moonIndex: bigint | null,
  isMoon: boolean,
  record: Vida9BiologyRecord | null,
  speciesId: string | null,
): Vida38SpeciesDetailKnowledge385 | null {
  const expectedBody = vida38ExpectedBodyKey385(model, bodyIndex, moonIndex, isMoon);
  if (!model || !record || !speciesId || expectedBody === null ||
      record.bodyStorageKey !== expectedBody ||
      record.identity.universeSeed !== model.universeSeed ||
      record.identity.generatorVersionCode !== model.generatorVersionCode ||
      record.identity.galaxyIndex !== model.galaxyIndex.toString() ||
      record.identity.sectorKey !== model.sectorKey.toString() ||
      record.identity.galacticObjectIndex !== model.galacticObjectIndex.toString() ||
      record.identity.bodyIndex !== bodyIndex?.toString() ||
      record.identity.kind !== (isMoon ? 'MOON' : 'PLANET') ||
      (record.identity.moonIndex ?? null) !== (isMoon ? moonIndex?.toString() : null)) return null;

  return vida38ConfirmedSpeciesDetail385(record, speciesId, {
    confirmedSystem: true,
    bodyStorageKey: expectedBody,
  });
}
