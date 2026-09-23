import Dexie from 'dexie';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import { ExternalGalaxyFocusChoice } from '../../domain/exploration/external-galaxy-focus';
import { DiscoveryTargetType } from '../../domain/discovery/discovery-target-type';
import { DiscoveryRewardReason } from '../../domain/exploration/discovery-reward-reason';
import { ExplorationResultKind } from '../../domain/exploration/exploration-sector-result';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalaxyLocator, SectorLocator } from '../../domain/generation/procedural-locator';
import { ObservationClassification } from '../../domain/observation/observation-classification';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GalacticNucleusState } from '../../domain/universe/galactic-nucleus-state';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieDiscoveryPointsRepository } from '../../data/local/repository/dexie-discovery-points.repository';
import { DexieDiscoveryRepository } from '../../data/local/repository/dexie-discovery.repository';
import { DexieUniverseRepository } from '../../data/local/repository/dexie-universe.repository';
import { DexieExplorationSectorProgressRuntime } from './exploration-sector-progress.runtime';
import { DiscoveryRewardEngine } from '../../simulation/exploration/discovery-reward-engine';
import { ExplorationSectorResultEngine } from '../../simulation/exploration/exploration-sector-result-engine';
import { ExplorationSectorScanEngine } from '../../simulation/exploration/exploration-sector-scan-engine';
import { ExternalGalaxySearchEngine } from '../../simulation/exploration/external-galaxy-search-engine';
import { ExternalGalaxyFocusEngine } from '../../simulation/exploration/external-galaxy-focus-engine';
import { GalaxyArchiveEngine } from '../../simulation/exploration/galaxy-archive-engine';
import { ExternalGalaxyPreliminaryInformationGenerator } from '../../simulation/observation/galaxy/external-galaxy-preliminary-information-generator';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { GalaxySectorContentGenerator } from '../../simulation/sector/galaxy-sector-content-generator';
import { GalaxyVisualStructureGenerator } from '../../simulation/universe/galaxy-visual-structure-generator';
import { GalaxyGenerator } from '../../simulation/universe/galaxy-generator';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5');
const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const v2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);

function result(key: UniverseGenerationKey, x: number, y: number) {
  return ExplorationSectorResultEngine.resolve(ExplorationSectorScanEngine.scan(
    ExplorationSectorScanEngine.prepareSector(key, 0n, x, y)));
}

describe('Etapa 13.1 — integración de exploración y archivo V2', () => {
  it('abre un mapa V2 con la estructura galáctica pública y muestra señales sin revelar clasificación formal', () => {
    const galaxy = GalaxyGenerator.generate(v2, 0n);
    expect(galaxy.generationKey).toBe(v2);
    expect(GalaxyVisualStructureGenerator.generate(galaxy)).toEqual(
      GalaxyVisualStructureGenerator.generate(GalaxyGenerator.generate(v1, 0n)));
    const selection = ExplorationSectorScanEngine.prepareSector(v2, 0n, 0, 2);
    const scan = ExplorationSectorScanEngine.scan(selection);
    expect(scan.selection.generationKey).toBe(v2);
    expect(scan.preliminaryClassification).toBe(ObservationClassification.Unclassified);
    const selected = result(v2, 0, 2);
    expect(selected.scanResult.selection.generationKey).toBe(v2);
    expect(selected.subject.generationKey).toBe(v2);
    expect(result(v2.copy(), 0, 2)).toEqual(selected);
    expect(selected.resultKind).toBe(result(v1, 0, 2).resultKind);
    const sector = GalaxySectorContentGenerator.generate(galaxy, selection.coordinates);
    expect(sector.generationKey).toBe(v2);
    expect(sector.systemLocators).toEqual(GalaxySectorContentGenerator.generate(
      GalaxyGenerator.generate(v1, 0n), selection.coordinates).systemLocators);
  });

  it('conserva la identidad V2 para la detección del núcleo y el resultado sectorial', () => {
    const found = result(v2, 0, 0);
    expect(found.scanResult.selection.generationKey).toBe(v2);
    expect(found.subject.generationKey).toBe(v2);
    expect(found.targetLocator).not.toBeNull();
    expect(GalaxyGenerator.generate(v2, 0n).nucleus?.state)
      .not.toBe(GalacticNucleusState.QUIESCENT);
    expect(found.resultKind).toBe(ExplorationResultKind.EXTREME_OBJECT);
    expect(ProceduralTargetResolver.resolveTargetSeed(v2, found.scanResult.selection.sectorLocator)
      .normalizedValue).toBe(ProceduralTargetResolver.resolveTargetSeed(v1,
        found.scanResult.selection.sectorLocator).normalizedValue);
  });

  it('mantiene la política de recompensas, incluidas las repeticiones sin nuevos PD', () => {
    const emptyReasons = new Set<DiscoveryRewardReason>();
    const firstV1 = DiscoveryRewardEngine.evaluateDiscoveryReward(v1,
      DiscoveryTargetType.fromLocator(new SectorLocator(0n, 0n)),
      DiscoveryState.UNKNOWN, DiscoveryState.DETECTED, emptyReasons);
    const firstV2 = DiscoveryRewardEngine.evaluateDiscoveryReward(v2,
      DiscoveryTargetType.fromLocator(new SectorLocator(0n, 0n)),
      DiscoveryState.UNKNOWN, DiscoveryState.DETECTED, emptyReasons);
    expect(firstV2.totalAwardedDiscoveryPoints).toBe(firstV1.totalAwardedDiscoveryPoints);
    expect(firstV2.totalAwardedDiscoveryPoints).toBeGreaterThan(0);
    expect(DiscoveryRewardEngine.evaluateDiscoveryReward(v2,
      DiscoveryTargetType.fromLocator(new SectorLocator(0n, 0n)),
      DiscoveryState.DETECTED, DiscoveryState.DETECTED, emptyReasons)
      .totalAwardedDiscoveryPoints).toBe(0);
  });

  it('consulta el archivo V2 por descubrimientos persistidos sin revelar nombres en DETECTED', () => {
    const known = [
      new KnownDiscovery(v2, new GalaxyLocator(1n), DiscoveryState.DETECTED),
      new KnownDiscovery(v2, new SectorLocator(0n, 0n), DiscoveryState.DETECTED),
      new KnownDiscovery(v2, new GalaxyLocator(0n), DiscoveryState.DISCOVERED),
    ];
    const archive = GalaxyArchiveEngine.buildArchive(v2, 0n, known);
    expect(archive.entries.map(entry => entry.galaxyIndex)).toEqual([0n, 1n]);
    expect(archive.entries[0]?.knownName).not.toBeNull();
    expect(archive.entries[1]?.knownName).toBeNull();
    expect(archive.entries[1]?.knowledgeState).toBe(DiscoveryState.DETECTED);
    expect(ExternalGalaxyPreliminaryInformationGenerator.generate(v2, 1n,
      DiscoveryState.DETECTED).designationCode).toContain('GEN-V2');
    expect(() => GalaxyArchiveEngine.buildArchive(v2, 0n, [
      new KnownDiscovery(v1, new GalaxyLocator(0n), DiscoveryState.DISCOVERED),
    ])).toThrow(/another universe/);
    expect(() => GalaxyArchiveEngine.buildArchive(v2, 0n, [
      new KnownDiscovery(new UniverseGenerationKey(UniverseSeed.parse(
        'ABCD-0000-0000-0000-0000-0000-0000-0001'), GeneratorVersion.V2),
        new GalaxyLocator(0n), DiscoveryState.DISCOVERED),
    ])).toThrow(/another universe/);
  });

  it('realiza búsquedas externas reproducibles con entropía V2 independiente y permite elegir foco', () => {
    const attempt = ExternalGalaxySearchEngine.resolveNextSearch(v2, 0n, 0n, 0n, [0n]);
    expect(ExternalGalaxySearchEngine.resolveNextSearch(v2.copy(), 0n, 0n, 0n, [0n]))
      .toEqual(attempt);
    expect(attempt.detectionRoll).not.toBe(ExternalGalaxySearchEngine.resolveNextSearch(
      v1, 0n, 0n, 0n, [0n]).detectionRoll);
    const offer = ExternalGalaxyFocusEngine.buildFocusOffer(v2, 0n, 1n,
      DiscoveryState.DETECTED);
    expect(ExternalGalaxyFocusEngine.resolveFocusChoice(v2, offer,
      ExternalGalaxyFocusChoice.FOCUS_DETECTED).resultingFocusGalaxyIndex).toBe(1n);
  });

  it('persiste un descubrimiento V2 con PD idempotentes y separación real de partidas V1', async () => {
    const name = 'genesis-stage-13-1-v2-integration';
    const deps = { indexedDB, IDBKeyRange };
    const db = new GenesisIndexedDb(name, deps);
    const universes = new DexieUniverseRepository(db, () => 1000);
    const points = new DexieDiscoveryPointsRepository(db, () => 1000);
    const discoveries = new DexieDiscoveryRepository(db, {
      resolveTargetSeedNormalized(key, locator) {
        return ProceduralTargetResolver.resolveTargetSeed(key, locator).normalizedValue;
      },
    }, () => 1000);
    const runtime = new DexieExplorationSectorProgressRuntime(db, points, discoveries);
    try {
      await universes.createIfAbsent(v1);
      await universes.createIfAbsent(v2);
      await points.setGlobalDiscoveryPoints(v1, 0n);
      await points.setGlobalDiscoveryPoints(v2, 0n);
      await discoveries.setState(v1, new GalaxyLocator(0n), DiscoveryState.DISCOVERED);
      await discoveries.setState(v2, new GalaxyLocator(0n), DiscoveryState.DISCOVERED);
      const resolved = result(v2, 0, 0);
      const first = await runtime.commitResolvedResult(resolved);
      const again = await runtime.commitResolvedResult(resolved);
      expect(first.awardedDiscoveryPoints).toBeGreaterThan(0);
      expect(again.awardedDiscoveryPoints).toBe(0);
      expect(first.sectorState).toBe(DiscoveryState.DETECTED);
      expect(await points.getGlobalDiscoveryPoints(v2)).toBe(BigInt(first.awardedDiscoveryPoints));
      expect(await points.getGlobalDiscoveryPoints(v1)).toBe(0n);
      expect(await discoveries.getState(v1, resolved.scanResult.selection.sectorLocator))
        .toBe(DiscoveryState.UNKNOWN);
      const known = await discoveries.getKnownDiscoveries(v2);
      expect(known.every(item => item.generationKey.equals(v2))).toBe(true);
      expect(GalaxyArchiveEngine.buildArchive(v2, 0n, known).focusedEntry.galaxyIndex).toBe(0n);
    } finally {
      db.closeDatabase();
      await new Dexie(name, deps).delete();
    }
  });
});
