import {
  projectH5PTypeWhiteDwarfEnvironment,
  type H5PTypeInput,
} from './white-dwarf-post-agb-circumbinary-model';

const binary = (): H5PTypeInput => ({
  formationPlanetAxisAu: 20, planetaryEccentricity: 0.05,
  innerAxisAu: 2, innerEccentricity: 0.12,
  initialMassA: 1.5, currentMassA: 0.6, luminosityA: 0.00001,
  initialMassB: 1, currentMassB: 1, luminosityB: 1,
  whiteDwarfLabel: 'A', outer: null,
});

describe('29.1E-H5-B: adiabatic P-type irradiation, not an authoritative orbit', () => {
  it('uses total AB mass loss for a circumbinary planet and separates companion flux', () => {
    const input = binary();
    const before = JSON.stringify(input);
    const r = projectH5PTypeWhiteDwarfEnvironment(input)!;
    expect(r).not.toBeNull();
    const factor = 2.5 / 1.6;
    const axis = 20 * factor;
    const orbitMean = axis ** 2 * Math.sqrt(1 - 0.05 ** 2);
    expect(r.expansionFactor).toBeCloseTo(factor, 12);
    expect(r.planetAxisAu).toBeCloseTo(axis, 12);
    expect(r.projectedInnerAxisAu).toBeCloseTo(2 * factor, 12);
    expect(r.periodYears).toBeCloseTo(Math.sqrt(axis ** 3 / 1.6), 10);
    expect(r.whiteDwarfFluxEarth).toBeGreaterThan(0);
    expect(Math.abs(r.whiteDwarfFluxEarth - 1e-5 / orbitMean) / (1e-5 / orbitMean)).toBeLessThan(0.025);
    expect(Math.abs(r.otherStarsFluxEarth - 1 / orbitMean) / (1 / orbitMean)).toBeLessThan(0.025);
    expect(r.totalModeledFluxEarth).toBeCloseTo(r.whiteDwarfFluxEarth + r.otherStarsFluxEarth, 12);
    expect(r.circumBinaryStabilityValidated).toBe(false);
    expect(projectH5PTypeWhiteDwarfEnvironment(input)).toEqual(r);
    expect(JSON.stringify(input)).toBe(before);
  });

  it('projects a hierarchical triple only with phase averaging and counts C exactly once', () => {
    const input: H5PTypeInput = {...binary(), outer: {
      axisAu: 800, eccentricity: 0.18,
      initialMassC: 0.8, currentMassC: 0.8, luminosityC: 0.4,
    }};
    const r = projectH5PTypeWhiteDwarfEnvironment(input)!;
    const outer = 800 * (2.5 + 0.8) / (1.6 + 0.8);
    const meanPointFluxC = 0.4 / (outer ** 2 * Math.sqrt(1 - 0.18 ** 2));
    expect(r.projectedOuterAxisAu).toBeCloseTo(outer, 10);
    const difference = r.otherStarsFluxEarth -
      projectH5PTypeWhiteDwarfEnvironment(binary())!.otherStarsFluxEarth;
    expect(difference).toBeGreaterThan(0);
    expect(Math.abs(difference - meanPointFluxC) / meanPointFluxC).toBeLessThan(0.1);
    expect(r.totalModeledFluxEarth).toBeGreaterThan(r.otherStarsFluxEarth);
    expect(projectH5PTypeWhiteDwarfEnvironment({...input, outer: {...input.outer!, axisAu: 35}}))
      .toBeNull();
  });

  it('rejects close circumbinary configurations, rather than claiming post-AGB stability', () => {
    expect(projectH5PTypeWhiteDwarfEnvironment({...binary(), formationPlanetAxisAu: 5}))
      .toBeNull();
    expect(projectH5PTypeWhiteDwarfEnvironment({...binary(), innerEccentricity: 0.85}))
      .toBeNull();
  });

  it('rejects incomplete luminosities, unphysical mass increase and bad orbits', () => {
    expect(projectH5PTypeWhiteDwarfEnvironment({...binary(), luminosityB: Number.NaN}))
      .toBeNull();
    expect(projectH5PTypeWhiteDwarfEnvironment({...binary(), currentMassA: 2}))
      .toBeNull();
    expect(projectH5PTypeWhiteDwarfEnvironment({...binary(), planetaryEccentricity: -0.1}))
      .toBeNull();
    expect(projectH5PTypeWhiteDwarfEnvironment({...binary(), outer: {
      axisAu: 400, eccentricity: 0.2,
      initialMassC: 1, currentMassC: -1, luminosityC: 1,
    }})).toBeNull();
  });

  it('is symmetric in A and B when the WD label and stellar properties are exchanged', () => {
    const x = binary();
    const y: H5PTypeInput = {...x,
      initialMassA: x.initialMassB, currentMassA: x.currentMassB, luminosityA: x.luminosityB,
      initialMassB: x.initialMassA, currentMassB: x.currentMassA, luminosityB: x.luminosityA,
      whiteDwarfLabel: 'B',
    };
    expect(projectH5PTypeWhiteDwarfEnvironment(y))
      .toEqual(projectH5PTypeWhiteDwarfEnvironment(x));
  });
});
