import { CompactBinarySystem, type CompactBinaryMember } from '../../domain/stellar/compact-binary-system';
import { StellarRelativeOrbit } from '../../domain/stellar/stellar-relative-orbit';
import { StellarKilonovaCanonicalEventResolver } from './stellar-kilonova-canonical-event-resolver';
import { StellarKilonovaEligibilityResolver, eccentricInspiralReferenceYears, kerrIscoRadiusGravitationalUnits, kilonovaTidalDisruptionRatio } from './stellar-kilonova-eligibility-resolver';

function member(label: 'A'|'B', kind: 'NEUTRON_STAR'|'STELLAR_BLACK_HOLE', mass: number, radiusKm: number, seed: string): CompactBinaryMember {
  return Object.freeze({ label, componentSeedHex: seed, remnantKind: kind, massSolar: mass, referenceRadiusKm: radiusKm,
    formationAgeBillionYears: 1, currentAgeBillionYears: 5 });
}
function binary(a: CompactBinaryMember, b: CompactBinaryMember, semiMajorAxisAu: number, eccentricity = 0.05): CompactBinarySystem {
  return new CompactBinarySystem('A'.repeat(32), a, b, new StellarRelativeOrbit(semiMajorAxisAu, eccentricity, 0.01));
}

describe('29.3 compact-merger kilonova eligibility', () => {
  it('accepts only NS-NS systems whose Peters reference merger lies inside the model horizon', () => {
    const close = binary(member('A','NEUTRON_STAR',1.35,12.1,'B'.repeat(32)), member('B','NEUTRON_STAR',1.30,12.3,'C'.repeat(32)), 0.001);
    const result = StellarKilonovaEligibilityResolver.resolve(close, { A: 'A', B: 'B' });
    expect(result?.stage).toBe('FUTURE_NS_NS_MERGER');
    expect(result?.eventProfile?.totalEjectaMassSolar).toBeGreaterThan(0);

    const wide = binary(member('A','NEUTRON_STAR',1.35,12.1,'B'.repeat(32)), member('B','NEUTRON_STAR',1.30,12.3,'C'.repeat(32)), 0.1);
    expect(StellarKilonovaEligibilityResolver.resolve(wide, { A: 'A', B: 'B' })).toBeNull();
  });

  it('keeps real NS-BH mergers spin-unresolved instead of fabricating Kerr spin from a seed', () => {
    const compact = binary(
      member('A','NEUTRON_STAR',1.35,12.4,'B'.repeat(32)),
      member('B','STELLAR_BLACK_HOLE',3.2,9.45,'D'.repeat(32)),
      0.001,
    );
    const result = StellarKilonovaEligibilityResolver.resolve(compact, { A: 'A', B: 'B' });
    expect(result?.stage).toBe('NS_BH_SPIN_UNRESOLVED');
    expect(result?.progenitor).toBeNull();
    expect(result?.eventProfile).toBeNull();
    expect(StellarKilonovaCanonicalEventResolver.resolve(result)).toEqual([]);
  });

  it('keeps explicit-spin disruption helpers for declared laboratory/validated NS-BH inputs', () => {
    const neutron = member('A','NEUTRON_STAR',1.35,12.4,'B'.repeat(32));
    const heavyBh = member('B','STELLAR_BLACK_HOLE',12,35.4,'C'.repeat(32));
    expect(kilonovaTidalDisruptionRatio(neutron, heavyBh, 0.05)).toBeLessThan(1);
    const lightBh = member('B','STELLAR_BLACK_HOLE',3.2,9.45,'D'.repeat(32));
    expect(kilonovaTidalDisruptionRatio(neutron, lightBh, 0.95)).toBeGreaterThan(1);
    expect(kerrIscoRadiusGravitationalUnits(0.95)).toBeLessThan(kerrIscoRadiusGravitationalUnits(0.05));
  });

  it('shortens the inspiral reference when eccentricity grows', () => {
    expect(eccentricInspiralReferenceYears(1e9, 0.6)).toBeLessThan(eccentricInspiralReferenceYears(1e9, 0.1));
  });
});
