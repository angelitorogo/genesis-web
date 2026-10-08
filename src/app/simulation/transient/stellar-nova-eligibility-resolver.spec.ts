import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarEvolutionState } from '../../domain/stellar/stellar-evolution-state';
import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import { StellarWhiteDwarfComposition } from '../../domain/stellar/stellar-white-dwarf-composition';
import { NovaStellarLineageStage } from '../../domain/transient/nova-stellar-lineage';
import { NovaWhiteDwarfComposition } from '../../domain/transient/nova-progenitor';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import {
  StellarNovaEligibilityResolver,
  assessStellarNovaMassTransfer,
  donorRocheLobeRadiusAu,
  type StellarNovaGroundTruthComponent,
  type StellarNovaInteractionContext,
} from './stellar-nova-eligibility-resolver';

describe('29.2 StellarNovaEligibilityResolver', () => {
  const generationKey = new UniverseGenerationKey(
    UniverseSeed.parse('1111-2222-3333-4444-5555-6666-7777-8888'),
    GeneratorVersion.V2,
  );

  it('requires a real mass-transfer path; an isolated or merely nearby WD binary does not invent a nova', () => {
    const isolated = StellarNovaEligibilityResolver.resolveGroundTruthSystem(
      context(null, null),
      [component('A', 'WHITE_DWARF', 5.2, 0.9, 'CARBON_OXYGEN_CORE')],
    );
    expect(isolated[0]?.stage).toBe(NovaStellarLineageStage.INELIGIBLE);

    const wide = StellarNovaEligibilityResolver.resolveGroundTruthSystem(
      context(2, null),
      [
        component('A', 'WHITE_DWARF', 5.2, 0.9, 'CARBON_OXYGEN_CORE'),
        component('B', 'MAIN_SEQUENCE', 0.9, 0.9, null),
      ],
    );
    expect(wide[0]?.stage).toBe(NovaStellarLineageStage.INELIGIBLE);
  });

  it('rejects the real Faker-like M5 donor because it fills only about 0.22% of its Roche lobe', () => {
    const donor = component('B', 'MAIN_SEQUENCE', 0.1754, 0.1754, null, {
      radiusSolar: 0.249,
      luminositySolar: 0.0048,
      effectiveTemperatureKelvin: 3047,
    });
    const wdMass = 0.5870063;
    const roche = donorRocheLobeRadiusAu(0.1754, wdMass, 1.8583);
    const fill = 0.249 * 0.004650467260962157 / roche;
    expect(fill).toBeCloseTo(0.0022, 3);
    expect(assessStellarNovaMassTransfer(wdMass, donor, 1.8583)).toBeNull();

    const resolved = StellarNovaEligibilityResolver.resolveGroundTruthSystem(
      context(1.8583, null),
      [
        component('A', 'WHITE_DWARF', 1.7707, 1.7707, 'CARBON_OXYGEN_CORE'),
        donor,
      ],
    );
    expect(resolved[0]?.stage).toBe(NovaStellarLineageStage.INELIGIBLE);
  });

  it('opens a deterministic H-rich nova channel only when a real close donor nearly fills its Roche lobe', () => {
    const resolved = StellarNovaEligibilityResolver.resolveGroundTruthSystem(
      context(0.012, null),
      [
        component('A', 'WHITE_DWARF', 6.3, 0.95, 'CARBON_OXYGEN_CORE'),
        component('B', 'MAIN_SEQUENCE', 1.0, 1.0, null),
      ],
    );

    const nova = resolved[0]!;
    expect(nova.stage).not.toBe(NovaStellarLineageStage.INELIGIBLE);
    expect(nova.donorComponentLabel).toBe(StellarSystemComponentLabel.B);
    expect(nova.progenitor?.whiteDwarfComposition).toBe(NovaWhiteDwarfComposition.CARBON_OXYGEN);
    expect(nova.eventProfile).not.toBeNull();
  });

  it('allows a sufficiently strong captured giant wind even when Roche overflow is not active', () => {
    const donor = component('B', 'GIANT', 1.3, 1.2, null);
    const transfer = assessStellarNovaMassTransfer(1.2, donor, 1.0);
    expect(transfer?.mode).toBe('CAPTURED_STELLAR_WIND');
    expect(transfer?.effectiveAccretionRateSolarPerYear ?? 0).toBeGreaterThanOrEqual(1e-11);
    expect(transfer?.donorRocheFillFactor ?? 1).toBeLessThan(0.9);
  });

  it('supports O/Ne novae and evolved wind/RLOF donors but rejects compact remnants as H-rich donors', () => {
    const valid = StellarNovaEligibilityResolver.resolveGroundTruthSystem(
      context(0.11, null),
      [
        component('A', 'WHITE_DWARF', 7.8, 1.1, 'OXYGEN_NEON_CORE'),
        component('B', 'GIANT', 1.3, 1.2, null),
      ],
    );
    expect(valid[0]?.progenitor?.whiteDwarfComposition).toBe(NovaWhiteDwarfComposition.OXYGEN_NEON);

    const compactDonor = StellarNovaEligibilityResolver.resolveGroundTruthSystem(
      context(0.011, null),
      [
        component('A', 'WHITE_DWARF', 7.8, 1.1, 'OXYGEN_NEON_CORE'),
        component('B', 'NEUTRON_STAR', 11, 1.4, null),
      ],
    );
    expect(compactDonor[0]?.stage).toBe(NovaStellarLineageStage.INELIGIBLE);
  });

  function context(innerPeriastronAu: number | null, outerPeriastronAu: number | null): StellarNovaInteractionContext {
    return Object.freeze({ generationKey, innerPeriastronAu, outerPeriastronAu });
  }
});

function component(
  label: 'A' | 'B' | 'C',
  state: 'WHITE_DWARF' | 'MAIN_SEQUENCE' | 'GIANT' | 'NEUTRON_STAR',
  initialMassSolar: number,
  currentMassSolar: number,
  whiteDwarfComposition: 'CARBON_OXYGEN_CORE' | 'OXYGEN_NEON_CORE' | null,
  overrides?: Partial<{
    radiusSolar: number;
    luminositySolar: number;
    effectiveTemperatureKelvin: number;
  }>,
): StellarNovaGroundTruthComponent {
  const componentLabel = label === 'A'
    ? StellarSystemComponentLabel.A
    : label === 'B'
      ? StellarSystemComponentLabel.B
      : StellarSystemComponentLabel.C;
  const evolutionState = state === 'WHITE_DWARF'
    ? StellarEvolutionState.WHITE_DWARF
    : state === 'MAIN_SEQUENCE'
      ? StellarEvolutionState.MAIN_SEQUENCE
      : state === 'GIANT'
        ? StellarEvolutionState.GIANT
        : StellarEvolutionState.NEUTRON_STAR;
  const composition = whiteDwarfComposition === 'CARBON_OXYGEN_CORE'
    ? StellarWhiteDwarfComposition.CARBON_OXYGEN_CORE
    : whiteDwarfComposition === 'OXYGEN_NEON_CORE'
      ? StellarWhiteDwarfComposition.OXYGEN_NEON_CORE
      : null;

  return {
    componentLabel,
    designation: `Fixture ${label}`,
    physicalProperties: {
      initialMassSolar,
      currentMassSolar,
      radiusSolar: overrides?.radiusSolar ?? (state === 'GIANT' ? 20 : 1),
      luminositySolar: overrides?.luminositySolar ?? (state === 'GIANT' ? 80 : 1),
      effectiveTemperatureKelvin: overrides?.effectiveTemperatureKelvin ?? (state === 'GIANT' ? 4_700 : 6_000),
    },
    lifetimeProfile: {
      ageBillionYears: 3,
      terminalAgeBillionYears: state === 'WHITE_DWARF' || state === 'NEUTRON_STAR' ? 1 : 8,
      remainingLifeBillionYears: state === 'WHITE_DWARF' || state === 'NEUTRON_STAR' ? 0 : 5,
      evolutionAssessment: {
        input: { initialMassSolar, metallicitySolarRatio: 1, ageBillionYears: 3 },
        evolutionState,
        whiteDwarfComposition: composition,
      },
    },
  } as unknown as StellarNovaGroundTruthComponent;
}
