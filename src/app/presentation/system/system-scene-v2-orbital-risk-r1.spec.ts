import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { StellarSystemMultiplicitySelector } from '../../simulation/stellar/stellar-system-multiplicity-selector';
import { ArchiveV2StellarSystemCardAssembler } from '../genesis-archive/archive-v2-stellar-system-card';
import { SystemSceneSnapshotBuilder, type SystemSceneSnapshotSource } from './system-scene-snapshot';
import { SystemSceneMultihostComposition } from './system-scene-multihost-composition';
import { SystemSceneMultihostMaterializedSources } from './system-scene-multihost-materialized-sources';
import { v2HostMinorBodyOrbitalCatalog } from './system-scene-v2-minor-body-source';
import { v2HostMinorBodyImpactRiskCatalog } from './system-scene-v2-orbital-risk-source';
import { assertSystemSceneProjectionSnapshot } from './system-scene-projection-contract';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const keyV1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const keyV2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);

function locatorFor(multiplicity: StellarSystemMultiplicity): SystemLocator {
  for (let index = 0n; index < 256n; index++) {
    const locator = new SystemLocator(0n, 0n, index);
    const target = ProceduralTargetResolver.resolveTargetSeed(keyV1, locator);
    if (StellarSystemMultiplicitySelector.select(keyV1, target as Parameters<
      typeof StellarSystemMultiplicitySelector.select>[1]) === multiplicity) return locator;
  }
  throw new Error('No deterministic stellar fixture found.');
}

function metadata(locator: SystemLocator, discoveryState: DiscoveryStateValue = DiscoveryState.CONFIRMED): SystemSceneSnapshotSource {
  return Object.freeze({
    universeSeed: seed.serialize(), generatorVersionCode: GeneratorVersion.V2.code,
    locator, proceduralIdentity: `G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}`,
    discoveryState, discoveryStateLabel: discoveryState.name,
    stellarSystemCard: ArchiveV2StellarSystemCardAssembler.build(keyV2, locator, discoveryState),
  });
}

describe('RISK-R1 — restore physical V2 orbital risk to the scientific scene', () => {
  it('projects phase-23 assessments from the SAME SINGLE V2 minor-body catalogue and respects CATALOGUED', () => {
    const locator = locatorFor(StellarSystemMultiplicity.SINGLE);
    const host = StellarMultihostFormation.generateV2SingleOrNull(keyV2, locator)!;
    const catalog = v2HostMinorBodyOrbitalCatalog(host);
    const risks = v2HostMinorBodyImpactRiskCatalog(host, catalog);
    const confirmed = SystemSceneSnapshotBuilder.buildFromGeneratedSingle(metadata(locator), host);
    const catalogued = SystemSceneSnapshotBuilder.buildFromGeneratedSingle(
      metadata(locator, DiscoveryState.CATALOGUED), host,
    );
    expect(confirmed.orbitalRiskEvaluated).toBe(
      risks !== null && risks.assessmentCount > 0,
    );
    expect(catalogued.orbitalRiskEvaluated).toBe(false);
    expect(catalogued.orbitalRiskTargets).toHaveLength(0);
    expect(confirmed.orbitalRiskTargets.every(target =>
      confirmed.planets.some(planet => planet.id === target.targetBodyId) ||
      confirmed.moons.some(moon => moon.id === target.targetBodyId))).toBe(true);
    expect(confirmed.layers.orbitalRiskTargetCount).toBe(
      confirmed.orbitalRiskTargets.filter(target => target.severity !== 'CROSSING').length,
    );
    expect(confirmed.layers.orbitalCrossingTargetCount).toBe(
      confirmed.orbitalRiskTargets.filter(target => target.severity === 'CROSSING').length,
    );
    expect(() => assertSystemSceneProjectionSnapshot(confirmed)).not.toThrow();
  }, 120_000);

  it.each([StellarSystemMultiplicity.BINARY, StellarSystemMultiplicity.TRIPLE])(
    'preserves host-local risk target identities in %s without leaking source planet ids', multiplicity => {
      const locator = locatorFor(multiplicity);
      const formation = StellarMultihostFormation.generateOrNull(keyV2, locator)!;
      const materialized = SystemSceneMultihostMaterializedSources.build(formation, metadata(locator));
      const composed = SystemSceneMultihostComposition.build(formation, materialized).snapshot;
      expect(composed.orbitalRiskEvaluated).toBe(
        materialized.singles.some(source => source.snapshot.orbitalRiskEvaluated === true),
      );
      expect(composed.orbitalRiskTargets.length).toBe(
        materialized.singles.reduce((sum, source) => sum + source.snapshot.orbitalRiskTargets.length, 0),
      );
      for (const target of composed.orbitalRiskTargets) {
        expect(target.targetBodyId.startsWith('mh-')).toBe(true);
        expect(composed.planets.some(body => body.id === target.targetBodyId) ||
          composed.moons.some(body => body.id === target.targetBodyId)).toBe(true);
        expect(composed.orbits.some(orbit => orbit.id === target.targetOrbitId)).toBe(true);
      }
      expect(() => assertSystemSceneProjectionSnapshot(composed)).not.toThrow();
    }, 120_000,
  );
});
