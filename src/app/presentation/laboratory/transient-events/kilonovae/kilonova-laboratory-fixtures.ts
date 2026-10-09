import { type KilonovaEventProfile } from '../../../../domain/transient/kilonova-event-profile';
import { KilonovaProgenitorProfile } from '../../../../domain/transient/kilonova-progenitor';
import { KilonovaType, type KilonovaType as KilonovaTypeValue } from '../../../../domain/transient/kilonova-type';
import { KilonovaEventEngine } from '../../../../simulation/transient/kilonova-event-engine';

export interface KilonovaLaboratoryCase {
  readonly id: KilonovaTypeValue;
  readonly shortLabel: string;
  readonly title: string;
  readonly description: string;
  readonly profile: KilonovaEventProfile;
}
function makeCase(id: KilonovaTypeValue, shortLabel: string, title: string, description: string, progenitor: KilonovaProgenitorProfile): KilonovaLaboratoryCase {
  const profile = KilonovaEventEngine.deriveProfile(progenitor);
  if (profile.type !== id) throw new RangeError('Kilonova laboratory fixture type mismatch.');
  return Object.freeze({ id, shortLabel, title, description, profile });
}
export const KILONOVA_LABORATORY_CASES = Object.freeze([
  makeCase(
    KilonovaType.BINARY_NEUTRON_STAR,
    'NS–NS',
    'Fusión de dos estrellas de neutrones',
    'Dos remanentes de neutrones inspiralan por radiación gravitatoria. La eyección combina una componente azul relativamente pobre en lantánidos y una componente roja rica en r-proceso.',
    new KilonovaProgenitorProfile(KilonovaType.BINARY_NEUTRON_STAR, 1.38, 1.27, 12.1, 0.006778517936238559, 0.08, 1.4e8, null, null),
  ),
  makeCase(
    KilonovaType.NEUTRON_STAR_BLACK_HOLE,
    'NS–BH',
    'Disrupción de estrella de neutrones por agujero negro',
    'La estrella de neutrones es desgarrada fuera de la ISCO. Solo estos NS–BH con disrupción tidal producen ejecta y una kilonova en 29.3.',
    new KilonovaProgenitorProfile(KilonovaType.NEUTRON_STAR_BLACK_HOLE, 1.42, 4.2, 12.2, 0.008170347599440101, 0.05, 4.2e7, 0.91, 1.2538842472526102),
  ),
] as const);
