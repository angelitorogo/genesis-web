import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';
import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';
import {
  type StellarCompanion,
} from '../../domain/stellar/stellar-companion';
import {
  StellarEvolutionInput,
} from '../../domain/stellar/stellar-evolution-input';
import {
  StellarLifetimeProfile,
} from '../../domain/stellar/stellar-lifetime-profile';
import {
  StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';
import {
  StellarSystemComponentLabel,
} from '../../domain/stellar/stellar-system-component-label';
import {
  type StellarSystem,
} from '../../domain/stellar/stellar-system';
import {
  SupernovaCanonicalEventTemporalStatus,
} from '../../domain/transient/supernova-canonical-event';
import {
  SupernovaStellarLineageStage,
} from '../../domain/transient/supernova-stellar-lineage';
import {
  SupernovaType,
} from '../../domain/transient/supernova-type';
import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';
import {
  StellarEvolutionEngine,
} from '../stellar/stellar-evolution-engine';
import {
  StellarSupernovaCanonicalEventResolver,
} from './stellar-supernova-canonical-event-resolver';

interface ComponentFixture {
  readonly physical: StellarPhysicalProperties;
  readonly lifetime: StellarLifetimeProfile;
}

describe('29.1C — StellarSupernovaCanonicalEventResolver', () => {
  const generationKey = new UniverseGenerationKey(
    UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
    GeneratorVersion.V1,
  );

  function component(
    initialMassSolar: number,
    metallicitySolarRatio: number,
    ageBillionYears: number,
    currentMassSolar = initialMassSolar,
  ): ComponentFixture {
    const assessment = StellarEvolutionEngine.evaluate(
      generationKey,
      new StellarEvolutionInput(
        initialMassSolar,
        metallicitySolarRatio,
        ageBillionYears,
      ),
    );
    const terminalAge =
      assessment.mainSequenceLifetimeBillionYears === null ||
      assessment.postMainSequenceDurationBillionYears === null
        ? null
        : assessment.mainSequenceLifetimeBillionYears +
          assessment.postMainSequenceDurationBillionYears;
    const remainingLife =
      terminalAge === null
        ? null
        : Math.max(0, terminalAge - ageBillionYears);

    return {
      physical: new StellarPhysicalProperties(
        initialMassSolar,
        currentMassSolar,
        1,
        1,
        5_800,
      ),
      lifetime: new StellarLifetimeProfile(
        ageBillionYears,
        terminalAge,
        remainingLife,
        assessment,
      ),
    };
  }

  function fakeCompanion(
    label: typeof StellarSystemComponentLabel.B | typeof StellarSystemComponentLabel.C,
    designation: string,
    fixture: ComponentFixture,
  ): StellarCompanion {
    return {
      componentLabel: label,
      designation: { name: designation },
      physicalProperties: fixture.physical,
      lifetimeProfile: fixture.lifetime,
    } as unknown as StellarCompanion;
  }

  function fakeSystem(
    secondaryCompanion: StellarCompanion | null = null,
    tertiaryCompanion: StellarCompanion | null = null,
    innerPeriastronAu = 1,
    outerPeriastronAu = 5,
  ): StellarSystem {
    return {
      generationKey,
      primaryComponentDesignation: { name: 'Testara A' },
      secondaryCompanion,
      tertiaryCompanion,
      orbitHierarchy: {
        innerOrbit:
          secondaryCompanion === null
            ? null
            : { periastronAu: innerPeriastronAu },
        outerOrbit:
          tertiaryCompanion === null
            ? null
            : { periastronAu: outerPeriastronAu },
      },
    } as unknown as StellarSystem;
  }

  it('materializes a future core-collapse event at the real terminal stellar age', () => {
    const primary = component(18, 1, 0);
    const [event] = StellarSupernovaCanonicalEventResolver.resolveSystem(
      fakeSystem(),
      primary.physical,
      primary.lifetime,
    );

    expect(event.eventKey).toBe('SUPERNOVA:A');
    expect(event.componentLabel).toBe(StellarSystemComponentLabel.A);
    expect(event.profile.type).toBe(SupernovaType.TYPE_II);
    expect(event.sourceLineageStage).toBe(
      SupernovaStellarLineageStage.FUTURE_CORE_COLLAPSE,
    );
    expect(event.temporalStatus).toBe(
      SupernovaCanonicalEventTemporalStatus.FUTURE_SCHEDULED,
    );
    expect(event.eventStellarAgeBillionYears).toBe(
      primary.lifetime.terminalAgeBillionYears,
    );
    expect(event.eventStellarAgeBillionYears).toBeGreaterThan(
      event.currentStellarAgeBillionYears,
    );
  });

  it('keeps a past core-collapse event attached to an already-generated compact remnant', () => {
    const primary = component(18, 1, 1, 1.5);
    const [event] = StellarSupernovaCanonicalEventResolver.resolveSystem(
      fakeSystem(),
      primary.physical,
      primary.lifetime,
    );

    expect(event.sourceLineageStage).toBe(
      SupernovaStellarLineageStage.POST_CORE_COLLAPSE_REMNANT,
    );
    expect(event.temporalStatus).toBe(
      SupernovaCanonicalEventTemporalStatus.HISTORICAL,
    );
    expect(event.eventStellarAgeBillionYears).not.toBeNull();
    expect(event.eventStellarAgeBillionYears!).toBeLessThanOrEqual(
      event.currentStellarAgeBillionYears,
    );
  });

  it('does not invent an explosion epoch for the physically eligible Ia binary channel', () => {
    const whiteDwarf = component(5.2, 1, 1.0, 0.95);
    const donor = component(2.0, 1, 1.0, 2.0);
    const secondary = fakeCompanion(
      StellarSystemComponentLabel.B,
      'Testara B',
      donor,
    );

    const [event] = StellarSupernovaCanonicalEventResolver.resolveSystem(
      fakeSystem(secondary),
      whiteDwarf.physical,
      whiteDwarf.lifetime,
    );

    expect(event.profile.type).toBe(SupernovaType.TYPE_IA);
    expect(event.temporalStatus).toBe(
      SupernovaCanonicalEventTemporalStatus.UNRESOLVED_BINARY_DELAY,
    );
    expect(event.eventStellarAgeBillionYears).toBeNull();
    expect(event.requiresBinaryInteraction).toBe(true);
  });

  it('excludes ineligible and direct-collapse components from the canonical event set', () => {
    const quietPrimary = component(1, 1, 0);
    const directCollapse = component(45, 1, 0);
    const secondary = fakeCompanion(
      StellarSystemComponentLabel.B,
      'Testara B',
      directCollapse,
    );

    const events = StellarSupernovaCanonicalEventResolver.resolveSystem(
      fakeSystem(secondary),
      quietPrimary.physical,
      quietPrimary.lifetime,
    );

    expect(events).toEqual([]);
  });

  it('preserves A/B/C identity and is deterministic on repeated resolution', () => {
    const primary = component(18, 1, 0);
    const secondaryFixture = component(26, 1, 0);
    const tertiaryFixture = component(34, 1, 0);
    const secondary = fakeCompanion(
      StellarSystemComponentLabel.B,
      'Testara B',
      secondaryFixture,
    );
    const tertiary = fakeCompanion(
      StellarSystemComponentLabel.C,
      'Testara C',
      tertiaryFixture,
    );
    const system = fakeSystem(secondary, tertiary, 8, 12);

    const first = StellarSupernovaCanonicalEventResolver.resolveSystem(
      system,
      primary.physical,
      primary.lifetime,
    );
    const second = StellarSupernovaCanonicalEventResolver.resolveSystem(
      system,
      primary.physical,
      primary.lifetime,
    );

    expect(first.map((event) => event.componentLabel)).toEqual([
      StellarSystemComponentLabel.A,
      StellarSystemComponentLabel.B,
      StellarSystemComponentLabel.C,
    ]);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });
});
