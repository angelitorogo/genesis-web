# GENESIS — 38.4a4 · Identidad VIDA.6 y preparación Dexie real

**Estado identidad:** IDENTIDAD_TRAZADA_REQUIERE_CASOS_PRODUCTIVOS
**Estado persistencia:** NO_EJECUTADA_REPOSITORIOS_REALES

## Generador productivo VIDA.6

### ID línea 151
- Asignación: `id:`vida6:${hash(key).slice(0,24)}``
- Función: `evaluate`
- Dependencias espaciales potenciales: namespace

| Símbolo | Línea | Tipo | Expresión |
|---|---:|---|---|
| `hash` | — | OUTER_OR_IMPORTED | `` |
| `key` | 142 | LOCAL | ``${groupKey}\|${i}`` |
| `groupKey` | 140 | LOCAL | ``${namespace}\|${group}`` |
| `group` | — | OUTER_OR_IMPORTED | `` |
| `namespace` | 136 | LOCAL | `[VIDA6_RANDOM_NAMESPACE, micro.identity.universeSeed,
      micro.identity.generatorVersionCode, micro.bodyStorageKey].join('\|')` |
| `VIDA6_RANDOM_NAMESPACE` | — | OUTER_OR_IMPORTED | `` |
| `micro` | 106 | PARAMETER | `micro: Vida3MicrobialSnapshot` |
| `i` | 141 | LOCAL | `0` |

## Interfaces observadas en persistencia

### src/app/data/local/repository/dexie-vida9-biology-exploration.repository.ts
- L5: `export class DexieVida9BiologyExplorationRepository `
- L7: `async ensure(record:Vida9BiologyRecord):Promise<Vida9BiologyRecord>`
- L46: `async getOrInsertPreservingExisting(record:Vida9BiologyRecord):Promise<Vida9BiologyRecord>`
- L73: `async get(seed:string,version:number,bodyStorageKey:string):Promise<Vida9BiologyRecord|null>`
### src/app/data/local/repository/dexie-vida6-ecosystems-species.repository.ts
- L5: `export class DexieVida6EcosystemsSpeciesRepository `
- L8: `async ensure(snapshot: Vida6EcosystemSnapshot): Promise<Vida6EcosystemSnapshot> `
### src/app/data/local/backup/genesis-backup-validator.ts
- L66: `export class GenesisBackupValidationError   extends Error `
- L82: `export class GenesisBackupValidator `
- L89: `validate(     input:       unknown,   ): GenesisBackupSnapshot `
- L165: `private validateUniverse(     input:       unknown,      path:       string,      universeKeys:       Set<string>,      observationIds:       Set<string>,     formatVersion: number,   ): UniverseBackupSnapshot `
- L392: `private validateNavigation(     input:       unknown,      path:       string,   ): NavigationBackupEntry `
- L473: `private validateGalaxy(     input:       unknown,      path:       string,      galaxyIndices:       Set<string>,   ): GalaxyBackupEntry `
- L556: `private validateDiscovery(     input:       unknown,      path:       string,      generationKey:       UniverseGenerationKey,      discoveryKeys:       Set<string>,   ): DiscoveryBackupEntry `
- L754: `private validateObservation(     input:       unknown,      path:       string,      observationIds:       Set<string>,   ): ObservationBackupEntry `
- L858: `private validateProgress(     input:       unknown,      path:       string,      progressKeys:       Set<string>,   ): ProgressBackupEntry `
### src/app/data/local/repository/dexie-procedural-ecology-vida4.repository.ts
- L5: `export class DexieProceduralEcologyVIDA4Repository `
- L8: `async ensure(snapshot: Vida4EcologySnapshot): Promise<Vida4EcologySnapshot> `
### src/app/data/local/repository/dexie-vida5c-advanced-biospheres.repository.ts
- L4: `export class DexieVida5cAdvancedBiospheresRepository `
- L6: `async ensure(snapshot: Vida5cAdvancedBiosphere): Promise<Vida5cAdvancedBiosphere> `
### src/app/data/local/repository/dexie-vida7-intelligence-civilizations.repository.ts
- L6: `export class DexieVida7IntelligenceCivilizationsRepository `
- L9: `async ensure(snapshot: Vida7IntelligenceCivilizationSnapshot):     Promise<Vida7IntelligenceCivilizationSnapshot> `
### src/app/data/local/repository/dexie-vida8-technological-colonization.repository.ts
- L4: `export class DexieVida8TechnologicalColonizationRepository `
- L6: `async ensure(snapshot:Vida8ColonizationSnapshot):Promise<Vida8ColonizationSnapshot>`
### src/app/data/local/backup/dexie-genesis-backup.service.ts
- L52: `export class DexieGenesisBackupService   implements GenesisBackupPort `
- L75: `async createSnapshot():     Promise<GenesisBackupSnapshot> `
- L139: `async exportJson():     Promise<string> `
- L149: `async importJson(     json:       string,   ): Promise<void> `
- L173: `async importSnapshot(     snapshot:       unknown,   ): Promise<void> `
- L481: `private async createUniverseSnapshot(     universe:       UniverseEntity,   ): Promise<UniverseBackupSnapshot> `
### src/app/data/local/repository/dexie-procedural-microbial-vida3.repository.ts
- L5: `export class DexieProceduralMicrobialVIDA3Repository `
- L8: `async ensure(snapshot: Vida3MicrobialSnapshot): Promise<Vida3MicrobialSnapshot> `
### src/app/data/local/repository/dexie-universe.repository.ts
- L23: `export class DexieUniverseRepository   implements UniverseRepository `
- L35: `async createIfAbsent(   generationKey:     UniverseGenerationKey, ): Promise<boolean> `
- L111: `async exists(     generationKey:       UniverseGenerationKey,   ): Promise<boolean> `
- L138: `async getAll():     Promise<       readonly UniverseGenerationKey[]     > `
- L181: `async delete(     generationKey:       UniverseGenerationKey,   ): Promise<boolean> `
### src/app/data/local/repository/dexie-discovery-points.repository.ts
- L42: `export class DexieDiscoveryPointsRepository   implements DiscoveryPointsRepository `
- L54: `async getGlobalDiscoveryPoints(     generationKey:       UniverseGenerationKey,   ): Promise<bigint> `
- L81: `async getLifetimeEarnedGlobalDiscoveryPoints(     generationKey:       UniverseGenerationKey,   ): Promise<bigint> `
- L133: `async ensureLifetimeEarnedGlobalDiscoveryPointsAtLeast(     generationKey:       UniverseGenerationKey,      minimumHistoricalLifetimeEarnedDiscoveryPoints:       bigint,   ): Promise<bigint> `
- L279: `async setGlobalDiscoveryPoints(     generationKey:       UniverseGenerationKey,      discoveryPoints:       bigint,   ): Promise<void> `
- L435: `async getGalaxyDiscoveryPoints(     generationKey:       UniverseGenerationKey,      galaxyIndex:       bigint,   ): Promise<bigint> `
- L490: `async setGalaxyDiscoveryPoints(     generationKey:       UniverseGenerationKey,      galaxyIndex:       bigint,      discoveryPoints:       bigint,   ): Promise<void> `
- L539: `private async getGlobalProgressEntity(     generationKey:       UniverseGenerationKey,   ) `
### src/app/data/local/repository/dexie-galaxy-knowledge-snapshot.repository.ts
- L27: `export class DexieGalaxyKnowledgeSnapshotRepository   implements GalaxyKnowledgeSnapshotRepository `
- L34: `async get(     generationKey: UniverseGenerationKey,     galaxyIndex: bigint,     scientificModelVersion: number,   ): Promise<GalaxyKnowledgeSnapshotEntity | undefined> `
- L55: `async put(     entity: GalaxyKnowledgeSnapshotEntity,   ): Promise<void> `
### src/app/data/local/repository/dexie-discovery.repository.ts
- L84: `export class DexieDiscoveryRepository   implements DiscoveryRepository `
- L99: `async getState(     generationKey:       UniverseGenerationKey,      locator:       ProceduralLocator,   ): Promise<DiscoveryStateValue> `
- L188: `async setState(     generationKey:       UniverseGenerationKey,      locator:       ProceduralLocator,      state:       DiscoveryStateValue,   ): Promise<void> `
- L308: `async getKnownDiscoveries(     generationKey:       UniverseGenerationKey,   ): Promise<     readonly KnownDiscovery[]   > `
- L364: `async getKnownDiscoveriesInGalaxy(     generationKey:       UniverseGenerationKey,      galaxyIndex:       bigint,      targetTypeCode?:       number,   ): Promise<     readonly KnownDiscovery[]   > `
- L425: `async getKnownDiscoveriesInSector(     generationKey:       UniverseGenerationKey,      galaxyIndex:       bigint,      coordinates:       GalaxySectorCoordinates,   ): Promise<     readonly KnownDiscovery[]   > `
- L505: `async getObservationProgressMilestones(     generationKey:       UniverseGenerationKey,   ): Promise<     readonly ObservationProgressMilestone[]   > `
- L650: `private toKnownDiscovery(     generationKey:       UniverseGenerationKey,      entity:       DiscoveryEntity,   ): KnownDiscovery `
- L709: `private assertSpatialIntegrity(     entity:       DiscoveryEntity,   ): void `
- L725: `private resolveTargetSeed(     generationKey:       UniverseGenerationKey,      locator:       ProceduralLocator,   ): string `
### src/app/data/local/repository/dexie-external-galaxy-search-state.repository.ts
- L30: `export class DexieExternalGalaxySearchStateRepository `
- L41: `async getState(     generationKey:       UniverseGenerationKey,   ): Promise<PersistedExternalGalaxySearchState> `
- L125: `async setState(     generationKey:       UniverseGenerationKey,      state:       PersistedExternalGalaxySearchState,   ): Promise<void> `
- L238: `async getConsecutiveFailedSearches(     generationKey:       UniverseGenerationKey,   ): Promise<bigint> `
- L251: `async setConsecutiveFailedSearches(     generationKey:       UniverseGenerationKey,      consecutiveFailedSearches:       bigint,   ): Promise<void> `
### src/app/data/local/repository/dexie-scientific-evidence.repository.ts
- L72: `export class DexieScientificEvidenceRepository   implements ScientificEvidenceRepository `
- L83: `async getEvidence(     generationKey:       UniverseGenerationKey,      locator:       ProceduralLocator,   ): Promise<readonly ScientificEvidence[]> `
- L140: `async recordEvidence(     generationKey:       UniverseGenerationKey,      locator:       ProceduralLocator,      evidence:       ScientificEvidence,   ): Promise<ScientificEvidence> `
- L240: `private targetIdentity(     generationKey:       UniverseGenerationKey,      locator:       ProceduralLocator,   ): ScientificEvidenceTargetIdentity `
- L280: `private fromObservation(     observation:       `
### src/app/data/local/repository/dexie-universe-navigation.repository.ts
- L21: `export class DexieUniverseNavigationRepository   implements UniverseNavigationRepository `
- L33: `async getNavigation(     generationKey:       UniverseGenerationKey,   ): Promise<UniverseNavigationState> `
- L94: `async setNavigation(     generationKey:       UniverseGenerationKey,      navigation:       UniverseNavigationState,   ): Promise<void> `

## Verificación obligatoria

1. Probar con el generador VIDA.6 productivo dos reconstrucciones independientes y un caso de consulta desde otra ubicación conservando species.id.
2. Instanciar la base Dexie real y sus repositorios VIDA.6/9 en un entorno IndexedDB de prueba aislado.
3. Guardar y leer por los métodos reales, reconstruir el contrato con el mapper productivo y comparar species.id, variantSeedUint32 y appearanceFingerprint.
4. Cerrar 38.4 solo cuando la prueba real anterior pase; JSON roundtrip y auditorías estáticas no la sustituyen.

> El informe no certifica IndexedDB. Para el test final deben enlazarse los constructores y operaciones reales de los repositorios localizados.
