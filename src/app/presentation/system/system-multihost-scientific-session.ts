import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { type StellarMultihostScientificTargetResolver } from '../../simulation/stellar/stellar-multihost-scientific-target-resolver';
import {
  ArchiveDiscoveryLocatorKind, type ArchiveDiscoveryDetailModel,
} from '../genesis-archive/archive-discovery-detail.facade';
import {
  PlanetScientificCardAssembler, type PlanetScientificFicheResolution,
} from '../planet-detail/planet-scientific-card';
import {
  MoonScientificCardAssembler, type MoonScientificFicheResolution,
} from '../moon-detail/moon-scientific-card';
import { type ScientificBodyPreviewSceneResolver } from '../scientific/scientific-body-preview';
import { SystemSceneMultihostMaterializedSources } from './system-scene-multihost-materialized-sources';
import { SystemSceneMultihostComposition } from './system-scene-multihost-composition';
import { type SystemSceneSnapshot, type SystemSceneSnapshotSource } from './system-scene-snapshot';
import { type ArchiveStellarSystemCardModel } from '../genesis-archive/archive-stellar-system-card';
import { SystemMultihostStellarCardAssembler } from './system-multihost-stellar-card';

/**
 * Stage 8 read-only atomic assembly boundary. A single physical formation
 * supplies the 3D scene, public routes, planet and moon fiches AND their 3D
 * previews. No persisted V1 system is silently reinterpreted by this class:
 * a future explicit generation-version switch must wire all three page routes
 * to this SAME session, never just SystemPage alone.
 */
export class SystemMultihostScientificSession {
  readonly scene: SystemSceneSnapshot;
  readonly planetCount: number;
  readonly stellarSystemCard: ArchiveStellarSystemCardModel;
  private readonly scientific: StellarMultihostScientificTargetResolver;
  private readonly planetIds: ReadonlyMap<string, string>;
  private readonly previewResolver: ScientificBodyPreviewSceneResolver;

  private constructor(private readonly model: ArchiveDiscoveryDetailModel) {
    const key = new UniverseGenerationKey(
      UniverseSeed.parse(model.universeSeed), GeneratorVersion.fromCode(model.generatorVersionCode),
    );
    const locator = new SystemLocator(model.galaxyIndex, model.sectorKey, model.galacticObjectIndex);
    const formation = StellarMultihostFormation.generateOrNull(key, locator);
    if (formation === null || model.stellarSystemCard === null) {
      throw new RangeError('This system is not a resolved multiple-star formation.');
    }
    // Replace the V1 multi-star card INSIDE this opt-in session only. All
    // scientific consumers and the scene receive the same generated card;
    // the facade's persisted V1 model is never modified.
    this.stellarSystemCard = SystemMultihostStellarCardAssembler.build(model.stellarSystemCard, formation);
    this.model = Object.freeze({ ...model, stellarSystemCard: this.stellarSystemCard });
    const metadata: SystemSceneSnapshotSource = Object.freeze({
      universeSeed: model.universeSeed,
      generatorVersionCode: model.generatorVersionCode,
      locator,
      proceduralIdentity: model.proceduralIdentity,
      discoveryState: model.discoveryState,
      discoveryStateLabel: model.discoveryStateLabel,
      stellarSystemCard: this.stellarSystemCard,
    });
    const sources = SystemSceneMultihostMaterializedSources.build(formation, metadata);
    const composed = SystemSceneMultihostComposition.build(formation, sources);
    this.scene = composed.snapshot;
    for (const component of this.stellarSystemCard.render.components) {
      const star = this.scene.stars.find(body => body.label === component.label);
      if (star === undefined || star.colorHex !== component.colorHex ||
          this.scene.stars.filter(body => body.label === component.label).length !== 1) {
        throw new Error('A generated stellar fiche component has no matching scene star.');
      }
    }
    if (this.stellarSystemCard.render.components.length !== this.scene.stars.length ||
        this.stellarSystemCard.orbits.length !== (formation.outerOrbit === null ? 1 : 2)) {
      throw new Error('The multihost stellar fiche and scene hierarchy disagree.');
    }
    this.scientific = sources.scientific;
    this.planetCount = formation.publicPlanets.length;
    this.planetIds = new Map(composed.planetBindings.map(entry =>
      [entry.publicLocator.bodyIndex.toString(), entry.sceneBodyId] as const));
    if (this.planetIds.size !== this.planetCount ||
        this.scene.scientificPlanetBindings?.length !== this.planetCount ||
        this.scene.scientificMoonBindings?.length !== this.scene.moons.length) {
      throw new Error('Multihost scene and public scientific catalogue disagree.');
    }
    for (const [index, bodyId] of this.planetIds) {
      if (!this.scene.planets.some(body => body.id === bodyId) ||
          this.scene.scientificPlanetBindings?.filter(binding =>
            binding.bodyIndex === index && binding.sceneBodyId === bodyId).length !== 1) {
        throw new Error('Public planet has no unique SystemScene identity.');
      }
    }
    // The preview adapter NEVER invokes the legacy scene generator and never
    // resolves an unknown public planet by falling back to a private ordinal.
    this.previewResolver = Object.freeze({
      build: (request: ArchiveDiscoveryDetailModel) => {
        this.assertSameModel(request);
        return this.scene;
      },
      planetBodyId: (request: ArchiveDiscoveryDetailModel, bodyIndex: bigint) => {
        this.assertSameModel(request);
        const bodyId = this.planetIds.get(bodyIndex.toString());
        if (bodyId === undefined) throw new RangeError('Planet is absent from the public scene.');
        return bodyId;
      },
    });
  }

  /** Not a version selector: the caller must opt into this boundary explicitly. */
  static buildOrNull(model: ArchiveDiscoveryDetailModel): SystemMultihostScientificSession | null {
    if (model.locatorKind !== ArchiveDiscoveryLocatorKind.SYSTEM || model.stellarSystemCard === null ||
        model.discoveryState.code < DiscoveryState.CATALOGUED.code ||
        (model.stellarSystemCard.render.multiplicity === null ||
          model.stellarSystemCard.render.multiplicity.name === 'SINGLE')) return null;
    return new SystemMultihostScientificSession(model);
  }

  planetFiche(bodyIndex: bigint): PlanetScientificFicheResolution {
    return PlanetScientificCardAssembler.build(this.model, bodyIndex, this.scientific, this.previewResolver);
  }

  moonFiche(bodyIndex: bigint, moonIndex: bigint): MoonScientificFicheResolution {
    return MoonScientificCardAssembler.build(this.model, bodyIndex, moonIndex,
      this.scientific.moonCardResolver, this.previewResolver);
  }

  private assertSameModel(request: ArchiveDiscoveryDetailModel): void {
    if (request !== this.model) {
      throw new RangeError('A scientific preview cannot be projected from another system model.');
    }
  }
}
