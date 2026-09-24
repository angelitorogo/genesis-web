import {
  stellarMultihostPublicComponentDesignation,
  stellarMultihostPublicMoonDesignation,
  stellarMultihostPublicPlanetDesignation,
} from './stellar-multihost-public-designation';

describe('stellar-multihost-public-designation', () => {
  it('uses the canonical parent name for BINARY stellar components', () => {
    expect(stellarMultihostPublicComponentDesignation('Beraum', 'A')).toBe('Beraum A');
    expect(stellarMultihostPublicComponentDesignation('Beraum', 'B')).toBe('Beraum B');
  });

  it('uses the canonical parent name for S-type and P-type planets', () => {
    expect(stellarMultihostPublicPlanetDesignation('Virer', 'A', 2)).toBe('Virer A-2');
    expect(stellarMultihostPublicPlanetDesignation('Virer', 'B', 3)).toBe('Virer B-3');
    expect(stellarMultihostPublicPlanetDesignation('Virer', 'AB', 1)).toBe('Virer AB-1');
  });

  it('builds moon names from the public planet name rather than a private child name', () => {
    expect(stellarMultihostPublicMoonDesignation('Virer', 'B', 3, 1)).toBe('Virer B-3 I');
    expect(stellarMultihostPublicMoonDesignation('Virer', 'AB', 1, 4)).toBe('Virer AB-1 IV');
  });

  it('covers TRIPLE A/B/C without duplicate component suffixes', () => {
    expect(['A', 'B', 'C'].map(role =>
      stellarMultihostPublicComponentDesignation('Virer', role as 'A' | 'B' | 'C')))
      .toEqual(['Virer A', 'Virer B', 'Virer C']);
  });
});
