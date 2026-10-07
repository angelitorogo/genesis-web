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
  StellarEvolutionState,
} from '../../domain/stellar/stellar-evolution-state';
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
  SupernovaCompactRemnantKind,
} from '../../domain/transient/supernova-event-profile';
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
  StellarSupernovaEligibilityResolver,
} from './stellar-supernova-eligibility-resolver';

interface ComponentFixture {
  readonly physical: StellarPhysicalProperties;
  readonly lifetime: StellarLifetimeProfile;
}

describe('29.1B — StellarSupernovaEligibilityResolver', () => {
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

  function fakeSystem(
    secondaryCompanion: StellarCompanion | null = null,
    tertiaryCompanion: StellarCompanion | null = null,
    innerPeriastronAu = 1,
    outerPeriastronAu = 5,
  ): StellarSystem {
    return {
      generationKey,
      primaryComponentDesignation: {
        name: 'Testara A',
      },
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

  function fakeCompanion(
    label: typeof StellarSystemComponentLabel.B | typeof StellarSystemComponentLabel.C,
    designation: string,
    fixture: ComponentFixture,
  ): StellarCompanion {
    return {
      componentLabel: label,
      designation: {
        name: designation,
      },
      physicalProperties: fixture.physical,
      lifetimeProfile: fixture.lifetime,
    } as unknown as StellarCompanion;
  }

  it('derives II, Ib and Ic from real stellar Ground Truth without changing the stellar evolution engine', () => {
    const cases = [
      { mass: 18, expected: SupernovaType.TYPE_II },
      { mass: 26, expected: SupernovaType.TYPE_IB },
      { mass: 34, expected: SupernovaType.TYPE_IC },
    ] as const;

    for (const sample of cases) {
      const primary = component(sample.mass, 1, 0);
      const [lineage] = StellarSupernovaEligibilityResolver.resolveSystem(
        fakeSystem(),
        primary.physical,
        primary.lifetime,
      );

      expect(lineage.stage).toBe(
        SupernovaStellarLineageStage.FUTURE_CORE_COLLAPSE,
      );
      expect(lineage.eventProfile?.type).toBe(sample.expected);
      expect(lineage.progenitor?.initialMassSolar).toBe(sample.mass);
    }
  });

  it('uses the real A-B periastron as a deterministic stripped-envelope channel', () => {
    const massivePrimary = component(18, 1, 0);
    const donorFixture = component(10, 1, 0);
    const donor = fakeCompanion(
      StellarSystemComponentLabel.B,
      'Testara B',
      donorFixture,
    );

    const [wide] = StellarSupernovaEligibilityResolver.resolveSystem(
      fakeSystem(donor, null, 8),
      massivePrimary.physical,
      massivePrimary.lifetime,
    );
    const [tight] = StellarSupernovaEligibilityResolver.resolveSystem(
      fakeSystem(donor, null, 0.1),
      massivePrimary.physical,
      massivePrimary.lifetime,
    );

    expect(wide.eventProfile?.type).toBe(SupernovaType.TYPE_II);
    expect(tight.eventProfile?.type).toBe(SupernovaType.TYPE_IB);
  });

  it('uses the stellar terminal fate as the authoritative NS/BH lineage hint at metallicity-sensitive boundaries', () => {
    const primary = component(26, 3, 0);
    const [lineage] = StellarSupernovaEligibilityResolver.resolveSystem(
      fakeSystem(),
      primary.physical,
      primary.lifetime,
    );

    expect(lineage.terminalEvolutionState?.name).toBe(
      StellarEvolutionState.NEUTRON_STAR.name,
    );
    expect(lineage.eventProfile?.compactRemnantKind).toBe(
      SupernovaCompactRemnantKind.NEUTRON_STAR,
    );
  });

  it('keeps direct collapse outside the canonical Ia/II/Ib/Ic event path', () => {
    const primary = component(45, 1, 0);
    const [lineage] = StellarSupernovaEligibilityResolver.resolveSystem(
      fakeSystem(),
      primary.physical,
      primary.lifetime,
    );

    expect(lineage.stage).toBe(
      SupernovaStellarLineageStage.DIRECT_COLLAPSE_NO_SUPERNOVA,
    );
    expect(lineage.progenitor).toBeNull();
    expect(lineage.eventProfile).toBeNull();
    expect(lineage.terminalAgeBillionYears).toBe(
      primary.lifetime.terminalAgeBillionYears,
    );
  });

  it('opens the Ia channel only for a C/O white dwarf with a compatible real companion mass reservoir', () => {
    const whiteDwarf = component(5.2, 1, 1.0, 0.95);
    expect(whiteDwarf.lifetime.evolutionAssessment.evolutionState.name).toBe(
      StellarEvolutionState.WHITE_DWARF.name,
    );

    const [singleLineage] =
      StellarSupernovaEligibilityResolver.resolveSystem(
        fakeSystem(),
        whiteDwarf.physical,
        whiteDwarf.lifetime,
      );

    expect(singleLineage.stage).toBe(
      SupernovaStellarLineageStage.INELIGIBLE,
    );

    const donor = component(2.0, 1, 1.0, 2.0);
    const secondary = fakeCompanion(
      StellarSystemComponentLabel.B,
      'Testara B',
      donor,
    );
    const [binaryLineage] =
      StellarSupernovaEligibilityResolver.resolveSystem(
        fakeSystem(secondary),
        whiteDwarf.physical,
        whiteDwarf.lifetime,
      );

    expect(binaryLineage.stage).toBe(
      SupernovaStellarLineageStage.THERMONUCLEAR_BINARY_CHANNEL,
    );
    expect(binaryLineage.requiresBinaryInteraction).toBe(true);
    expect(binaryLineage.eventProfile?.type).toBe(SupernovaType.TYPE_IA);
    expect(binaryLineage.eventProfile?.compactRemnantKind).toBe(
      SupernovaCompactRemnantKind.NONE,
    );
  });

  it('preserves component identity and resolves B/C independently in multiple systems', () => {
    const primary = component(1.0, 1, 0);
    const secondaryFixture = component(18, 1, 0);
    const tertiaryFixture = component(26, 1, 0);
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

    const lineages = StellarSupernovaEligibilityResolver.resolveSystem(
      fakeSystem(secondary, tertiary),
      primary.physical,
      primary.lifetime,
    );

    expect(lineages).toHaveLength(3);
    expect(lineages.map((entry) => entry.componentLabel)).toEqual([
      StellarSystemComponentLabel.A,
      StellarSystemComponentLabel.B,
      StellarSystemComponentLabel.C,
    ]);
    expect(lineages[0].stage).toBe(SupernovaStellarLineageStage.INELIGIBLE);
    expect(lineages[1].eventProfile?.type).toBe(SupernovaType.TYPE_II);
    expect(lineages[2].eventProfile?.type).toBe(SupernovaType.TYPE_IB);
  });
});
