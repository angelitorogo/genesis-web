import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { ExplorationResultKind } from '../../domain/exploration/exploration-sector-result';
import { GalacticObjectScientificActionType as Action } from '../../domain/galactic-object/galactic-object-scientific-action';
import { GalacticObjectScientificSubject as Subject } from '../../domain/galactic-object/galactic-object-scientific-subject';
import { GalacticObjectLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { InstrumentObservationSession, ObservationInstrumentType as Instrument } from '../../domain/observation/observation-instrument';
import { LeveledInstrumentObservationSession, ObservationInstrumentLevel as Level } from '../../domain/observation/observation-instrument-capability';
import { ObservationSession, Observatory } from '../../domain/observation/observatory';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ArchiveGalacticObjectCardAssembler as Card } from './archive-galactic-object-card';
import { ObservationInstrumentCapabilityCatalogV1 } from '../../simulation/observation/observation-instrument-capability-catalog';
import { ObservationInstrumentCatalogV1 } from '../../simulation/observation/observation-instrument-catalog';
import { IntermediateMassBlackHoleGenerator as Imbh } from '../../simulation/galactic-object/intermediate-mass-black-hole-generator';
import { GalacticObjectScientificSubjectResolver as Resolver } from '../../simulation/galactic-object/galactic-object-scientific-subject-resolver';
import { GalacticObjectScientificActionEngine as Engine } from '../../simulation/galactic-object/galactic-object-scientific-action-engine';
import { GalacticObjectScientificActionCatalogV1 as Original } from '../../simulation/galactic-object/galactic-object-scientific-action-catalog';
import { GalacticObjectScientificActionCatalogV2 as Catalog } from '../../simulation/galactic-object/galactic-object-scientific-action-catalog-v2';

/** Golden occupied object from 27.2. The unrelated reserved locator 18 stays unknown. */
describe('27.10 V2 — IMBH real gameplay integration', () => {
  const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
  const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
  const v2 = new UniverseGenerationKey(seed, GeneratorVersion.V2);
  const rare = new GalacticObjectLocator(0n, -73014444020n, 0n);
  const reserved = new GalacticObjectLocator(0n, 0n, 18n);

  function session(key: UniverseGenerationKey, locator: GalacticObjectLocator,
      state: typeof DiscoveryState.DETECTED | typeof DiscoveryState.DISCOVERED |
        typeof DiscoveryState.CATALOGUED | typeof DiscoveryState.CONFIRMED,
      instrumentType: Instrument, level: Level) {
    return new LeveledInstrumentObservationSession(
      new InstrumentObservationSession(
        new ObservationSession(new Observatory(key), locator, state),
        ObservationInstrumentCatalogV1.instrument(instrumentType)),
      ObservationInstrumentCapabilityCatalogV1.profile(instrumentType, level),
    );
  }

  it('preserves all thirteen old action rules, three surveys and two distinct new stages', () => {
    expect(Original.rules).toHaveLength(13);
    expect(Catalog.rules.slice(0, 13)).toEqual(Original.rules);
    expect(Catalog.supportedActions).toHaveLength(15);
    expect(Catalog.surveyRule(Original.rules[2].surveyFamily!)).toBe(Original.rules[2]);
    const rules = Catalog.subjectRules(Subject.INTERMEDIATE_MASS_BLACK_HOLE);
    expect(rules.map(rule => rule.actionType)).toEqual([
      Action.IMBH_COMPACT_CHARACTERIZATION,
      Action.IMBH_INDEPENDENT_CONFIRMATION,
    ]);
    expect(rules.map(rule => rule.targetDiscoveryState)).toEqual([
      DiscoveryState.CATALOGUED, DiscoveryState.CONFIRMED,
    ]);
    expect(rules[0].observationActionType).not.toBe(rules[1].observationActionType);
    expect(rules[0].compatibleInstrumentTypes)
      .not.toContain(rules[1].compatibleInstrumentTypes[0]);
  });

  it('does not resolve a hidden subtype at DETECTED, classifies only the occupied 27.2 target after DISCOVERED', () => {
    for (const key of [v1, v2]) {
      expect(Imbh.generate(key, rare)).not.toBeNull();
      expect(() => Resolver.resolve(key, rare, DiscoveryState.DETECTED)).toThrow(RangeError);
      expect(Resolver.resolve(key, rare, DiscoveryState.DISCOVERED))
        .toBe(Subject.INTERMEDIATE_MASS_BLACK_HOLE);
      expect(Resolver.resolve(key, reserved, DiscoveryState.DISCOVERED)).toBeNull();
      expect(Engine.availability(key, session(key, rare, DiscoveryState.DETECTED,
        Instrument.OPTICAL, Level.LEVEL_3), Action.IMBH_COMPACT_CHARACTERIZATION).isAvailable).toBe(false);
    }
  });

  it('supports survey -> characterisation -> independent confirmation, not skipping/replaying stages', () => {
    const survey = Engine.evaluate(v1, session(v1, rare, DiscoveryState.DETECTED,
      Instrument.RADIO, Level.LEVEL_2), Action.EXTREME_OBJECT_SURVEY);
    expect(survey.newDiscoveryState).toBe(DiscoveryState.DISCOVERED);
    const characterize = Engine.evaluate(v1, session(v1, rare, DiscoveryState.DISCOVERED,
      Instrument.OPTICAL, Level.LEVEL_3), Action.IMBH_COMPACT_CHARACTERIZATION);
    expect(characterize.newDiscoveryState).toBe(DiscoveryState.CATALOGUED);
    const confirm = Engine.evaluate(v1, session(v1, rare, DiscoveryState.CATALOGUED,
      Instrument.X_RAY, Level.LEVEL_4), Action.IMBH_INDEPENDENT_CONFIRMATION);
    expect(confirm.newDiscoveryState).toBe(DiscoveryState.CONFIRMED);
    expect(() => Engine.evaluate(v1, session(v1, rare, DiscoveryState.DETECTED,
      Instrument.OPTICAL, Level.LEVEL_3), Action.IMBH_COMPACT_CHARACTERIZATION)).toThrow(RangeError);
    expect(() => Engine.evaluate(v1, session(v1, rare, DiscoveryState.DISCOVERED,
      Instrument.X_RAY, Level.LEVEL_4), Action.IMBH_INDEPENDENT_CONFIRMATION)).toThrow(RangeError);
    expect(() => Engine.evaluate(v1, session(v1, rare, DiscoveryState.CATALOGUED,
      Instrument.OPTICAL, Level.LEVEL_3), Action.IMBH_COMPACT_CHARACTERIZATION)).toThrow(RangeError);
    expect(() => Engine.evaluate(v1, session(v1, reserved, DiscoveryState.DISCOVERED,
      Instrument.OPTICAL, Level.LEVEL_3), Action.IMBH_COMPACT_CHARACTERIZATION)).toThrow(RangeError);
  });

  it('does not accept an incorrect instrument or insufficient level', () => {
    expect(Engine.availability(v1, session(v1, rare, DiscoveryState.DISCOVERED,
      Instrument.OPTICAL, Level.LEVEL_2), Action.IMBH_COMPACT_CHARACTERIZATION).isAvailable).toBe(false);
    expect(Engine.availability(v1, session(v1, rare, DiscoveryState.DISCOVERED,
      Instrument.RADIO, Level.LEVEL_4), Action.IMBH_COMPACT_CHARACTERIZATION).isAvailable).toBe(false);
    expect(Engine.availability(v1, session(v1, rare, DiscoveryState.CATALOGUED,
      Instrument.X_RAY, Level.LEVEL_3), Action.IMBH_INDEPENDENT_CONFIRMATION).isAvailable).toBe(false);
  });

  it('keeps observed content hidden until cataloguing, then reveals only existing model values and safe SVG', () => {
    for (const key of [v1, v2]) {
      for (const state of [DiscoveryState.DETECTED, DiscoveryState.DISCOVERED]) {
        const card = Card.build(key, rare, ExplorationResultKind.EXTREME_OBJECT, state);
        expect(card.scientificSubject).toBeNull();
        expect(card.facts).toHaveLength(0);
        expect(card.scientificSections).toHaveLength(0);
        expect(card.render.compactVisual).toBeUndefined();
        expect(card.title).not.toContain('agujero');
      }
      for (const state of [DiscoveryState.CATALOGUED, DiscoveryState.CONFIRMED]) {
        const card = Card.build(key, rare, ExplorationResultKind.EXTREME_OBJECT, state);
        expect(card.scientificSubject).toBe(Subject.INTERMEDIATE_MASS_BLACK_HOLE);
        expect(card.scientificSections.map(section => section.id)).toEqual(['intermediate-black-hole']);
        expect(card.facts.some(fact => fact.label === 'Masa (modelo)')).toBe(true);
        expect(card.render.compactVisual?.kind).toBe('BLACK_HOLE');
        expect(card.render.compactVisual?.hasAccretionDisk).toBe(false);
        expect(card.render.compactVisual?.hasRelativisticJets).toBe(false);
      }
      const unknown = Card.build(key, reserved, ExplorationResultKind.EXTREME_OBJECT, DiscoveryState.CONFIRMED);
      expect(unknown.scientificSubject).toBeNull();
      expect(unknown.facts).toHaveLength(0);
      expect(unknown.render.compactVisual).toBeUndefined();
    }
  });
});
