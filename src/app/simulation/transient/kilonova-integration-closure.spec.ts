import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import { KilonovaCanonicalEvent } from '../../domain/transient/kilonova-canonical-event';
import { KilonovaProgenitorProfile } from '../../domain/transient/kilonova-progenitor';
import { KilonovaStellarLineageStage } from '../../domain/transient/kilonova-stellar-lineage';
import { KilonovaEventEngine } from './kilonova-event-engine';
import { KilonovaType } from '../../domain/transient/kilonova-type';
import { NovaType } from '../../domain/transient/nova-type';
import { SupernovaType } from '../../domain/transient/supernova-type';

describe('29.3 transient integration closure', () => {
  it('keeps kilonova, nova and supernova taxonomies explicitly disjoint', () => {
    expect(Object.values(KilonovaType)).toEqual(['BINARY_NEUTRON_STAR', 'NEUTRON_STAR_BLACK_HOLE']);
    expect(Object.values(NovaType)).not.toContain('BINARY_NEUTRON_STAR' as never);
    expect(Object.values(SupernovaType)).not.toContain('BINARY_NEUTRON_STAR' as never);
  });

  it('rejects unresolved NS-BH candidates from canonical persistence', () => {
    const profile = KilonovaEventEngine.deriveProfile(new KilonovaProgenitorProfile(
      KilonovaType.NEUTRON_STAR_BLACK_HOLE,
      1.42,
      4.2,
      12.2,
      0.0011,
      0.05,
      4.2e7,
      0.91,
      1.35,
    ));

    expect(() => new KilonovaCanonicalEvent(
      StellarSystemComponentLabel.A,
      StellarSystemComponentLabel.B,
      'Fixture A',
      'Fixture B',
      KilonovaStellarLineageStage.NS_BH_SPIN_UNRESOLVED,
      5,
      4.2e7,
      5.042,
      profile,
    )).toThrowError(RangeError);
  });

});
