import { describe, expect, it } from 'vitest';

import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { ExplorationResultKind } from '../../domain/exploration/exploration-sector-result';
import { GalacticObjectScientificActionType } from '../../domain/galactic-object/galactic-object-scientific-action';
import { GalacticObjectScientificSubject } from '../../domain/galactic-object/galactic-object-scientific-subject';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { GalacticObjectLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { ObservationActionContext, ObservationActionType } from '../../domain/observation/observation-action';
import { InstrumentObservationSession, ObservationInstrumentType } from '../../domain/observation/observation-instrument';
import { LeveledInstrumentObservationSession, ObservationInstrumentLevel } from '../../domain/observation/observation-instrument-capability';
import { ObservationSession, Observatory } from '../../domain/observation/observatory';
import { ObservationScientificCompletenessContext } from '../../domain/observation/observation-scientific-completeness';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GalacticObjectScientificActionEngine } from '../../simulation/galactic-object/galactic-object-scientific-action-engine';
import { GalacticObjectScientificActionCatalogV1 } from '../../simulation/galactic-object/galactic-object-scientific-action-catalog';
import { GalacticObjectScientificSubjectResolver } from '../../simulation/galactic-object/galactic-object-scientific-subject-resolver';
import { SupernovaRemnantGenerator } from '../../simulation/galactic-object/supernova-remnant-generator';
import { ObservationActionEngine } from '../../simulation/observation/observation-action-engine';
import { ObservationEngine } from '../../simulation/observation/observation-engine';
import { ObservationInstrumentCapabilityCatalogV1 } from '../../simulation/observation/observation-instrument-capability-catalog';
import { ObservationInstrumentCatalogV1 } from '../../simulation/observation/observation-instrument-catalog';
import { ArchiveGalacticObjectCardAssembler } from './archive-galactic-object-card';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const v2 = new UniverseGenerationKey(seed, GeneratorVersion.V2);
const nebula = new GalacticObjectLocator(0n, 123456789n, 8n);
const hii = new GalacticObjectLocator(0n, 123456789n, 3n);
const openCluster = new GalacticObjectLocator(0n, 0n, 2n);
const globularCluster = new GalacticObjectLocator(0n, 0n, 7n);
const extremeComplement = new GalacticObjectLocator(0n, 0n, 18n);

function remnantLocator(): GalacticObjectLocator {
  for (let index = 1n; index < 2048n; index += 1n) {
    const candidate = new GalacticObjectLocator(0n, 0n, index);
    if (SupernovaRemnantGenerator.isSupernovaRemnantLocator(v1, candidate)) {
      return candidate;
    }
  }
  throw new Error('No remnant in frozen physical fixture.');
}

function session(
  key: UniverseGenerationKey,
  locator: GalacticObjectLocator,
  state: DiscoveryStateValue,
  instrumentType: ObservationInstrumentType,
  level: ObservationInstrumentLevel,
): LeveledInstrumentObservationSession {
  const observation = new ObservationSession(new Observatory(key), locator, state);
  const instrument = ObservationInstrumentCatalogV1.instrument(instrumentType);
  return new LeveledInstrumentObservationSession(
    new InstrumentObservationSession(observation, instrument),
    ObservationInstrumentCapabilityCatalogV1.profile(instrumentType, level),
  );
}

describe('V2 galactic objects: public identity, frozen physics and scientific progression', () => {
  it('opens every coarse family at DETECTED without leaking physical facts or crashing', () => {
    for (const [locator, kind] of [
      [nebula, ExplorationResultKind.NEBULA],
      [openCluster, ExplorationResultKind.STAR_CLUSTER],
      [extremeComplement, ExplorationResultKind.EXTREME_OBJECT],
    ] as const) {
      const card = ArchiveGalacticObjectCardAssembler.build(v2, locator, kind, DiscoveryState.DETECTED);
      expect(card.scientificSubject).toBeNull();
      expect(card.facts).toHaveLength(0);
      expect(card.scientificSections).toHaveLength(0);
      expect(card.render.seed).toContain('/V2/');
    }
  });

  it('resolves all supported physical specializations identically in V1 and V2', () => {
    for (const [locator, expected] of [
      [nebula, GalacticObjectScientificSubject.NEBULA],
      [hii, GalacticObjectScientificSubject.HII_REGION],
      [openCluster, GalacticObjectScientificSubject.OPEN_CLUSTER],
      [globularCluster, GalacticObjectScientificSubject.GLOBULAR_CLUSTER],
      [remnantLocator(), GalacticObjectScientificSubject.SUPERNOVA_REMNANT],
    ] as const) {
      expect(GalacticObjectScientificSubjectResolver.resolve(v1, locator, DiscoveryState.DISCOVERED)).toBe(expected);
      expect(GalacticObjectScientificSubjectResolver.resolve(v2, locator, DiscoveryState.DISCOVERED)).toBe(expected);
    }
    expect(GalacticObjectScientificSubjectResolver.resolve(v2, extremeComplement, DiscoveryState.DISCOVERED)).toBeNull();
    expect(() => GalacticObjectScientificSubjectResolver.resolve(v2, openCluster, DiscoveryState.DETECTED)).toThrow();
  });

  it('reveals the same frozen scientific facts only when V2 is catalogued, retaining a distinct visual identity', () => {
    const cases = [
      [nebula, ExplorationResultKind.NEBULA],
      [hii, ExplorationResultKind.NEBULA],
      [openCluster, ExplorationResultKind.STAR_CLUSTER],
      [globularCluster, ExplorationResultKind.STAR_CLUSTER],
      [remnantLocator(), ExplorationResultKind.EXTREME_OBJECT],
    ] as const;
    for (const [locator, kind] of cases) {
      const discovered = ArchiveGalacticObjectCardAssembler.build(v2, locator, kind, DiscoveryState.DISCOVERED);
      expect(discovered.facts).toHaveLength(0);
      const cataloguedV1 = ArchiveGalacticObjectCardAssembler.build(v1, locator, kind, DiscoveryState.CATALOGUED);
      const cataloguedV2 = ArchiveGalacticObjectCardAssembler.build(v2, locator, kind, DiscoveryState.CATALOGUED);
      expect(cataloguedV2.facts).toEqual(cataloguedV1.facts);
      expect(cataloguedV2.facts.length).toBeGreaterThan(0);
      expect(cataloguedV2.render.seed).toContain('/V2/');
      expect(cataloguedV2.render.seed).not.toBe(cataloguedV1.render.seed);
      const confirmed = ArchiveGalacticObjectCardAssembler.build(v2, locator, kind, DiscoveryState.CONFIRMED);
      expect(confirmed.facts.length).toBeGreaterThanOrEqual(cataloguedV2.facts.length);
    }
  });

  it('resolves V2 surveys and PD progression for nebula, cluster and extreme families without duplicating milestones', () => {
    const cases = [
      [nebula, GalacticObjectScientificActionType.NEBULA_SURVEY, ObservationInstrumentType.OPTICAL, ObservationInstrumentLevel.LEVEL_1],
      [openCluster, GalacticObjectScientificActionType.STAR_CLUSTER_SURVEY, ObservationInstrumentType.OPTICAL, ObservationInstrumentLevel.LEVEL_1],
      [extremeComplement, GalacticObjectScientificActionType.EXTREME_OBJECT_SURVEY, ObservationInstrumentType.X_RAY, ObservationInstrumentLevel.LEVEL_2],
    ] as const;
    for (const [locator, action, instrument, level] of cases) {
      const current = session(v2, locator, DiscoveryState.DETECTED, instrument, level);
      const result = GalacticObjectScientificActionEngine.evaluate(v2, current, action);
      const old = GalacticObjectScientificActionEngine.evaluate(v1, session(v1, locator, DiscoveryState.DETECTED, instrument, level), action);
      expect(result.newDiscoveryState).toBe(DiscoveryState.DISCOVERED);
      expect(result.awardedDiscoveryPoints).toBe(old.awardedDiscoveryPoints);
      expect(GalacticObjectScientificActionEngine.availability(
        v2, session(v2, locator, DiscoveryState.DISCOVERED, instrument, level), action,
      ).isAvailable).toBe(false);
      expect(() => GalacticObjectScientificActionEngine.evaluate(v1, current, action)).toThrow();
    }
  });

  it('characterizes and confirms each V2 physical family with the original rule catalog', () => {
    for (const locator of [nebula, hii, openCluster, globularCluster, remnantLocator()]) {
      const subject = GalacticObjectScientificSubjectResolver.resolve(v2, locator, DiscoveryState.DISCOVERED);
      expect(subject).not.toBeNull();
      if (subject === null) throw new Error('Missing scientific subject.');
      const rules = GalacticObjectScientificActionCatalogV1.subjectRules(subject);
      expect(rules).toHaveLength(2);
      for (const rule of rules) {
        const instrument = rule.compatibleInstrumentTypes[0];
        if (instrument === undefined) throw new Error('Missing scientific instrument.');
        const current = session(v2, locator, rule.minimumDiscoveryState, instrument, rule.minimumInstrumentLevel);
        const result = GalacticObjectScientificActionEngine.evaluate(v2, current, rule.actionType);
        const baseline = GalacticObjectScientificActionEngine.evaluate(
          v1, session(v1, locator, rule.minimumDiscoveryState, instrument, rule.minimumInstrumentLevel), rule.actionType,
        );
        expect(result.newDiscoveryState).toBe(rule.targetDiscoveryState);
        expect(result.awardedDiscoveryPoints).toBe(baseline.awardedDiscoveryPoints);
      }
    }
  });

  it('supports V2 observation sessions with the same instrument rules but rejects V1 or other seed discoveries', () => {
    const locator = new SystemLocator(0n, 123456789n, 2n);
    const observatory = new Observatory(v2);
    const known = [new KnownDiscovery(v2, locator, DiscoveryState.DETECTED)];
    const prepared = ObservationEngine.prepareInstrumentObservationAtLevel(
      observatory, locator, known, ObservationInstrumentType.OPTICAL, ObservationInstrumentLevel.LEVEL_1,
    );
    expect(prepared.generationKey.equals(v2)).toBe(true);
    expect(ObservationActionEngine.availability(
      v2, prepared, ObservationActionType.OBSERVE, new ObservationActionContext(false, false),
    ).isAvailable).toBe(true);
    expect(() => ObservationActionEngine.availability(
      v1, prepared, ObservationActionType.OBSERVE, new ObservationActionContext(false, false),
    )).toThrow();
    expect(() => ObservationEngine.prepareObservation(observatory, locator, [
      new KnownDiscovery(v1, locator, DiscoveryState.DETECTED),
    ])).toThrow(/another universe/);
    const another = new UniverseGenerationKey(UniverseSeed.parse('ABCD-0000-0000-0000-0000-0000-0000-0001'), GeneratorVersion.V2);
    expect(() => ObservationEngine.prepareObservation(observatory, locator, [
      new KnownDiscovery(another, locator, DiscoveryState.DETECTED),
    ])).toThrow(/another universe/);
    const candidate = ObservationEngine.initialObservationCertainty(observatory);
    expect(ObservationEngine.advanceObservationCertainty(observatory, candidate).certainty).not.toBe(candidate.certainty);
    const unclassified = ObservationEngine.unclassifiedObject(observatory, locator);
    expect(unclassified.subject.generationKey.equals(v2)).toBe(true);
    const completeness = ObservationEngine.scientificCompletenessForObject(
      observatory, locator, ObservationScientificCompletenessContext.EMPTY,
    );
    expect(completeness.generationKey.equals(v2)).toBe(true);
    const uncertainty = ObservationEngine.estimateScalarWithUncertainty(prepared, 42, 100);
    expect(uncertainty).toBeDefined();
  });
});
