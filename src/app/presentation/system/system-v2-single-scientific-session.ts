import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { MoonScientificTargetResolver, type MoonScientificResolvedTarget } from '../../simulation/planetary/moon-scientific-target-resolver';
import { PlanetScientificTargetResolver, type PlanetScientificResolvedTarget } from '../../simulation/planetary/planet-scientific-target-resolver';
import { StellarMultihostFormation, type GeneratedSingleHost } from '../../simulation/stellar/stellar-multihost-formation';
import { ArchiveDiscoveryLocatorKind, type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { PlanetScientificCardAssembler, type PlanetScientificFicheResolution } from '../planet-detail/planet-scientific-card';
import { MoonScientificCardAssembler, type MoonScientificFicheResolution } from '../moon-detail/moon-scientific-card';
import { type ScientificBodyPreviewSceneResolver } from '../scientific/scientific-body-preview';
import { SystemSceneSnapshotBuilder, type SystemSceneSnapshot, type SystemSceneSnapshotSource } from './system-scene-snapshot';

/**
 * Stage 13.2: SINGLE V2 is a public V2 system, but its frozen A physics is V1.
 * Never pass the public V2 key to the legacy body generators or interpret a
 * multiple's public ordinal as a single-star V1 body index. Planet/moon fiches
 * and previews use exactly the same once-materialized SINGLE population.
 */
export class SystemV2SingleScientificSession {
  readonly scene: SystemSceneSnapshot;
  readonly planetCount: number;
  private readonly publicKey: UniverseGenerationKey;
  private readonly locator: SystemLocator;
  private readonly host: GeneratedSingleHost;
  private readonly planetResolver: Readonly<{
    resolveDetailed: (key: UniverseGenerationKey, locator: BodyLocator) => PlanetScientificResolvedTarget | null;
  }>;
  private readonly moonResolver: Readonly<{
    resolveDetailed: (key: UniverseGenerationKey, locator: BodyLocator, moonIndex: bigint) => MoonScientificResolvedTarget | null;
    resolveHostPlanetDetailed: (key: UniverseGenerationKey, locator: BodyLocator) => PlanetScientificResolvedTarget | null;
  }>;
  private readonly previewResolver: ScientificBodyPreviewSceneResolver;

  private constructor(private readonly model: ArchiveDiscoveryDetailModel, host: GeneratedSingleHost) {
    this.publicKey = new UniverseGenerationKey(
      UniverseSeed.parse(model.universeSeed), GeneratorVersion.V2,
    );
    this.locator = new SystemLocator(model.galaxyIndex, model.sectorKey, model.galacticObjectIndex);
    this.host = host;
    this.planetCount = host.planets.length;
    if (host.label !== 'A' || model.stellarSystemCard?.render.multiplicity?.name !== 'SINGLE' ||
        host.planets.length !== host.atmospheres.length || host.planets.length !== host.moonSystems.length) {
      throw new Error('The persisted V2 SINGLE identity and its frozen physical sources disagree.');
    }
    const metadata: SystemSceneSnapshotSource = Object.freeze({
      universeSeed: model.universeSeed, generatorVersionCode: model.generatorVersionCode,
      locator: this.locator, proceduralIdentity: model.proceduralIdentity,
      discoveryState: model.discoveryState, discoveryStateLabel: model.discoveryStateLabel,
      stellarSystemCard: model.stellarSystemCard,
    });
    this.scene = SystemSceneSnapshotBuilder.buildFromGeneratedSingle(metadata, host);
    if (this.scene.generatorVersionCode !== 2 || this.scene.planets.length !== this.planetCount ||
        this.scene.moons.length !== host.moonSystems.reduce((count, moons) => count + moons.relevantMoonCount, 0)) {
      throw new Error('The public SINGLE fiche and its 3D preview disagree.');
    }
    this.planetResolver = Object.freeze({
      resolveDetailed: (key: UniverseGenerationKey, locator: BodyLocator) => this.resolvePlanet(key, locator),
    });
    this.moonResolver = Object.freeze({
      resolveDetailed: (key: UniverseGenerationKey, locator: BodyLocator, moonIndex: bigint) =>
        this.resolveMoon(key, locator, moonIndex),
      resolveHostPlanetDetailed: (key: UniverseGenerationKey, locator: BodyLocator) =>
        this.resolvePlanet(key, locator),
    });
    this.previewResolver = Object.freeze({
      build: (request: ArchiveDiscoveryDetailModel) => {
        this.assertSameModel(request);
        return this.scene;
      },
      planetBodyId: (request: ArchiveDiscoveryDetailModel, index: bigint) => {
        this.assertSameModel(request);
        if (index < 0n || index >= BigInt(this.planetCount)) {
          throw new RangeError('The V2 SINGLE public planet does not exist.');
        }
        return `planet-${index + 1n}`;
      },
    });
  }

  static buildOrNull(model: ArchiveDiscoveryDetailModel): SystemV2SingleScientificSession | null {
    if (model.generatorVersionCode !== GeneratorVersion.V2.code ||
        model.locatorKind !== ArchiveDiscoveryLocatorKind.SYSTEM ||
        model.discoveryState.code < DiscoveryState.CATALOGUED.code ||
        model.stellarSystemCard?.render.multiplicity?.name !== 'SINGLE') return null;
    const key = new UniverseGenerationKey(UniverseSeed.parse(model.universeSeed), GeneratorVersion.V2);
    const locator = new SystemLocator(model.galaxyIndex, model.sectorKey, model.galacticObjectIndex);
    const host = StellarMultihostFormation.generateV2SingleOrNull(key, locator);
    if (host === null) throw new Error('V2 SINGLE system has no corresponding physical A source.');
    return new SystemV2SingleScientificSession(model, host);
  }

  planetFiche(index: bigint): PlanetScientificFicheResolution {
    return PlanetScientificCardAssembler.build(this.model, index, this.planetResolver, this.previewResolver);
  }

  moonFiche(index: bigint, moonIndex: bigint): MoonScientificFicheResolution {
    return MoonScientificCardAssembler.build(this.model, index, moonIndex, this.moonResolver, this.previewResolver);
  }

  private resolvePlanet(key: UniverseGenerationKey, locator: BodyLocator): PlanetScientificResolvedTarget | null {
    if (!key.equals(this.publicKey) || !this.matchesSystem(locator) || locator.bodyIndex < 0n ||
        locator.bodyIndex >= BigInt(this.planetCount)) return null;
    const index = Number(locator.bodyIndex);
    const planet = this.host.planets[index];
    const atmosphere = this.host.atmospheres[index];
    const moons = this.host.moonSystems[index];
    const name = this.host.planetarySystem?.planetDesignations[index]?.name;
    if (!planet || !atmosphere || !moons || !name ||
        atmosphere.hostPlanet !== planet || moons.hostPlanet !== planet ||
        this.host.planetarySystem === null) {
      throw new Error('V2 SINGLE planet identity is not backed by a single physical source.');
    }
    return PlanetScientificTargetResolver.projectGenerated(Object.freeze({
      locator, planetOrdinal: index + 1, designation: name,
      hostSystemDesignation: this.model.stellarSystemCard!.title,
      orbitTopology: this.host.planetarySystem.architecture.orbitTopology,
      hostPlanetCount: this.planetCount,
    }), planet, atmosphere, moons);
  }

  private resolveMoon(key: UniverseGenerationKey, locator: BodyLocator,
    moonIndex: bigint): MoonScientificResolvedTarget | null {
    if (!key.equals(this.publicKey) || !this.matchesSystem(locator)) return null;
    return MoonScientificTargetResolver.resolveDetailed(key, locator, moonIndex, this.planetResolver);
  }

  private matchesSystem(locator: BodyLocator): boolean {
    return locator.galaxyIndex === this.locator.galaxyIndex &&
      locator.sectorKey === this.locator.sectorKey &&
      locator.galacticObjectIndex === this.locator.galacticObjectIndex;
  }

  private assertSameModel(request: ArchiveDiscoveryDetailModel): void {
    if (request !== this.model) throw new RangeError('V2 SINGLE preview belongs to another persisted system.');
  }
}
