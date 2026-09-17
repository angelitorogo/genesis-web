import {
  assessMultihostOrbitalDomainsV21,
} from './multihost-orbital-domain-assessor';
import {
  generateMultihostPlanetaryCatalog,
  type MultihostStellarInput,
} from './multihost-planetary-catalog-generator';
import {
  type MultihostCandidateOrbit,
  type MultihostPlanetaryCatalog,
} from '../../domain/planetary/multihost-planetary-catalog';

const BINARY: MultihostStellarInput = Object.freeze({
  seed: '0123456789abcdef0123456789abcdef',
  massA: 1,
  massB: 0.8,
  massC: null,
  radiusAAu: 0.00465,
  radiusBAu: 0.004,
  radiusCAu: null,
  innerBinaryAxisAu: 1,
  innerBinaryEccentricity: 0.12,
  outerBinaryAxisAu: null,
  outerBinaryEccentricity: null,
  frozenPAbInnerAu: 3.3,
  frozenPAbOuterAu: null,
  samplingOuterAu: 40,
});

const TRIPLE: MultihostStellarInput = Object.freeze({
  ...BINARY,
  massC: 0.5,
  radiusCAu: 0.003,
  outerBinaryAxisAu: 45,
  outerBinaryEccentricity: 0.12,
  frozenPAbOuterAu: 10,
  samplingOuterAu: 220,
});

function testOrbit(
  catalog: MultihostPlanetaryCatalog,
  hostId: 'A' | 'B' | 'C' | 'AB' | 'ABC',
  semiMajorAxisAu: number,
  eccentricity: number,
  id = 'test-planet',
): MultihostCandidateOrbit {
  const window = catalog.windows.find(entry => entry.hostId === hostId)!;
  return Object.freeze({
    id,
    hostId,
    family: window.family,
    ordinal: 1,
    semiMajorAxisAu,
    eccentricity,
    periapsisAu: semiMajorAxisAu * (1 - eccentricity),
    apoapsisAu: semiMajorAxisAu * (1 + eccentricity),
    periodDays: 365.25 * Math.sqrt(
      semiMajorAxisAu ** 3 / window.gravitatingMassSolar),
    inclinationDegrees: 0,
    rotationDegrees: 0,
    epochMeanAnomalyDegrees: 0,
    experimental: true as const,
  });
}

describe('V2.1 host-per-planet and S/P orbital-domain diagnostics', () => {
  it('preserves frozen SINGLE planets as A-hosted without claiming a new stability verdict', () => {
    const catalog = generateMultihostPlanetaryCatalog({
      ...BINARY,
      massB: null,
      radiusBAu: null,
      innerBinaryAxisAu: null,
      innerBinaryEccentricity: null,
      frozenPAbInnerAu: null,
    });
    const input = {
      catalog,
      legacyHostId: 'A' as const,
      legacyPlanets: [{ id: 'v1-b', label: 'b' }, { id: 'v1-c', label: 'c' }],
    };
    const result = assessMultihostOrbitalDomainsV21(input);
    expect(result.version).toBe('V2_1_QA');
    expect(result.domains.map(domain => domain.host.id)).toEqual(['A']);
    expect(result.assignments.slice(0, 2).map(planet => planet.hostId))
      .toEqual(['A', 'A']);
    expect(result.assignments.slice(0, 2).every(planet =>
      planet.stability === 'NOT_REASSESSED_V1')).toBe(true);
    expect(input.legacyPlanets).toEqual([
      { id: 'v1-b', label: 'b' }, { id: 'v1-c', label: 'c' },
    ]);
    expect(Object.isFrozen(result.assignments)).toBe(true);
  });

  it('BINARY assigns the S-A, S-B and P-AB bodies to distinct host masses and windows', () => {
    const generated = generateMultihostPlanetaryCatalog(BINARY);
    const a = generated.windows.find(window => window.hostId === 'A')!;
    const b = generated.windows.find(window => window.hostId === 'B')!;
    const ab = generated.windows.find(window => window.hostId === 'AB')!;
    const catalog = {
      ...generated,
      candidates: [
        testOrbit(generated, 'A', (a.innerStableAu + a.referenceOuterAu) / 2, 0.05, 'qa-a'),
        testOrbit(generated, 'B', (b.innerStableAu + b.referenceOuterAu) / 2, 0.05, 'qa-b'),
        testOrbit(generated, 'AB', (ab.innerStableAu + ab.referenceOuterAu) / 2, 0.05, 'qa-ab'),
      ],
    };
    const result = assessMultihostOrbitalDomainsV21({
      catalog, legacyHostId: 'AB', legacyPlanets: [{ id: 'frozen-b', label: 'V1 b' }],
    });
    expect(result.domains.map(domain => domain.state)).toEqual([
      'OPEN_BOUNDED', 'OPEN_BOUNDED', 'OPEN_SAMPLING_LIMITED',
    ]);
    expect(result.assignments.map(planet => planet.hostId)).toEqual([
      'AB', 'A', 'B', 'AB',
    ]);
    expect(result.assignments.map(planet => planet.gravitatingMassSolar))
      .toEqual([1.8, 1, 0.8, 1.8]);
    expect(result.assessments.every(assessment =>
      assessment.verdict === 'WITHIN_APPROXIMATE_WINDOW')).toBe(true);
    expect(result.domains.find(domain => domain.host.id === 'AB')?.outerStableAu)
      .toBeNull();
    expect(result.domains.find(domain => domain.host.id === 'AB')?.samplingOuterAu)
      .toBe(40);
  });

  it('TRIPLE separates host C, inner pair AB and whole hierarchy ABC without marking V1 as V2', () => {
    const catalog = generateMultihostPlanetaryCatalog(TRIPLE);
    const result = assessMultihostOrbitalDomainsV21({
      catalog, legacyHostId: 'AB', legacyPlanets: [{ id: 'frozen-triple-b', label: 'b' }],
    });
    expect(result.domains.map(domain => domain.host.id))
      .toEqual(['A', 'B', 'AB', 'C', 'ABC']);
    expect(result.domains.find(domain => domain.host.id === 'ABC')?.host.components)
      .toEqual(['A', 'B', 'C']);
    expect(result.domains.find(domain => domain.host.id === 'AB')?.outerStableAu)
      .toBeLessThanOrEqual(10);
    expect(result.assignments[0]).toMatchObject({
      bodyId: 'frozen-triple-b', hostId: 'AB', origin: 'V1_FROZEN',
      stability: 'NOT_REASSESSED_V1',
    });
    expect(result.assessments).toHaveLength(catalog.candidates.length);
    expect(assessMultihostOrbitalDomainsV21({
      catalog, legacyHostId: 'AB', legacyPlanets: [{ id: 'frozen-triple-b', label: 'b' }],
    })).toEqual(result);
  });

  it('classifies periapsis and apoapsis boundary crossings, not just semimajor axis', () => {
    const generated = generateMultihostPlanetaryCatalog(TRIPLE);
    const ab = generated.windows.find(window => window.hostId === 'AB')!;
    const middle = (ab.innerStableAu + ab.outerStableAu!) / 2;
    const qOutside = testOrbit(generated, 'AB', ab.innerStableAu * 1.04, 0.12,
      'inner-crossing');
    const qAndQInside = testOrbit(generated, 'AB', middle, 0.01, 'inside');
    const qInsideQOutside = testOrbit(generated, 'AB', ab.outerStableAu! * 0.98,
      0.12, 'outer-crossing');
    const result = assessMultihostOrbitalDomainsV21({
      catalog: { ...generated, candidates: [qOutside, qAndQInside, qInsideQOutside] },
      legacyHostId: 'AB', legacyPlanets: [],
    });
    expect(result.assessments.map(assessment => assessment.verdict)).toEqual([
      'INNER_BOUNDARY_CROSSED', 'WITHIN_APPROXIMATE_WINDOW',
      'OUTER_BOUNDARY_CROSSED',
    ]);
    expect(result.assessments[0]?.innerClearanceAu).toBeLessThan(0);
    expect(result.assessments[2]?.outerClearanceAu).toBeLessThan(0);
  });

  it('a closed P-AB domain remains closed even when an injected test orbit has no crossings', () => {
    const generated = generateMultihostPlanetaryCatalog({
      ...BINARY, frozenPAbOuterAu: 2.4,
    });
    const result = assessMultihostOrbitalDomainsV21({
      catalog: { ...generated, candidates: [testOrbit(generated, 'AB', 3.4, 0)] },
      legacyHostId: 'AB', legacyPlanets: [],
    });
    expect(result.domains[2]?.state).toBe('CLOSED');
    expect(result.assessments[0]?.verdict).toBe('CLOSED_HOST_DOMAIN');
  });

  it('distinguishes a physically open but too-narrow annulus from a closed domain', () => {
    const generated = generateMultihostPlanetaryCatalog({
      ...BINARY, frozenPAbOuterAu: 3.75,
    });
    const result = assessMultihostOrbitalDomainsV21({
      catalog: { ...generated, candidates: [testOrbit(generated, 'AB', 3.6, 0)] },
      legacyHostId: 'AB', legacyPlanets: [],
    });
    expect(result.domains[2]?.state).toBe('UNSAMPLED');
    expect(result.assessments[0]?.verdict).toBe('NO_USABLE_SAMPLE');
  });

  it('rejects ambiguous planet identities, missing hosts and inconsistent physical apsides', () => {
    const generated = generateMultihostPlanetaryCatalog(BINARY);
    const a = generated.windows[0]!;
    const candidate = testOrbit(generated, 'A',
      (a.innerStableAu + a.referenceOuterAu) / 2, 0.01, 'collision');
    const assess = (catalog: MultihostPlanetaryCatalog) =>
      assessMultihostOrbitalDomainsV21({
        catalog, legacyHostId: 'AB', legacyPlanets: [{ id: 'collision', label: 'V1' }],
      });
    expect(() => assess({ ...generated, candidates: [candidate] })).toThrow(/duplicate/i);
    expect(() => assess({ ...generated, candidates: [{
      ...candidate, id: 'bad-apsides', periapsisAu: candidate.periapsisAu * 0.6,
    }] })).toThrow(/inconsistent orbital elements/);
    expect(() => assessMultihostOrbitalDomainsV21({
      catalog: generated, legacyHostId: 'C', legacyPlanets: [],
    })).toThrow(/absent/);
  });
});
