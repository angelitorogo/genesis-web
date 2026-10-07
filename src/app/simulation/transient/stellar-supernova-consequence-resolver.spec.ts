import {
  type SystemLocator,
} from '../../domain/generation/procedural-locator';
import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';
import {
  type SupernovaCanonicalEventRepository,
} from '../../domain/repository/supernova-canonical-event-repository';
import {
  StellarEvolutionState,
} from '../../domain/stellar/stellar-evolution-state';
import {
  StellarSystemComponentLabel,
} from '../../domain/stellar/stellar-system-component-label';
import {
  SupernovaCanonicalEvent,
  SupernovaCanonicalEventTemporalStatus,
} from '../../domain/transient/supernova-canonical-event';
import {
  SupernovaCompactRemnantKind,
  SupernovaEventProfile,
} from '../../domain/transient/supernova-event-profile';
import {
  SupernovaProgenitorChannel,
  SupernovaProgenitorCompactRemnantHint,
  SupernovaProgenitorProfile,
} from '../../domain/transient/supernova-progenitor';
import {
  SupernovaStellarLineageStage,
} from '../../domain/transient/supernova-stellar-lineage';
import {
  SupernovaStellarConsequenceStatus,
  SupernovaStellarDisposition,
} from '../../domain/transient/supernova-stellar-consequence';
import {
  SupernovaType,
} from '../../domain/transient/supernova-type';
import {
  SupernovaEventEngine,
} from './supernova-event-engine';
import {
  StellarSupernovaConsequenceResolver,
} from './stellar-supernova-consequence-resolver';

describe('29.1D — StellarSupernovaConsequenceResolver', () => {
  function coreCollapseEvent(input: {
    readonly componentLabel?: typeof StellarSystemComponentLabel.A | typeof StellarSystemComponentLabel.B;
    readonly initialMassSolar: number;
    readonly remnantHint: typeof SupernovaProgenitorCompactRemnantHint.NEUTRON_STAR | typeof SupernovaProgenitorCompactRemnantHint.STELLAR_BLACK_HOLE;
    readonly historical?: boolean;
  }): SupernovaCanonicalEvent {
    const componentLabel = input.componentLabel ?? StellarSystemComponentLabel.A;
    const progenitor = new SupernovaProgenitorProfile(
      SupernovaProgenitorChannel.CORE_COLLAPSE,
      input.initialMassSolar,
      input.initialMassSolar * 0.65,
      1,
      0.45,
      0.25,
      null,
      input.remnantHint,
    );
    const profile = SupernovaEventEngine.deriveProfile(progenitor);
    const historical = input.historical ?? false;

    return new SupernovaCanonicalEvent(
      componentLabel,
      `Testara ${componentLabel.name}`,
      historical
        ? SupernovaStellarLineageStage.POST_CORE_COLLAPSE_REMNANT
        : SupernovaStellarLineageStage.FUTURE_CORE_COLLAPSE,
      historical
        ? SupernovaCanonicalEventTemporalStatus.HISTORICAL
        : SupernovaCanonicalEventTemporalStatus.FUTURE_SCHEDULED,
      historical ? 1 : 0,
      0.02,
      false,
      profile,
    );
  }

  function typeIaEvent(): SupernovaCanonicalEvent {
    const progenitor = new SupernovaProgenitorProfile(
      SupernovaProgenitorChannel.THERMONUCLEAR_WHITE_DWARF,
      5.2,
      1.38,
      1,
      0,
      0,
      1.38,
    );

    return new SupernovaCanonicalEvent(
      StellarSystemComponentLabel.A,
      'Testara A',
      SupernovaStellarLineageStage.THERMONUCLEAR_BINARY_CHANNEL,
      SupernovaCanonicalEventTemporalStatus.UNRESOLVED_BINARY_DELAY,
      1,
      null,
      true,
      SupernovaEventEngine.deriveProfile(progenitor),
    );
  }

  it('projects a future core collapse as a predicted neutron-star consequence without mutating the system', () => {
    const event = coreCollapseEvent({
      initialMassSolar: 18,
      remnantHint: SupernovaProgenitorCompactRemnantHint.NEUTRON_STAR,
    });

    const consequence = StellarSupernovaConsequenceResolver.resolveEvent(event);

    expect(consequence.sourceEventKey).toBe('SUPERNOVA:A');
    expect(consequence.status).toBe(
      SupernovaStellarConsequenceStatus.PREDICTED_FUTURE,
    );
    expect(consequence.disposition).toBe(
      SupernovaStellarDisposition.COMPACT_REMNANT,
    );
    expect(consequence.postEventEvolutionState).toBe(
      StellarEvolutionState.NEUTRON_STAR,
    );
    expect(consequence.compactRemnantKind).toBe(
      SupernovaCompactRemnantKind.NEUTRON_STAR,
    );
    expect(consequence.postEventStellarMassSolar).toBe(
      event.profile.compactRemnantMassSolar,
    );
    expect(consequence.ejectaMassSolar).toBe(event.profile.ejectaMassSolar);
    expect(consequence.isRealized).toBe(false);
  });

  it('projects an already historical core collapse as the realized black-hole remnant dictated by Ground Truth', () => {
    const event = coreCollapseEvent({
      initialMassSolar: 30,
      remnantHint: SupernovaProgenitorCompactRemnantHint.STELLAR_BLACK_HOLE,
      historical: true,
    });

    const consequence = StellarSupernovaConsequenceResolver.resolveEvent(event);

    expect(consequence.status).toBe(
      SupernovaStellarConsequenceStatus.REALIZED_HISTORICAL,
    );
    expect(consequence.postEventEvolutionState).toBe(
      StellarEvolutionState.STELLAR_BLACK_HOLE,
    );
    expect(consequence.compactRemnantKind).toBe(
      SupernovaCompactRemnantKind.STELLAR_BLACK_HOLE,
    );
    expect(consequence.leavesCompactRemnant).toBe(true);
    expect(consequence.isRealized).toBe(true);
  });

  it('destroys a thermonuclear C/O white dwarf completely and does not invent a compact remnant', () => {
    const event = typeIaEvent();
    const consequence = StellarSupernovaConsequenceResolver.resolveEvent(event);

    expect(consequence.supernovaType).toBe(SupernovaType.TYPE_IA);
    expect(consequence.status).toBe(
      SupernovaStellarConsequenceStatus.UNRESOLVED_BINARY_DELAY,
    );
    expect(consequence.disposition).toBe(
      SupernovaStellarDisposition.DESTROYED,
    );
    expect(consequence.postEventEvolutionState).toBeNull();
    expect(consequence.compactRemnantKind).toBe(
      SupernovaCompactRemnantKind.NONE,
    );
    expect(consequence.postEventStellarMassSolar).toBe(0);
    expect(consequence.consequenceStellarAgeBillionYears).toBeNull();
    expect(consequence.leavesCompactRemnant).toBe(false);
  });

  it('preserves A/B consequence identity and deterministic order for one canonical system set', () => {
    const a = coreCollapseEvent({
      componentLabel: StellarSystemComponentLabel.A,
      initialMassSolar: 18,
      remnantHint: SupernovaProgenitorCompactRemnantHint.NEUTRON_STAR,
    });
    const b = coreCollapseEvent({
      componentLabel: StellarSystemComponentLabel.B,
      initialMassSolar: 30,
      remnantHint: SupernovaProgenitorCompactRemnantHint.STELLAR_BLACK_HOLE,
    });

    const first = StellarSupernovaConsequenceResolver.resolveEvents([a, b]);
    const second = StellarSupernovaConsequenceResolver.resolveEvents([a, b]);

    expect(first.map((entry) => entry.componentLabel)).toEqual([
      StellarSystemComponentLabel.A,
      StellarSystemComponentLabel.B,
    ]);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it('derives consequences directly from persisted 29.1C events without storing a duplicate consequence record', async () => {
    const event = coreCollapseEvent({
      initialMassSolar: 18,
      remnantHint: SupernovaProgenitorCompactRemnantHint.NEUTRON_STAR,
    });
    const repository: SupernovaCanonicalEventRepository = {
      loadForSystem: async () => [event],
      replaceForSystem: async () => undefined,
    };

    const consequences = await StellarSupernovaConsequenceResolver.loadPersistedSystem(
      repository,
      {} as UniverseGenerationKey,
      {} as SystemLocator,
    );

    expect(consequences).toHaveLength(1);
    expect(consequences[0].sourceEventKey).toBe(event.eventKey);
    expect(consequences[0].postEventEvolutionState).toBe(
      StellarEvolutionState.NEUTRON_STAR,
    );
  });

  it('rejects a compact remnant that disagrees with the Ground Truth hint frozen by 29.1B', () => {
    const valid = coreCollapseEvent({
      initialMassSolar: 18,
      remnantHint: SupernovaProgenitorCompactRemnantHint.NEUTRON_STAR,
    });
    const source = valid.profile;
    const malformedProfile = new SupernovaEventProfile(
      source.type,
      source.progenitor,
      source.ejectaMassSolar,
      source.nickel56MassSolar,
      source.explosionEnergyJoules,
      source.characteristicEjectaVelocityKmS,
      source.peakBolometricLuminosityWatts,
      source.peakAbsoluteBolometricMagnitude,
      source.peakPhotosphericTemperatureKelvin,
      source.riseTimeDays,
      source.plateauDurationDays,
      source.earlyRemnantTransitionDays,
      source.transientCompletionDays,
      SupernovaCompactRemnantKind.STELLAR_BLACK_HOLE,
      5,
    );
    const malformed = new SupernovaCanonicalEvent(
      valid.componentLabel,
      valid.stellarDesignation,
      valid.sourceLineageStage,
      valid.temporalStatus,
      valid.currentStellarAgeBillionYears,
      valid.eventStellarAgeBillionYears,
      valid.requiresBinaryInteraction,
      malformedProfile,
    );

    expect(() =>
      StellarSupernovaConsequenceResolver.resolveEvent(malformed),
    ).toThrow(/disagrees with stellar Ground Truth/);
  });

  it('rejects a malformed core-collapse event that claims to leave no compact remnant', () => {
    const valid = coreCollapseEvent({
      initialMassSolar: 18,
      remnantHint: SupernovaProgenitorCompactRemnantHint.NEUTRON_STAR,
    });
    const source = valid.profile;
    const malformedProfile = new SupernovaEventProfile(
      source.type,
      source.progenitor,
      source.ejectaMassSolar,
      source.nickel56MassSolar,
      source.explosionEnergyJoules,
      source.characteristicEjectaVelocityKmS,
      source.peakBolometricLuminosityWatts,
      source.peakAbsoluteBolometricMagnitude,
      source.peakPhotosphericTemperatureKelvin,
      source.riseTimeDays,
      source.plateauDurationDays,
      source.earlyRemnantTransitionDays,
      source.transientCompletionDays,
      SupernovaCompactRemnantKind.NONE,
      null,
    );
    const malformed = new SupernovaCanonicalEvent(
      valid.componentLabel,
      valid.stellarDesignation,
      valid.sourceLineageStage,
      valid.temporalStatus,
      valid.currentStellarAgeBillionYears,
      valid.eventStellarAgeBillionYears,
      valid.requiresBinaryInteraction,
      malformedProfile,
    );

    expect(() =>
      StellarSupernovaConsequenceResolver.resolveEvent(malformed),
    ).toThrow(/positive compact remnant/);
  });
});
