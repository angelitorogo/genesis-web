import { Injectable } from '@angular/core';
import type { Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';
import { DexieVida9BiologyExplorationRepository } from '../../data/local/repository/dexie-vida9-biology-exploration.repository';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieProceduralMicrobialVIDA3Repository } from '../../data/local/repository/dexie-procedural-microbial-vida3.repository';
import { DexieProceduralEcologyVIDA4Repository } from '../../data/local/repository/dexie-procedural-ecology-vida4.repository';
import { DexieVida5cAdvancedBiospheresRepository } from '../../data/local/repository/dexie-vida5c-advanced-biospheres.repository';
import { VIDA6_REVISION, type Vida6EcosystemSnapshot } from '../../domain/life/vida6-ecosystems-species';
import type { Vida8ColonizationSnapshot } from '../../domain/life/vida8-technological-colonization';
import { DexieVida8TechnologicalColonizationRepository } from '../../data/local/repository/dexie-vida8-technological-colonization.repository';
import type { Vida7IntelligenceCivilizationSnapshot } from '../../domain/life/vida7-intelligence-civilizations';
import { DexieVida7IntelligenceCivilizationsRepository } from '../../data/local/repository/dexie-vida7-intelligence-civilizations.repository';
import { DexieVida6EcosystemsSpeciesRepository } from '../../data/local/repository/dexie-vida6-ecosystems-species.repository';
import type { Vida5cAdvancedBiosphere } from '../../domain/life/vida5c-advanced-biospheres';
import { ProceduralEcologyVIDA4 } from '../../simulation/life/procedural-ecology-vida4';
import { ProceduralMicrobialLifeVIDA3, type Vida3BodyIdentity } from '../../simulation/life/procedural-microbial-life-vida3';
import type { Vida2WorldAssessment } from '../../simulation/life/life-plausibility-engine-vida2';

@Injectable({providedIn: 'root'})
export class Vida3PrivateMicrobialRuntime {
  private readonly database = new GenesisIndexedDb();
  private readonly repository = new DexieProceduralMicrobialVIDA3Repository(this.database);
  private readonly ecology = new DexieProceduralEcologyVIDA4Repository(this.database);
  private readonly pending = new Map<string, Promise<void>>();
  private readonly calibrated = new DexieVida5cAdvancedBiospheresRepository(this.database);
  private readonly ecosystems = new DexieVida6EcosystemsSpeciesRepository(this.database);
  private readonly civilizations = new DexieVida7IntelligenceCivilizationsRepository(this.database);
  private readonly colonization = new DexieVida8TechnologicalColonizationRepository(this.database);
  private readonly biology9 = new DexieVida9BiologyExplorationRepository(this.database);
  /** New independent VIDA.9 V10 persistence, immutable across reload. */
  async ensureBiologyVIDA9(snapshot:Vida9BiologyRecord):Promise<void>{
    // The catalog indexer may have persisted CT-0 before the user opens this
    // fiche. Reuse that validated Ground Truth instead of inserting a second
    // projection with the same identity but a different digest.
    if (snapshot.nativeCivilizationPresent && await this.preserveHistoricalMorphologyVersion(
      VIDA6_REVISION, snapshot.identity, snapshot.bodyStorageKey, snapshot.ecosystem.digest)) return;
    await this.biology9.getOrInsertPreservingExisting(snapshot);
  }
  /** Insert only after VIDA.3b and VIDA.4a historical snapshots are saved. */
  async ensureCalibrated(snapshot: Vida5cAdvancedBiosphere): Promise<void> {
    await this.calibrated.ensure(snapshot);
  }


  /** VIDA.T1: los CT-0 v1 previamente guardados son inmutables.
   * Preservar la versión histórica con su huella sin intentar sobrescribirla
   * con el nuevo tamaño. Los cuerpos nuevos siguen su persistencia habitual.
   * Una migración versionada de datos anteriores pertenece a una etapa separada.
   */
  private async preserveHistoricalMorphologyVersion(
    revision: string,
    identity: Vida6EcosystemSnapshot['identity'],
    bodyStorageKey: string,
    candidateDigest: string,
  ): Promise<boolean> {
    await this.database.openDatabase();
    const row = await this.database.privateEcologicalBiospheres.get([
      identity.universeSeed, identity.generatorVersionCode,
      `${revision}|${bodyStorageKey}`,
    ]);
    let oldVida6Differs = false;
    if (row) {
      let old: { revision?: string; bodyStorageKey?: string; digest?: string; identity?: typeof identity };
      try { old = JSON.parse(row.snapshotJson); }
      catch { throw Error('VIDA.T1: registro histórico privado ilegible; no sobrescribir'); }
      if (row.modelRevision !== revision || old.revision !== revision ||
          old.digest !== row.digest || old.bodyStorageKey !== bodyStorageKey ||
          old.identity?.universeSeed !== identity.universeSeed ||
          old.identity?.generatorVersionCode !== identity.generatorVersionCode ||
          old.identity?.kind !== identity.kind ||
          old.identity?.galaxyIndex !== identity.galaxyIndex ||
          old.identity?.sectorKey !== identity.sectorKey ||
          old.identity?.galacticObjectIndex !== identity.galacticObjectIndex ||
          old.identity?.bodyIndex !== identity.bodyIndex ||
          (old.identity?.moonIndex ?? null) !== (identity.moonIndex ?? null)) {
        throw Error('VIDA.T1: registro histórico privado inconsistente; no sobrescribir');
      }
      oldVida6Differs = row.digest !== candidateDigest;
    }
    // VIDA.9 puede existir por indexación del sistema sin fila independiente
    // VIDA.6. Comprobar AMBAS rutas impide una cadena histórica/nueva mixta.
    const historicalVida9 = await this.biology9.get(
      identity.universeSeed, identity.generatorVersionCode, bodyStorageKey,
    );
    return oldVida6Differs ||
      (historicalVida9 !== null && historicalVida9.ecosystem.digest !== candidateDigest);
  }

  /** Persist after VIDA.3/4 and (if present) VIDA.5c. Never expose as observed life. */
  async ensureEcosystem(snapshot: Vida6EcosystemSnapshot): Promise<void> {
    const changedByT1 = snapshot.species.some(species =>
      species.adaptations.includes('MACROSCOPIC_TOOL_MANIPULATION'));
    if (changedByT1 && await this.preserveHistoricalMorphologyVersion(
      snapshot.revision, snapshot.identity, snapshot.bodyStorageKey, snapshot.digest)) return;
    await this.ecosystems.ensure(snapshot);
  }

  /** Persist VIDA.7 Ground Truth after VIDA.6; no knowledge-state mutation. */
  async ensureIntelligenceCivilization(snapshot: Vida7IntelligenceCivilizationSnapshot): Promise<void> {
    if (snapshot.civilizationPresent && await this.preserveHistoricalMorphologyVersion(
      VIDA6_REVISION, snapshot.identity, snapshot.bodyStorageKey, snapshot.ecosystemDigest)) return;
    await this.civilizations.ensure(snapshot);
  }

  /** Persist after VIDA.7 and VIDA.6; no observations or physical changes. */
  async ensureColonization(snapshot:Vida8ColonizationSnapshot):Promise<void>{
    if (snapshot.nativeCivilizationPresent && await this.preserveHistoricalMorphologyVersion(
      VIDA6_REVISION, snapshot.identity, snapshot.bodyStorageKey, snapshot.ecosystemDigest)) return;
    await this.colonization.ensure(snapshot);
  }

  /** Only invoked after the confirmed system's detailed fiche becomes AVAILABLE. */
  ensure(id: Vida3BodyIdentity, physical: Vida2WorldAssessment): Promise<void> {
    const snapshot = ProceduralMicrobialLifeVIDA3.evaluate(id, physical);
    const key = `${id.universeSeed}|${snapshot.revision}|${snapshot.bodyStorageKey}`;
    const prior = this.pending.get(key);
    if (prior) return prior;
    // Persist ecology only after the immutable VIDA.3 microbial result is confirmed.
    const task = this.repository.ensure(snapshot)
      .then(microbial => this.ecology.ensure(ProceduralEcologyVIDA4.evaluate(microbial)))
      .then(() => undefined);
    this.pending.set(key, task);
    void task.finally(() => { if (this.pending.get(key) === task) this.pending.delete(key); }).catch(() => undefined);
    return task;
  }
}
