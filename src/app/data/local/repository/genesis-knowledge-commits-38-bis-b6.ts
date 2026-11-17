/** 38.bis-b6 · Notifications of *committed* scientific knowledge.
 * The Archive is a derived index. It must never become part of a scientific
 * transaction, nor keep that transaction alive by awaiting another database. */
import Dexie from 'dexie';

export type GenesisKnowledgeCommitKind38BisB6 =
  'GALAXY'|'SECTOR'|'GALACTIC_OBJECT'|'SYSTEM'|'BODY'|'CIVILIZATION'|'VIDA9'|'RESTORE';

export interface GenesisKnowledgeCommit38BisB6 {
  readonly universeSeed:string;
  readonly generatorVersionCode:number;
  readonly galaxyIndex:string;
  readonly kind:GenesisKnowledgeCommitKind38BisB6;
}

type Listener=(event:GenesisKnowledgeCommit38BisB6)=>Promise<void>|void;
const listeners=new Set<Listener>();

/** Collect changes belonging to an outer Dexie transaction. Its complete/abort
 * hooks determine whether those changes can become observable to the Archive. */
type PendingTransactionEvents=Map<string,GenesisKnowledgeCommit38BisB6>;
const pendingByTransaction=new WeakMap<object,PendingTransactionEvents>();

export function subscribeGenesisKnowledgeCommits38BisB6(listener:Listener):()=>void {
  listeners.add(listener);
  return ()=>{listeners.delete(listener);};
}

async function deliver(event:GenesisKnowledgeCommit38BisB6):Promise<void>{
  await Promise.all([...listeners].map(async listener=>{
    try { await listener(event); }
    catch(error){
      // An indexing failure never rolls back discovery or consumes extra PD.
      console.warn('GENESIS 38.bis-b6: no se pudo registrar una actualización del Archivo',error);
    }
  }));
}

/** Called by repositories after their own write. When a repository participates
 * in a larger Dexie transaction (galaxy catalogue, system confirmation, sector
 * discovery...), its write has NOT committed yet. Never await a second IndexedDB
 * database inside that transaction: the native transaction can auto-complete
 * before the remaining scientific writes (PD, observations, etc.).
 *
 * Instead, register an AFTER-COMMIT callback on the real outer transaction.
 * On abort nothing is published. Outside a transaction, deliver normally. */
export async function publishGenesisKnowledgeCommit38BisB6(
  event:GenesisKnowledgeCommit38BisB6,
):Promise<void>{
  const transaction=Dexie.currentTransaction;
  if(!transaction){
    // A standalone discovery write has already committed. Do not delay its
    // UI transition waiting for a derived-index update in another database.
    void deliver(event);
    return;
  }
  let pending=pendingByTransaction.get(transaction);
  if(!pending){
    pending=new Map<string,GenesisKnowledgeCommit38BisB6>();
    const events=pending;
    pendingByTransaction.set(transaction,events);
    transaction.on('complete',()=>{
      pendingByTransaction.delete(transaction);
      // Leave Dexie's transaction zone before any Archive DB access. Never
      // await an Archive listener from a scientific commit callback.
      if(events.size>0) setTimeout(()=>{
        for(const committedEvent of events.values()) void deliver(committedEvent);
        events.clear();
      },0);
    });
    transaction.on('abort',()=>{
      events.clear();
      pendingByTransaction.delete(transaction);
    });
  }
  // A sector scan can persist many objects inside one transaction. Emit just
  // one invalidation per universe / galaxy / category for this commit.
  pending.set(JSON.stringify([event.universeSeed,event.generatorVersionCode,
    event.galaxyIndex,event.kind]),event);
}
