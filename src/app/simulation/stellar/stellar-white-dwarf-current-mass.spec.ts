import { StellarEvolutionState } from '../../domain/stellar/stellar-evolution-state';
import {
  estimateWhiteDwarfCurrentMassSolar,
  stellarWhiteDwarfCurrentMassSolar,
} from './stellar-white-dwarf-current-mass';

describe('stellarWhiteDwarfCurrentMassSolar', () => {
  it('projects Faker A to the same current WD mass used by 29.2', () => {
    expect(estimateWhiteDwarfCurrentMassSolar(1.7707)).toBeCloseTo(0.5870063, 7);
  });

  it('recomputes Faker current Kepler period from the WD remnant mass, not 1.7707 M☉ progenitor mass', () => {
    const wdMass = estimateWhiteDwarfCurrentMassSolar(1.7707);
    const periodYears = Math.sqrt(2.1117 ** 3 / (wdMass + 0.1754));
    expect(periodYears).toBeCloseTo(3.5144, 4);
    expect(periodYears).not.toBeCloseTo(2.1996, 2);
  });

  it('does not replace the mass of a non-WD host', () => {
    const mass = stellarWhiteDwarfCurrentMassSolar(
      { initialMassSolar: 1, currentMassSolar: 1 } as any,
      {
        evolutionAssessment: {
          input: { initialMassSolar: 1 },
          evolutionState: StellarEvolutionState.MAIN_SEQUENCE,
        },
      } as any,
    );
    expect(mass).toBeNull();
  });
});
