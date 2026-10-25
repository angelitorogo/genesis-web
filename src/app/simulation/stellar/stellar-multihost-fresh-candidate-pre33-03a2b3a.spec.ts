import { describe, expect, it } from 'vitest';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { MULTIHOST_FRESH_COEVAL_CANDIDATE_PRE3303A2B3A as VERSION } from
  '../../domain/stellar/stellar-multihost-fresh-candidate-pre33-03a2b3a';
import { StellarMultihostFormation } from './stellar-multihost-formation';
import { StellarMultihostFreshCandidatePRE3303A2B3A as Fresh } from
  './stellar-multihost-fresh-candidate-pre33-03a2b3a';
import { frozenMultihostDigestPRE3303A2B3 as digest } from
  './stellar-multihost-activation-pre33-03a2b3';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5');
const key = new UniverseGenerationKey(seed, GeneratorVersion.V2);
const binary = new SystemLocator(0n,-30064771061n,0n);
const triple = new SystemLocator(1n,60129542150n,1n);
const again = () => Fresh.materializeOrNull(key,binary,VERSION)!;

describe('PRE-33.03a.2b.3a isolated fresh coeval graph', () => {
  it('requires canonical V2 input and explicit source-revision token', () => {
    expect(() => Fresh.materializeOrNull(new UniverseGenerationKey(seed,GeneratorVersion.V1),binary,VERSION))
      .toThrow('EXPLICIT_LEGACY_SOURCE_AND_REVISION_REQUIRED');
    expect(() => Fresh.materializeOrNull(key,binary,'V2' as typeof VERSION))
      .toThrow('EXPLICIT_LEGACY_SOURCE_AND_REVISION_REQUIRED');
  });
  it('materializes a new physical graph with coeval stellar ages', () => {
    const frozen=StellarMultihostFormation.generateOrNull(key,binary)!;
    const v=again();
    expect(v.manifest.originalAgesBillionYears[0]).not.toBe(v.manifest.originalAgesBillionYears[1]);
    expect(v.manifest.revisedAgesBillionYears[0]).toBe(v.manifest.revisedAgesBillionYears[1]);
    expect(v.manifest.privateObjectReferenceReuse).toBe(false);
    expect(v.experimentalGraph.components[1]!.stellarSystem.primaryStar.evolutionState.name)
      .toBe(v.experimentalGraph.components[1]!.lifetime.evolutionAssessment.evolutionState.name);
    expect(v.experimentalGraph.publicPlanets[0]!.planet).not.toBe(frozen.publicPlanets[0]!.planet);
    expect(v.manifest.regeneratedPlanetCount).toBe(v.experimentalGraph.publicPlanets.length);
    expect(v.manifest.planetaryMaterialMassValidated).toBe(v.manifest.regeneratedPlanetCount);
    expect(v.manifest.moonPopulationValidated).toBe(v.manifest.regeneratedPlanetCount);
  });
  it('regenerates triple A/B/C physics and S/P dependent objects', () => {
    const v=Fresh.materializeOrNull(key,triple,VERSION)!;
    expect(v.experimentalGraph.components.map(c=>c.label)).toEqual(['A','B','C']);
    expect(new Set(v.manifest.revisedAgesBillionYears).size).toBe(1);
    expect(v.experimentalGraph.outerOrbit).not.toBeNull();
    expect(v.experimentalGraph.publicPlanets.every(p=>
      p.atmosphere.hostPlanet===p.planet && p.moonSystem.hostPlanet===p.planet)).toBe(true);
  });
  it('does not materialize worlds before point-17.7 formation completion at coeval CT-0', () => {
    // Before the correction these private V2 lineages mistakenly displayed
    // fully mature 18/19/20/21 planets at a younger shared formation age.
    const young = new SystemLocator(2n, 38654705676n, 1n);
    const frozen = StellarMultihostFormation.generateOrNull(key, young)!;
    const revision = Fresh.materializeOrNull(key, young, VERSION)!;
    expect(frozen.publicPlanets.length).toBe(16);
    expect(revision.experimentalGraph.components[0]!.lifetime.ageBillionYears).toBeLessThan(0.013);
    expect(revision.experimentalGraph.publicPlanets.length).toBe(0);
    expect(revision.manifest.regeneratedPlanetCount).toBe(0);
    expect(digest(StellarMultihostFormation.generateOrNull(key, young)!)).toBe(digest(frozen));
  });
  it('supports partially matured multiple systems without artificial planet quotas', () => {
    const young = new SystemLocator(0n, -25769803789n, 0n);
    const revision = Fresh.materializeOrNull(key, young, VERSION)!;
    expect(revision.manifest.originalPlanetCount).toBe(15);
    expect(revision.manifest.regeneratedPlanetCount).toBe(6);
    expect(revision.experimentalGraph.publicPlanets.every(({planet}) =>
      planet.hostPlanetarySystem.formationBlueprint.formationCompletionAgeMillionYears <=
        revision.manifest.primaryFormationAgeBillionYears * 1000 + 1e-9)).toBe(true);
    expect(revision.manifest.planetaryMaterialMassValidated).toBe(6);
  });
  it('is deterministic and never changes V2 materialization', () => {
    const original=StellarMultihostFormation.generateOrNull(key,binary)!;
    const before=digest(original);
    const first=again().manifest;
    const second=again().manifest;
    expect(first).toEqual(second);
    expect(digest(original)).toBe(before);
    expect(digest(StellarMultihostFormation.generateOrNull(key,binary)!)).toBe(before);
    expect(first.oldSnapshotDigest).toBe(before);
    expect(first.candidateSnapshotDigest).not.toBe(before);
  });
  it('rejects a new-game publication until 29/31/32 and a public version exist',()=>{
    const result=again().manifest;
    expect(result.newlyGeneratedGameIsPublic).toBe(false);
    expect(result.persistable).toBe(false);
    expect(result.savedUniverseMutated).toBe(false);
    expect(result.dependencies.filter(d=>d.status==='NOT_REGENERATED_RELEASE_BLOCKER').length)
      .toBeGreaterThan(0);
    expect(()=>Fresh.publishToNewGame()).toThrow('PUBLIC_VERSION_AND_FULL_29_31_32_REGENERATION_NOT_RELEASED');
  });
  it('preserves V1/V2 released identities until a separate public version ships',()=>{
    expect(GeneratorVersion.isReleasedForNewUniverses(GeneratorVersion.V1)).toBe(true);
    expect(GeneratorVersion.isReleasedForNewUniverses(GeneratorVersion.V2)).toBe(true);
    expect(GeneratorVersion.fromCodeOrNull(4)).toBeNull();
  });
});
