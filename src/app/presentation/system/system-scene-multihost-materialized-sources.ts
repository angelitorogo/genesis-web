import { type BodyLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import {
  type GeneratedMultipleHost, type MultihostLabel,
} from '../../simulation/stellar/stellar-multihost-formation';
import { StellarMultihostScientificTargetResolver } from '../../simulation/stellar/stellar-multihost-scientific-target-resolver';
import {
  SystemSceneSnapshotBuilder, type SystemSceneBodySnapshot,
  type SystemSceneSnapshot, type SystemSceneSnapshotSource,
} from './system-scene-snapshot';

export interface MultihostProjectedSingleSource {
  readonly label: MultihostLabel;
  readonly snapshot: SystemSceneSnapshot;
}

/** Public planet and EXACT projected host-body pair; no private child seeds escape. */
export interface MultihostProjectedPlanetBinding {
  readonly publicLocator: BodyLocator;
  readonly host: MultihostLabel;
  readonly sourcePlanetOrdinal: number;
  readonly body: SystemSceneBodySnapshot;
}

/**
 * Stage 6: strictly opt-in, read-only boundary for one already generated system.
 * Both renderer source snapshots and scientific resolution consume the SAME
 * physical aggregate. This is NOT the final multi-star composer: physical
 * A/B/C barycentric motion and P-type projection remain for the next stage.
 * Nothing here switches live routes or reinterprets legacy saved discoveries.
 */
export class SystemSceneMultihostMaterializedSources {
  readonly singles: readonly MultihostProjectedSingleSource[];
  readonly boundPlanets: readonly MultihostProjectedPlanetBinding[];
  readonly circumbinaryPublicLocators: readonly BodyLocator[];
  readonly scientific: StellarMultihostScientificTargetResolver;

  private constructor(formation: GeneratedMultipleHost, metadata: SystemSceneSnapshotSource) {
    const key = new UniverseGenerationKey(
      UniverseSeed.parse(metadata.universeSeed),
      GeneratorVersion.fromCode(metadata.generatorVersionCode),
    );
    const address = metadata.locator;
    const expected = formation.parentLocator;
    if (!key.equals(formation.parentGenerationKey) ||
        address.galaxyIndex !== expected.galaxyIndex ||
        address.sectorKey !== expected.sectorKey ||
        address.galacticObjectIndex !== expected.galacticObjectIndex ||
        metadata.discoveryState.code < DiscoveryState.CATALOGUED.code ||
        metadata.stellarSystemCard.render.multiplicity !== formation.multiplicity ||
        formation.components.length !== formation.multiplicity.stellarComponentCount) {
      throw new RangeError('Multihost visual/scientific sources must share a catalogued parent identity.');
    }
    this.scientific = new StellarMultihostScientificTargetResolver(formation);
    this.singles = Object.freeze(formation.components.map(component => Object.freeze({
      label: component.label,
      snapshot: SystemSceneSnapshotBuilder.buildFromGeneratedSingle(metadata, component),
    })));
    const bindings: MultihostProjectedPlanetBinding[] = [];
    const projectedP: BodyLocator[] = [];
    const seenAddresses = new Set<string>();
    for (const entry of formation.publicPlanets) {
      const addressKey = entry.publicLocator.bodyIndex.toString();
      if (seenAddresses.has(addressKey)) {
        throw new Error('Duplicate public planet address in a generated multihost system.');
      }
      seenAddresses.add(addressKey);
      if (this.scientific.resolveDetailed(key, entry.publicLocator)?.detail.general.massEarth !== entry.planet.massEarth) {
        throw new Error('Physical planet and scientific resolver disagree.');
      }
      if (entry.host === 'AB') {
        // No fake visual substitute: P is still waiting for its own real projection.
        projectedP.push(entry.publicLocator);
        continue;
      }
      const host = this.singles.find(single => single.label === entry.host);
      const planet = host?.snapshot.planets.find(body => body.id === `planet-${entry.sourcePlanetOrdinal}`);
      if (planet === undefined || host?.snapshot.planets.filter(body =>
        body.id === `planet-${entry.sourcePlanetOrdinal}`).length !== 1) {
        throw new Error('Generated public planet has no unique projected host body.');
      }
      const motion = planet.motionContributions.at(-1);
      const projectedMotion = host.snapshot.motions.find(candidate => candidate.id === motion?.motionId);
      if (projectedMotion?.semiMajorAxisAu !== entry.planet.orbit.semiMajorAxisAu ||
          projectedMotion.periodDays !== entry.planet.orbitalPeriod.periodDays) {
        throw new Error('Projected planet orbital science does not match its generated identity.');
      }
      bindings.push(Object.freeze({
        publicLocator: entry.publicLocator,
        host: entry.host,
        sourcePlanetOrdinal: entry.sourcePlanetOrdinal,
        body: planet,
      }));
    }
    if (bindings.length + projectedP.length !== formation.publicPlanets.length ||
        projectedP.length !== formation.circumbinary.planets.length) {
      throw new Error('Multihost materialized scene does not cover the public planet catalogue.');
    }
    this.boundPlanets = Object.freeze(bindings);
    this.circumbinaryPublicLocators = Object.freeze(projectedP);
    Object.freeze(this);
  }

  static build(
    formation: GeneratedMultipleHost,
    metadata: SystemSceneSnapshotSource,
  ): SystemSceneMultihostMaterializedSources {
    return new SystemSceneMultihostMaterializedSources(formation, metadata);
  }
}
