import { CompactBinarySystem, type CompactBinaryMember } from '../../domain/stellar/compact-binary-system';
import { StellarRelativeOrbit } from '../../domain/stellar/stellar-relative-orbit';
import { CompactMergerType } from '../../domain/transient/compact-merger-type';
import { StellarKilonovaEligibilityResolver } from './stellar-kilonova-eligibility-resolver';
import { StellarCompactMergerCanonicalEventResolver } from './stellar-compact-merger-canonical-event-resolver';
import { StellarCompactMergerEligibilityResolver } from './stellar-compact-merger-eligibility-resolver';

function member(label: 'A'|'B', kind: 'WHITE_DWARF'|'NEUTRON_STAR'|'STELLAR_BLACK_HOLE', mass: number, radiusKm: number, seed: string): CompactBinaryMember {
  return Object.freeze({ label, componentSeedHex: seed, remnantKind: kind, massSolar: mass, referenceRadiusKm: radiusKm,
    formationAgeBillionYears: 1, currentAgeBillionYears: 5 });
}
function binary(a: CompactBinaryMember, b: CompactBinaryMember, semiMajorAxisAu: number, eccentricity = 0.05): CompactBinarySystem {
  return new CompactBinarySystem('A'.repeat(32), a, b, new StellarRelativeOrbit(semiMajorAxisAu, eccentricity, 0.01));
}

describe('29.4 compact-merger eligibility', () => {
  it('creates a canonical NS-BH merger even while 29.3 correctly keeps its kilonova spin-unresolved', () => {
    const source = binary(
      member('A','NEUTRON_STAR',1.35,12.4,'B'.repeat(32)),
      member('B','STELLAR_BLACK_HOLE',3.2,9.45,'D'.repeat(32)),
      0.001,
    );
    const kilonova = StellarKilonovaEligibilityResolver.resolve(source, { A: 'A', B: 'B' });
    expect(kilonova?.stage).toBe('NS_BH_SPIN_UNRESOLVED');
    const merger = StellarCompactMergerEligibilityResolver.resolve(source, { A: 'A', B: 'B' });
    expect(merger?.stage).toBe('FUTURE_NS_BH_MERGER');
    expect(merger?.eventProfile.type).toBe(CompactMergerType.NEUTRON_STAR_BLACK_HOLE);
    expect(StellarCompactMergerCanonicalEventResolver.resolve(merger)).toHaveLength(1);
  });

  it('adds the BH-BH channel that 29.3 intentionally does not classify as a kilonova', () => {
    const source = binary(
      member('A','STELLAR_BLACK_HOLE',9,26.6,'B'.repeat(32)),
      member('B','STELLAR_BLACK_HOLE',7,20.7,'C'.repeat(32)),
      0.001,
    );
    expect(StellarKilonovaEligibilityResolver.resolve(source, { A: 'A', B: 'B' })).toBeNull();
    const merger = StellarCompactMergerEligibilityResolver.resolve(source, { A: 'A', B: 'B' });
    expect(merger?.stage).toBe('FUTURE_BH_BH_MERGER');
    expect(merger?.eventProfile.type).toBe(CompactMergerType.BLACK_HOLE_BLACK_HOLE);
  });

  it('rejects compact pairs outside the merger horizon and all WD-containing channels', () => {
    const wide = binary(
      member('A','NEUTRON_STAR',1.35,12.1,'B'.repeat(32)),
      member('B','NEUTRON_STAR',1.30,12.3,'C'.repeat(32)),
      0.1,
    );
    expect(StellarCompactMergerEligibilityResolver.resolve(wide, { A: 'A', B: 'B' })).toBeNull();
    const wdNs = binary(
      member('A','WHITE_DWARF',1.0,6000,'B'.repeat(32)),
      member('B','NEUTRON_STAR',1.30,12.3,'C'.repeat(32)),
      0.001,
    );
    expect(StellarCompactMergerEligibilityResolver.resolve(wdNs, { A: 'A', B: 'B' })).toBeNull();
  });
});
