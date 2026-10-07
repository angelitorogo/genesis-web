import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarEvolutionInput } from '../../domain/stellar/stellar-evolution-input';
import { StellarLifetimeProfile } from '../../domain/stellar/stellar-lifetime-profile';
import { StellarPhysicalProperties } from '../../domain/stellar/stellar-physical-properties';
import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import {
  SupernovaCanonicalEventTemporalStatus,
} from '../../domain/transient/supernova-canonical-event';
import {
  SupernovaCompactRemnantKind,
} from '../../domain/transient/supernova-event-profile';
import {
  SupernovaStellarLineageStage,
} from '../../domain/transient/supernova-stellar-lineage';
import {
  SupernovaStellarConsequenceStatus,
  SupernovaStellarDisposition,
} from '../../domain/transient/supernova-stellar-consequence';
import { SupernovaType } from '../../domain/transient/supernova-type';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarEvolutionEngine } from '../../simulation/stellar/stellar-evolution-engine';
import {
  type StellarSupernovaGroundTruthComponent,
  type StellarSupernovaInteractionContext,
  StellarSupernovaEligibilityResolver,
} from '../../simulation/transient/stellar-supernova-eligibility-resolver';
import {
  StellarSupernovaCanonicalEventResolver,
} from '../../simulation/transient/stellar-supernova-canonical-event-resolver';
import {
  StellarSupernovaConsequenceResolver,
} from '../../simulation/transient/stellar-supernova-consequence-resolver';
import {
  buildPostSupernovaAuditCases,
} from '../laboratory/stellar-systems/post-supernova-audit/post-supernova-audit-fixtures';
import {
  StellarSupernovaScientificPresentationAssembler,
} from './stellar-supernova-scientific-presentation';

const generationKey = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V1,
);

const wideContext: StellarSupernovaInteractionContext = Object.freeze({
  generationKey,
  innerPeriastronAu: 8,
  outerPeriastronAu: 30,
});

function component(
  label: typeof StellarSystemComponentLabel.A |
    typeof StellarSystemComponentLabel.B |
    typeof StellarSystemComponentLabel.C,
  initialMassSolar: number,
  ageBillionYears: number,
  currentMassSolar = initialMassSolar,
): StellarSupernovaGroundTruthComponent {
  const assessment = StellarEvolutionEngine.evaluate(
    generationKey,
    new StellarEvolutionInput(initialMassSolar, 1, ageBillionYears),
  );
  const terminalAge = assessment.mainSequenceLifetimeBillionYears === null ||
    assessment.postMainSequenceDurationBillionYears === null
    ? null
    : assessment.mainSequenceLifetimeBillionYears +
      assessment.postMainSequenceDurationBillionYears;

  return Object.freeze({
    componentLabel: label,
    designation: `Clausura ${label.name}`,
    physicalProperties: new StellarPhysicalProperties(
      initialMassSolar,
      currentMassSolar,
      1,
      1,
      5_800,
    ),
    lifetimeProfile: new StellarLifetimeProfile(
      ageBillionYears,
      terminalAge,
      terminalAge === null
        ? null
        : Math.max(0, terminalAge - ageBillionYears),
      assessment,
    ),
  });
}

function snapshotFor(
  context: StellarSupernovaInteractionContext,
  components: readonly StellarSupernovaGroundTruthComponent[],
) {
  const lineages = StellarSupernovaEligibilityResolver.resolveGroundTruthSystem(
    context,
    components,
  );
  const events = StellarSupernovaCanonicalEventResolver.resolveGroundTruthSystem(
    context,
    components,
  );
  const consequences = StellarSupernovaConsequenceResolver.resolveEvents(events);

  return Object.freeze({ lineages, events, consequences });
}

describe('29.1F — complete supernova integration regression closure', () => {
  it('closes one historical core-collapse lineage from real stellar evolution through event, remnant and scientific presentation', () => {
    const source = component(StellarSystemComponentLabel.A, 18, 1);
    const snapshot = snapshotFor(wideContext, [source]);

    expect(snapshot.lineages).toHaveLength(1);
    expect(snapshot.events).toHaveLength(1);
    expect(snapshot.consequences).toHaveLength(1);

    const lineage = snapshot.lineages[0]!;
    const event = snapshot.events[0]!;
    const consequence = snapshot.consequences[0]!;

    expect(lineage.stage).toBe(
      SupernovaStellarLineageStage.POST_CORE_COLLAPSE_REMNANT,
    );
    expect(event.temporalStatus).toBe(
      SupernovaCanonicalEventTemporalStatus.HISTORICAL,
    );
    expect(event.profile.type).toBe(SupernovaType.TYPE_II);
    expect(event.eventKey).toBe('SUPERNOVA:A');
    expect(event.componentLabel).toBe(lineage.componentLabel);
    expect(event.stellarDesignation).toBe(lineage.stellarDesignation);

    expect(consequence.sourceEventKey).toBe(event.eventKey);
    expect(consequence.componentLabel).toBe(event.componentLabel);
    expect(consequence.status).toBe(
      SupernovaStellarConsequenceStatus.REALIZED_HISTORICAL,
    );
    expect(consequence.disposition).toBe(
      SupernovaStellarDisposition.COMPACT_REMNANT,
    );
    expect(consequence.compactRemnantKind).not.toBe(
      SupernovaCompactRemnantKind.NONE,
    );
    expect(consequence.postEventStellarMassSolar).toBe(
      event.profile.compactRemnantMassSolar,
    );
    expect(
      event.profile.ejectaMassSolar + consequence.postEventStellarMassSolar,
    ).toBeCloseTo(event.profile.progenitor.preExplosionMassSolar, 6);

    const presentation = StellarSupernovaScientificPresentationAssembler.build(
      snapshot,
    );
    expect(presentation.canonicalEventCount).toBe(1);
    expect(presentation.directCollapseCount).toBe(0);
    expect(presentation.entries).toHaveLength(1);
    expect(presentation.entries[0]!.componentLabel).toBe('A');
    expect(presentation.entries[0]!.stellarDesignation).toBe('Clausura A');
    expect(presentation.entries[0]!.eventTypeLabel).toBe('Tipo II');
    expect(presentation.entries[0]!.temporalLabel).toBe(
      'Evento histórico realizado',
    );
    expect(presentation.entries[0]!.hasCanonicalEvent).toBe(true);
  });

  it('keeps mixed A/B/C identity closed and never manufactures a supernova event for direct collapse', () => {
    const snapshot = snapshotFor(wideContext, [
      component(StellarSystemComponentLabel.A, 18, 1),
      component(StellarSystemComponentLabel.B, 45, 1),
      component(StellarSystemComponentLabel.C, 1, 1),
    ]);

    expect(snapshot.lineages.map(current => current.componentLabel.name)).toEqual([
      'A',
      'B',
      'C',
    ]);
    expect(snapshot.lineages[0]!.stage).toBe(
      SupernovaStellarLineageStage.POST_CORE_COLLAPSE_REMNANT,
    );
    expect(snapshot.lineages[1]!.stage).toBe(
      SupernovaStellarLineageStage.DIRECT_COLLAPSE_NO_SUPERNOVA,
    );
    expect(snapshot.lineages[2]!.stage).toBe(
      SupernovaStellarLineageStage.INELIGIBLE,
    );

    expect(snapshot.events.map(current => current.componentLabel.name)).toEqual([
      'A',
    ]);
    expect(snapshot.consequences.map(current => current.componentLabel.name)).toEqual([
      'A',
    ]);

    const presentation = StellarSupernovaScientificPresentationAssembler.build(
      snapshot,
    );
    expect(presentation.canonicalEventCount).toBe(1);
    expect(presentation.directCollapseCount).toBe(1);
    expect(presentation.entries.map(current => current.componentLabel)).toEqual([
      'A',
      'B',
    ]);
    expect(presentation.entries[1]!.eventTypeLabel).toBe(
      'Sin supernova canónica',
    );
    expect(presentation.entries[1]!.hasCanonicalEvent).toBe(false);
  });

  it('keeps the Ia binary channel temporally unresolved, destroys the white dwarf and invents neither date nor compact remnant', () => {
    const closeBinaryContext: StellarSupernovaInteractionContext = Object.freeze({
      generationKey,
      innerPeriastronAu: 1,
      outerPeriastronAu: null,
    });
    const snapshot = snapshotFor(closeBinaryContext, [
      component(StellarSystemComponentLabel.A, 5.2, 1, 0.95),
      component(StellarSystemComponentLabel.B, 2, 1),
    ]);

    const iaLineage = snapshot.lineages.find(current =>
      current.componentLabel === StellarSystemComponentLabel.A,
    )!;
    expect(iaLineage.stage).toBe(
      SupernovaStellarLineageStage.THERMONUCLEAR_BINARY_CHANNEL,
    );

    expect(snapshot.events).toHaveLength(1);
    const event = snapshot.events[0]!;
    const consequence = snapshot.consequences[0]!;
    expect(event.profile.type).toBe(SupernovaType.TYPE_IA);
    expect(event.temporalStatus).toBe(
      SupernovaCanonicalEventTemporalStatus.UNRESOLVED_BINARY_DELAY,
    );
    expect(event.eventStellarAgeBillionYears).toBeNull();
    expect(event.requiresBinaryInteraction).toBe(true);
    expect(event.profile.compactRemnantKind).toBe(
      SupernovaCompactRemnantKind.NONE,
    );

    expect(consequence.disposition).toBe(
      SupernovaStellarDisposition.DESTROYED,
    );
    expect(consequence.postEventStellarMassSolar).toBe(0);
    expect(consequence.postEventEvolutionState).toBeNull();
    expect(consequence.consequenceStellarAgeBillionYears).toBeNull();

    const presentation = StellarSupernovaScientificPresentationAssembler.build(
      snapshot,
    );
    expect(presentation.entries[0]!.eventTypeLabel).toBe('Tipo Ia');
    expect(presentation.entries[0]!.eventAgeLabel).toBe(
      'No resuelta por el modelo binario actual',
    );
    expect(presentation.entries[0]!.remnantMassLabel).toBe(
      'Sin remanente compacto',
    );
  });

  it('pins the deterministic post-supernova audit outcomes used to close survival, ejection, hierarchy disruption and the no-SN control', () => {
    const first = buildPostSupernovaAuditCases();
    const replay = buildPostSupernovaAuditCases();

    expect(first).toEqual(replay);
    expect(first.map(current => current.id)).toEqual(['A', 'B', 'C', 'D']);
    expect(first.map(current => current.status)).toEqual([
      'BOUND_RECONFIGURED',
      'EJECTED',
      'DISRUPTED_HIERARCHY',
      'BINARY_UNCHANGED',
    ]);
    expect(first[0]!.afterOrbit).not.toBeNull();
    expect(first[1]!.afterOrbit).toBeNull();
    expect(first[2]!.metrics.find(metric => metric.label === 'Órbita exterior (A+B)–C')?.after)
      .toBe('HIERARCHY_DISRUPTED');
    expect(first[3]!.metrics.every(metric => !metric.changed)).toBe(true);
  }, 120_000);
});
