import type { PlanetScientificResolvedTarget } from '../planetary/planet-scientific-target-resolver';
import { projectWhiteDwarfPostAgbOrbit } from './white-dwarf-post-agb-orbit-projection';
import { projectH5PTypeWhiteDwarfEnvironment } from './white-dwarf-post-agb-circumbinary-model';
import { projectH5WhiteDwarfScientificTarget } from './white-dwarf-post-agb-h5-scientific-bridge';

/** Synthetic physical parameters, not a special seed, generation override or real-world measurement. */
function syntheticPlanet(): PlanetScientificResolvedTarget {
  return Object.freeze({
    identity: Object.freeze({designation: 'Regression body'}),
    detail: Object.freeze({
      general: Object.freeze({massEarth: 1.4, radiusEarth: 1.1, referenceBondAlbedo01: 0.19}),
      atmosphere: Object.freeze({
        retainedSurfacePressurePascal: 5000,
        retainedGasComposition: Object.freeze([
          Object.freeze({gas: 'NITROGEN', moleFraction01: 0.70}),
          Object.freeze({gas: 'CARBON_DIOXIDE', moleFraction01: 0.30}),
        ]),
      }),
      geology: Object.freeze({
        internalHeatRetentionIndex01: 0.65, tidalHeatingIndex01: 0.04,
        volatileOutgassingPotential01: 0.25,
      }),
    }),
  }) as unknown as PlanetScientificResolvedTarget;
}
const common = {
  initialWhiteDwarfMassSolar: 1.8,
  currentWhiteDwarfMassSolar: 0.6,
  presentWhiteDwarfLuminositySolar: 2e-5,
  coolingAgeBillionYears: 5.5,
  terminalAgeBillionYears: 5,
  postMainSequenceDurationBillionYears: 0.4,
  formationEccentricity: 0.04,
};

describe('29.1E-H5-B: SINGLE/P-type shared derived environment, without Ground Truth mutation', () => {
  it('provides a WD-only simulated SINGLE environment and never marks companion flux unresolved', () => {
    const orbit = projectWhiteDwarfPostAgbOrbit({
      evolutionStateName: 'WHITE_DWARF', context: 'SINGLE',
      initialHostMassSolar: 1.8, currentHostMassSolar: 0.6,
      formationSemiMajorAxisAu: 15, formationEccentricity: 0.04,
      currentWhiteDwarfLuminositySolar: 2e-5, explosiveReconfiguration: false,
    })!;
    const target = syntheticPlanet();
    const projected = projectH5WhiteDwarfScientificTarget(target, {
      ...common, architecture: 'SINGLE', orbit, otherStarsFluxEarth: null,
      totalCurrentHostMassSolar: 0.6, initialFormationAxisAu: 15,
    });
    expect(projected).not.toBe(target);
    expect(projected.detail).toBe(target.detail);
    expect(projected.identity).toBe(target.identity);
    expect(projected.hostEvolution?.whiteDwarfPostAgbPTypeHypothesisApplied).toBe(false);
    expect(projected.hostEvolution?.whiteDwarfHasUnresolvedCompanion).toBe(false);
    const evolved = projected.hostEvolution?.whiteDwarfPostAgbEvolvedEnvironment;
    expect(evolved).not.toBeNull();
    expect(evolved?.atmosphericSurfaceCondition).toBe('HOST_ONLY_CONDITIONAL');
    expect(evolved?.multiHostRadiationUnresolved).toBe(false);
    expect(evolved?.reference.atmosphericMassBudgetErrorPascal).toBeLessThan(1e-5);
    expect(evolved?.canonicalPlanetModified).toBe(false);
    expect(projectH5WhiteDwarfScientificTarget(target, {
      ...common, architecture: 'SINGLE', orbit, otherStarsFluxEarth: null,
      totalCurrentHostMassSolar: 0.6, initialFormationAxisAu: 15,
    })).toEqual(projected);
  });

  it('models AB companion light only once in a P-type far-field closure', () => {
    const p = projectH5PTypeWhiteDwarfEnvironment({
      formationPlanetAxisAu: 25, planetaryEccentricity: 0.04,
      innerAxisAu: 2, innerEccentricity: 0.12,
      initialMassA: 1.8, currentMassA: 0.6, luminosityA: 2e-5,
      initialMassB: 1, currentMassB: 1, luminosityB: 1,
      whiteDwarfLabel: 'A', outer: null,
    })!;
    expect(p).not.toBeNull();
    const target = syntheticPlanet();
    const orbit = {
      status: 'ADIABATIC_CONDITIONAL' as const,
      formationSemiMajorAxisAu: 25,
      hypotheticalSemiMajorAxisAu: p.planetAxisAu,
      hypotheticalEccentricity: 0.04,
      massExpansionFactor: p.expansionFactor,
      hypotheticalPeriodYears: p.periodYears,
      hypotheticalHostMeanInsolationEarth: p.whiteDwarfFluxEarth,
      stabilityResolved: false as const, survivalResolved: false as const,
      companionHierarchyResolved: false as const,
    };
    const projected = projectH5WhiteDwarfScientificTarget(target, {
      ...common, architecture: 'P_TYPE', orbit,
      otherStarsFluxEarth: p.otherStarsFluxEarth,
      totalCurrentHostMassSolar: 1.6, initialFormationAxisAu: 25,
    });
    const evolution = projected.hostEvolution;
    expect(evolution?.whiteDwarfPostAgbPTypeHypothesisApplied).toBe(true);
    expect(evolution?.whiteDwarfPostAgbModeledCompanionFluxEarth)
      .toBeCloseTo(p.otherStarsFluxEarth, 12);
    expect(evolution?.whiteDwarfPostAgbHostInsolationEarth)
      .toBeCloseTo(p.whiteDwarfFluxEarth, 12);
    expect(evolution?.whiteDwarfPostAgbEvolvedEnvironment?.atmosphericSurfaceCondition)
      .toBe('ADIABATIC_MULTIPLE_HIERARCHY_CONDITIONAL');
    expect(evolution?.whiteDwarfPostAgbEvolvedEnvironment?.reference.atmosphericMassBudgetErrorPascal)
      .toBeLessThan(1e-5);
    expect(target.hostEvolution).toBeUndefined();
    expect(Object.isFrozen(target.detail)).toBe(true);
  });
});
