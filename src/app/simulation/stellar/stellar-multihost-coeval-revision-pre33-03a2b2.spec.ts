import { describe, it, expect } from 'vitest';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { StellarEvolutionInput } from '../../domain/stellar/stellar-evolution-input';
import { StellarEvolutionEngine } from './stellar-evolution-engine';
import type { GeneratedMultipleHost } from './stellar-multihost-formation';
import { MULTIHOST_COEVAL_REVISION_PRE3303A2B2 as REV } from '../../domain/stellar/stellar-multihost-coeval-revision-pre33-03a2b2';
import { StellarMultihostCoEvalRevisionPRE3303A2B2 as engine } from './stellar-multihost-coeval-revision-pre33-03a2b2';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5');
const oldKey = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const parentKey = new UniverseGenerationKey(seed, GeneratorVersion.V2);
function frozen(ages = [4, 12], masses = [1, 1], metals = [1, 1]) {
  const components = ages.map((age, i) => ({
    label: 'ABC'[i],
    internalGenerationKey: oldKey,
    physical: {initialMassSolar: masses[i], currentMassSolar: masses[i], luminositySolar: masses[i]},
    lifetime: {
      ageBillionYears: age,
      evolutionAssessment: StellarEvolutionEngine.evaluate(oldKey,
        new StellarEvolutionInput(masses[i]!, metals[i] ?? 1, age)),
    },
  }));
  const mult = {
    parentGenerationKey: parentKey,
    parentLocator: {galaxyIndex: 0n, sectorKey: 12n, galacticObjectIndex: 2n},
    components,
    publicPlanets: [],
  } as unknown as GeneratedMultipleHost;
  return { mult, components };
}
const revise = (ages?: number[], masses?: number[], metals?: number[]) =>
  engine.fromFrozenSource(frozen(ages, masses, metals).mult, REV);

describe('PRE-33.03a.2b.2 versioned physical coeval multihost source', () => {
  it('derives one new formation clock from A for all revised components', () => {
    const r = revise();
    expect(r.status).toBe('COEVAL_PHYSICAL_SOURCE_READY');
    expect(r.sharedFormationAgeBillionYears).toBe(4);
    expect(r.components.map(c => c.revisedAgeBillionYears)).toEqual([4, 4]);
    expect(r.components.map(c => c.frozenAgeBillionYears)).toEqual([4, 12]);
  });
  it('really RECOMPUTES B phase rather than claiming compatibility with its old phase', () => {
    const r = revise();
    expect(r.components[1].frozenEvolutionState).toBe('WHITE_DWARF');
    expect(r.components[1].revisedEvolutionState).toBe('MAIN_SEQUENCE');
    expect(r.components[1].phaseChanged).toBe(true);
    expect(r.components[1].revisedLifetime.ageBillionYears).toBe(4);
  });
  it('preserves all original physical component masses and metallicities', () => {
    const r = revise([3, 8, 12], [1, .8, .35], [1, .6, 1.2]);
    expect(r.components.map(c => c.initialMassSolar)).toEqual([1, .8, .35]);
    expect(r.components.map(c => c.metallicitySolarRatio)).toEqual([1, .6, 1.2]);
  });
  it('does not consume a stochastic source to choose revised B/C ages', () => {
    const a = revise([3, 8, 12], [1, .8, .5]);
    const b = revise([3, 2, 1], [1, .8, .5]);
    expect(a.components.map(c => c.revisedEvolutionState)).toEqual(b.components.map(c => c.revisedEvolutionState));
    expect(a.components.map(c => c.revisedAgeBillionYears)).toEqual(b.components.map(c => c.revisedAgeBillionYears));
  });
  it('cannot be used as a migration of V2 snapshots or gameplay histories', () => {
    const r = revise();
    expect(r.legacyUniverseUnmodified).toBe(true);
    expect(r.phase32Unmodified).toBe(true);
    expect(r.gameCutoverActivated).toBe(false);
    expect(r.migrationRequiresAtomicRegeneration).toBe(true);
    expect(r.planetRecordsCompatibleWithoutMigration).toBe(false);
    expect(r.ct0WaterCertified).toBe(false);
  });
  it('requires an explicit revision before attempting a new public V2 physical source', () => {
    const loc={galaxyIndex:0n,sectorKey:12n,galacticObjectIndex:2n};
    expect(() => engine.generateForScientificRevisionOrNull(oldKey,
      loc as unknown as import('../../domain/generation/procedural-locator').SystemLocator, REV))
      .toThrow(/EXPLICIT_V2_SCIENTIFIC_REVISION_REQUIRED/);
  });
  it('rejects V1 parent lineage even though components use private V1 physics', () => {
    const x = frozen();
    const wrong = {...x.mult, parentGenerationKey: oldKey} as GeneratedMultipleHost;
    expect(() => engine.fromFrozenSource(wrong, REV)).toThrow(/NONVERSIONED/);
  });
  it('rejects implicit or unknown revisions, never changes the canonical V2 default', () => {
    const x = frozen();
    expect(() => engine.fromFrozenSource(x.mult, 'UNVERSIONED' as typeof REV)).toThrow(/NONVERSIONED/);
  });
  it('does not mutate frozen V2 component age, assessment or public body identity', () => {
    const x = frozen();
    const before = JSON.stringify(x.components, (_, v) => typeof v === 'bigint' ? String(v) : v);
    const r = engine.fromFrozenSource(x.mult, REV);
    expect(JSON.stringify(x.components, (_, v) => typeof v === 'bigint' ? String(v) : v)).toBe(before);
    expect(r.components[1].revisedLifetime).not.toBe(x.components[1].lifetime);
  });
  it('supports coeval triple input independently of the old three ages', () => {
    const r = revise([5, 1, 10], [1, .9, .3]);
    expect(r.components.length).toBe(3);
    expect(r.components.map(c => c.revisedAgeBillionYears)).toEqual([5, 5, 5]);
  });
  it('preserves initial evolutionary family and lifetime of brown dwarf at common epoch', () => {
    const r = revise([4, 8], [1, .045]);
    expect(r.components[1].revisedEvolutionState).toBe('BROWN_DWARF');
    expect(r.components[1].revisedLifetime.terminalAgeBillionYears).toBeNull();
  });
  it('is deterministic across repeated independent evaluations', () => {
    expect(JSON.stringify(revise())).toBe(JSON.stringify(revise()));
  });
  it('uses a separate explicit scientific-revision contract, not GeneratorVersion.V3', () => {
    const r = revise();
    expect(r.contractVersion).toBe(REV);
    expect(r.parentGenerationVersion).toBe('V2');
    expect(r.parentSourceVersion).toBe('FROZEN_V2_PRIVATE_V1_15_3');
  });
});
