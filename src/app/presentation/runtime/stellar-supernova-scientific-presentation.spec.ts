import { StellarEvolutionState } from '../../domain/stellar/stellar-evolution-state';
import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import {
  SupernovaCanonicalEvent,
  SupernovaCanonicalEventTemporalStatus,
} from '../../domain/transient/supernova-canonical-event';
import { SupernovaCompactRemnantKind } from '../../domain/transient/supernova-event-profile';
import {
  SupernovaStellarLineage,
  SupernovaStellarLineageStage,
} from '../../domain/transient/supernova-stellar-lineage';
import {
  SupernovaStellarConsequence,
  SupernovaStellarConsequenceStatus,
  SupernovaStellarDisposition,
} from '../../domain/transient/supernova-stellar-consequence';
import { SupernovaType } from '../../domain/transient/supernova-type';
import { SUPERNOVA_LABORATORY_CASES } from '../laboratory/transient-events/supernovae/supernova-laboratory-fixtures';
import { StellarSupernovaScientificPresentationAssembler } from './stellar-supernova-scientific-presentation';

function laboratoryProfile(type: typeof SupernovaType.TYPE_II | typeof SupernovaType.TYPE_IA) {
  const source = SUPERNOVA_LABORATORY_CASES.find((entry) => entry.id === type);
  if (source === undefined) {
    throw new Error(`Missing supernova laboratory fixture ${type}.`);
  }
  return source.profile;
}

describe('29.1E — StellarSupernovaScientificPresentationAssembler', () => {
  it('projects a canonical core-collapse lineage into fiche and compact catalogue science', () => {
    const profile = laboratoryProfile(SupernovaType.TYPE_II);
    const lineage = new SupernovaStellarLineage(
      StellarSystemComponentLabel.A,
      'Testara A',
      18,
      13,
      1,
      0.008,
      StellarEvolutionState.SUPERGIANT,
      StellarEvolutionState.NEUTRON_STAR,
      SupernovaStellarLineageStage.FUTURE_CORE_COLLAPSE,
      profile.progenitor,
      profile,
      false,
    );
    const event = new SupernovaCanonicalEvent(
      StellarSystemComponentLabel.A,
      'Testara A',
      SupernovaStellarLineageStage.FUTURE_CORE_COLLAPSE,
      SupernovaCanonicalEventTemporalStatus.FUTURE_SCHEDULED,
      0.008,
      0.009,
      false,
      profile,
    );
    const consequence = new SupernovaStellarConsequence(
      StellarSystemComponentLabel.A,
      'Testara A',
      event.eventKey,
      SupernovaStellarConsequenceStatus.PREDICTED_FUTURE,
      SupernovaType.TYPE_II,
      SupernovaStellarDisposition.COMPACT_REMNANT,
      StellarEvolutionState.NEUTRON_STAR,
      SupernovaCompactRemnantKind.NEUTRON_STAR,
      profile.compactRemnantMassSolar ?? 1.5,
      profile.ejectaMassSolar,
      0.009,
    );

    const model = StellarSupernovaScientificPresentationAssembler.build({
      lineages: [lineage],
      events: [event],
      consequences: [consequence],
    });

    expect(model.canonicalEventCount).toBe(1);
    expect(model.directCollapseCount).toBe(0);
    expect(model.catalogLabel).toBe('II · futura');
    expect(model.entries[0]?.eventTypeLabel).toBe('Tipo II');
    expect(model.entries[0]?.consequenceLabel).toContain('estrella de neutrones');
    expect(model.entries[0]?.stellarDesignation).toBe('Testara A');
    expect(model.entries[0]?.eventAgeFieldLabel).toBe('Edad del evento');
  });

  it('shows direct collapse as stellar lineage without inventing a canonical supernova', () => {
    const lineage = new SupernovaStellarLineage(
      StellarSystemComponentLabel.B,
      'Testara B',
      60,
      18,
      0.1,
      0.004,
      StellarEvolutionState.STELLAR_BLACK_HOLE,
      StellarEvolutionState.STELLAR_BLACK_HOLE,
      SupernovaStellarLineageStage.DIRECT_COLLAPSE_NO_SUPERNOVA,
      null,
      null,
      false,
      0.0025,
    );

    const model = StellarSupernovaScientificPresentationAssembler.build({
      lineages: [lineage],
      events: [],
      consequences: [],
    }, {
      components: [{
        componentLabel: 'B',
        facts: [{ label: 'Masa actual del remanente (estimada)', value: '54,5599 M☉' }],
      }],
    } as never);

    expect(model.canonicalEventCount).toBe(0);
    expect(model.directCollapseCount).toBe(1);
    expect(model.catalogLabel).toBe('Colapso directo · sin SN');
    expect(model.entries[0]?.hasCanonicalEvent).toBe(false);
    expect(model.entries[0]?.eventTypeLabel).toBe('Sin supernova canónica');
    expect(model.entries[0]?.temporalLabel).toBe('Colapso directo histórico');
    expect(model.entries[0]?.consequenceLabel).toBe('Remanente actual: agujero negro estelar');
    expect(model.entries[0]?.eventAgeFieldLabel).toBe('Edad del colapso');
    expect(model.entries[0]?.eventAgeLabel).toContain('0,003 Ga');
    expect(model.entries[0]?.remnantMassLabel).toBe('Agujero negro estelar · 54,5599 M☉');
  });

  it('keeps a not-yet-realized direct collapse explicitly future without inventing a supernova', () => {
    const lineage = new SupernovaStellarLineage(
      StellarSystemComponentLabel.A,
      'Futura A',
      70,
      70,
      0.2,
      0.001,
      StellarEvolutionState.MAIN_SEQUENCE,
      StellarEvolutionState.STELLAR_BLACK_HOLE,
      SupernovaStellarLineageStage.DIRECT_COLLAPSE_NO_SUPERNOVA,
      null,
      null,
      false,
      0.003,
    );

    const model = StellarSupernovaScientificPresentationAssembler.build({
      lineages: [lineage],
      events: [],
      consequences: [],
    });

    expect(model.entries[0]?.temporalLabel).toBe('Colapso directo futuro previsto');
    expect(model.entries[0]?.consequenceLabel).toBe('Remanente previsto: agujero negro estelar');
    expect(model.entries[0]?.eventAgeFieldLabel).toBe('Edad del colapso');
    expect(model.entries[0]?.eventAgeLabel).toContain('0,003 Ga');
  });

  it('preserves the unresolved Type Ia delay and complete white-dwarf destruction', () => {
    const profile = laboratoryProfile(SupernovaType.TYPE_IA);
    const lineage = new SupernovaStellarLineage(
      StellarSystemComponentLabel.A,
      'Degenera A',
      5.2,
      1.38,
      1,
      2.4,
      StellarEvolutionState.WHITE_DWARF,
      StellarEvolutionState.WHITE_DWARF,
      SupernovaStellarLineageStage.THERMONUCLEAR_BINARY_CHANNEL,
      profile.progenitor,
      profile,
      true,
    );
    const event = new SupernovaCanonicalEvent(
      StellarSystemComponentLabel.A,
      'Degenera A',
      SupernovaStellarLineageStage.THERMONUCLEAR_BINARY_CHANNEL,
      SupernovaCanonicalEventTemporalStatus.UNRESOLVED_BINARY_DELAY,
      2.4,
      null,
      true,
      profile,
    );
    const consequence = new SupernovaStellarConsequence(
      StellarSystemComponentLabel.A,
      'Degenera A',
      event.eventKey,
      SupernovaStellarConsequenceStatus.UNRESOLVED_BINARY_DELAY,
      SupernovaType.TYPE_IA,
      SupernovaStellarDisposition.DESTROYED,
      null,
      SupernovaCompactRemnantKind.NONE,
      0,
      profile.ejectaMassSolar,
      null,
    );

    const model = StellarSupernovaScientificPresentationAssembler.build({
      lineages: [lineage],
      events: [event],
      consequences: [consequence],
    });

    expect(model.catalogLabel).toBe('Ia · retardo binario');
    expect(model.entries[0]?.eventAgeLabel).toContain('No resuelta');
    expect(model.entries[0]?.remnantMassLabel).toBe('Sin remanente compacto');
    expect(model.entries[0]?.consequenceLabel).toContain('Destrucción completa');
  });
});
