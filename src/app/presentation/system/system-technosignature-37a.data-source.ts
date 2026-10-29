/** 37.A: bounded, read-only consultation of biological records of ONE confirmed system.
 * It does not scan a galaxy, create a discovery, or disclose the homeworld. */
import { Injectable } from '@angular/core';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import {
  technosignatureProfile37a, systemTechnosignatureAlert37a,
  type Technosignature37aProfile,
} from '../../domain/life/technosignatures-37a';
import { extractConfirmedCivilization } from '../galaxy-knowledge-catalog/galaxy-civilization-known-index';
import { ensureVida9PlanetsInBackground } from '../runtime/vida9-background-materializer';

export interface SystemTechnosignature37aRequest {
  readonly universeSeed: string;
  readonly generatorVersionCode: number;
  readonly galaxyIndex: bigint;
  readonly sectorKey: bigint;
  readonly galacticObjectIndex: bigint;
  readonly confirmed: boolean;
}
export interface SystemTechnosignature37aResult {
  readonly alert: 'ADVANCED'|'VERY_ADVANCED'|null;
  readonly profiles: readonly Technosignature37aProfile[];
}

@Injectable({providedIn:'root'})
export class SystemTechnosignature37aDataSource {
  private readonly db = new GenesisIndexedDb();

  async read(request:SystemTechnosignature37aRequest):Promise<SystemTechnosignature37aResult> {
    if (!request.confirmed || request.generatorVersionCode!==GeneratorVersion.V3.code)
      return {alert:null,profiles:[]};
    const key = [request.galaxyIndex,request.sectorKey,request.galacticObjectIndex].join('/');
    const records = async():Promise<{profiles:readonly Technosignature37aProfile[];planetRecordCount:number}> => {
      await this.db.openDatabase();
      const ids = await this.db.privateBiologicalRecordsVIDA9
        .where('[universeSeed+generatorVersionCode+systemStorageKey]')
        .equals([request.universeSeed,request.generatorVersionCode,key])
        .primaryKeys();
      // Dexie returns generic indexed keys; the V10 primary key is a triple.
      const typedKeys=ids as unknown as readonly (readonly [string,number,string])[];
      // Read only PLANET rows: moon identities never create native civilizations.
      const planetKeys = typedKeys.filter(id=>Array.isArray(id) &&
        id[0]===request.universeSeed && id[1]===request.generatorVersionCode &&
        typeof id[2]==='string' && id[2].endsWith(':PLANET:-'));
      const profiles:Technosignature37aProfile[]=[];
      for(let i=0;i<planetKeys.length;i+=32) {
        const rows=await this.db.privateBiologicalRecordsVIDA9.bulkGet(planetKeys.slice(i,i+32));
        for(const row of rows) {
          if(!row)continue;
          // Reuse the strict VIDA.9 identity/digest/CONFIRMED checks of the galactic index.
          try {
            const record=extractConfirmedCivilization(row,new Set([key]));
            if(record?.intelligence.civilization) profiles.push(
              technosignatureProfile37a(record.intelligence.civilization));
          } catch(error) {
            // An invalid private record cannot make other valid civilizations
            // disappear, and it never becomes evidence by assumption.
            console.warn('37.A: registro biológico no verificable',row.bodyStorageKey,error);
          }
        }
      }
      return {profiles,planetRecordCount:planetKeys.length};
    };
    let result=await records();
    // First entry after confirmation may race the worker materializing VIDA.9.
    // Await only the current system, never a galaxy-wide census or UI-thread rebuild.
    if(result.planetRecordCount===0){
      const generation=new UniverseGenerationKey(UniverseSeed.parse(request.universeSeed),GeneratorVersion.V3);
      const pending=ensureVida9PlanetsInBackground(generation,request.galaxyIndex,new Set([key]));
      if(pending){
        await pending;
        result=await records();
      }
    }
    return {alert:systemTechnosignatureAlert37a(result.profiles),profiles:result.profiles};
  }
}
