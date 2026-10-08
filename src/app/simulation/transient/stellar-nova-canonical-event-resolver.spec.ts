import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarEvolutionState } from '../../domain/stellar/stellar-evolution-state';
import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import { StellarWhiteDwarfComposition } from '../../domain/stellar/stellar-white-dwarf-composition';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { NovaType } from '../../domain/transient/nova-type';
import { StellarNovaCanonicalEventResolver } from './stellar-nova-canonical-event-resolver';
import type {
  StellarNovaGroundTruthComponent,
  StellarNovaInteractionContext,
} from './stellar-nova-eligibility-resolver';

describe('29.2 canonical real-system nova cycle', () => {
  const key = new UniverseGenerationKey(
    UniverseSeed.parse('1111-2222-3333-4444-5555-6666-7777-8888'),
    GeneratorVersion.V2,
  );

  it('derives one deterministic nova cycle for a real WD + donor pair', () => {
    const context: StellarNovaInteractionContext = Object.freeze({
      generationKey: key,
      innerPeriastronAu: 0.012,
      outerPeriastronAu: null,
    });
    const components = [
      fakeComponent('A', 'Fixture A', 'WHITE_DWARF', 6.8, 1.0, 2.4, 'CARBON_OXYGEN_CORE'),
      fakeComponent('B', 'Fixture B', 'MAIN_SEQUENCE', 1.1, 1.1, 2.4, null),
    ] as const;

    const first = StellarNovaCanonicalEventResolver.resolveGroundTruthSystem(context, components);
    const replay = StellarNovaCanonicalEventResolver.resolveGroundTruthSystem(context, components);

    expect(first).toEqual(replay);
    expect(first).toHaveLength(1);
    expect(first[0]?.componentLabel).toBe(StellarSystemComponentLabel.A);
    expect(first[0]?.donorComponentLabel).toBe(StellarSystemComponentLabel.B);
    expect([NovaType.CLASSICAL, NovaType.RECURRENT]).toContain(first[0]!.profile.type);
    expect(first[0]!.previousEruptionStellarAgeBillionYears).toBeLessThanOrEqual(2.4);
    expect(first[0]!.nextEruptionStellarAgeBillionYears).toBeGreaterThanOrEqual(2.4);
  });
});

function fakeComponent(
  label: 'A' | 'B',
  designation: string,
  state: 'WHITE_DWARF' | 'MAIN_SEQUENCE',
  initialMassSolar: number,
  currentMassSolar: number,
  ageBillionYears: number,
  whiteDwarfComposition: 'CARBON_OXYGEN_CORE' | null,
): StellarNovaGroundTruthComponent {
  const componentLabel = label === 'A' ? StellarSystemComponentLabel.A : StellarSystemComponentLabel.B;
  return {
    componentLabel,
    designation,
    physicalProperties: {
      initialMassSolar,
      currentMassSolar,
      radiusSolar: 1,
      luminositySolar: 1,
      effectiveTemperatureKelvin: 6000,
    },
    lifetimeProfile: {
      ageBillionYears,
      terminalAgeBillionYears: state === 'WHITE_DWARF' ? 1 : 10,
      remainingLifeBillionYears: state === 'WHITE_DWARF' ? 0 : 7.6,
      evolutionAssessment: {
        input: { initialMassSolar, metallicitySolarRatio: 1, ageBillionYears },
        evolutionState: state === 'WHITE_DWARF' ? StellarEvolutionState.WHITE_DWARF : StellarEvolutionState.MAIN_SEQUENCE,
        whiteDwarfComposition: whiteDwarfComposition === null ? null : StellarWhiteDwarfComposition.CARBON_OXYGEN_CORE,
      },
    },
  } as unknown as StellarNovaGroundTruthComponent;
}
