import { Injectable } from '@angular/core';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieVida9BiologyExplorationRepository } from '../../data/local/repository/dexie-vida9-biology-exploration.repository';
import { vida38InfrastructurePlansFromConfirmed386 } from '../infrastructure/vida38-infrastructure-plan-38-6';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { extractConfirmedCivilization } from '../galaxy-knowledge-catalog/galaxy-civilization-known-index';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
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
      const biologyKeys = typedKeys.filter(id => Array.isArray(id) &&
        id[0] === request.universeSeed && id[1] === request.generatorVersionCode &&
        typeof id[2] === 'string' && /:(?:PLANET:-|MOON:\d+)$/.test(id[2]));
      const repo = new DexieVida9BiologyExplorationRepository(this.db);
      const collected: SystemSceneCivilizationVisualRecord[] = [];
      // Bulk-scan cheap provenance flags first; verify only candidate records with
      // the REAL VIDA.9 repository. No raw/private payload reaches the renderer.
      for (let offset=0;offset<biologyKeys.length;offset+=32) {
        const block=biologyKeys.slice(offset,offset+32);
        const rows=await this.db.privateBiologicalRecordsVIDA9.bulkGet(block);
        for (let index=0;index<block.length;index++) {
          const key=block[index]!;
          const row=rows[index];
          if (!row || typeof row.payloadJson !== 'string' ||
            (!row.payloadJson.includes('"nativeCivilizationPresent":true') &&
             !row.payloadJson.includes('"colonialPopulationPresent":true'))) continue;
          try {
            const record=await repo.get(key[0],key[1],key[2]);
            if (!record) continue;
            const plan=vida38InfrastructurePlansFromConfirmed386(record);
            // Native lights retain exactly the existing verified-civilization rule.
            const tier=record.identity.kind==='PLANET'
              ? extractConfirmedCivilization(row,new Set([systemKey]))?.intelligence.civilization?.tier ?? null
              : null;
            if (tier === null && plan.length === 0) continue;
            collected.push(Object.freeze({
              universeSeed:request.universeSeed,generatorVersionCode:request.generatorVersionCode,
              systemKey,bodyIndex:record.identity.bodyIndex,
              moonIndex:record.identity.kind==='MOON'?record.identity.moonIndex:null,
              tier,infrastructurePlans:plan,
              vegetationProfile:record.identity.kind==='PLANET' && tier!==null
                ? resolvePlanetVegetationPreviewProfileV1(record,undefined):null,
            }));
          } catch(error) {
            console.warn('38.6: registro biológico no verificable; infraestructura omitida',key[2],error);
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
