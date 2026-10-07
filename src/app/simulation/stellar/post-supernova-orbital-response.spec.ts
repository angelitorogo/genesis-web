import {
  PostSupernovaMassLossRegime,
  classifyPostSupernovaMassLossRegime,
  deriveDeterministicNatalKickKmS,
  resolveAdiabaticPostStellarMassLoss,
  resolvePostSupernovaImpulse,
  resolvePostSupernovaMoonStability,
} from './post-supernova-orbital-response';

describe('29.1E-g post-supernova orbital response primitives', () => {
  it('expands an adiabatic orbit while preserving eccentricity', () => {
    const orbit = resolveAdiabaticPostStellarMassLoss(5, 0.12, 10, 8);
    expect(orbit.semiMajorAxisAu).toBeCloseTo(6.25, 12);
    expect(orbit.eccentricity).toBeCloseTo(0.12, 12);
    expect(orbit.periastronAu).toBeCloseTo(5.5, 12);
  });

  it('ejects a circular test particle after instantaneous symmetric loss of more than half the host mass', () => {
    const result = resolvePostSupernovaImpulse({
      semiMajorAxisAu: 1,
      eccentricity: 0,
      preEventMassSolar: 10,
      postEventMassSolar: 4.9,
      natalKickKmS: 0,
      deterministicKey: 'HALF-MASS-LOSS',
    });
    expect(result.disposition).toBe('EJECTED');
    expect(result.orbit).toBeNull();
  });

  it('keeps a circular orbit bound below the half-mass threshold and pumps eccentricity', () => {
    const result = resolvePostSupernovaImpulse({
      semiMajorAxisAu: 1,
      eccentricity: 0,
      preEventMassSolar: 10,
      postEventMassSolar: 7,
      natalKickKmS: 0,
      deterministicKey: 'BOUND-MASS-LOSS',
    });
    expect(result.disposition).toBe('BOUND_RECONFIGURED');
    expect(result.orbit!.semiMajorAxisAu).toBeCloseTo(1.75, 10);
    expect(result.orbit!.eccentricity).toBeCloseTo(3 / 7, 10);
  });

  it('materializes the same hidden event phase and kick direction for the same identity', () => {
    const input = {
      semiMajorAxisAu: 2.7,
      eccentricity: 0.08,
      preEventMassSolar: 9,
      postEventMassSolar: 6,
      natalKickKmS: 32,
      deterministicKey: 'BODY-ABC|SUPERNOVA:A',
    } as const;
    expect(resolvePostSupernovaImpulse(input)).toEqual(resolvePostSupernovaImpulse(input));
  });

  it('derives larger ejecta/remnant momentum kicks deterministically and keeps BH fallback bounded', () => {
    const neutron = deriveDeterministicNatalKickKmS({
      remnantKind: 'NEUTRON_STAR', ejectaMassSolar: 6, remnantMassSolar: 1.5,
      deterministicKey: 'KICK-SCALE',
    });
    const blackHole = deriveDeterministicNatalKickKmS({
      remnantKind: 'STELLAR_BLACK_HOLE', ejectaMassSolar: 2, remnantMassSolar: 8,
      deterministicKey: 'KICK-SCALE',
    });
    expect(neutron).toBeGreaterThan(blackHole);
    expect(neutron).toBeGreaterThan(0);
    expect(blackHole).toBeGreaterThan(0);
  });

  it('classifies explosive mass loss against the pre-event orbital period', () => {
    expect(classifyPostSupernovaMassLossRegime(0.03, 365.25))
      .toBe(PostSupernovaMassLossRegime.IMPULSIVE);
    expect(classifyPostSupernovaMassLossRegime(10, 100))
      .toBe(PostSupernovaMassLossRegime.TRANSITIONAL);
    expect(classifyPostSupernovaMassLossRegime(30, 100))
      .toBe(PostSupernovaMassLossRegime.ADIABATIC);
  });

  it('re-evaluates prograde moon survival against the post-SN Hill sphere', () => {
    const inner = resolvePostSupernovaMoonStability({
      planetSemiMajorAxisAu: 1,
      planetEccentricity: 0.1,
      planetMassEarth: 317.8,
      planetRadiusEarth: 11.2,
      currentHostMassSolar: 1,
      moonSemiMajorAxisPlanetRadii: 20,
      moonEccentricity: 0.02,
    });
    const outer = resolvePostSupernovaMoonStability({
      planetSemiMajorAxisAu: 1,
      planetEccentricity: 0.1,
      planetMassEarth: 317.8,
      planetRadiusEarth: 11.2,
      currentHostMassSolar: 1,
      moonSemiMajorAxisPlanetRadii: 200,
      moonEccentricity: 0.02,
    });
    expect(inner.survives).toBe(true);
    expect(outer.survives).toBe(false);
    expect(inner.progradeStableLimitPlanetRadii).toBeGreaterThan(20);
  });
});
