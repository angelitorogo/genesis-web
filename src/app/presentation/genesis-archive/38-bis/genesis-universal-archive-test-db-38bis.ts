/** Solo tests: el IndexedDB falso pertenece a cada instancia de Dexie.
 * No se cambia Dexie.dependencies ni el objeto global del navegador/worker. */
import {indexedDB, IDBKeyRange} from 'fake-indexeddb';
import {GenesisUniversalArchiveStore38Bis} from './genesis-universal-archive-38-bis.store';

export function createArchiveTestStore38Bis(name: string): GenesisUniversalArchiveStore38Bis {
  return new GenesisUniversalArchiveStore38Bis(name,{indexedDB,IDBKeyRange});
}
