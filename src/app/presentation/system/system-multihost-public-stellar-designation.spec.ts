import { systemMultihostPublicStellarComponentDesignation } from './system-multihost-public-stellar-designation';

describe('systemMultihostPublicStellarComponentDesignation', () => {
  it('builds Beraum A/B from the canonical binary system name', () => {
    expect(systemMultihostPublicStellarComponentDesignation('Beraum', 'A')).toBe('Beraum A');
    expect(systemMultihostPublicStellarComponentDesignation('Beraum', 'B')).toBe('Beraum B');
  });

  it('does not depend on historical/internal SINGLE names', () => {
    const internalHostNames = ['Beraum A', 'Dinaion A'];
    const publicNames = (['A', 'B'] as const).map(role =>
      systemMultihostPublicStellarComponentDesignation('Beraum', role));

    expect(internalHostNames).toEqual(['Beraum A', 'Dinaion A']);
    expect(publicNames).toEqual(['Beraum A', 'Beraum B']);
  });

  it('builds Virer A/B/C for a triple system', () => {
    expect((['A', 'B', 'C'] as const).map(role =>
      systemMultihostPublicStellarComponentDesignation('Virer', role)))
      .toEqual(['Virer A', 'Virer B', 'Virer C']);
  });

  it('never introduces duplicated role suffixes', () => {
    for (const role of ['A', 'B', 'C'] as const) {
      const designation = systemMultihostPublicStellarComponentDesignation('Virer', role);
      expect(designation).not.toContain(`${role} · ${role}`);
      expect(designation).not.toContain(' · ');
    }
  });

  it('rejects an empty canonical system name rather than deriving identity from a child host', () => {
    expect(() => systemMultihostPublicStellarComponentDesignation('   ', 'A')).toThrow(RangeError);
  });
});
