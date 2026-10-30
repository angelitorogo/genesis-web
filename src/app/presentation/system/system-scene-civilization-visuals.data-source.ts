import { Injectable } from '@angular/core';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { extractConfirmedCivilization } from '../galaxy-knowledge-catalog/galaxy-civilization-known-index';
import { ensureVida9PlanetsInBackground } from '../runtime/vida9-background-materializer';
import { resolvePlanetVegetationPreviewProfileV1 } from '../planet-detail/planet-vegetation-preview-profile-visbio';
import {
  civilizationVisualMapOf,
  type SystemSceneCivilizationVisualRecord,
} from './system-scene-civilization-visuals';

export interface SystemSceneCivilizationVisualsRequest {
  readonly universeSeed: string;
  readonly generatorVersionCode: number;
  readonly galaxyIndex: bigint;
  readonly sectorKey: bigint;
  readonly galacticObjectIndex: bigint;
  readonly confirmed: boolean;
}

@Injectable({ providedIn: 'root' })
export class SystemSceneCivilizationVisualsDataSource {
  private readonly db = new GenesisIndexedDb();

  async read(
    request: SystemSceneCivilizationVisualsRequest,
  ): Promise<ReadonlyMap<string, SystemSceneCivilizationVisualRecord>> {
    if (!request.confirmed || request.generatorVersionCode !== GeneratorVersion.V3.code) {
      return new Map();
    }

    const systemKey = [request.galaxyIndex, request.sectorKey, request.galacticObjectIndex].join('/');
    const readRecords = async (): Promise<readonly SystemSceneCivilizationVisualRecord[]> => {
      await this.db.openDatabase();
      const ids = await this.db.privateBiologicalRecordsVIDA9
        .where('[universeSeed+generatorVersionCode+systemStorageKey]')
        .equals([request.universeSeed, request.generatorVersionCode, systemKey])
        .primaryKeys();
      const typedKeys = ids as unknown as readonly (readonly [string, number, string])[];
      const planetKeys = typedKeys.filter(id => Array.isArray(id) &&
        id[0] === request.universeSeed &&
        id[1] === request.generatorVersionCode &&
        typeof id[2] === 'string' && id[2].endsWith(':PLANET:-'));
      const collected: SystemSceneCivilizationVisualRecord[] = [];
      for (let i = 0; i < planetKeys.length; i += 32) {
        const rows = await this.db.privateBiologicalRecordsVIDA9.bulkGet(planetKeys.slice(i, i + 32));
        for (const row of rows) {
          if (!row) continue;
          try {
            const record = extractConfirmedCivilization(row, new Set([systemKey]));
            const tier = record?.intelligence.civilization?.tier;
            if (record && tier) {
              collected.push(Object.freeze({
                bodyIndex: record.identity.bodyIndex.toString(),
                tier,
                vegetationProfile: resolvePlanetVegetationPreviewProfileV1(record, undefined),
              }));
            }
          } catch (error) {
            console.warn('VISCIV.1a: registro biológico de civilización no verificable', row.bodyStorageKey, error);
          }
        }
      }
      return Object.freeze(collected.sort((left, right) => left.bodyIndex.localeCompare(right.bodyIndex)));
    };

    let records = await readRecords();
    if (records.length === 0) {
      const generation = new UniverseGenerationKey(UniverseSeed.parse(request.universeSeed), GeneratorVersion.V3);
      const pending = ensureVida9PlanetsInBackground(generation, request.galaxyIndex, new Set([systemKey]));
      if (pending) {
        await pending;
        records = await readRecords();
      }
    }

    return civilizationVisualMapOf(records);
  }
}
