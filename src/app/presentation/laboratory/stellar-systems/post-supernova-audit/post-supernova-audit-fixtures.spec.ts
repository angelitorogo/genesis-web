import { buildPostSupernovaAuditCases } from './post-supernova-audit-fixtures';

describe('29.1E-g.1 deterministic post-supernova visual audit fixtures', () => {
  it('pins four deterministic cases with explicit survival, ejection, disruption and control outcomes', () => {
    const cases = buildPostSupernovaAuditCases();

    expect(cases).toHaveLength(4);
    expect(cases.map(current => current.id)).toEqual(['A', 'B', 'C', 'D']);
    expect(cases.map(current => current.status)).toEqual([
      'BOUND_RECONFIGURED',
      'EJECTED',
      'DISRUPTED_HIERARCHY',
      'BINARY_UNCHANGED',
    ]);
  }, 120_000);

  it('keeps the bound case closed, the ejected case open and the control numerically unchanged', () => {
    const [bound, ejected, triple, control] = buildPostSupernovaAuditCases();

    expect(bound!.beforeOrbit).not.toBeNull();
    expect(bound!.afterOrbit).not.toBeNull();
    expect(bound!.afterOrbit!.eccentricity).toBeGreaterThan(bound!.beforeOrbit!.eccentricity);
    expect(bound!.proof.join(' ')).toContain('Luna');

    expect(ejected!.beforeOrbit).not.toBeNull();
    expect(ejected!.afterOrbit).toBeNull();
    expect(ejected!.proof.join(' ')).toContain('kick natal = 0');

    expect(triple!.metrics.find(current => current.label === 'Órbita interior A–B')?.after)
      .toBe('EJECTED');
    expect(triple!.metrics.find(current => current.label === 'Órbita exterior (A+B)–C')?.after)
      .toBe('HIERARCHY_DISRUPTED');

    expect(control!.beforeOrbit).not.toBeNull();
    expect(control!.afterOrbit).not.toBeNull();
    expect(control!.afterOrbit!.semiMajorAxisAu).toBeCloseTo(control!.beforeOrbit!.semiMajorAxisAu, 12);
    expect(control!.afterOrbit!.eccentricity).toBeCloseTo(control!.beforeOrbit!.eccentricity, 12);
    expect(control!.metrics.every(metric => !metric.changed)).toBe(true);
  }, 120_000);

  it('is stable across repeated reads and does not depend on wall-clock state', () => {
    expect(buildPostSupernovaAuditCases()).toEqual(buildPostSupernovaAuditCases());
  }, 120_000);
});
