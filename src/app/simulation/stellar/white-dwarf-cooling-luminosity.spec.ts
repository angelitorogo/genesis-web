import { projectWhiteDwarfCoolingLuminosity } from './white-dwarf-cooling-luminosity';
import {
  StellarCompactHostPlanetaryCoherence,
  currentHostRadiativeReferenceZoneAu,
  stellarPlanetaryMeanInsolationEarth,
  stellarPlanetaryPeriodYearsFromCurrentMass,
} from './stellar-compact-host-planetary-coherence';
import { estimateWhiteDwarfCurrentMassSolar } from './stellar-white-dwarf-current-mass';

const whiteDwarf = (coolingAgeBillionYears: number, mass = 0.6) =>
  projectWhiteDwarfCoolingLuminosity({
    evolutionStateName: 'WHITE_DWARF',
    currentRemnantMassSolar: mass,
    stellarAgeBillionYears: 4 + coolingAgeBillionYears,
    progenitorTerminalAgeBillionYears: 4,
  });

describe('29.1E-H1 — WD bolometric cooling estimate', () => {
  it('uses stellar age minus terminal age, never the age of the universe or real clock', () => {
    const result = whiteDwarf(0.1)!;
    expect(result.coolingAgeBillionYears).toBeCloseTo(0.1, 12);
    expect(result.presentLuminositySolar).toBeCloseTo(0.01, 12);
    expect(result.model).toBe('BOUNDED_MESTEL_REFERENCE_V1');
    expect(whiteDwarf(0.1)).toEqual(whiteDwarf(0.1));
    expect(Object.isFrozen(whiteDwarf(0.1))).toBe(true);
  });

  it('cools monotonically and respects the existing WD mass input', () => {
    expect(whiteDwarf(1)!.presentLuminositySolar).toBeLessThan(whiteDwarf(0.1)!.presentLuminositySolar);
    expect(whiteDwarf(5)!.presentLuminositySolar).toBeLessThan(whiteDwarf(1)!.presentLuminositySolar);
    expect(whiteDwarf(1, 0.9)!.presentLuminositySolar).toBeGreaterThan(whiteDwarf(1, 0.6)!.presentLuminositySolar);
  });

  it('leaves NS, BH and other stellar hosts outside the WD cooling model', () => {
    for (const state of ['NEUTRON_STAR', 'STELLAR_BLACK_HOLE', 'MAIN_SEQUENCE', 'GIANT']) {
      expect(projectWhiteDwarfCoolingLuminosity({
        evolutionStateName: state,
        currentRemnantMassSolar: 0.6,
        stellarAgeBillionYears: 5,
        progenitorTerminalAgeBillionYears: 4,
      })).toBeNull();
    }
  });

  it('does not extrapolate for missing, inconsistent or unsupported chronology and masses', () => {
    for (const t of [-1, 0, 0.01, 13.1, Number.NaN]) expect(whiteDwarf(t)).toBeNull();
    for (const mass of [0.35, 1.35, Number.POSITIVE_INFINITY]) expect(whiteDwarf(1, mass)).toBeNull();
    expect(projectWhiteDwarfCoolingLuminosity({
      evolutionStateName: 'WHITE_DWARF', currentRemnantMassSolar: 0.6,
      stellarAgeBillionYears: 1, progenitorTerminalAgeBillionYears: 2,
    })).toBeNull();
    expect(projectWhiteDwarfCoolingLuminosity({
      evolutionStateName: 'WHITE_DWARF', currentRemnantMassSolar: 0.6,
      stellarAgeBillionYears: 1, progenitorTerminalAgeBillionYears: null,
    })).toBeNull();
  });

  it('reuses 29.2 remnant mass without changing period or frozen progenitor parameters', () => {
    const initialMassSolar = 1.7707;
    const mass = estimateWhiteDwarfCurrentMassSolar(initialMassSolar);
    expect(mass).toBeCloseTo(0.5870063, 7);
    const state = projectWhiteDwarfCoolingLuminosity({
      evolutionStateName: 'WHITE_DWARF', currentRemnantMassSolar: mass,
      stellarAgeBillionYears: 4.8, progenitorTerminalAgeBillionYears: 3.8,
    });
    expect(state?.presentLuminositySolar).toBeGreaterThan(0);
    expect(stellarPlanetaryPeriodYearsFromCurrentMass(2, mass)).toBeGreaterThan(
      stellarPlanetaryPeriodYearsFromCurrentMass(2, initialMassSolar),
    );
  });

  it('projects only solar-spectrum radiative reference limits, ordered and proportional to sqrt(L)', () => {
    const zone = currentHostRadiativeReferenceZoneAu(0.01)!;
    expect(zone.innerAu).toBeGreaterThan(0);
    expect(zone.outerAu).toBeGreaterThan(zone.innerAu);
    expect(currentHostRadiativeReferenceZoneAu(0.04)!.innerAu).toBeCloseTo(zone.innerAu * 2, 10);
    expect(stellarPlanetaryMeanInsolationEarth(1, 0, 0.01)).toBeCloseTo(0.01, 12);
    expect(currentHostRadiativeReferenceZoneAu(null)).toBeNull();
    expect(currentHostRadiativeReferenceZoneAu(0)).toBeNull();
  });

  it('uses the existing 29.2 mass projection in the current-state resolver without mutating source', () => {
    // Exercise the branch in isolation: the actual formation is not changed.
    const initialMassSolar = 1.7707;
    const lifetime = Object.freeze({
      ageBillionYears: 5,
      terminalAgeBillionYears: 4,
      evolutionAssessment: {
        input: { initialMassSolar },
        evolutionState: { name: 'WHITE_DWARF' },
      },
    });
    const physical = Object.freeze({ initialMassSolar, currentMassSolar: initialMassSolar, luminositySolar: 2 });
    const host = Object.freeze({
      label: 'B', physical, lifetime,
      stellarSystem: { primaryStar: { evolutionState: { name: 'WHITE_DWARF' } } },
    });
    const resolver = Object.create(StellarCompactHostPlanetaryCoherence.prototype) as {
      componentState(input: unknown): {
        currentGravitatingMassSolar: number | null;
        currentLuminositySolar: number | null;
        radiativeRegime: string;
        whiteDwarfCoolingAgeBillionYears?: number | null;
      };
    };
    const state = resolver.componentState(host);
    expect(state.currentGravitatingMassSolar).toBeCloseTo(estimateWhiteDwarfCurrentMassSolar(initialMassSolar), 12);
    expect(state.radiativeRegime).toBe('WHITE_DWARF_COOLING_ESTIMATE');
    expect(state.whiteDwarfCoolingAgeBillionYears).toBe(1);
    expect(state.currentLuminositySolar).toBeGreaterThan(0);
    expect(physical.currentMassSolar).toBe(initialMassSolar);
    expect(physical.luminositySolar).toBe(2);
  });
});
